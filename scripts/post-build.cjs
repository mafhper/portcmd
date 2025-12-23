const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist/index.html');

try {
    let html = fs.readFileSync(distPath, 'utf8');

    // Regex to find the main CSS link injected by Vite
    // It usually looks like: <link rel="stylesheet" crossorigin href="/assets/index-D8Ui0rhG.css">
    const cssLinkRegex = /<link rel="stylesheet"([^>]*)href="([^"]+)"([^>]*)>/g;

    html = html.replace(cssLinkRegex, (match, p1, href, p2) => {
        console.log(`Optimizing CSS load for: ${href}`);
        // Replace with preload pattern + noscript fallback
        // We add 'data-optimized="true"' to verify it worked
        return `
      <link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'" ${p1} ${p2} data-optimized="true">
      <noscript><link rel="stylesheet" href="${href}" ${p1} ${p2}></noscript>
    `;
    });

    fs.writeFileSync(distPath, html);
    console.log('✅ index.html optimized for non-blocking CSS.');

} catch (e) {
    console.error('Error optimizing index.html:', e);
    process.exit(1);
}
