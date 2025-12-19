const { withPage } = require('../adapters/playwright.cjs');

function luminance(rgb) {
    const a = rgb.map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(fg, bg) {
    const L1 = luminance(fg);
    const L2 = luminance(bg);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

function parseRGB(str) {
    const m = str?.match(/\d+/g);
    return m ? m.map(Number).slice(0, 3) : null;
}

module.exports = {
    name: 'contrast',

    async run(ctx) {
        return withPage(ctx, async page => {
            const nodes = await page.evaluate(() => {
                return [...document.querySelectorAll('*')]
                    .filter(el => el.textContent.trim())
                    .map(el => {
                        const s = getComputedStyle(el);
                        return {
                            text: el.textContent.trim().slice(0, 80),
                            fg: s.color,
                            bg: s.backgroundColor,
                            fontSize: parseFloat(s.fontSize),
                            fontWeight: parseInt(s.fontWeight, 10) || 400,
                            tag: el.tagName.toLowerCase()
                        };
                    });
            });

            const violations = [];

            for (const n of nodes) {
                const fg = parseRGB(n.fg);
                const bg = parseRGB(n.bg);
                if (!fg || !bg) continue;

                const ratio = contrastRatio(fg, bg);
                const large =
                    n.fontSize >= 24 ||
                    (n.fontSize >= 18.66 && n.fontWeight >= 700);

                const min = large ? 3 : 4.5;

                if (ratio < min) {
                    violations.push({
                        ...n,
                        ratio: Number(ratio.toFixed(2)),
                        required: min
                    });
                }
            }

            const passed = violations.length === 0;
            return {
                status: passed ? 'ok' : 'fail',
                score: passed ? 100 : 80, // Contrast failures are often partial, so 80 isn't terrible but bad
                raw: { violations }
            };
        });
    }
};
