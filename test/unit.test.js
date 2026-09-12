/* FASE 403 — SUITE DE TESTES UNITÁRIOS (item 39 da spec)
   Testa funções puras e constantes do servidor, sem rede (require direto).
   Rode com:  node test/unit.test.js
   Saída: linhas ✅/❌ + resumo. Exit code 0 = tudo verde. */
'use strict';
const s = require('../server.js');

let pass = 0, fail = 0;
const failures = [];
function ok(nome, cond) {
  if (cond) { pass++; console.log('  ✅ ' + nome); }
  else { fail++; failures.push(nome); console.log('  ❌ ' + nome); }
}
function section(t) { console.log('\n■ ' + t); }

/* ---------- TEMPO ---------- */
section('TEMPO');
ok('dayMsFor(1) = 3000', s.dayMsFor(1) === 3000);
ok('dayMsFor(2) = 1500', s.dayMsFor(2) === 1500);
ok('dayMsFor(3) = 1000', s.dayMsFor(3) === 1000);
ok('dayMsFor(5) = 600', s.dayMsFor(5) === 600);
ok('dayMsFor(999 inválido) = 3000', s.dayMsFor(999) === 3000);

/* ---------- CONSTRUÇÃO ---------- */
section('CONSTRUÇÃO (buildDays)');
ok('buildDays está entre 1 e 30', (() => { const d = s.buildDays(500, null); return d >= 1 && d <= 30; })());
ok('buildDays é inteiro', Number.isInteger(s.buildDays(300, null)));

/* ---------- SANITIZAÇÃO ---------- */
section('SEGURANÇA (sanitizeName)');
ok('remove caracteres perigosos', s.sanitizeName('<script>alert(1)</script>') === 'scriptalert1script');
ok('trunca em 18 chars', s.sanitizeName('A'.repeat(50)).length <= 18);
ok('vazio vira Presidente', s.sanitizeName('') === 'Presidente');
ok('mantém acentos e espaços', s.sanitizeName('João Silva') === 'João Silva');

/* ---------- TECNOLOGIA ---------- */
section('TECNOLOGIA');
ok('TECH_COSTS correto', JSON.stringify(s.TECH_COSTS) === JSON.stringify([50, 99, 198, 396, 797]));
ok('techCost(0) = 50', s.techCost(0) === 50);
ok('techCost(4) = 797', s.techCost(4) === 797);
ok('techCost(fora do range) = 797', s.techCost(999) === 797);
ok('techLevel jogador sem techLv = 0', s.techLevel({}, 'infra') === 0);
ok('techLevel jogador com techLv = N', s.techLevel({ techLv: { infra: 3 } }, 'infra') === 3);
ok('techName de tech inexistente devolve a chave', s.techName('zzz') === 'zzz');
ok('TECHS tem 125 tecnologias', Object.keys(s.TECHS).length === 125);
ok('TECH_TREES tem 5 árvores', s.TECH_TREES.length === 5);

/* ---------- RELAÇÕES ---------- */
section('RELAÇÕES (relBetween)');
ok('relação default = 50', s.relBetween({ id: 'a', relations: {} }, { id: 'b' }) === 50);
ok('relação explícita é respeitada', s.relBetween({ id: 'a', relations: { b: 80 } }, { id: 'b' }) === 80);

/* ---------- SETORES / PROVÍNCIAS ---------- */
section('SETORES / PROVÍNCIAS');
ok('sectorSum soma os 9 setores', s.sectorSum({ sectors: { educacao: 1, saude: 1, cultura: 1, esportes: 1, habitacao: 1, justica: 1, turismo: 1, infraestrutura: 1, ciencia: 1 } }) === 9);
ok('ownProvinces filtra por dono', s.ownProvinces({ id: 'p1', provinces: [{ owner: 'p1' }, { owner: 'p2' }, { owner: 'p1' }] }).length === 2);
ok('SECTORS tem 9 setores', s.SECTORS.length === 9);

/* ---------- MISSÕES ---------- */
section('MISSÕES');
ok('MISSIONS tem 37 missões', s.MISSIONS.length === 37);
ok('toda missão tem id/desc/reward/check', s.MISSIONS.every(m => m.id && m.desc && typeof m.reward === 'number' && typeof m.check === 'function'));

/* ---------- UNIDADES ---------- */
section('UNIDADES');
ok('UNIT_COSTS tem 9 unidades', Object.keys(s.UNIT_COSTS).length === 9);
ok('UNIT_MAX = 3', s.UNIT_MAX === 3);
ok('todas as unidades têm custo positivo', Object.values(s.UNIT_COSTS).every(c => c > 0));

/* ---------- PERSONAS ---------- */
section('PERSONAS DE IA');
ok('7 personas', Object.keys(s.PERSONAS).length === 7);
const p1 = s.personaOf('br'), p2 = s.personaOf('br');
ok('personaOf é determinística', p1 === p2);
ok('personaOf retorna chave válida', p1 in s.PERSONAS);
const variedade = new Set(['br','us','ru','cn','gb','fr','de','in','jp','mx'].map(id => s.personaOf(id)));
ok('personaOf tem variedade entre países', variedade.size >= 2);

/* ---------- ECONOMIA (mock) ---------- */
section('ECONOMIA (pibOf/incomeOf)');
const mk = () => ({
  id: 'pX', money: 10000, eco: 3, mil: 3, aprov: 50, ap: 4, alive: true,
  allies: [], sanctioning: [], sanctionedBy: [], blockading: [], blockadedBy: [], wars: [],
  provinces: [{ name: 'Capital', infra: 1, owner: 'pX', origem: 'pX' }],
  buildings: { fazenda: 0, mina: 0, usina: 0 }, stats: {}, builds: [],
  rec: { comida: 10, minerio: 10, energia: 10, concreto: 25, madeira: 10, terras_raras: 12, uranio: 0, borracha: 0, carne: 0 },
  pop: 0, xp: 0, techLv: {}, techs: [], sectors: { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0, infraestrutura: 0, ciencia: 0 },
  space: 0, colonias: [], embassies: [], trades: [], ministers: { eco: null, def: null, dip: null, soc: null },
  ideology: null, religion: 'laico', leis: [], taxes: { corp: 10, rend: 10, prod: 10, amb: 5 }, budget: { exe: 1, int: 1, tra: 1, edu: 1, ambm: 1 },
  taxRate: 1, debt: 0, nuclear: 0, influencia: 0, fe: 0, relations: {}, depositos: [], upgrades: {}, pacts: {}, seguranca: { defesa: 0, secreto: 0, policia: 0, guarda: 0 }, espioes: 1,
  emergencyUntil: 0, maravilhas: [], suprimento: null, pib: null, empregos: null, inflacao: 0,
});
const room = { embargo: null, bloqueio: null, turn: 1, invernoUntil: 0, market: { comida: 8 } };
ok('pibOf retorna número finito', Number.isFinite(s.pibOf(mk())));
ok('empregosOf retorna número finito', Number.isFinite(s.empregosOf(mk())));
ok('incomeOf retorna número finito', Number.isFinite(s.incomeOf(room, mk())));
ok('taxaSuprimento retorna número 0..1', (() => { const v = s.taxaSuprimento(mk()); return v >= 0 && v <= 1; })());
ok('pibDetalhe retorna objeto', typeof s.pibDetalhe(mk()) === 'object');

/* ---------- FASE 404: CALENDÁRIO CIVIL ---------- */
section('CALENDÁRIO (dataDe)');
ok('dataDe exportada', typeof s.dataDe === 'function');
ok('dataDe(1) = 01 de Julho de 2024', s.dataDe(1).txt === '1 de Julho de 2024');
ok('dataDe(31) = Julho→ 1 de Agosto de 2024', s.dataDe(31).txt === '1 de Agosto de 2024');
ok('dataDe(361) vira 2025', s.dataDe(361).ano === 2025 && s.dataDe(361).mes === 'Julho');
ok('dataDe(day 0) não quebra (≥2024)', s.dataDe(0).ano >= 2024);
ok('MESES tem 12 nomes', s.MESES.length === 12);

/* ---------- FASE 404: MANUTENÇÃO DE CONSTRUÇÕES ---------- */
section('MANUTENÇÃO (buildingMaint)');
ok('buildingMaint exportada', typeof s.buildingMaint === 'function');
ok('0 prédios = 0 manutenção', s.buildingMaint({ buildings: {}, upgrades: {} }) === 0);
ok('prédios somam', s.buildingMaint({ buildings: { fazenda: 2, mina: 1 }, upgrades: {} }) === 5);  // 3 prédios × 1.5 = 4.5 → 5
ok('upgrades encarecem', s.buildingMaint({ buildings: {}, upgrades: { fazenda: 2 } }) === 3);  // 2 upgrades × 1.5 = 3
ok('incomeOf desconta manutenção (base militar não rende, só custa)', (() => {
  const a = mk(); const b = mk();
  b.buildings['base'] = 20;   // base tem BUILD_OUT vazio: não rende, só gera manutenção
  return s.incomeOf(room, b) < s.incomeOf(room, a);
})());

/* ---------- FASE 405: MIGRAÇÃO ENTRE PROVÍNCIAS ---------- */
section('MIGRAÇÃO (migracaoOf)');
ok('migracaoOf exportada', typeof s.migracaoOf === 'function');
ok('sem 2 províncias = migração zero', (() => { const r = s.migracaoOf({ id: 'a', provinces: [{ owner: 'a', infra: 3 }], sectors: {} }); return r.migracao === 0 && r.bonus === 0 && r.tensao === 0; })());
ok('províncias iguais = migração zero', (() => { const r = s.migracaoOf({ id: 'a', provinces: [{ owner: 'a', infra: 3 }, { owner: 'a', infra: 3 }], sectors: {} }); return r.migracao === 0 && r.bonus === 0 && r.tensao === 0; })());
ok('províncias desiguais = migração positiva (êxodo)', (() => { const r = s.migracaoOf({ id: 'a', provinces: [{ owner: 'a', infra: 5 }, { owner: 'a', infra: 0 }], sectors: {} }); return r.migracao > 0 && r.bonus > 0 && r.tensao > 0; })());
ok('bônus limitado a +15%', (() => { const r = s.migracaoOf({ id: 'a', provinces: [{ owner: 'a', infra: 5 }, { owner: 'a', infra: 0 }], sectors: {} }); return r.bonus <= 0.15; })());
ok('habitação/saúde amortizam a tensão do êxodo', (() => { const a = s.migracaoOf({ id: 'a', provinces: [{ owner: 'a', infra: 5 }, { owner: 'a', infra: 0 }], sectors: { habitacao: 5, saude: 5 } }); const b = s.migracaoOf({ id: 'a', provinces: [{ owner: 'a', infra: 5 }, { owner: 'a', infra: 0 }], sectors: {} }); return a.tensao < b.tensao; })());
ok('migração alimenta a renda (incomeOf com bônus isolado)', (() => { const x = mk(); x.provinces = [{ name: 'A', infra: 5, owner: 'pX' }, { name: 'B', infra: 0, owner: 'pX' }]; const a = s.incomeOf(room, x); x.migracaoBonus = s.migracaoOf(x).bonus; return s.incomeOf(room, x) > a; })());

/* ---------- FASE 407: EFEITOS FUNCIONAIS DAS TECNOLOGIAS ---------- */
section('TECNOLOGIA — efeitos reais (techBonus/techResBonus)');
ok('techBonus exportada', typeof s.techBonus === 'function');
ok('techResBonus exportada', typeof s.techResBonus === 'function');
ok('todas as 125 techs têm efeito mapeado', Object.keys(s.TECHS).every(k => s.TECH_EFFECTS[k] || s.TECH_RES[k] || (['infra','valor_agreg','condicoes','interceptadores','escola_oficiais','estado_direito','influencia_cult'].includes(k))));
ok('TECH_EFFECTS cobre todas as 125 techs', Object.keys(s.TECHS).filter(k => !s.TECH_EFFECTS[k]).length === 0);
ok('techBonus sem tech = 0', s.techBonus({}, 'renda') === 0);
ok('techBonus soma nível×magnitude', s.techBonus({ techLv: { mina_ouro_t: 2 } }, 'renda') === 6);
ok('techBonus ignora domínio errado', s.techBonus({ techLv: { mina_ouro_t: 2 } }, 'ataque') === 0);
ok('techResBonus gera recurso por nível', (() => { const r = s.techResBonus({ techLv: { mina_ferro: 2 } }); return r.minerio === 2; })());
ok('fatores de guerra usam ataque/defesa separados', (() => {
  const p = { techLv: { canhao_122: 2 }, buildings: {}, provinces: [{ owner: 'p', infra: 1 }], sanctionedBy: [], blockadedBy: [], ministers: { def: null }, rec: {}, buildings2: null };
  return s.techBonus(p, 'ataque') === 2 && s.techBonus(p, 'defesa') === 0;
})());

/* ---------- FASE 407: correção contra-inteligência ---------- */
section('ESPIONAGEM (riscoEspionagem)');
ok('riscoEspionagem exportada', typeof s.riscoEspionagem === 'function');
ok('contraintelig REDUZ o risco de ser espionado', (() => {
  const atk = { techLv: {}, seguranca: { secreto: 0 }, ideology: null, ministers: { def: null } };
  const semDef = { techLv: {}, seguranca: { secreto: 0 }, ideology: null, ministers: { def: null } };
  const comDef = { techLv: { contraintelig: 3 }, seguranca: { secreto: 2 }, ideology: null, ministers: { def: null } };
  return s.riscoEspionagem(atk, comDef) < s.riscoEspionagem(atk, semDef);
})());

/* ---------- FASE 408: TETO DE TROPAS POR QUARTÉIS (paridade MA3) ---------- */
section('MILITAR (milCap)');
ok('milCap exportada', typeof s.milCap === 'function');
ok('teto base = 8 (sem quartéis)', s.milCap({ buildings: {} }) === 8);
ok('quartel +5 no teto', s.milCap({ buildings: { quartel: 2 } }) === 18);
ok('base +2 no teto', s.milCap({ buildings: { base: 1 } }) === 10);
ok('academia +3 no teto', s.milCap({ buildings: { academia_militar: 1 } }) === 11);
ok('teto nunca passa de 25', s.milCap({ buildings: { quartel: 10, base: 10, academia_militar: 10 } }) === 25);
ok('quartéis elevam o teto (diferença real)', s.milCap({ buildings: { quartel: 3 } }) > s.milCap({ buildings: {} }));

/* ---------- RESULTADO ---------- */
console.log('\n══════════════════════════════');
console.log('RESULTADO: ' + pass + ' passaram · ' + fail + ' falharam');
if (fail) { console.log('FALHAS:'); failures.forEach(f => console.log('  - ' + f)); process.exit(1); }
console.log('✅ TODOS OS TESTES UNITÁRIOS PASSARAM');
process.exit(0);
