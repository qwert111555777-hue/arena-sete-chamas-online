module.exports = {
  UNIT_COSTS: { blindados: 300, aviacao: 400, frota: 500, infantaria: 200, artilharia: 350, submarinos: 450, porta_avioes: 700, fuzileiros: 350, defesa_aerea: 450 },
  UNIT_MAX: 3,
  BT: {
  infantaria:   { em:'🪖', nome:'Infantaria',    hp:10, atk:3, def:2, alc:1 },
  blindados:    { em:'🛡️', nome:'Blindados',     hp:16, atk:5, def:4, alc:1 },
  artilharia:   { em:'💥', nome:'Artilharia',    hp:8,  atk:6, def:1, alc:3 },
  aviacao:      { em:'✈️', nome:'Aviação',       hp:10, atk:5, def:2, alc:4 },
  frota:        { em:'⚓', nome:'Frota',          hp:20, atk:4, def:3, alc:2 },
  submarinos:   { em:'🌊', nome:'Submarinos',    hp:12, atk:6, def:2, alc:2 },
  porta_avioes: { em:'🛳️', nome:'Porta-aviões',  hp:25, atk:3, def:5, alc:3 },
  /* FASE 397 — fuzileiros e defesa aérea existiam na loja mas NÃO existiam na
     batalha (não estavam em BT): o jogador pagava por uma unidade que nunca lutava. */
  fuzileiros:   { em:'🪂', nome:'Fuzileiros Navais', hp:14, atk:4, def:3, alc:2 },
  defesa_aerea: { em:'🎯', nome:'Defesa Aérea',      hp:9,  atk:5, def:2, alc:3 },
  milicia:      { em:'🔰', nome:'Milícia',       hp:8,  atk:2, def:1, alc:1 },
},
  BT_VANTAGEM: {
  infantaria:   { contra:['artilharia','submarinos'],  mult:1.35, fraca:['blindados','aviacao','fuzileiros'] },
  blindados:    { contra:['infantaria','artilharia'],  mult:1.35, fraca:['aviacao'] },
  artilharia:   { contra:['blindados','infantaria'],   mult:1.30, fraca:['aviacao','frota','fuzileiros'] },
  aviacao:      { contra:['blindados'],                mult:1.40, fraca:['frota','porta_avioes','defesa_aerea'] },
  frota:        { contra:['artilharia','aviacao'],     mult:1.25, fraca:['submarinos'] },
  submarinos:   { contra:['frota','porta_avioes'],     mult:1.45, fraca:['infantaria','aviacao'] },
  porta_avioes: { contra:['aviacao','submarinos'],     mult:1.20, fraca:['frota','defesa_aerea'] },
  /* FASE 397 — fuzileiros: infantaria de elite que desembarca e domina infantaria e
     artilharia no corpo a corpo, mas é frágil contra blindados.
     Defesa aérea: o predador de tudo que voa (x1,55), inútil contra o chão. */
  fuzileiros:   { contra:['infantaria','artilharia'],  mult:1.30, fraca:['blindados'] },
  defesa_aerea: { contra:['aviacao','porta_avioes'],   mult:1.55, fraca:['blindados','infantaria'] },
  milicia:      { contra:[],                           mult:1.00, fraca:[] }
},
  BT_COLS: 7,
  BT_LINHAS: 6,
};
