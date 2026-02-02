import type { Oklab, Oklch } from 'culori';
import {
    converter,
    modeLrgb,
    modeOklab,
    modeOklch,
    modeRgb,
    modeXyz65,
    parse,
    useMode,
} from 'culori/fn';

// Register color spaces in worker scope
// CRITICAL: Registering intermediate spaces (Linear RGB, XYZ) is mandatory
// for accurate conversion between Hex (sRGB) and OKLAB/OKLCH.
useMode(modeRgb);
useMode(modeLrgb);
useMode(modeXyz65);
useMode(modeOklch);
useMode(modeOklab);

interface WorkerMessage {
    type: 'search' | 'filter';
    color?: Oklch;
    query?: string;
    limit?: number;
}

interface WorkerResponse {
    type: 'result' | 'filterResult';
    name?: string;
    colors?: Array<{ name: string; hex: string }>;
}

// Explicitly type the converter so TypeScript knows it returns Oklab
const toOklab = converter<Oklab>('oklab');

// Flattened data for high-performance scanning
let coordinates: Float32Array | null = null;
let names: string[] = [];
let hexValues: string[] = [];

let isLoading = false;
let loadError: Error | null = null;

const messageQueue: Oklch[] = [];

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

            // Hex string parses to { mode: 'rgb', ... }
            const color = parse(entry.hex);
            if (color) {
                // Requires modeRgb to be registered to work
                const lab = toOklab(color);
                const ptr = i * 3;
                if (lab) {
                    coordinates[ptr] = lab.l;
                    coordinates[ptr + 1] = lab.a ?? 0;
                    coordinates[ptr + 2] = lab.b ?? 0;
                }
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
            // Buffer message until data is ready
            messageQueue.push(e.data.color);
            return;
        }

        const result = findClosestName(e.data.color);
        self.postMessage({ type: 'result', name: result } as WorkerResponse);
    } else if (e.data.type === 'filter') {
        if (coordinates === null || isLoading) {
            // Buffer message until data is ready
            // We still need to process this after loading, so we'll handle it differently
            await waitForData();
        }

        const results = filterColors(e.data.query || '', e.data.limit || 100);
        self.postMessage({ type: 'filterResult', colors: results } as WorkerResponse);
    }
};

// Helper to wait for data to be ready
async function waitForData(): Promise<void> {
    while (coordinates === null || isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
}

function findClosestName(current: Oklch): string {
    if (loadError || !coordinates || !names.length) {
        return 'Custom Color';
    }

    const target = toOklab(current);
    if (!target) return 'Custom Color';

    const tL = target.l;
    const ta = target.a ?? 0;
    const tb = target.b ?? 0;

    let minDistSq = Infinity;
    let bestIndex = -1;
    const len = names.length;
    const coords = coordinates;

    for (let i = 0; i < len; i++) {
        const ptr = i * 3;

        const vL = coords[ptr]!;
        const va = coords[ptr + 1]!;
        const vb = coords[ptr + 2]!;

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
        return names[bestIndex]!;
    }

    return 'Custom Color';
}

function filterColors(query: string, limit: number): Array<{ name: string; hex: string }> {
    if (loadError || !names.length || !hexValues.length) {
        return [];
    }

    // Empty query - return empty array (component will show all via different path)
    if (!query.trim()) {
        return [];
    }

    const q = query.toLowerCase();
    const results: Array<{ name: string; hex: string }> = [];
    const len = names.length;

    // Fast scan - stop at limit
    for (let i = 0; i < len && results.length < limit; i++) {
        const name = names[i];
        if (name && name.toLowerCase().includes(q)) {
            results.push({ name, hex: hexValues[i]! });
        }
    }

    return results;
}

// Initialize data immediately on worker startup
// This ensures the data is loaded once and kept in memory
prepareData();
