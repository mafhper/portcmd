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


module.exports = {
    name: 'contrast',

    async run(ctx) {
        return withPage(ctx, async page => {
            const nodes = await page.evaluate(() => {
                const ignoredTags = ['head', 'meta', 'link', 'script', 'style', 'noscript', 'title', 'html'];

                return [...document.querySelectorAll('*')]
                    .filter(el => {
                        // Must have text content
                        if (!el.textContent || !el.textContent.trim()) return false;

                        // Must be a visible tag type
                        if (ignoredTags.includes(el.tagName.toLowerCase())) return false;

                        // Must be visibly rendered
                        const style = window.getComputedStyle(el);
                        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

                        // Ignore gradient text (background-clip: text)
                        if (style.backgroundClip === 'text' || style.webkitBackgroundClip === 'text') return false;

                        // Check if rect has size (reliable for visibility)
                        const rect = el.getBoundingClientRect();
                        if (rect.width === 0 || rect.height === 0) return false;

                        // Ignore elements with no direct text node children (containers) 
                        // UNLESS they are flex/grid items that might have text directly? 
                        // Actually, querySelectorAll('*') gets the leaf nodes too.
                        // We only want to check contrast on the specific element that renders the text.
                        // Ideally check: hasChildNodes() && childNode.nodeType === 3
                        const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim());
                        if (!hasText) return false;

                        // Check if disabled (exempt from contrast rq)
                        if (el.hasAttribute('disabled') || el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[disabled]')) return false;

                        return true;
                    })
                    .map(el => {
                        const s = getComputedStyle(el);

                        // Helper to get RGBA
                        // We return string here, parsing happens in Node context
                        return {
                            text: el.textContent.trim().slice(0, 80),
                            fgColor: s.color,
                            bgColor: s.backgroundColor,
                            fontSize: parseFloat(s.fontSize),
                            fontWeight: parseInt(s.fontWeight, 10) || 400,
                            tag: el.tagName.toLowerCase(),
                            selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''),
                            // We need to traverse up to blend backgrounds
                            parents: (function (element) {
                                const pData = [];
                                let curr = element.parentElement;
                                while (curr) {
                                    const style = getComputedStyle(curr);
                                    if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
                                        pData.push(style.backgroundColor);
                                    }
                                    curr = curr.parentElement;
                                }
                                return pData;
                            })(el)
                        };
                    });
            });

            // Re-define parsing here since we are back in Node context
            function parseRGBA(str) {
                if (!str) return null;
                const m = str.match(/[\d.]+/g);
                if (!m || m.length < 3) return null;
                return {
                    r: Number(m[0]),
                    g: Number(m[1]),
                    b: Number(m[2]),
                    a: m.length > 3 ? Number(m[3]) : 1
                };
            }

            function blend(fg, bg) {
                const alpha = fg.a;
                return {
                    r: Math.round(alpha * fg.r + (1 - alpha) * bg.r),
                    g: Math.round(alpha * fg.g + (1 - alpha) * bg.g),
                    b: Math.round(alpha * fg.b + (1 - alpha) * bg.b),
                    a: 1
                };
            }

            const violations = [];

            for (const n of nodes) {
                let fg = parseRGBA(n.fgColor);
                let bg = parseRGBA(n.bgColor);

                // If main bg is transparent/alpha, blend with parents
                let currentBg = bg;

                // Start with a default white opaque base (browser default)
                let finalBg = { r: 255, g: 255, b: 255, a: 1 };

                // Construct the stack of backgrounds: [root, ..., parent, current]
                const bgStack = [...n.parents.reverse().map(c => parseRGBA(c)), currentBg].filter(c => c && c.a > 0);

                // Blend from bottom up
                for (const layer of bgStack) {
                    finalBg = blend(layer, finalBg);
                }

                // Now finalBg is the composite background

                // Also handle FG alpha if any (rare for text usually 1, but opacity: 0.5 exists)
                // Assuming FG is rendered on top of finalBg
                if (!fg) continue;

                // Calculate L for FG over BG
                // We need to blend FG onto BG to get the actual perceived FG color
                const compositedFg = blend(fg, finalBg);

                const fgArr = [compositedFg.r, compositedFg.g, compositedFg.b];
                const bgArr = [finalBg.r, finalBg.g, finalBg.b];

                const ratio = contrastRatio(fgArr, bgArr);
                const large =
                    n.fontSize >= 24 ||
                    (n.fontSize >= 18.66 && n.fontWeight >= 700);

                const min = large ? 3 : 4.5;

                if (ratio < min) {
                    violations.push({
                        ...n,
                        ratio: Number(ratio.toFixed(2)),
                        required: min,
                        message: `Contrast ${ratio.toFixed(2)} < ${min}`
                    });
                }
            }

            const passed = violations.length === 0;
            return {
                status: passed ? 'ok' : 'fail',
                score: passed ? 100 : 80,
                violations: violations, // Main Runner expects "violations" at root for summary
                raw: { violations }
            };
        });
    }
};
