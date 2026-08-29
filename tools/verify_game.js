const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
let failures = 0;
function ok(cond, msg) {
  if (cond) console.log(`OK  ${msg}`);
  else { console.error(`ERR ${msg}`); failures++; }
}

const html = read('public/index.html');
const js = read('public/client.js');
const css = read('public/styles.css');
const server = read('server.js');

// DOM refs used by $('id') must exist.
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
const refs = new Set([...js.matchAll(/\$\('([^']+)'\)/g)].map(m => m[1]));
const missingRefs = [...refs].filter(id => !ids.has(id));
ok(missingRefs.length === 0, `sem referencias DOM quebradas${missingRefs.length ? ': ' + missingRefs.join(', ') : ''}`);

// Asset paths mentioned in HTML/CSS/JS must exist. Querystrings are ignored.
const assetMatches = [...(html + css + js).matchAll(/assets\/[A-Za-z0-9_\.\-\/]+/g)].map(m => m[0].replace(/[)"'`].*$/, ''));
const missingAssets = [...new Set(assetMatches)].filter(a => !exists(path.join('public', a)));
ok(missingAssets.length === 0, `sem assets faltando${missingAssets.length ? ': ' + missingAssets.join(', ') : ''}`);

ok(/client\.js\?v=9/.test(html), 'HTML usando client.js?v=9 para limpar cache');
ok(/styles\.css\?v=9/.test(html), 'HTML usando styles.css?v=9 para limpar cache');
ok(/ASSET_VERSION = '9'/.test(js), 'assets com versao v9');
ok(!/assets\/sprites_opt\//.test(js), 'cliente nao carrega sprites antigos pesados');
ok(/assets\/spritesheets\//.test(js), 'cliente usa spritesheets animados');
ok(/perfLevel/.test(js) && /recordFrameCost/.test(js) && /setPerfLevel/.test(js), 'guarda anti-lag dinamico existe');
ok(/getStageAsset/.test(js) && !/Object\.entries\(STAGE_BACKGROUNDS\)/.test(js), 'cenario carrega sob demanda, nao todos de uma vez');
ok(!/label: 'gloss'/.test(server), 'Mito nao tem projetil de gloss');
ok(/type: 'beam'/.test(server) && /type: 'puddle'/.test(server), 'Mito usa Testa Astral + poça de Gloss Caotico');
ok(/function addFloatingText[\s\S]*return;/.test(server), 'texto flutuante da arena desligado');
ok(/messages-hud \{ display: none !important; \}/.test(css), 'mensagens da luta escondidas');

const stageFiles = [
  'public/assets/stages/stage1_lagoa_porta.jpg',
  'public/assets/stages/stage2_feira_coruja.jpg',
  'public/assets/stages/stage3_tanque_missionarios.jpg',
  'public/assets/stages/stage4_recanto_serra.jpg',
  'public/assets/stages/stage5_riacho_curva.jpg'
];
for (const f of stageFiles) {
  const bytes = fs.statSync(path.join(root, f)).size;
  ok(bytes < 260 * 1024, `${f} otimizado (${Math.round(bytes/1024)} KB)`);
}

const sheetDir = path.join(root, 'public/assets/spritesheets');
const sheetFiles = fs.readdirSync(sheetDir).filter(f => f.endsWith('.webp'));
ok(sheetFiles.length === 11, `11 spritesheets animados encontrados (${sheetFiles.length})`);
for (const f of sheetFiles) {
  const bytes = fs.statSync(path.join(sheetDir, f)).size;
  ok(bytes < 220 * 1024, `${f} otimizado (${Math.round(bytes/1024)} KB)`);
}

if (failures) {
  console.error(`\nVERIFY_FAIL: ${failures} erro(s)`);
  process.exit(1);
}
console.log('\nVERIFY_OK');
