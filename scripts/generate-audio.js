'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'audio');

const PRESETS = {
  'tap.wav':       { freq: 880, ms: 35, vol: 0.15 },
  'card-drop.wav': { freq: 220, ms: 55, vol: 0.15 },
  'stamp.wav':     { freq: 140, ms: 70, vol: 0.15 },
  'toggle.wav':    { freq: 660, ms: 25, vol: 0.15 },
};

function writeWav(filePath, { freq, ms, vol }) {
  const rate = 22050;
  const n = Math.floor(rate * ms / 1000);
  const data = Buffer.alloc(n * 2);

  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const env = Math.exp(-t * 28);
    const sample = Math.sin(2 * Math.PI * freq * t) * env * vol * 32767;
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(sample))), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(filePath, Buffer.concat([header, data]));
}

Object.entries(PRESETS).forEach(([name, preset]) => {
  writeWav(path.join(OUT, name), preset);
  console.log(`Generated ${name}`);
});