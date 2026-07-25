/* eslint-disable */
// ============================================================================
// ARISE — App icon / splash generator (pure Node, zero deps)
//
// Renders the "Arise" mark (shadow-monarch hex gate + upward level-up chevrons
// + monarch spark) directly to PNG using only Node's built-in zlib.
// Regenerate anytime:  node scripts/generate-icons.js
// ============================================================================

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---- tiny PNG encoder (RGBA) ------------------------------------------------
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- drawing helpers --------------------------------------------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = clamp(t, 0, 1);
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// colors
const PURPLE = [124, 58, 237];
const BLUE = [59, 130, 246];
const LILAC = [167, 139, 250];

function makeCanvas(size) { return Buffer.alloc(size * size * 4, 0); }
function blend(buf, size, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= size || y >= size || a <= 0) return;
  const i = (y * size + x) * 4;
  const ba = buf[i + 3] / 255;
  const na = a + ba * (1 - a);
  if (na <= 0) return;
  buf[i] = clamp((r * a + buf[i] * ba * (1 - a)) / na, 0, 255);
  buf[i + 1] = clamp((g * a + buf[i + 1] * ba * (1 - a)) / na, 0, 255);
  buf[i + 2] = clamp((b * a + buf[i + 2] * ba * (1 - a)) / na, 0, 255);
  buf[i + 3] = clamp(na * 255, 0, 255);
}

// stroke a polyline with rounded caps, x-gradient color + soft glow
function strokePolyline(buf, size, pts, halfW, glow, opacity, colorMode) {
  const minx = 0, maxx = size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let d = Infinity;
      for (let k = 0; k < pts.length - 1; k++) {
        d = Math.min(d, distToSeg(x + 0.5, y + 0.5, pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]));
      }
      // core coverage (anti-aliased edge over 1.5px)
      let cov = clamp((halfW - d) / 1.5 + 0.5, 0, 1) * opacity;
      // glow (soft additive falloff beyond core)
      let g = 0;
      if (glow > 0 && d > halfW && d < halfW + glow) {
        g = Math.pow(1 - (d - halfW) / glow, 2) * 0.5 * opacity;
      }
      const a = Math.max(cov, g);
      if (a <= 0.002) continue;
      let col;
      if (colorMode === 'white') col = [240, 240, 250];
      else {
        const t = clamp((x - size * 0.28) / (size * 0.44), 0, 1);
        col = [lerp(PURPLE[0], BLUE[0], t), lerp(PURPLE[1], BLUE[1], t), lerp(PURPLE[2], BLUE[2], t)];
      }
      blend(buf, size, x, y, col[0], col[1], col[2], a);
    }
  }
}

function fillCircleGlow(buf, size, cx, cy, r, glow, color) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      let a = 0;
      if (d < r) a = clamp((r - d) / 1.5 + 0.5, 0, 1);
      else if (d < r + glow) a = Math.pow(1 - (d - r) / glow, 2) * 0.6;
      if (a <= 0.002) continue;
      blend(buf, size, x, y, color[0], color[1], color[2], a);
    }
  }
}

function drawBackground(buf, size) {
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const r = lerp(10, 20, t), g = lerp(10, 20, t), b = lerp(15, 31, t);
    for (let x = 0; x < size; x++) blend(buf, size, x, y, r, g, b, 1);
  }
}

function hexPoints(cx, cy, R) {
  const pts = [];
  for (let k = 0; k <= 6; k++) {
    const a = (Math.PI / 180) * (60 * k - 90);
    pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  return pts;
}

// Render the full mark. opts: { size, bg, scale, colorMode }
function renderLogo({ size, bg = true, scale = 1, colorMode = 'gradient' }) {
  const buf = makeCanvas(size);
  if (bg) drawBackground(buf, size);
  const cx = size / 2, cy = size / 2;
  const S = size / 1024 * scale;

  // Hexagon gate (subtle)
  strokePolyline(buf, size, hexPoints(cx, cy, 330 * S), 8 * S, 22 * S, 0.55, colorMode);

  // Upward chevrons (Arise)
  const chevron1 = [[cx - 150 * S, cy + 70 * S], [cx, cy - 95 * S], [cx + 150 * S, cy + 70 * S]];
  const chevron2 = [[cx - 150 * S, cy + 185 * S], [cx, cy + 20 * S], [cx + 150 * S, cy + 185 * S]];
  strokePolyline(buf, size, chevron2, 24 * S, 26 * S, 0.6, colorMode);
  strokePolyline(buf, size, chevron1, 26 * S, 34 * S, 1.0, colorMode);

  // Monarch spark
  fillCircleGlow(buf, size, cx, cy - 150 * S, 22 * S, 40 * S, colorMode === 'white' ? [240, 240, 250] : LILAC);

  return buf;
}

// ---- outputs ----------------------------------------------------------------
const assets = path.join(__dirname, '..', 'assets');
function write(name, size, opts) {
  const buf = renderLogo({ size, ...opts });
  const png = encodePNG(size, size, buf);
  fs.writeFileSync(path.join(assets, name), png);
  console.log(`  wrote ${name} (${size}x${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

console.log('Generating Arise icons...');
write('icon.png', 1024, { bg: true, scale: 1 });
write('adaptive-icon.png', 1024, { bg: true, scale: 0.72 });      // Android safe zone
write('splash.png', 1024, { bg: true, scale: 0.9 });
write('favicon.png', 96, { bg: true, scale: 1 });
write('notification-icon.png', 96, { bg: false, scale: 1, colorMode: 'white' }); // white on transparent
console.log('Done.');
