export const MIN_WIDTH = 35.6;

export const priceTiers = [
    { maxArea: 993.4, unitPrice: 45.3 },
    { maxArea: 1327.9, unitPrice: 39.2 },
    { maxArea: 2064.5, unitPrice: 33.6 },
    { maxArea: 2477.4, unitPrice: 32.9 },
    { maxArea: 3096.7, unitPrice: 32.2 },
    { maxArea: 4967.2, unitPrice: 29.1 },
    { maxArea: 6451.6, unitPrice: 28.9 },
    { maxArea: 7741.9, unitPrice: 28.7 },
    { maxArea: 8535.4, unitPrice: 28.1 },
    { maxArea: 12133.0, unitPrice: 27.1 },
    { maxArea: 18393.3, unitPrice: 26.4 },
    { maxArea: 20503.4, unitPrice: 24.5 },
    { maxArea: Infinity, unitPrice: 25.4 },
];

export const getMidWidth = (minW, maxW, maxH, ratio) => {
    const actualMaxW = Math.min(maxW, maxH * ratio);
    const midW = (minW + actualMaxW) / 2;
    return parseFloat(midW.toFixed(1));
};

export const calculateCumulativePrice = (area) => {
    let remainingArea = area;
    let lastMax = 0;
    let totalPrice = 0;

    for (let i = 0; i < priceTiers.length; i++) {
        const tier = priceTiers[i];
        const tierArea = Math.min(tier.maxArea - lastMax, remainingArea);

        if (tierArea <= 0) break;

        totalPrice += tierArea * tier.unitPrice;
        remainingArea -= tierArea;
        lastMax = tier.maxArea;
    }

    return Math.floor(Math.round(totalPrice) / 1000) * 1000;
};

export const getMinFrameConfigByRatio = (ratio) => {
    const maxWidth = ratio >= 1 ? 200.7 : 101.6;
    const maxHeight = ratio >= 1 ? 101.6 : 200.7;

    let width = MIN_WIDTH;
    let height = parseFloat((width / ratio).toFixed(1));

    if (height > maxHeight) {
        height = maxHeight;
        width = parseFloat((height * ratio).toFixed(1));
    }

    width = Math.floor(width);
    height = Math.floor(height);

    const area = width * height;
    const price = calculateCumulativePrice(area);

    return {
        ratio,
        width,
        height,
        area,
        price,
        maxWidth,
        maxHeight,
    };
};