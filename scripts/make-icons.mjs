// Draws the app icon from shapes (no fonts) and writes the PNG sizes iPad and the manifest need.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const icon = (pad) => {
  const s = 512, c = s / 2, u = (s - pad * 2) / 10; // 10-unit grid inside the padding
  const x = (n) => pad + n * u;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#D9D9D9"/>
  <g fill="#111111">
    <rect x="${x(1.5)}" y="${x(3.4)}" width="${u * 3.6}" height="${u * 0.8}"/>
    <rect x="${x(2.9)}" y="${x(2)}" width="${u * 0.8}" height="${u * 3.6}"/>
  </g>
  <g fill="#0A3FD0">
    <rect x="${x(5.2)}" y="${x(5.6)}" width="${u * 3.4}" height="${u * 0.8}"/>
    <rect x="${x(5.2)}" y="${x(7.1)}" width="${u * 3.4}" height="${u * 0.8}"/>
  </g>
</svg>`;
};

await mkdir('public/icons', { recursive: true });
const out = [
  ['icon-192.png', 192, 40],
  ['icon-512.png', 512, 40],
  ['apple-touch-icon.png', 180, 40],
  ['icon-maskable-512.png', 512, 100],
];
for (const [name, size, pad] of out) {
  await sharp(Buffer.from(icon(pad))).resize(size, size).png().toFile(`public/icons/${name}`);
}
console.log('icons written');
