import sharp from 'sharp';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

function svg(size, { maskable = false } = {}) {
  const rx = maskable ? 0 : size * 0.2;
  const glyphScale = maskable ? 0.58 : 0.72;
  const g = (size * glyphScale) / 24;
  const gx = (size - size * glyphScale) / 2;
  const gy = (size - size * glyphScale) / 2 + (maskable ? size * 0.015 : 0);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#bg)"/>
  <g transform="translate(${gx},${gy}) scale(${g})">
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" fill="#ffffff" opacity="0.97"/>
  </g>
</svg>`;
}

const icons = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const icon of icons) {
  const buf = Buffer.from(svg(icon.size, { maskable: icon.maskable }));
  await sharp(buf).png().toFile(path.join(outDir, icon.file));
  console.log('wrote', icon.file);
}
