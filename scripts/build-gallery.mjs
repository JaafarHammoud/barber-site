// Собирает js/gallery.js из папок assets/img/works и assets/img/salon.
// Запуск: node scripts/build-gallery.mjs (на GitHub выполняется автоматически).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FALLBACK_CAPTION = 'Салон LORD';

function photos(folder) {
  return readdirSync(join(root, folder))
    .filter((name) => /\.(webp|jpe?g|png|avif)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }));
}

const captions = new Map(JSON.parse(readFileSync(join(root, 'assets/img/salon/captions.json'), 'utf8')));
const files = photos('assets/img/salon');

// Сначала фото с подписями в порядке captions.json, затем новые
const known = [...captions.keys()].flatMap((id) => files.filter((f) => parse(f).name === id));
const fresh = files.filter((f) => !known.includes(f));
const salon = [...known, ...fresh].map((f) => [f, captions.get(parse(f).name) || FALLBACK_CAPTION]);

const gallery = { works: photos('assets/img/works'), salon };
writeFileSync(
  join(root, 'js/gallery.js'),
  '// Сгенерировано scripts/build-gallery.mjs — не редактируйте вручную.\nwindow.LORD_GALLERY = ' +
    JSON.stringify(gallery, null, 1) + ';\n'
);
console.log(`works: ${gallery.works.length}, salon: ${salon.length}`);
