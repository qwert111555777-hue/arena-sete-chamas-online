module.exports = {
  SEG: {
  defesa:  { name: 'Ministério da Defesa', icon: '🛡️', desc: '+8% defesa por nível',              custos: [400, 900, 1800] },
  secreto: { name: 'Serviço Secreto',      icon: '🕵️', desc: 'espionagem mais forte, -12% dano de sabotagem por nível', custos: [350, 800, 1600] },
  policia: { name: 'Polícia',              icon: '🚓', desc: '+1 aprovação por semana por nível',  custos: [300, 700, 1400] },
  guarda:  { name: 'Guarda Nacional',      icon: '🪖', desc: '+6% defesa por nível e menos golpes', custos: [350, 800, 1600] },
},
  LEIS: {
  servico_militar:   { name: 'Serviço Militar Obrigatório', cost: 150, desc: '+5% ataque em guerras' },
  guarda_nacional:   { name: 'Guarda Nacional',             cost: 160, desc: '+5% defesa' },
  reforma_agraria:   { name: 'Reforma Agrária',             cost: 200, desc: '+$10/semana' },
  abertura_comercial:{ name: 'Abertura Comercial',          cost: 180, desc: '+$10/semana' },
  liberdade_imprensa:{ name: 'Liberdade de Imprensa',       cost: 120, desc: '+3 aprovação' },
  campanha_patriotica:{ name: 'Campanha Patriótica',        cost: 100, desc: '+4 aprovação' },
  ensino_obrigatorio:{ name: 'Ensino Obrigatório', cost: 200, desc: '+2 aprovação, +1 ciência' },
  saude_universal:  { name: 'Saúde Universal',   cost: 250, desc: '+3 aprovação, +2 pop' },
  codigo_florestal: { name: 'Código Florestal',  cost: 150, desc: '+1 economia' },
  zona_franca: { name: 'Zona Franca', cost: 300, desc: '+$20/semana' },
  bolsa_familia: { name: 'Bolsa Família', cost: 250, desc: '+4 aprovação, +1 pop' },
  /* FASE 396 — LEIS DE PRODUÇÃO (paridade com a tela de decretos do MA3:
     preço de compra, preço de venda, volume de produção, velocidade e tempo de obra).
     Toda lei tem contrapartida visível: nenhuma é vantagem pura. */
  lei_compra:  { name: 'Compras Estatais Centralizadas', cost: 220, desc: 'compra no mercado −12%, mas a venda cai 6%', grupo: 'producao' },
  lei_venda:   { name: 'Câmbio de Exportação',           cost: 220, desc: 'venda no mercado +12%, mas a compra sobe 6%', grupo: 'producao' },
  lei_volume:  { name: 'Turnos Extras na Indústria',     cost: 260, desc: 'produção +25%, consumo de insumo +25%, −2 ❤️', grupo: 'producao' },
  lei_ritmo:   { name: 'Ritmo de Produção Acelerado',    cost: 240, desc: 'produção +10% e obra 1 dia mais rápida, insumo +10%', grupo: 'producao' },
  lei_mutirao: { name: 'Mutirão Nacional de Obras',      cost: 200, desc: 'tempo de obra −35%, custo da obra +15%', grupo: 'producao' },
},
  LEI_GRUPOS: {
  servico_militar:   { militares:+20, pacifistas:-25, empresarios:0,  religiosos:0,  intelectuais:-5 },
  guarda_nacional:   { militares:+12, pacifistas:-10, empresarios:+5, religiosos:0,  intelectuais:0 },
  reforma_agraria:   { militares:-5,  pacifistas:+10, empresarios:-15,religiosos:+5, intelectuais:+8 },
  abertura_comercial:{ militares:0,   pacifistas:+5,  empresarios:+22,religiosos:0,  intelectuais:+10 },
  liberdade_imprensa:{ militares:-8,  pacifistas:+12, empresarios:+5, religiosos:-5, intelectuais:+20 },
  campanha_patriotica:{militares:+15, pacifistas:-8,  empresarios:+3, religiosos:+8, intelectuais:-12 },
  ensino_obrigatorio:{ militares:0,   pacifistas:+8,  empresarios:-4, religiosos:-3, intelectuais:+18 },
  estado_direito:    { militares:-6,  pacifistas:+14, empresarios:+12,religiosos:0,  intelectuais:+16 },
  teto_gastos:       { militares:+3,   pacifistas:-6,  empresarios:+18,religiosos:0,  intelectuais:-8 },
  reforma_trabalhista:{militares:0,   pacifistas:-10, empresarios:+20,religiosos:0,  intelectuais:-6 },
  lei_marcal:        { militares:+18,  pacifistas:-20, empresarios:-8, religiosos:+4, intelectuais:-10 }
},
  MINISTRO_EFEITOS: {
  eco: {
    tec: { renda:+0.10, pesquisa:+0.06, aprovacao:-1, desemprego:-0.02 },
    pop: { renda:-0.05, pesquisa:0,     aprovacao:+1, desemprego:-0.04 },
    ind: { renda:+0.20, pesquisa:-0.03, aprovacao:0,  desemprego:-0.06 }
  },
  def: {
    pac: { renda:-0.10, defesa:-0.05, aprovacao:+2, militar:-0.08 },
    agu: { renda:-0.02, defesa:+0.12, aprovacao:-2, militar:+0.15 },
    eq:  { renda:0,     defesa:+0.05, aprovacao:+1, militar:+0.05 }
  },
  soc: {
    art: { aprovacao:+1, cultura:+0.15, doutrina:+0.08, renda:-0.02 },
    atl: { aprovacao:0,  cultura:-0.05, doutrina:0,     renda:+0.05 }
  }
},
};
