process.env.PORT = '3997';
const S = require('/tmp/srv_test.js');
let ok = 0, fail = 0;
const chk = (n, c, e = '') => { c ? ok++ : fail++; console.log((c ? '  ✅ ' : '  ❌ ') + n + (e ? ' — ' + e : '')); };
function jogador(id, extra) {
  return Object.assign({
    id, name: 'N' + id, alive: true, money: 100000, mil: 5, eco: 10, pop: 5000, ap: 10,
    aprov: 60, rec: { comida: 200, minerio: 200, energia: 200, concreto: 100, madeira: 100, terras_raras: 50, uranio: 10, borracha: 10, carne: 50 },
    buildings: { siderurgica: 2, fazenda: 2, usina: 2 }, upgrades: {}, techLv: {},
    provinces: [{ name: 'P1', owner: id, infra: 4 }], units: { infantaria: 0, blindados: 0, artilharia: 0, aviacao: 0, submarinos: 0, frota: 0, porta_avioes: 0, fuzileiros: 0, defesa_aerea: 0 },
    wars: [], allies: [], sanctionedBy: [], sanctioning: [], blockadedBy: [], blockading: [],
    trades: [], relations: {}, pacts: {}, leis: [], ministers: { eco: 'ind', def: 'agu', soc: 'art' },
    ideology: 'democracia', taxRate: 1, sectors: { educacao: 1, saude: 1, cultura: 1, esportes: 1, habitacao: 1, justica: 1, turismo: 1, infraestrutura: 1, ciencia: 1 },
    seguranca: { defesa: 1, secreto: 1, policia: 1, guarda: 1 }, orgs: [], budget: null, nuclear: 0, space: 0, debt: 0, maravilhas: [], embassies: [], dividas: [], pollution: 0, emergencyUntil: 0, famine: false
  }, extra || {});
}

console.log('\n=== FASE 396 — LEIS DE PRODUÇÃO ===');
const base = jogador('b');
chk('sem lei, multiplicadores neutros', JSON.stringify([S.leiProd(base).compra, S.leiProd(base).venda, S.leiProd(base).volume]) === '[1,1,1]');
const lc = jogador('c', { leis: ['lei_compra'] });
chk('lei_compra reduz compra e deprime venda', S.leiProd(lc).compra < 1 && S.leiProd(lc).venda < 1, 'compra x' + S.leiProd(lc).compra.toFixed(2) + ' venda x' + S.leiProd(lc).venda.toFixed(2));
const lv = jogador('v', { leis: ['lei_venda'] });
chk('lei_venda aumenta venda e encarece compra', S.leiProd(lv).venda > 1 && S.leiProd(lv).compra > 1, 'venda x' + S.leiProd(lv).venda.toFixed(2) + ' compra x' + S.leiProd(lv).compra.toFixed(2));
const vol = jogador('o', { leis: ['lei_volume'] });
chk('lei_volume aumenta produção e insumo', S.leiProd(vol).volume === 1.25 && S.leiProd(vol).insumo === 1.25, 'x' + S.leiProd(vol).volume.toFixed(2));
chk('lei_volume eleva o consumo de insumo da siderúrgica', S.insumoNecessario(vol).energia > S.insumoNecessario(base).energia, S.insumoNecessario(vol).energia + ' vs ' + S.insumoNecessario(base).energia);
const mut = jogador('m', { leis: ['lei_mutirao'] });
chk('lei_mutirao encurta o tempo de obra', S.buildDays(600, mut) < S.buildDays(600, base), 'dias ' + S.buildDays(600, base) + ' -> ' + S.buildDays(600, mut));
chk('lei_mutirao encarece a obra (contrapartida)', S.leiProd(mut).obraCusto === 1.15, 'x' + S.leiProd(mut).obraCusto.toFixed(2));
const rit = jogador('r', { leis: ['lei_ritmo'] });
chk('lei_ritmo acelera produção e obra', S.leiProd(rit).volume === 1.10 && S.leiProd(rit).obraFixo === -1, 'volume x' + S.leiProd(rit).volume.toFixed(2));

console.log('\n=== FASE 397 — FUZILEIROS E DEFESA AÉREA NA BATALHA ===');
chk('fuzileiros tem stats de batalha', !!S.BT.fuzileiros, S.BT.fuzileiros && (S.BT.fuzileiros.nome + ' hp' + S.BT.fuzileiros.hp));
chk('defesa_aerea tem stats de batalha', !!S.BT.defesa_aerea, S.BT.defesa_aerea && (S.BT.defesa_aerea.nome + ' hp' + S.BT.defesa_aerea.hp));
chk('defesa aérea é o predador da aviação', S.vantagemUnidade('defesa_aerea', 'aviacao').mult > 1.4, 'x' + S.vantagemUnidade('defesa_aerea', 'aviacao').mult.toFixed(2));
chk('fuzileiro domina infantaria', S.vantagemUnidade('fuzileiros', 'infantaria').mult > 1, 'x' + S.vantagemUnidade('fuzileiros', 'infantaria').mult.toFixed(2));
const comp = jogador('u', { units: { fuzileiros: 2, defesa_aerea: 1 } });
chk('montarExercito escala fuzileiros e defesa aérea', S.montarExercito(comp, 'atk').some(u => u.tipo === 'fuzileiros') && S.montarExercito(comp, 'atk').some(u => u.tipo === 'defesa_aerea'));

console.log('\n=== FASE 398 — TETO DE UNIDADE E CUSTO ÚNICO ===');
chk('UNIT_COSTS tem as 9 unidades', Object.keys(S.UNIT_COSTS).length === 9, Object.keys(S.UNIT_COSTS).join(','));
chk('teto UNIT_MAX é 3', S.UNIT_MAX === 3);
const cheio = jogador('t', { units: { infantaria: 3 } });
const ex = S.montarExercito(cheio, 'def');
chk('infantaria 3 vira no máximo 3 unidades de campo', ex.filter(u => u.tipo === 'infantaria').length === 3, ex.filter(u => u.tipo === 'infantaria').length + ' em campo');

console.log('\n=== ' + ok + ' ok, ' + fail + ' falhas ===');
process.exit(fail ? 1 : 0);
