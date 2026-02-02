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
    type: 'search';
    color: Oklch;
}

interface WorkerResponse {
    type: 'result';
    name: string;
}

// Explicitly type the converter so TypeScript knows it returns Oklab
const toOklab = converter<Oklab>('oklab');

// Flattened data for high-performance scanning
let coordinates: Float32Array | null = null;
let names: string[] = [];

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

        for (let i = 0; i < count; i++) {
            const entry = list[i];
            if (!entry) continue;

            names[i] = entry.name;

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
    if (e.data.type === 'search') {
        if (coordinates === null) {
            messageQueue.push(e.data.color);
            if (!isLoading) {
                await prepareData();
            }
            return;
        }

        const result = findClosestName(e.data.color);
        self.postMessage({ type: 'result', name: result } as WorkerResponse);
    }
};

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
