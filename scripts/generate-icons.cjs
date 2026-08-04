#!/usr/bin/env node
// Generates PNG icons from icon.svg using @resvg/resvg-js
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/icon.svg');
const outDir = path.join(__dirname, '../public');
const svg = fs.readFileSync(svgPath, 'utf-8');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-1024.png', size: 1024 },
];

for (const { name, size } of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const outPath = path.join(outDir, name);
  fs.writeFileSync(outPath, pngBuffer);
  console.log(`✓ ${name} (${size}×${size})`);
}

console.log('Icons generated.');
