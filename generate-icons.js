const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function drawIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1e293b');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Border glow effect
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = size * 0.03;
  ctx.shadowColor = '#f472b6';
  ctx.shadowBlur = size * 0.1;
  ctx.beginPath();
  ctx.roundRect(size * 0.08, size * 0.08, size * 0.84, size * 0.84, size * 0.12);
  ctx.stroke();

  // Math symbols "+−" top and "×÷" bottom
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f8fafc';
  ctx.font = `bold ${size * 0.35}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+−', size / 2, size * 0.38);
  ctx.fillText('×÷', size / 2, size * 0.62);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
}

drawIcon(192, path.join(iconsDir, 'icon-192.png'));
drawIcon(512, path.join(iconsDir, 'icon-512.png'));

console.log('Icons generated successfully!');
