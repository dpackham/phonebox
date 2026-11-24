// Checks grid.js against the editor's screen presets. Run: node tools/check-grid.mjs
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'pb-grid-'));
const file = join(dir, 'grid.mjs');
copyFileSync(fileURLToPath(new URL('../android/app/src/main/assets/www/grid.js', import.meta.url)), file);
const { gridForViewport, designGrid, placeWidget, widgetsOnGrid, PHONE_COLS, PHONE_ROWS, MAX_ROWS } = await import(pathToFileURL(file).href);

const eq = (a, b, msg) => {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  if (ja !== jb) { console.error(msg + '\n  got ' + ja + '\n  want ' + jb); process.exitCode = 1; }
};

const phone = gridForViewport(780, 360);
eq(phone, { cols: 12, rows: 6, tablet: false, portrait: false }, 'phone landscape');
eq(gridForViewport(360, 780), { cols: 6, rows: 6, tablet: false, portrait: true }, 'phone portrait');

const nexus9 = gridForViewport(1024, 768);
eq(nexus9, { cols: 12, rows: 10, tablet: true, portrait: false }, 'Nexus 9 landscape');
eq(gridForViewport(768, 1024), { cols: 12, rows: 6, tablet: true, portrait: true }, 'Nexus 9 portrait');
eq(designGrid(768, 1024), { cols: 12, rows: 10, tablet: true, portrait: false }, 'Nexus 9 design grid while upright');

eq(gridForViewport(1280, 800), { cols: 12, rows: 8, tablet: true, portrait: false }, '16:10 tablet');
eq(gridForViewport(800, 360), { cols: PHONE_COLS, rows: PHONE_ROWS, tablet: false, portrait: false }, 'wide phone');

eq(placeWidget({ x: 0, y: 6, w: 4, h: 2 }, 12, 6), null, 'tablet row hidden on a phone');
eq(placeWidget({ x: 0, y: 6, w: 4, h: 2 }, 12, 10), { x: 0, y: 6, w: 4, h: 2 }, 'tablet row kept');
eq(placeWidget({ x: 10, y: 4, w: 4, h: 4 }, 12, 6), { x: 10, y: 4, w: 2, h: 2 }, 'clamped to the page');
const page = [{ id: 'top', x: 0, y: 0, w: 4, h: 2 }, { id: 'tablet', x: 0, y: 6, w: 4, h: 2 }, { id: 'edge', x: 4, y: 4, w: 4, h: 4 }];
eq(widgetsOnGrid(page, 12, 6).map((w) => w.id), ['top', 'edge'], 'upright phone packs only the phone rows');
eq(widgetsOnGrid(page, 12, 10).map((w) => w.id), ['top', 'tablet', 'edge'], 'upright tablet keeps its rows');
if (nexus9.rows > PHONE_ROWS && nexus9.rows <= MAX_ROWS && nexus9.cols === 12) console.log('grid ok');
else { console.error('nexus grid out of range'); process.exitCode = 1; }
if (!process.exitCode) console.log('all grid checks passed');
