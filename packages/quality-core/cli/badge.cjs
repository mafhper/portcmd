/**
 * Quality Gate Badge - SVG badge generator
 */
const fs = require('fs');
const path = require('path');

module.exports = function writeBadge({ failed, duration }) {
    const label = 'quality';
    const message = failed ? 'failed' : 'passed';
    const bgColor = failed ? '#e05d44' : '#4c1';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="150" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <rect width="70" height="20" fill="#555"/>
    <rect x="70" width="80" height="20" fill="${bgColor}"/>
    <rect width="150" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="35" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="35" y="14">${label}</text>
    <text x="110" y="15" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="110" y="14">${message}</text>
  </g>
</svg>`;

    const badgePath = path.join(process.cwd(), 'quality-badge.svg');
    fs.writeFileSync(badgePath, svg.trim());
    return badgePath;
};
