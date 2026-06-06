import { colordx } from '@colordx/core';

interface WorkerMessage {
  type: 'search' | 'filter' | 'get-page';
  color?: { l: number; c: number; h: number; alpha: number };
  query?: string;
  limit?: number;
  offset?: number;
}

interface WorkerResponse {
  type: 'result' | 'filterResult' | 'pageResult';
  name?: string;
  colors?: Array<{ name: string; hex: string }>;
  total?: number;
}

let coordinates: Float32Array | null = null;
let names: string[] = [];
let hexValues: string[] = [];

let isLoading = false;
let loadError: Error | null = null;

const messageQueue: { l: number; c: number; h: number; alpha: number }[] = [];

async function prepareData(): Promise<void> {
  if (coordinates !== null || isLoading) return;

  isLoading = true;

  try {
    const module = await import('../data/colors');
    const list = await module.loadColorNames();

    const count = list.length;
    coordinates = new Float32Array(count * 3);
    names = new Array(count);
    hexValues = new Array(count);

    for (let i = 0; i < count; i++) {
      const entry = list[i];
      if (!entry) continue;

      names[i] = entry.name;
      hexValues[i] = entry.hex;

      try {
        const oklab = colordx(entry.hex).toOklab();
        const ptr = i * 3;
        coordinates[ptr] = oklab.l;
        coordinates[ptr + 1] = oklab.a;
        coordinates[ptr + 2] = oklab.b;
      } catch {
        // Skip colors that can't be parsed
      }
    }

    while (messageQueue.length > 0) {
      const color = messageQueue.shift();
      if (color) {
        const result = findClosestName(color);
        self.postMessage({ type: 'result', name: result } as WorkerResponse);
      }
    }
  } catch (error) {
    loadError = error instanceof Error ? error : new Error('Failed to load color names');
    console.error('Failed to load color name list:', loadError);

    while (messageQueue.length > 0) {
      messageQueue.shift();
      self.postMessage({ type: 'result', name: 'Custom Color' } as WorkerResponse);
    }
  } finally {
    isLoading = false;
  }
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  if (e.data.type === 'search' && e.data.color) {
    if (coordinates === null || isLoading) {
      messageQueue.push(e.data.color);
      return;
    }

    const result = findClosestName(e.data.color);
    self.postMessage({ type: 'result', name: result } as WorkerResponse);
  } else if (e.data.type === 'filter') {
    if (coordinates === null || isLoading) {
      await waitForData();
    }

    const results = filterColors(e.data.query || '', e.data.limit || 500);
    self.postMessage({ type: 'filterResult', colors: results } as WorkerResponse);
  } else if (e.data.type === 'get-page') {
    if (coordinates === null || isLoading) {
      await waitForData();
    }

    const results = getPage(e.data.offset || 0, e.data.limit || 100);
    self.postMessage({
      type: 'pageResult',
      colors: results,
      total: names.length,
    } as WorkerResponse);
  }
};

async function waitForData(): Promise<void> {
  while (coordinates === null || isLoading) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function findClosestName(current: { l: number; c: number; h: number; alpha: number }): string {
  if (loadError || !coordinates || !names.length) {
    return 'Custom Color';
  }

  let tL: number, ta: number, tb: number;
  try {
    const target = colordx({ l: current.l, c: current.c, h: current.h }).toOklab();
    tL = target.l;
    ta = target.a;
    tb = target.b;
  } catch {
    return 'Custom Color';
  }

  let minDistSq = Infinity;
  let bestIndex = -1;
  const len = names.length;
  const coords = coordinates;

  for (let i = 0; i < len; i++) {
    const ptr = i * 3;

    const vL = coords[ptr] as number;
    const va = coords[ptr + 1] as number;
    const vb = coords[ptr + 2] as number;

    const dL = vL - tL;
    const da = va - ta;
    const db = vb - tb;

    const distSq = dL * dL + da * da + db * db;

    if (distSq < minDistSq) {
      minDistSq = distSq;
      bestIndex = i;
    }
  }

  if (bestIndex !== -1) {
    return names[bestIndex] as string;
  }

  return 'Custom Color';
}

function filterColors(query: string, limit: number): Array<{ name: string; hex: string }> {
  if (loadError || !names.length || !hexValues.length) {
    return [];
  }

  if (!query.trim()) {
    return [];
  }

  const q = query.toLowerCase();
  const results: Array<{ name: string; hex: string }> = [];
  const len = names.length;

  for (let i = 0; i < len && results.length < limit; i++) {
    const name = names[i];
    if (name?.toLowerCase().includes(q)) {
      results.push({ name, hex: hexValues[i] as string });
    }
  }

  return results;
}

function getPage(offset: number, limit: number): Array<{ name: string; hex: string }> {
  if (loadError || !names.length || !hexValues.length) {
    return [];
  }

  const results: Array<{ name: string; hex: string }> = [];
  const end = Math.min(offset + limit, names.length);

  for (let i = offset; i < end; i++) {
    results.push({ name: names[i] as string, hex: hexValues[i] as string });
  }

  return results;
}

prepareData();
