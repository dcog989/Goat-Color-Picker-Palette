interface WorkerMessage {
    imageData: ImageData;
    distance: number;
}

// Helper to convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const i = Math.max(0, Math.min(255, Math.round(n)));
        return i.toString(16).padStart(2, '0');
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { imageData, distance } = e.data;
    const { data } = imageData;

    // 1. QUANTIZATION (Binning)
    // 12-bit color space = 4096 bins
    const BIN_SIZE = 4096;
    const rBin = new Uint32Array(BIN_SIZE);
    const gBin = new Uint32Array(BIN_SIZE);
    const bBin = new Uint32Array(BIN_SIZE);
    const countBin = new Uint32Array(BIN_SIZE);

    const len = data.length;

    // Iterate all pixels
    for (let i = 0; i < len; i += 4) {
        // Bounds check
        if (i + 3 >= len) break;

        // Use null coalescing for strict safety
        const r = data[i] ?? 0;
        const g = data[i + 1] ?? 0;
        const b = data[i + 2] ?? 0;
        const a = data[i + 3] ?? 0;

        // Skip transparent
        if (a < 125) continue;

        // 12-bit key: 4 bits per channel (0-15)
        const key = (((r >> 4) & 0xf) << 8) | (((g >> 4) & 0xf) << 4) | ((b >> 4) & 0xf);

        // TypeScript strict mode fix: Assert existence since key (0-4095) is within BIN_SIZE (4096)
        rBin[key] = (rBin[key] ?? 0) + r;
        gBin[key] = (gBin[key] ?? 0) + g;
        bBin[key] = (bBin[key] ?? 0) + b;
        countBin[key] = (countBin[key] ?? 0) + 1;
    }

    // 2. CONVERT TO LIST
    interface ColorBin {
        r: number;
        g: number;
        b: number;
        count: number;
    }

    let colorList: ColorBin[] = [];

    for (let i = 0; i < BIN_SIZE; i++) {
        const count = countBin[i];
        if (count !== undefined && count > 0) {
            // Average the accumulated values
            colorList.push({
                r: Math.round((rBin[i] ?? 0) / count),
                g: Math.round((gBin[i] ?? 0) / count),
                b: Math.round((bBin[i] ?? 0) / count),
                count: count
            });
        }
    }

    // 3. SORT BY DENSITY
    colorList.sort((a, b) => b.count - a.count);

    // PERFORMANCE: Cap candidates to 400
    if (colorList.length > 400) {
        colorList.length = 400;
    }

    // 4. MERGE NEIGHBORS
    // Threshold = distance (0-1) * 3 channels * 255
    const threshold = distance * 765;

    const mergedList: ColorBin[] = [];
    const mergedIndices = new Uint8Array(colorList.length);

    for (let i = 0; i < colorList.length; i++) {
        if (mergedIndices[i]) continue;

        const current = colorList[i];
        if (!current) continue;

        let mergedCount = current.count;

        for (let j = i + 1; j < colorList.length; j++) {
            if (mergedIndices[j]) continue;

            const other = colorList[j];
            if (!other) continue;

            const dist = Math.abs(current.r - other.r) + Math.abs(current.g - other.g) + Math.abs(current.b - other.b);

            if (dist < threshold) {
                mergedCount += other.count;
                mergedIndices[j] = 1;
            }
        }

        current.count = mergedCount;
        mergedList.push(current);
    }

    // 5. FILTER AND FORMAT
    mergedList.sort((a, b) => b.count - a.count);

    // Return top 64 colors
    const finalColors = mergedList.slice(0, 64);

    self.postMessage({
        colors: finalColors.map(c => rgbToHex(c.r, c.g, c.b)),
        clusters: finalColors.map(c => ({
            color: rgbToHex(c.r, c.g, c.b),
            pixels: c.count
        }))
    });
};
