// Generates PNG icons for the PWA without external deps.
// Draws the Flowday mark: indigo rounded square + white checkmark-ish "flow" stroke.
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Distance from point to segment
function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function drawIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const s = size / 512; // design in 512 space
  // Background: vertical gradient indigo (#4f46e5 -> #4338ca-ish)
  const top = [0x4f, 0x46, 0xe5], bottom = [0x3b, 0x34, 0xc9];
  const radius = maskable ? size * 0.5 : 512 * 0.22 * s; // maskable = full-bleed circle-ish
  const cx0 = size / 2, cy0 = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let inside = true;
      if (!maskable) {
        // rounded rect in design space
        const x0 = x / s, y0 = y / s;
        const r = 512 * 0.22;
        const minX = r, maxX = 512 - r, minY = r, maxY = 512 - r;
        const qx = Math.max(minX - x0, 0, x0 - maxX);
        const qy = Math.max(minY - y0, 0, y0 - maxY);
        inside = Math.hypot(qx, qy) <= r;
      }
      if (!inside) { rgba[i + 3] = 0; continue; }
      const tt = Math.hypot(x - cx0, y - cy0) / (size * 0.75);
      const c = top.map((tc, k) => Math.round(tc + (bottom[k] - tc) * Math.min(1, tt)));
      rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2]; rgba[i + 3] = 255;

      // Flow mark: three chevron strokes fading (like a fast-forward "flow")
      const px = x / s, py = y / s;
      const strokes = [
        { x1: 150, y1: 176, x2: 236, y2: 256, x3: 150, y3: 336, a: 0.55 },
        { x1: 250, y1: 176, x2: 336, y2: 256, x3: 250, y3: 336, a: 0.8 },
        { x1: 350, y1: 176, x2: 436, y2: 256, x3: 350, y3: 336, a: 1 },
      ];
      for (const st of strokes) {
        const d1 = distSeg(px, py, st.x1, st.y1, st.x2, st.y2);
        const d2 = distSeg(px, py, st.x2, st.y2, st.x3, st.y3);
        const d = Math.min(d1, d2);
        const w = 34; // half-width
        if (d < w) {
          const cov = Math.min(1, (w - d) / 1.5);
          const alpha = cov * st.a;
          rgba[i] = Math.round(rgba[i] * (1 - alpha) + 255 * alpha);
          rgba[i + 1] = Math.round(rgba[i + 1] * (1 - alpha) + 255 * alpha);
          rgba[i + 2] = Math.round(rgba[i + 2] * (1 - alpha) + 255 * alpha);
        }
      }
    }
  }
  return encodePNG(size, size, rgba);
}

const outDir = path.resolve("public");
fs.mkdirSync(outDir, { recursive: true });
for (const [name, size, opts] of [
  ["icon-192.png", 192, {}],
  ["icon-512.png", 512, {}],
  ["icon-maskable-192.png", 192, { maskable: true }],
  ["icon-maskable-512.png", 512, { maskable: true }],
  ["apple-touch-icon.png", 180, {}],
]) {
  fs.writeFileSync(path.join(outDir, name), drawIcon(size, opts));
  console.log("wrote", name);
}
