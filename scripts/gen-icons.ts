/**
 * Regenerates the PNG favicons from the Flowday logo geometry
 * (indigo rounded square + three white chevrons).
 *
 *   bun scripts/gen-icons.ts
 *
 * Outputs into public/:
 *   favicon-16.png / favicon-32.png            (transparent rounded corners)
 *   apple-touch-icon.png                       (full-bleed 180px — iOS masks corners itself)
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

/* ------------------------------------------------------------------ */
/* Logo geometry (viewBox 512)                                          */
/* ------------------------------------------------------------------ */

const INDIGO: RGB = [79, 70, 229]; // #4f46e5
const WHITE: RGB = [255, 255, 255];
type RGB = [number, number, number];

const SEGMENTS: [number, number, number, number][] = [
  // chevron 1 (faded)
  [140, 172, 232, 256],
  [232, 256, 140, 340],
  // chevron 2
  [242, 172, 334, 256],
  [334, 256, 242, 340],
  // chevron 3 (solid)
  [344, 172, 436, 256],
  [436, 256, 344, 340],
];
const OPACITIES = [0.6, 0.6, 0.8, 0.8, 1.0, 1.0];
const HALF_W = 32; // stroke-width 64 → half = 32 (512 units)

/* ------------------------------------------------------------------ */
/* Rasterizer (4×4 supersampling per output pixel)                      */
/* ------------------------------------------------------------------ */

function insideRoundedSquare(x: number, y: number, S: number, inset: number, r: number): boolean {
  const lo = inset;
  const hi = S - inset;
  if (x < lo || x > hi || y < lo || y > hi) return false;
  // corner circles
  const cx = Math.min(Math.max(x, lo + r), hi - r);
  const cy = Math.min(Math.max(y, lo + r), hi - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r || (x >= lo + r && x <= hi - r) || (y >= lo + r && y <= hi - r);
}

function segDist2(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = px - x1;
  const wy = py - y1;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, (wx * vx + wy * vy) / len2));
  const dx = px - (x1 + t * vx);
  const dy = py - (y1 + t * vy);
  return dx * dx + dy * dy;
}

/** Renders one RGBA pixel row-major buffer at `size`, sup = supersample grid. */
function render(size: number, opts: { rounded: boolean }): { buf: Uint8Array; size: number } {
  const S = 512;
  const sup = 4; // 4×4 subsamples per pixel
  const buf = new Uint8Array(size * size * 4);
  const scale = S / size;
  const inset = opts.rounded ? 0 : 0; // icon art fills the viewBox either way
  const radius = opts.rounded ? (112 / 512) * S : 0;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bgHits = 0;
      // accumulate white coverage weighted by each chevron's opacity
      const whiteW = [0, 0, 0]; // per chevron pair
      for (let sy = 0; sy < sup; sy++) {
        for (let sx = 0; sx < sup; sx++) {
          const x = (px + (sx + 0.5) / sup) * scale;
          const y = (py + (sy + 0.5) / sup) * scale;
          if (insideRoundedSquare(x, y, S, inset, radius)) bgHits++;
          for (let s = 0; s < SEGMENTS.length; s++) {
            const [x1, y1, x2, y2] = SEGMENTS[s];
            const d2 = segDist2(x, y, x1, y1, x2, y2);
            if (d2 <= HALF_W * HALF_W) {
              whiteW[s >> 1] += OPACITIES[s] / (sup * sup);
            }
          }
        }
      }
      const bgA = bgHits / (sup * sup);
      // composite: white over indigo, then alpha-mask by the square
      let wA = whiteW[0] + whiteW[1] + whiteW[2];
      wA = Math.min(1, wA);
      const o = (py * size + px) * 4;
      for (let c = 0; c < 3; c++) {
        buf[o + c] = Math.round(WHITE[c] * wA + INDIGO[c] * (1 - wA));
      }
      buf[o + 3] = Math.round(bgA * 255);
    }
  }
  return { buf, size };
}

/** Box-downsample a rendered buffer by an integer factor. */
function downsample(src: { buf: Uint8Array; size: number }, factor: number) {
  const size = Math.floor(src.size / factor);
  const buf = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const o = ((y * factor + dy) * src.size + (x * factor + dx)) * 4;
          r += src.buf[o];
          g += src.buf[o + 1];
          b += src.buf[o + 2];
          a += src.buf[o + 3];
        }
      }
      const n = factor * factor;
      const o2 = (y * size + x) * 4;
      buf[o2] = Math.round(r / n);
      buf[o2 + 1] = Math.round(g / n);
      buf[o2 + 2] = Math.round(b / n);
      buf[o2 + 3] = Math.round(a / n);
    }
  }
  return { buf, size };
}

/* ------------------------------------------------------------------ */
/* Minimal PNG encoder (RGBA, filter 0)                                 */
/* ------------------------------------------------------------------ */

let CRC_TABLE: number[] | null = null;
function crc32(buf: Buffer): number {
  if (!CRC_TABLE) {
    CRC_TABLE = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(img: { buf: Uint8Array; size: number }): Buffer {
  const { size, buf } = img;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    Buffer.from(buf.buffer, buf.byteOffset + y * size * 4, size * 4).copy(
      raw,
      y * (size * 4 + 1) + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* Generate                                                             */
/* ------------------------------------------------------------------ */

const OUT = join(process.cwd(), "public");

// Favicons: render at 4× target then box-downsample for smooth edges.
for (const size of [16, 32]) {
  const hi = render(size * 4, { rounded: true });
  const png = encodePng(downsample(hi, 4));
  writeFileSync(join(OUT, `favicon-${size}.png`), png);
  console.log(`wrote public/favicon-${size}.png (${png.length} bytes)`);
}

// Apple touch icon: 180px, full-bleed square (iOS applies its own mask).
const at = render(180, { rounded: false });
writeFileSync(join(OUT, "apple-touch-icon.png"), encodePng(at));
console.log(`wrote public/apple-touch-icon.png`);
console.log("done");
