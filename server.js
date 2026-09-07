'use strict';
/* ============================================================
   PRESIDENTE ONLINE — Simulador de Geopolítica Multiplayer
   VERSÃO TOTAL: impostos, empréstimos, ministros, ideologias,
   religião de Estado, tecnologias, setores sociais, relações
   bilaterais, embaixadas, acordos comerciais, bloqueio naval,
   ONU com votações, programa espacial, nuclear, províncias,
   sanções, sabotagem, guerras/paz, 5+ vitórias.
   Servidor HTTP + WebSocket sem dependências externas.
   ============================================================ */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const AP_PER_TURN = 4;
const PROV_INCOME = 6;
const NUKE_MIN_LEVEL = 3;
const NUKE_MAX_LEVEL = 5;

/* ---------------- Conteúdo (original) ---------------- */
const COUNTRIES = [
  { id:'br', name:'Brasil', flag:'🇧🇷', lat:-10, lon:-52 },
  { id:'us', name:'Estados Unidos', flag:'🇺🇸', lat:39, lon:-98 },
  { id:'ru', name:'Rússia', flag:'🇷🇺', lat:60, lon:90 },
  { id:'cn', name:'China', flag:'🇨🇳', lat:35, lon:104 },
  { id:'gb', name:'Reino Unido', flag:'🇬🇧', lat:53, lon:-2 },
  { id:'fr', name:'França', flag:'🇫🇷', lat:46, lon:2 },
  { id:'de', name:'Alemanha', flag:'🇩🇪', lat:51, lon:10 },
  { id:'in', name:'Índia', flag:'🇮🇳', lat:22, lon:79 },
  { id:'jp', name:'Japão', flag:'🇯🇵', lat:36, lon:138 },
  { id:'mx', name:'México', flag:'🇲🇽', lat:23, lon:-102 },
  { id:'ng', name:'Nigéria', flag:'🇳🇬', lat:9, lon:8 },
  { id:'au', name:'Austrália', flag:'🇦🇺', lat:-25, lon:134 },
  { id:'ar', name:'Argentina', flag:'🇦🇷', lat:-34, lon:-64 },
  { id:'ca', name:'Canadá', flag:'🇨🇦', lat:56, lon:-106 },
  { id:'es', name:'Espanha', flag:'🇪🇸', lat:40, lon:-4 },
  { id:'it', name:'Itália', flag:'🇮🇹', lat:42, lon:12 },
  { id:'tr', name:'Turquia', flag:'🇹🇷', lat:39, lon:35 },
  { id:'sa', name:'Arábia Saudita', flag:'🇸🇦', lat:24, lon:45 },
  { id:'ir', name:'Irã', flag:'🇮🇷', lat:32, lon:53 },
  { id:'eg', name:'Egito', flag:'🇪🇬', lat:26, lon:30 },
  { id:'za', name:'África do Sul', flag:'🇿🇦', lat:-29, lon:25 },
  { id:'id', name:'Indonésia', flag:'🇮🇩', lat:-2, lon:118 },
  { id:'kr', name:'Coreia do Sul', flag:'🇰🇷', lat:36, lon:128 },
  { id:'pk', name:'Paquistão', flag:'🇵🇰', lat:30, lon:69 },
  { id:'pl', name:'Polônia', flag:'🇵🇱', lat:52, lon:19 },
  { id:'ua', name:'Ucrânia', flag:'🇺🇦', lat:49, lon:32 },
  { id:'se', name:'Suécia', flag:'🇸🇪', lat:62, lon:15 },
  { id:'co', name:'Colômbia', flag:'🇨🇴', lat:4, lon:-73 },
  { id:'cl', name:'Chile', flag:'🇨🇱', lat:-35, lon:-71 },
  { id:'pt', name:'Portugal', flag:'🇵🇹', lat:39, lon:-8 },
  { id:'nl', name:'Países Baixos', flag:'🇳🇱', lat:52, lon:5 },
  { id:'be', name:'Bélgica', flag:'🇧🇪', lat:51, lon:4 },
  { id:'no', name:'Noruega', flag:'🇳🇴', lat:61, lon:9 },
  { id:'fi', name:'Finlândia', flag:'🇫🇮', lat:64, lon:26 },
  { id:'dk', name:'Dinamarca', flag:'🇩🇰', lat:56, lon:10 },
  { id:'gr', name:'Grécia', flag:'🇬🇷', lat:39, lon:22 },
  { id:'ie', name:'Irlanda', flag:'🇮🇪', lat:53, lon:-8 },
  { id:'cz', name:'Tchéquia', flag:'🇨🇿', lat:50, lon:15 },
  { id:'ro', name:'Romênia', flag:'🇷🇴', lat:46, lon:25 },
  { id:'hu', name:'Hungria', flag:'🇭🇺', lat:47, lon:19 },
  { id:'at', name:'Áustria', flag:'🇦🇹', lat:47, lon:14 },
  { id:'ch', name:'Suíça', flag:'🇨🇭', lat:47, lon:8 },
  { id:'il', name:'Israel', flag:'🇮🇱', lat:31, lon:35 },
  { id:'iq', name:'Iraque', flag:'🇮🇶', lat:33, lon:44 },
  { id:'ma', name:'Marrocos', flag:'🇲🇦', lat:32, lon:-6 },
  { id:'dz', name:'Argélia', flag:'🇩🇿', lat:28, lon:3 },
  { id:'tn', name:'Tunísia', flag:'🇹🇳', lat:34, lon:9 },
  { id:'ly', name:'Líbia', flag:'🇱🇾', lat:27, lon:17 },
  { id:'ke', name:'Quênia', flag:'🇰🇪', lat:0, lon:38 },
  { id:'et', name:'Etiópia', flag:'🇪🇹', lat:9, lon:39 },
  { id:'gh', name:'Gana', flag:'🇬🇭', lat:8, lon:-1 },
  { id:'tz', name:'Tanzânia', flag:'🇹🇿', lat:-6, lon:35 },
  { id:'th', name:'Tailândia', flag:'🇹🇭', lat:15, lon:101 },
  { id:'vn', name:'Vietnã', flag:'🇻🇳', lat:16, lon:107 },
  { id:'ph', name:'Filipinas', flag:'🇵🇭', lat:13, lon:122 },
  { id:'my', name:'Malásia', flag:'🇲🇾', lat:4, lon:109 },
  { id:'bd', name:'Bangladesh', flag:'🇧🇩', lat:24, lon:90 },
  { id:'kz', name:'Cazaquistão', flag:'🇰🇿', lat:48, lon:67 },
  { id:'nz', name:'Nova Zelândia', flag:'🇳🇿', lat:-41, lon:174 },
  { id:'np', name:'Nepal', flag:'🇳🇵', lat:28, lon:84 },
  { id:'al', name:'Albânia', flag:'🇦🇱', lat:41.3, lon:19.8 },
  { id:'ad', name:'Andorra', flag:'🇦🇩', lat:42.5, lon:1.5 },
  { id:'am', name:'Armênia', flag:'🇦🇲', lat:40.2, lon:44.5 },
  { id:'az', name:'Azerbaijão', flag:'🇦🇿', lat:40.4, lon:49.9 },
  { id:'by', name:'Belarus', flag:'🇧🇾', lat:53.9, lon:27.9 },
  { id:'ba', name:'Bósnia e Herzegovina', flag:'🇧🇦', lat:43.9, lon:18.4 },
  { id:'bg', name:'Bulgária', flag:'🇧🇬', lat:42.7, lon:25.5 },
  { id:'hr', name:'Croácia', flag:'🇭🇷', lat:45.8, lon:16.0 },
  { id:'cy', name:'Chipre', flag:'🇨🇾', lat:35.2, lon:33.4 },
  { id:'ee', name:'Estônia', flag:'🇪🇪', lat:58.6, lon:25.0 },
  { id:'ge', name:'Geórgia', flag:'🇬🇪', lat:41.7, lon:44.8 },
  { id:'is', name:'Islândia', flag:'🇮🇸', lat:64.8, lon:-18.5 },
  { id:'lv', name:'Letônia', flag:'🇱🇻', lat:56.9, lon:24.1 },
  { id:'li', name:'Liechtenstein', flag:'🇱🇮', lat:47.1, lon:9.5 },
  { id:'lt', name:'Lituânia', flag:'🇱🇹', lat:55.2, lon:24.0 },
  { id:'lu', name:'Luxemburgo', flag:'🇱🇺', lat:49.8, lon:6.1 },
  { id:'mt', name:'Malta', flag:'🇲🇹', lat:35.9, lon:14.4 },
  { id:'md', name:'Moldávia', flag:'🇲🇩', lat:47.0, lon:28.9 },
  { id:'mc', name:'Mônaco', flag:'🇲🇨', lat:43.7, lon:7.4 },
  { id:'me', name:'Montenegro', flag:'🇲🇪', lat:42.7, lon:19.3 },
  { id:'mk', name:'Macedônia do Norte', flag:'🇲🇰', lat:41.6, lon:21.7 },
  { id:'sm', name:'San Marino', flag:'🇸🇲', lat:43.9, lon:12.5 },
  { id:'rs', name:'Sérvia', flag:'🇷🇸', lat:44.0, lon:21.0 },
  { id:'sk', name:'Eslováquia', flag:'🇸🇰', lat:48.7, lon:19.5 },
  { id:'si', name:'Eslovênia', flag:'🇸🇮', lat:46.1, lon:14.8 },
  { id:'va', name:'Vaticano', flag:'🇻🇦', lat:41.9, lon:12.45 },
  { id:'xk', name:'Kosovo', flag:'🇽🇰', lat:42.6, lon:20.9 },
  { id:'af', name:'Afeganistão', flag:'🇦🇫', lat:33.9, lon:66.0 },
  { id:'bh', name:'Bahrein', flag:'🇧🇭', lat:26.0, lon:50.5 },
  { id:'bt', name:'Butão', flag:'🇧🇹', lat:27.5, lon:90.4 },
  { id:'bn', name:'Brunei', flag:'🇧🇳', lat:4.5, lon:114.7 },
  { id:'kh', name:'Camboja', flag:'🇰🇭', lat:12.6, lon:105.0 },
  { id:'tl', name:'Timor-Leste', flag:'🇹🇱', lat:-8.9, lon:125.7 },
  { id:'jo', name:'Jordânia', flag:'🇯🇴', lat:31.3, lon:36.5 },
  { id:'kw', name:'Kuwait', flag:'🇰🇼', lat:29.3, lon:47.6 },
  { id:'kg', name:'Quirguistão', flag:'🇰🇬', lat:41.2, lon:74.8 },
  { id:'la', name:'Laos', flag:'🇱🇦', lat:19.9, lon:102.5 },
  { id:'lb', name:'Líbano', flag:'🇱🇧', lat:33.9, lon:35.9 },
  { id:'mv', name:'Maldivas', flag:'🇲🇻', lat:3.2, lon:73.2 },
  { id:'mn', name:'Mongólia', flag:'🇲🇳', lat:46.9, lon:103.8 },
  { id:'mm', name:'Mianmar', flag:'🇲🇲', lat:21.9, lon:95.9 },
  { id:'om', name:'Omã', flag:'🇴🇲', lat:21.5, lon:57.1 },
  { id:'qa', name:'Catar', flag:'🇶🇦', lat:25.3, lon:51.2 },
  { id:'sg', name:'Singapura', flag:'🇸🇬', lat:1.4, lon:103.8 },
  { id:'lk', name:'Sri Lanka', flag:'🇱🇰', lat:7.9, lon:80.8 },
  { id:'sy', name:'Síria', flag:'🇸🇾', lat:34.8, lon:38.9 },
  { id:'tj', name:'Tajiquistão', flag:'🇹🇯', lat:38.9, lon:71.3 },
  { id:'tm', name:'Turcomenistão', flag:'🇹🇲', lat:38.9, lon:59.6 },
  { id:'ae', name:'Emirados Árabes Unidos', flag:'🇦🇪', lat:23.9, lon:54.5 },
  { id:'uz', name:'Uzbequistão', flag:'🇺🇿', lat:41.4, lon:64.6 },
  { id:'ye', name:'Iêmen', flag:'🇾🇪', lat:15.6, lon:48.5 },
  { id:'ps', name:'Palestina', flag:'🇵🇸', lat:31.9, lon:35.3 },
  { id:'ao', name:'Angola', flag:'🇦🇴', lat:-11.2, lon:17.9 },
  { id:'bj', name:'Benim', flag:'🇧🇯', lat:9.3, lon:2.3 },
  { id:'bw', name:'Botsuana', flag:'🇧🇼', lat:-22.3, lon:24.7 },
  { id:'bf', name:'Burkina Faso', flag:'🇧🇫', lat:12.2, lon:-1.6 },
  { id:'bi', name:'Burundi', flag:'🇧🇮', lat:-3.4, lon:29.9 },
  { id:'cv', name:'Cabo Verde', flag:'🇨🇻', lat:16.0, lon:-24.0 },
  { id:'cm', name:'Camarões', flag:'🇨🇲', lat:7.4, lon:12.4 },
  { id:'cf', name:'República Centro-Africana', flag:'🇨🇫', lat:6.6, lon:20.9 },
  { id:'td', name:'Chade', flag:'🇹🇩', lat:15.5, lon:18.7 },
  { id:'km', name:'Comores', flag:'🇰🇲', lat:-11.9, lon:43.9 },
  { id:'cg', name:'República do Congo', flag:'🇨🇬', lat:-0.2, lon:15.8 },
  { id:'cd', name:'Rep. Dem. do Congo', flag:'🇨🇩', lat:-4.0, lon:21.8 },
  { id:'ci', name:'Costa do Marfim', flag:'🇨🇮', lat:7.5, lon:-5.5 },
  { id:'dj', name:'Djibuti', flag:'🇩🇯', lat:11.8, lon:42.6 },
  { id:'gq', name:'Guiné Equatorial', flag:'🇬🇶', lat:1.7, lon:10.3 },
  { id:'er', name:'Eritreia', flag:'🇪🇷', lat:15.2, lon:38.8 },
  { id:'sz', name:'Essuatíni', flag:'🇸🇿', lat:-26.5, lon:31.5 },
  { id:'ga', name:'Gabão', flag:'🇬🇦', lat:-0.8, lon:11.6 },
  { id:'gm', name:'Gâmbia', flag:'🇬🇲', lat:13.4, lon:-15.3 },
  { id:'gn', name:'Guiné', flag:'🇬🇳', lat:9.9, lon:-9.7 },
  { id:'gw', name:'Guiné-Bissau', flag:'🇬🇼', lat:12.0, lon:-15.0 },
  { id:'ls', name:'Lesoto', flag:'🇱🇸', lat:-29.6, lon:28.2 },
  { id:'lr', name:'Libéria', flag:'🇱🇷', lat:6.4, lon:-9.4 },
  { id:'mg', name:'Madagascar', flag:'🇲🇬', lat:-18.8, lon:46.9 },
  { id:'mw', name:'Malawi', flag:'🇲🇼', lat:-13.3, lon:34.3 },
  { id:'ml', name:'Mali', flag:'🇲🇱', lat:17.6, lon:-4.0 },
  { id:'mr', name:'Mauritânia', flag:'🇲🇷', lat:20.3, lon:-10.3 },
  { id:'mu', name:'Maurício', flag:'🇲🇺', lat:-20.3, lon:57.6 },
  { id:'mz', name:'Moçambique', flag:'🇲🇿', lat:-18.7, lon:35.5 },
  { id:'na', name:'Namíbia', flag:'🇳🇦', lat:-22.9, lon:17.1 },
  { id:'ne', name:'Níger', flag:'🇳🇪', lat:17.6, lon:8.1 },
  { id:'rw', name:'Ruanda', flag:'🇷🇼', lat:-2.0, lon:29.9 },
  { id:'st', name:'São Tomé e Príncipe', flag:'🇸🇹', lat:0.2, lon:6.6 },
  { id:'sn', name:'Senegal', flag:'🇸🇳', lat:14.5, lon:-14.5 },
  { id:'sc', name:'Seicheles', flag:'🇸🇨', lat:-4.7, lon:55.5 },
  { id:'sl', name:'Serra Leoa', flag:'🇸🇱', lat:8.6, lon:-11.8 },
  { id:'so', name:'Somália', flag:'🇸🇴', lat:5.2, lon:46.2 },
  { id:'ss', name:'Sudão do Sul', flag:'🇸🇸', lat:6.9, lon:31.3 },
  { id:'sd', name:'Sudão', flag:'🇸🇩', lat:12.9, lon:30.2 },
  { id:'tg', name:'Togo', flag:'🇹🇬', lat:8.6, lon:0.8 },
  { id:'ug', name:'Uganda', flag:'🇺🇬', lat:1.4, lon:32.3 },
  { id:'zm', name:'Zâmbia', flag:'🇿🇲', lat:-13.1, lon:27.8 },
  { id:'zw', name:'Zimbábue', flag:'🇿🇼', lat:-19.0, lon:29.2 },
  { id:'bs', name:'Bahamas', flag:'🇧🇸', lat:24.2, lon:-76.6 },
  { id:'bb', name:'Barbados', flag:'🇧🇧', lat:13.2, lon:-59.5 },
  { id:'bz', name:'Belize', flag:'🇧🇿', lat:17.2, lon:-88.5 },
  { id:'cr', name:'Costa Rica', flag:'🇨🇷', lat:9.7, lon:-83.8 },
  { id:'cu', name:'Cuba', flag:'🇨🇺', lat:21.5, lon:-79.0 },
  { id:'dm', name:'Dominica', flag:'🇩🇲', lat:15.4, lon:-61.4 },
  { id:'do', name:'República Dominicana', flag:'🇩🇴', lat:18.7, lon:-70.2 },
  { id:'sv', name:'El Salvador', flag:'🇸🇻', lat:13.8, lon:-88.9 },
  { id:'gd', name:'Granada', flag:'🇬🇩', lat:12.1, lon:-61.7 },
  { id:'gt', name:'Guatemala', flag:'🇬🇹', lat:15.8, lon:-90.2 },
  { id:'gy', name:'Guiana', flag:'🇬🇾', lat:4.9, lon:-59.0 },
  { id:'ht', name:'Haiti', flag:'🇭🇹', lat:18.9, lon:-72.3 },
  { id:'hn', name:'Honduras', flag:'🇭🇳', lat:15.2, lon:-86.5 },
  { id:'jm', name:'Jamaica', flag:'🇯🇲', lat:18.1, lon:-77.3 },
  { id:'ni', name:'Nicarágua', flag:'🇳🇮', lat:12.9, lon:-85.2 },
  { id:'pa', name:'Panamá', flag:'🇵🇦', lat:8.5, lon:-80.8 },
  { id:'kn', name:'São Cristóvão e Névis', flag:'🇰🇳', lat:17.3, lon:-62.7 },
  { id:'lc', name:'Santa Lúcia', flag:'🇱🇨', lat:13.9, lon:-61.0 },
  { id:'vc', name:'São Vicente e Granadinas', flag:'🇻🇨', lat:13.0, lon:-61.3 },
  { id:'sr', name:'Suriname', flag:'🇸🇷', lat:3.9, lon:-56.0 },
  { id:'tt', name:'Trinidad e Tobago', flag:'🇹🇹', lat:10.7, lon:-61.2 },
  { id:'ag', name:'Antígua e Barbuda', flag:'🇦🇬', lat:17.1, lon:-61.8 },
  { id:'ve', name:'Venezuela', flag:'🇻🇪', lat:6.4, lon:-66.6 },
  { id:'bo', name:'Bolívia', flag:'🇧🇴', lat:-16.3, lon:-63.6 },
  { id:'ec', name:'Equador', flag:'🇪🇨', lat:-1.8, lon:-78.2 },
  { id:'pe', name:'Peru', flag:'🇵🇪', lat:-9.2, lon:-75.0 },
  { id:'uy', name:'Uruguai', flag:'🇺🇾', lat:-32.5, lon:-55.8 },
  { id:'py', name:'Paraguai', flag:'🇵🇾', lat:-23.4, lon:-58.4 },
  { id:'fj', name:'Fiji', flag:'🇫🇯', lat:-17.9, lon:177.9 },
  { id:'ki', name:'Kiribati', flag:'🇰🇮', lat:1.5, lon:173.0 },
  { id:'mh', name:'Ilhas Marshall', flag:'🇲🇭', lat:7.1, lon:171.2 },
  { id:'fm', name:'Micronésia', flag:'🇫🇲', lat:6.9, lon:158.2 },
  { id:'nr', name:'Nauru', flag:'🇳🇷', lat:-0.5, lon:166.9 },
  { id:'pw', name:'Palau', flag:'🇵🇼', lat:7.5, lon:134.6 },
  { id:'pg', name:'Papua-Nova Guiné', flag:'🇵🇬', lat:-6.3, lon:144.0 },
  { id:'ws', name:'Samoa', flag:'🇼🇸', lat:-13.8, lon:-172.1 },
  { id:'sb', name:'Ilhas Salomão', flag:'🇸🇧', lat:-9.4, lon:160.2 },
  { id:'to', name:'Tonga', flag:'🇹🇴', lat:-21.2, lon:-175.2 },
  { id:'tv', name:'Tuvalu', flag:'🇹🇻', lat:-7.5, lon:177.6 },
  { id:'vu', name:'Vanuatu', flag:'🇻🇺', lat:-16.3, lon:167.0 },
];
const NEWLANDS = [[12,-38],[28,-44],[-12,-25],[-33,-18],[2,-52],[33,-148],[8,-138],[-22,-112],[-42,-105],[42,-168],[-28,78],[6,66],[-36,92],[16,90],[-12,108],[8,28],[22,-28],[-48,-38],[52,-38],[65,-25],[28,-72],[-6,-92],[18,-158],[-30,-150],[0,95],[38,152],[-52,55],[70,60],[-60,-49],[35,-60]];
const FLAGS_ALLOWED = ['🏳️','🦅','🐺','🦁','🐉','🐻','⭐','☀️','🌙','🔥','❄️','🌊','⚡','🛡️','⚔️','🌹','🌻','🍀','💎','🏴','🚩','👑','🕊️','🎌'];
const COUNTRY_BY_ID = Object.fromEntries(COUNTRIES.map(c => [c.id, c]));
const DYNC = {};
const cname = p => { const c = COUNTRY_BY_ID[p.country] || DYNC[p.country]; return c ? c.flag + ' ' + c.name : (p.customName || p.name); };

const IDEOLOGIES = {
  democracia:    { name: 'Democracia',    desc: '+5% renda' },
  autoritarismo: { name: 'Autoritarismo', desc: '+15% ataque, -1 aprovação/turno' },
  comunismo:     { name: 'Comunismo',     desc: 'setores 50% mais baratos, -10% renda' },
  fascismo:      { name: 'Fascismo',      desc: 'recrutar 50% mais barato, relações decaem mais' },
  monarquia:     { name: 'Monarquia',     desc: 'diplomacia 50% mais barata, +1 aprovação/turno' },
  republica:     { name: 'República',     desc: 'tecnologias 25% mais baratas' },
};
const RELIGIONS = {
  laico:     { name: 'Estado Laico', desc: 'sem bônus de fé' },
  cristao:   { name: 'Cristã',       desc: '+1 fé/turno' },
  muculmano: { name: 'Islâmica',     desc: '+1 fé/turno' },
  budista:   { name: 'Budista',      desc: '+1 fé/turno' },
  hindu:     { name: 'Hindu',        desc: '+1 fé/turno' },
};
const MINISTERS = {
  eco: { tec: { name: 'Tecocrata', desc: '+10% renda' }, pop: { name: 'Populista', desc: '+1 aprovação/turno, -5% renda' } },
  def: { fal: { name: 'Falcão', desc: '+10% ataque' }, estr: { name: 'Estrategista', desc: '+10% defesa' } },
  dip: { neg: { name: 'Negociador', desc: 'diplomacia -50% custo' }, inf: { name: 'Influenciador', desc: '+1 influência/turno' } },
};
const TECHS = {
  livrecomercio: { name: 'Livre Comércio Global', cost: 500, desc: '+$20/turno' },
  automacao:     { name: 'Automação Industrial',  cost: 600, desc: '+2 economia' },
  exercito:      { name: 'Exército Profissional', cost: 600, desc: '+15% ataque' },
  antiaerea:     { name: 'Defesa Antiaérea',      cost: 600, desc: 'dano nuclear -50%' },
  bemestar:      { name: 'Estado de Bem-Estar',   cost: 500, desc: 'desgaste de aprovação pela metade' },
  midia:         { name: 'Mídia Global',          cost: 500, desc: '+1 influência/turno' },
  engenharia:    { name: 'Engenharia Avançada',   cost: 600, desc: 'construções e melhorias 15% mais baratas' },
};
const SECTORS = [
  ['educacao', 'Educação'], ['saude', 'Saúde'], ['cultura', 'Cultura'],
  ['esportes', 'Esportes'], ['habitacao', 'Habitação'], ['justica', 'Justiça'], ['turismo', 'Turismo'],
];
const DEPOSIT_POOL = ['petroleo', 'minerio', 'madeira', 'ouro', 'uranio', 'terras_raras', 'comida'];
const DEP_NAMES = { petroleo: '🛢️ Petróleo', minerio: '⛏️ Minério', madeira: '🪵 Madeira', ouro: '🏦 Ouro', uranio: '☢️ Urânio', terras_raras: '⚙️ Terras raras', comida: '🌾 Terra fértil' };
function depositosOf(id) {
  let h = 0; for (const ch of String(id) + 'x') h = (h * 31 + ch.charCodeAt(0)) % 997;
  const out = [];
  for (const d of [DEPOSIT_POOL[h % 7], DEPOSIT_POOL[Math.floor(h / 7) % 7], DEPOSIT_POOL[Math.floor(h / 49) % 7]]) if (!out.includes(d)) out.push(d);
  let i = 0; while (out.length < 3 && i < 7) { const d = DEPOSIT_POOL[(h + 3 * ++i) % 7]; if (!out.includes(d)) out.push(d); }
  return out.slice(0, 3);
}
const SPACE_COSTS = [500, 800, 1200];
const UN_TYPES = [
  { id: 'proibir_guerra', desc: 'Proibição de novas declarações de guerra por 3 turnos' },
  { id: 'proibir_armas',  desc: 'Proibição de recrutamento militar por 3 turnos' },
  { id: 'embargo',        desc: 'Embargo econômico contra {T} por 3 turnos' },
  { id: 'condenar',       desc: 'Condenação internacional de {T} (-6 aprovação)' },
];

/* ---------------- WebSocket artesanal ---------------- */
function acceptKey(key) { return crypto.createHash('sha1').update(key + MAGIC).digest('base64'); }
function encodeFrame(data, opcode = 0x1) {
  const payload = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) { header = Buffer.alloc(2); header[1] = len; }
  else if (len < 65536) { header = Buffer.alloc(4); header[1] = 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2); }
  header[0] = 0x80 | opcode;
  return Buffer.concat([header, payload]);
}
class WSConn {
  constructor(socket) {
    this.socket = socket; this.buffer = Buffer.alloc(0);
    this.onMessage = null; this.onClose = null; this.closed = false;
    socket.setNoDelay(true);
    socket.on('data', chunk => { this.buffer = Buffer.concat([this.buffer, chunk]); this.drain(); });
    socket.on('close', () => this._close());
    socket.on('error', () => this._close());
    socket.on('end', () => { try { socket.end(); } catch (e) {} this._close(); });
    this.pingTimer = setInterval(() => {
      try { if (!this.closed) socket.write(encodeFrame(Buffer.alloc(0), 0x9)); } catch (e) {}
    }, 25000);
  }
  _close() {
    if (this.closed) return;
    this.closed = true; clearInterval(this.pingTimer);
    try { this.socket.destroy(); } catch (e) {}
    if (this.onClose) this.onClose();
  }
  parseFrame() {
    const buf = this.buffer;
    if (buf.length < 2) return null;
    const opcode = buf[0] & 0x0f;
    const masked = (buf[1] & 0x80) !== 0;
    let len = buf[1] & 0x7f, off = 2;
    if (len === 126) { if (buf.length < 4) return null; len = buf.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (buf.length < 10) return null; len = Number(buf.readBigUInt64BE(2)); off = 10; }
    let maskKey = null;
    if (masked) {
      if (buf.length < off + 4) return null;
      maskKey = buf.subarray(off, off + 4); off += 4;
    }
    if (buf.length < off + len) return null;
    let payload = buf.subarray(off, off + len);
    if (masked) { const out = Buffer.alloc(len); for (let i = 0; i < len; i++) out[i] = payload[i] ^ maskKey[i & 3]; payload = out; }
    this.buffer = buf.subarray(off + len);
    return { opcode, payload };
  }
  drain() {
    let frame;
    while ((frame = this.parseFrame())) {
      const { opcode, payload } = frame;
      if (opcode === 0x8) { try { this.socket.write(encodeFrame(Buffer.alloc(0), 0x8)); } catch (e) {} this._close(); return; }
      else if (opcode === 0x9) { try { this.socket.write(encodeFrame(payload, 0xA)); } catch (e) {} }
      else if (opcode === 0xA) {}
      else if (opcode === 0x1 || opcode === 0x0) { if (this.onMessage) this.onMessage(payload.toString('utf8')); }
    }
  }
  send(obj) { if (this.closed) return; try { this.socket.write(encodeFrame(JSON.stringify(obj))); } catch (e) { this._close(); } }
}

/* ---------------- Estado ---------------- */
const rooms = new Map();
let playerSeq = 1;
function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c;
  do { c = ''; for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)]; } while (rooms.has(c));
  return c;
}
function newRoom() {
  const room = {
    code: makeCode(), phase: 'lobby', turn: 0, timerEnd: 0, speed: 45,
    players: [], hostId: null, proposals: [], log: [], winner: null, timer: null,
    un: null, noWarUntil: 0, noArmsUntil: 0, embargo: null, paused: false, pausedRemaining: 0,
    world: COUNTRIES.slice(), market: { comida: 8, minerio: 12, energia: 10, concreto: 10, madeira: 7, terras_raras: 20, uranio: 25 }, missionIdx: 0, warAuth: null, paused: false, pausedRemaining: 0,
  };
  rooms.set(room.code, room);
  return room;
}
function log(room, msg) { room.log.unshift({ msg, turn: room.turn }); if (room.log.length > 120) room.log.length = 120; }
function ownProvinces(p) { return p.provinces.filter(pr => pr.owner === p.id); }
function sectorSum(p) { return SECTORS.reduce((s, [k]) => s + p.sectors[k], 0); }
function relBetween(a, b) { return a.relations[b.id] != null ? a.relations[b.id] : 50; }
function relBonus(p) {
  let n = 0;
  for (const id in p.relations) if (p.relations[id] >= 70) n++;
  return Math.min(3, n) * 10;
}
function dipCost(p, c) {
  return (p.ministers.dip === 'neg' || p.ideology === 'monarquia') ? Math.round(c / 2) : c;
}

function snapshot(room) {
  return {
    t: 'state', phase: room.phase, code: room.code, turn: room.turn,
    timerEnd: room.timerEnd, speed: room.speed, winner: room.winner,
    log: room.log.slice(0, 60), proposals: room.proposals,
    un: room.un, noWarUntil: room.noWarUntil, noArmsUntil: room.noArmsUntil, embargo: room.embargo,
    players: room.players.map(p => ({
      id: p.id, name: p.name, country: p.country, color: p.color,
      money: Math.round(p.money), eco: p.eco, mil: p.mil, aprov: p.aprov, ap: p.ap,
      alive: p.alive, allies: p.allies, connected: p.connected,
      isHost: p.id === room.hostId, reason: p.eliminatedReason,
      nuclear: p.nuclear, influencia: p.influencia, fe: p.fe, wars: p.wars,
      provinces: p.provinces, sanctioning: p.sanctioning, sanctionedBy: p.sanctionedBy,
      taxRate: p.taxRate, debt: p.debt, ideology: p.ideology, religion: p.religion,
      ministers: p.ministers, techs: p.techs, sectors: p.sectors, space: p.space,
      relations: p.bot ? {} : p.relations, embassies: p.embassies, trades: p.trades,
      blockading: p.blockading, blockadedBy: p.blockadedBy,
      units: p.units, builds: p.builds, emergencyUntil: p.emergencyUntil, leis: p.leis,
      pop: p.pop, rec: p.rec, xp: p.xp, bot: p.bot, customName: p.customName, customFlag: p.customFlag,
      buildings: p.buildings, stats: p.stats, famine: p.famine, blackout: p.blackout,
      depositos: p.depositos || [], upgrades: p.upgrades || {}, pacts: p.pacts || {},
    })),
    world: room.world, market: room.market, mission: MISSIONS[room.missionIdx % MISSIONS.length], paused: room.paused,
  };
}
function broadcast(room) {
  const base = snapshot(room);
  for (const p of room.players) if (p.conn && p.connected) p.conn.send({ ...base, you: p.id });
}
function err(conn, msg) { if (conn) conn.send({ t: 'error', msg }); }
function info(conn, msg) { if (conn) conn.send({ t: 'info', msg }); }

function addPlayer(room, conn, name, isHost) {
  const p = {
    id: 'p' + (playerSeq++), conn, name, country: null, color: (playerSeq + 5) % 12,
    money: 0, eco: 0, mil: 0, aprov: 50, ap: AP_PER_TURN, alive: true,
    allies: [], connected: true, eliminatedReason: null,
    nuclear: 0, influencia: 0, fe: 0, provinces: [], wars: [],
    sanctioning: [], sanctionedBy: [],
    taxRate: 1, debt: 0, ideology: null, religion: 'laico',
    customName: null, customFlag: '🏳️', bot: false, pop: 0, rec: { comida: 0, minerio: 0, energia: 0, concreto: 0, madeira: 0, terras_raras: 12, uranio: 0 },
    xp: 0, blackout: false, depositos: [], upgrades: {}, pacts: {},
    buildings: { fazenda: 0, mina: 0, usina: 0, petroleo: 0, fabrica: 0, serraria: 0, mina_ouro: 0, estrada: 0, base: 0, mina_rara: 0, adubo: 0, mina_uranio: 0 }, stats: { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0 }, famine: false,
    ministers: { eco: null, def: null, dip: null },
    techs: [], sectors: { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0 },
    space: 0, relations: {}, embassies: [], trades: [], blockading: [], blockadedBy: [],
    units: { blindados: 0, aviacao: 0, frota: 0, infantaria: 0, artilharia: 0, submarinos: 0, porta_avioes: 0 }, builds: [], emergencyUntil: 0, leis: [],
  };
  conn.meta = { room, player: p };
  room.players.push(p);
  if (isHost) room.hostId = p.id;
  return p;
}

/* ---------------- Fluxo ---------------- */
function makeAIBot(c) {
  let h = 0; for (const ch of c.id + 'x') h = (h * 31 + ch.charCodeAt(0)) % 997;
  return {
    id: c.id, name: c.name, country: c.id, bot: true, conn: null, connected: true, color: 0,
    customName: null, customFlag: null, isHost: false,
    money: 10000, eco: 3 + (h % 4), mil: 3 + ((h >> 2) % 4), pop: 0, rec: { comida: 0, minerio: 0, energia: 0, concreto: 0, madeira: 0, terras_raras: 12, uranio: 0 }, xp: 0, blackout: false, depositos: depositosOf(c.id), upgrades: {}, pacts: {},
    aprov: 50, ap: AP_PER_TURN, alive: true, allies: [], eliminatedReason: null,
    nuclear: 0, influencia: 0, fe: 0, wars: [],
    provinces: [{ name: c.name, infra: 1, owner: c.id }],
    sanctioning: [], sanctionedBy: [], taxRate: 1, debt: 0, ideology: null, religion: 'laico',
    ministers: { eco: null, def: null, dip: null },
    techs: [], sectors: { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0 },
    space: 0, relations: {}, embassies: [], trades: [], blockading: [], blockadedBy: [],
    units: { blindados: 0, aviacao: 0, frota: 0, infantaria: 0, artilharia: 0, submarinos: 0, porta_avioes: 0 },
    builds: [], emergencyUntil: 0, leis: [],
    buildings: { fazenda: 0, mina: 0, usina: 0, petroleo: 0, fabrica: 0, serraria: 0, mina_ouro: 0, estrada: 0, base: 0, mina_rara: 0, adubo: 0, mina_uranio: 0 }, stats: { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0 }, famine: false,
    ideology: Object.keys(IDEOLOGIES)[h % 6], religion: Object.keys(RELIGIONS)[h % 5],
  };
}

function startGame(room) {
  room.world = COUNTRIES.slice();
  room.players.forEach((p, i) => {
    const cid = 'n' + p.id;
    const spot = NEWLANDS[i % NEWLANDS.length];
    const nat = { id: cid, name: p.customName || (p.name + 'lândia'), flag: p.customFlag || '🏳️', lat: spot[0] + Math.floor(i / NEWLANDS.length) * 5, lon: spot[1] };
    room.world.push(nat); DYNC[cid] = nat;
    p.country = cid;
    p.money = 10000; p.eco = 3; p.mil = 3; p.pop = 0; p.rec = { comida: 0, minerio: 0, energia: 0, concreto: 0, madeira: 0, terras_raras: 12, uranio: 0 }; p.xp = 0; p.blackout = false;
    p.depositos = depositosOf(cid); p.upgrades = {}; p.pacts = {};
    p.buildings = { fazenda: 0, mina: 0, usina: 0, petroleo: 0, fabrica: 0, serraria: 0, mina_ouro: 0, estrada: 0, base: 0, mina_rara: 0, adubo: 0, mina_uranio: 0 }; p.stats = { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0 }; p.famine = false;
    p.aprov = 50; p.ap = AP_PER_TURN; p.alive = true;
    p.allies = []; p.eliminatedReason = null; p.nuclear = 0; p.influencia = 0; p.fe = 0; p.wars = [];
    p.provinces = [{ name: 'Capital de ' + nat.name, infra: 1, owner: p.id }];
    p.sanctioning = []; p.sanctionedBy = [];
    p.taxRate = 1; p.debt = 0; p.ideology = null; p.religion = 'laico';
    p.ministers = { eco: null, def: null, dip: null };
    p.techs = []; p.sectors = { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0 };
    p.space = 0; p.relations = {}; p.embassies = []; p.trades = []; p.blockading = []; p.blockadedBy = [];
    p.units = { blindados: 0, aviacao: 0, frota: 0, infantaria: 0, artilharia: 0, submarinos: 0, porta_avioes: 0 }; p.builds = []; p.emergencyUntil = 0; p.leis = [];
  });
  for (let i = 0; i < room.players.length; i++) for (let j = i + 1; j < room.players.length; j++) {
    room.players[i].relations[room.players[j].id] = 50; room.players[j].relations[room.players[i].id] = 50;
  }
  for (const c of COUNTRIES) room.players.push(makeAIBot(c));
  room.players.forEach((p, i) => { if (p.bot) p.color = i % 60; });
  room.phase = 'game'; room.turn = 1; room.proposals = [];
  room.un = null; room.noWarUntil = 0; room.noArmsUntil = 0; room.embargo = null;
  room.timerEnd = Date.now() + room.speed * 1000;
  log(room, '🏳️ Cada jogador fundou sua própria nação: $10.000, 0 habitantes, reserva natural de 12⚙️ terras raras — tudo por construir.');
  log(room, `🤖 As ${COUNTRIES.length} nações do mundo estão sob controle da IA. É vocês contra elas!`);
  if (!room.timer) {
    room.timer = setInterval(() => {
      if (room.phase !== 'game' || room.paused) return;
      if (Date.now() >= room.timerEnd) resolveTurn(room);
      if (room.un && Date.now() >= room.un.deadline) resolveUN(room);
    }, 1000);
  }
  broadcast(room);
}

function checkEliminations(room) {
  for (const p of room.players) {
    if (!p.alive) continue;
    if (p.aprov <= 5) { p.alive = false; p.eliminatedReason = 'Deposto por revolta popular'; }
    else if (p.provinces.length && ownProvinces(p).length === 0) { p.alive = false; p.eliminatedReason = 'Conquista total do território'; }
    else continue;
    p.allies.forEach(aid => { const a = room.players.find(x => x.id === aid); if (a) a.allies = a.allies.filter(id => id !== p.id); });
    p.sanctioning.forEach(tid => { const t = room.players.find(x => x.id === tid); if (t) t.sanctionedBy = t.sanctionedBy.filter(id => id !== p.id); });
    p.sanctionedBy.forEach(sid => { const s = room.players.find(x => x.id === sid); if (s) s.sanctioning = s.sanctioning.filter(id => id !== p.id); });
    p.wars.forEach(wid => { const w = room.players.find(x => x.id === wid); if (w) w.wars = w.wars.filter(id => id !== p.id); });
    p.trades.forEach(tid => { const t = room.players.find(x => x.id === tid); if (t) t.trades = t.trades.filter(id => id !== p.id); });
    p.embassies.forEach(tid => { const t = room.players.find(x => x.id === tid); if (t) t.embassies = t.embassies.filter(id => id !== p.id); });
    p.blockading.forEach(tid => { const t = room.players.find(x => x.id === tid); if (t) t.blockadedBy = t.blockadedBy.filter(id => id !== p.id); });
    p.blockadedBy.forEach(sid => { const s2 = room.players.find(x => x.id === sid); if (s2) s2.blockading = s2.blockading.filter(id => id !== p.id); });
    p.allies = []; p.sanctioning = []; p.sanctionedBy = []; p.wars = []; p.trades = []; p.embassies = []; p.blockading = []; p.blockadedBy = [];
    log(room, `💥 ${cname(p)} (${p.name}) foi ELIMINADO: ${p.eliminatedReason}!`);
  }
}

function checkVictory(room) {
  if (room.phase !== 'game') return;
  const alive = room.players.filter(p => p.alive);
  let winner = null, reason = '';
  if (room.players.length > 1 && alive.length === 1) { winner = alive[0]; reason = 'Domínio global — última nação de pé'; }
  else {
    const ecoW = alive.find(p => p.eco >= 60);
    if (ecoW) { winner = ecoW; reason = 'Hegemonia econômica (economia 60+)'; }
    const ideoW = !winner && alive.find(p => p.influencia >= 60);
    if (ideoW) { winner = ideoW; reason = 'Hegemonia ideológica — sua doutrina dominou o mundo'; }
    const feW = !winner && alive.find(p => p.fe >= 60);
    if (feW) { winner = feW; reason = 'Hegemonia religiosa — sua fé unificou o mundo'; }
    const convRelW = !winner && alive.find(p => p.religion && p.religion !== 'laico' && alive.filter(o => o.religion === p.religion).length > alive.length / 2);
    if (convRelW) { winner = convRelW; reason = '🛐 Vitória religiosa — sua fé converteu a maioria das nações do mundo'; }
    const convIdeW = !winner && alive.find(p => p.ideology && alive.filter(o => o.ideology === p.ideology).length > alive.length / 2);
    if (convIdeW) { winner = convIdeW; reason = '🗽 Vitória ideológica — sua doutrina governa a maioria das nações'; }
  }
  if (winner) {
    room.phase = 'over';
    room.winner = { id: winner.id, name: winner.name, country: winner.country, reason };
    log(room, `🏆 ${cname(winner)} (${winner.name}) VENCEU: ${reason}!`);
    if (room.timer) { clearInterval(room.timer); room.timer = null; }
  }
}

const LEIS = {
  servico_militar:   { name: 'Serviço Militar Obrigatório', cost: 150, desc: '+5% ataque em guerras' },
  guarda_nacional:   { name: 'Guarda Nacional',             cost: 160, desc: '+5% defesa' },
  reforma_agraria:   { name: 'Reforma Agrária',             cost: 200, desc: '+$10/turno' },
  abertura_comercial:{ name: 'Abertura Comercial',          cost: 180, desc: '+$10/turno' },
  liberdade_imprensa:{ name: 'Liberdade de Imprensa',       cost: 120, desc: '+3 aprovação' },
  campanha_patriotica:{ name: 'Campanha Patriótica',        cost: 100, desc: '+4 aprovação' },
};

function incomeOf(room, p) {
  const prov = ownProvinces(p).reduce((s, pr) => s + pr.infra, 0) * PROV_INCOME;
  let base = p.eco * 10 + prov + Math.floor(p.pop / 8) + p.buildings.petroleo * 15 + p.buildings.mina_ouro * 25 + p.buildings.estrada * 5
    + p.allies.length * 25
    + ((p.depositos || []).includes('ouro') ? 15 : 0)
    - p.embassies.length * 10
    + p.trades.length * 20
    + (p.space >= 3 ? 30 : 0)
    + sectorSum(p) * 2
    + relBonus(p);
  if (p.techs.includes('livrecomercio')) base += 20;
  if (p.leis.includes('reforma_agraria')) base += 10;
  if (p.leis.includes('abertura_comercial')) base += 10;
  let mult = 1;
  if (p.ideology === 'democracia') mult += 0.05;
  if (p.ideology === 'comunismo') mult -= 0.10;
  if (p.ministers.eco === 'tec') mult += 0.10;
  if (p.ministers.eco === 'pop') mult -= 0.05;
  if (p.taxRate === 2) mult += 0.15;
  if (p.taxRate === 0) mult -= 0.10;
  if (room.embargo && room.embargo.target === p.id && room.turn < room.embargo.until) mult *= 0.7;
  if (p.blockadedBy.length) mult *= p.units.frota >= 1 ? 0.9 : 0.75;
  if (room.turn < p.emergencyUntil) mult *= 0.8;
  base *= mult;
  const costs = Math.round(p.mil * 2)
    + p.sanctionedBy.length * 50
    + p.sanctioning.length * 20
    + p.blockading.length * 15
    + Math.round(p.debt * 0.05);
  return Math.round(base - costs);
}

function resolveUN(room) {
  if (!room.un) return;
  const u = room.un;
  const yes = Object.values(u.votes).filter(v => v).length;
  const no = Object.values(u.votes).filter(v => !v).length;
  const passed = yes > no;
  const tgt = u.target ? room.players.find(p => p.id === u.target) : null;
  if (passed) {
    if (u.type === 'proibir_guerra') { room.noWarUntil = room.turn + 3; log(room, '🇺 A ONU APROVOU: proibição de novas guerras por 3 turnos!'); }
    if (u.type === 'proibir_armas') { room.noArmsUntil = room.turn + 3; log(room, '🇺 A ONU APROVOU: proibição de recrutamento por 3 turnos!'); }
    if (u.type === 'embargo' && tgt) { room.embargo = { target: tgt.id, until: room.turn + 3 }; log(room, `🇺🇳 A ONU APROVOU embargo econômico contra ${cname(tgt)}!`); }
    if (u.type === 'condenar' && tgt) { tgt.aprov = Math.max(0, tgt.aprov - 6); log(room, `🇺🇳 A ONU CONDENOU ${cname(tgt)} (-6 aprovação)!`); }
    if (u.type === 'autorizar') { room.warAuth = { by: u.proposer, target: u.target, until: room.turn + 8 }; log(room, `🇺🇳 A ONU AUTORIZOU a intervenção militar! Válido por 8 turnos.`); }
  } else {
    log(room, '🇺🇳 A ONU REJEITOU a resolução.');
  }
  room.un = null;
  checkEliminations(room);
  broadcast(room);
}

function openUN(room) {
  const alive = room.players.filter(p => p.alive);
  if (alive.length < 2) return;
  const type = UN_TYPES[Math.floor(Math.random() * UN_TYPES.length)];
  let target = null;
  if (type.id === 'embargo' || type.id === 'condenar') target = alive[Math.floor(Math.random() * alive.length)];
  room.un = { type: type.id, desc: type.desc.replace('{T}', target ? cname(target) : ''), target: target ? target.id : null, votes: {}, deadline: Date.now() + 20000 };
  log(room, `🇺🇳 Sessão da ONU: ${room.un.desc}. Votação aberta!`);
  for (const b of room.players) if (b.bot && b.alive) {
    if (room.un.target) {
      const tp = room.players.find(x => x.id === room.un.target);
      room.un.votes[b.id] = tp ? relBetween(b, tp) < 50 : Math.random() < 0.5;
    } else room.un.votes[b.id] = Math.random() < 0.5;
  }
}

function resolveTurn(room) {
  room.turn++;
  for (const p of room.players) {
    if (!p.alive) continue;
    const done = p.builds.filter(b => b.until <= room.turn);
    p.builds = p.builds.filter(b => b.until > room.turn);
    for (const b of done) {
      if (b.kind === 'infra') { const pr = p.provinces[b.prov]; if (pr && pr.owner === p.id && pr.infra < 5) { pr.infra += 1; log(room, `🏗️ Construção concluída: ${pr.name} (${cname(p)}) infraestrutura ${pr.infra}.`); } }
      if (b.kind === 'nuclear' && p.nuclear < NUKE_MAX_LEVEL) { p.nuclear += 1; log(room, `☢️ ${cname(p)} conclui etapa do programa nuclear (nível ${p.nuclear}).`); }
      if (b.kind === 'espacial' && p.space < 3) { p.space += 1; p.aprov = Math.min(100, p.aprov + 2); log(room, `🚀 ${cname(p)} conclui etapa do programa espacial (nível ${p.space}).`); }
      if (PROD_NAMES[b.kind]) { p.buildings[b.kind] = (p.buildings[b.kind] || 0) + 1; p.stats.construidas++; log(room, `${PROD_NAMES[b.kind]} construíd${b.kind === 'mina' ? 'a' : 'o'} em ${cname(p)}.`); }
      if (b.kind === 'infra' || b.kind === 'nuclear') p.stats.construidas++;
    }
    p.money += incomeOf(room, p);
    if (p.money < 0) { p.money = 0; p.mil = Math.max(1, Math.round(p.mil * 0.9)); }
    // aprovação
    let dAprov = -1;
    if (p.techs.includes('bemestar')) dAprov = Math.ceil(dAprov / 2);
    dAprov += Math.min(1, Math.floor(sectorSum(p) / 3));
    if (p.ideology === 'autoritarismo') dAprov -= 1;
    if (p.ideology === 'monarquia') dAprov += 1;
    if (p.ministers.eco === 'pop') dAprov += 1;
    if (p.taxRate === 0) dAprov += 1;
    if (p.taxRate === 2) dAprov -= 2;
    p.aprov = Math.max(0, Math.min(100, p.aprov + dAprov));
    // fé / influência passivos
    if (p.religion && p.religion !== 'laico') p.fe += 1;
    if (p.ministers.dip === 'inf') p.influencia += 1;
    if (p.techs.includes('midia')) p.influencia += 1;
    p.ap = AP_PER_TURN;
  }
  // população, produção de recursos e oscilação do mercado
  for (const p of room.players) if (p.alive) {
    const infra = ownProvinces(p).reduce((sx, x) => sx + x.infra, 0);
    const nBld = p.buildings.fazenda + p.buildings.mina + p.buildings.usina + p.buildings.petroleo + p.buildings.fabrica + p.buildings.serraria + p.buildings.mina_ouro + p.buildings.mina_rara + p.buildings.adubo + p.buildings.mina_uranio;
    const needEn = Math.ceil(nBld / 3);
    p.rec.energia += 3 + infra * 2 + Math.round(p.buildings.usina * 4 * upM(p, 'usina')) + Math.round(p.buildings.petroleo * 3 * upM(p, 'petroleo'));
    let mult = 1;
    if (nBld > 0 && p.rec.energia < needEn) {
      mult = 0.5;
      if (!p.blackout) { log(room, `🔌 APAGÃO em ${cname(p)}! Energia insuficiente — produção pela metade. Construa usinas.`); p.blackout = true; }
    } else { p.blackout = false; p.rec.energia -= needEn; }
    p.rec.comida += Math.round((4 + infra * 3 + p.buildings.fazenda * 5 * upM(p, 'fazenda') + p.buildings.adubo * 4 * upM(p, 'adubo')) * mult);
    p.rec.minerio += Math.round((2 + Math.round(p.eco * 0.8) + p.buildings.mina * 4 * upM(p, 'mina')) * mult);
    p.rec.concreto += Math.round((1 + p.buildings.fabrica * 6 * upM(p, 'fabrica')) * mult);
    p.rec.madeira += Math.round(p.buildings.serraria * 5 * upM(p, 'serraria') * mult);
    p.rec.terras_raras += Math.round(p.buildings.mina_rara * 3 * upM(p, 'mina_rara') * mult);
    p.rec.uranio += Math.round(p.buildings.mina_uranio * 2 * upM(p, 'mina_uranio') * mult);
    const dep = p.depositos || [];
    if (dep.includes('petroleo')) p.rec.energia += 2;
    if (dep.includes('minerio')) p.rec.minerio += 2;
    if (dep.includes('madeira')) p.rec.madeira += 3;
    if (dep.includes('comida')) p.rec.comida += 3;
    if (dep.includes('terras_raras')) p.rec.terras_raras += 1;
    if (dep.includes('uranio')) p.rec.uranio += 1;
    const need = Math.ceil(p.pop / 10);
    let g = 4 + infra * 2;
    if (p.rec.comida >= need) p.rec.comida -= need; else { p.rec.comida = 0; g = Math.max(1, Math.floor(g / 3)); }
    p.pop += g;
    if (p.rec.comida === 0 && p.pop > 0) {
      p.pop = Math.max(0, p.pop - 2); p.aprov = Math.max(0, p.aprov - 3);
      if (!p.famine) { log(room, `🍽️ FOME em ${cname(p)}! A população está morrendo — compre comida no mercado.`); p.famine = true; }
    } else p.famine = false;
  }
  for (const k of Object.keys(room.market)) room.market[k] = Math.max(3, Math.min(40, Math.round(room.market[k] * (0.88 + Math.random() * 0.3))));

  // relações: decaimento + embaixadas
  const alive = room.players.filter(p => p.alive);
  for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
    const a = alive[i], b = alive[j];
    let dec = 2;
    if (a.ideology === 'fascismo' || b.ideology === 'fascismo') dec = 3;
    let v = relBetween(a, b) - dec;
    if (a.embassies.includes(b.id)) v += 3;
    if (b.embassies.includes(a.id)) v += 3;
    if (a.allies.includes(b.id)) v = Math.max(v, 80);
    v = Math.max(0, Math.min(100, v));
    a.relations[b.id] = v; b.relations[a.id] = v;
  }
  randomEvent(room);
  worldNews(room);
  if (room.turn % 4 === 0 && !room.un) openUN(room);
  aiTurn(room);
  const mNow = MISSIONS[room.missionIdx % MISSIONS.length];
  if (mNow) {
    const hero = room.players.find(p => p.alive && !p.bot && mNow.check(p));
    if (hero) {
      hero.money += mNow.reward; hero.aprov = Math.min(100, hero.aprov + 3); hero.xp += 10;
      log(room, `🏆 MISSÃO CUMPRIDA por ${cname(hero)}: ${mNow.desc} (+$${mNow.reward}, +3 aprovação)!`);
      room.missionIdx++;
    }
  }
  checkEliminations(room);
  checkVictory(room);
  if (room.phase === 'game') room.timerEnd = Date.now() + room.speed * 1000;
  broadcast(room);
}

const PROD_BUILDS = { fabrica: 300, serraria: 280, fazenda: 250, mina: 300, usina: 350, petroleo: 400, mina_ouro: 500, estrada: 150, base: 400, mina_rara: 450, adubo: 260, mina_uranio: 500 };
const CONCRETE_NEED = { fabrica: 0, serraria: 8, fazenda: 8, mina: 8, usina: 8, petroleo: 8, mina_ouro: 10, estrada: 5, base: 10, mina_rara: 10, adubo: 8, mina_uranio: 10 };
const PROD_NAMES = { fabrica: '🧱 Fábrica de concreto', serraria: '🪵 Serraria', fazenda: '🌾 Fazenda', mina: '⛏️ Mina', usina: '⚡ Usina', petroleo: '🛢️ Poço de petróleo', mina_ouro: '🏦 Mina de ouro', estrada: '🛣️ Estrada', base: '🎖️ Base militar', mina_rara: '⚙️ Mina de terras raras', adubo: '🌱 Usina de nutrientes', mina_uranio: '☢️ Mina de urânio' };
const MISSIONS = [
  { id: 'construir_3', desc: 'Conclua 3 construções',            reward: 500, check: p => p.stats.construidas >= 3 },
  { id: 'vender_30',   desc: 'Venda 30 unidades no mercado',      reward: 400, check: p => p.stats.vendidas >= 30 },
  { id: 'pop_50',      desc: 'Alcance 50 habitantes',             reward: 500, check: p => p.pop >= 50 },
  { id: 'leis_2',      desc: 'Aprove 2 leis nacionais',           reward: 450, check: p => p.leis.length >= 2 },
  { id: 'vencer_1',    desc: 'Vença 1 batalha',                   reward: 600, check: p => p.stats.vitorias >= 1 },
  { id: 'educacao_2',  desc: 'Leve Educação ao nível 2',          reward: 400, check: p => p.sectors.educacao >= 2 },
  { id: 'presente_2',  desc: 'Envie 2 presentes diplomáticos',    reward: 350, check: p => p.stats.presentes >= 2 },
  { id: 'anexar',      desc: 'Ocupe território inimigo (2+ províncias)', reward: 700, check: p => ownProvinces(p).length >= 2 },
  { id: 'blindados_1', desc: 'Produza forças blindadas',                 reward: 400, check: p => p.units.blindados >= 1 },
  { id: 'treinar_3',   desc: 'Treine o exército 3 vezes',                reward: 400, check: p => p.stats.treinos >= 3 },
];

const UNIT_COSTS = { blindados: 300, aviacao: 400, frota: 500, infantaria: 200, artilharia: 350, submarinos: 450, porta_avioes: 700 };
const upM = (p, k) => 1 + 0.5 * ((p.upgrades && p.upgrades[k]) || 0);

function allyDefend(room, atk, def) {
  for (const al of room.players) {
    if (!al.alive || al.id === atk.id || al.id === def.id) continue;
    if (def.allies.includes(al.id) && !al.wars.includes(atk.id) && !atk.allies.includes(al.id)) {
      al.wars.push(atk.id); atk.wars.push(al.id);
      log(room, `🤝 ${cname(al)} entrou na guerra para DEFENDER ${cname(def)}!`);
    }
  }
}

function botAttack(room, a, d) {
  allyDefend(room, a, d);
  let aM = 1, dM = 1;
  if (a.ideology === 'autoritarismo') aM += 0.15;
  if (a.techs.includes('exercito')) aM += 0.15;
  aM += 0.05 * a.units.blindados + 0.02 * a.units.aviacao + 0.04 * a.units.artilharia + 0.02 * a.units.submarinos + 0.02 * a.units.porta_avioes;
  dM += 0.05 * d.units.aviacao + 0.03 * d.units.frota + 0.04 * d.units.infantaria + 0.02 * d.units.submarinos + 0.04 * d.units.porta_avioes;
  dM += 0.05 * Math.min(5, d.buildings.base || 0);
  if (a.leis.includes('servico_militar')) aM += 0.05;
  if (d.leis.includes('guarda_nacional')) dM += 0.05;
  const aP = a.mil * aM * (0.85 + Math.random() * 0.45);
  const dP = d.mil * dM * (0.9 + Math.random() * 0.45) * 1.08;
  if (aP > dP) {
    const loot = Math.round(d.money * 0.25);
    d.money -= loot; a.money += loot;
    d.mil = Math.max(1, Math.round(d.mil * 0.8)); a.mil = Math.max(1, Math.round(a.mil * 0.9));
    d.aprov = Math.max(0, d.aprov - 8); a.stats.vitorias++;
    log(room, `🤖⚔️ ${cname(a)} atacou ${cname(d)} e VENCEU! Saque: $${loot}.`);
    const provs = ownProvinces(d);
    if (provs.length) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.owner = a.id; log(room, `🏴 ${cname(a)} OCUPA a província de ${pr.name}!`); }
  } else {
    a.mil = Math.max(1, Math.round(a.mil * 0.7)); d.mil = Math.max(1, Math.round(d.mil * 0.92));
    log(room, `🛡️ ${cname(d)} repeliu o ataque da IA ${cname(a)}!`);
  }
}

function aiTurn(room) {
  if (room.phase !== 'game') return;
  const humans = room.players.filter(p => p.alive && !p.bot);
  const botsAlive = room.players.filter(p => p.alive && p.bot).length || 1;
  for (const b of room.players) {
    if (!b.alive || !b.bot) continue;
    const need = Math.ceil(b.pop / 10) + 10;
    if (b.rec.comida > need + 20) { const q = Math.floor((b.rec.comida - need) / 2); b.rec.comida -= q; b.money += q * room.market.comida; }
    if (b.rec.madeira > 30) { const q = Math.floor(b.rec.madeira / 3); b.rec.madeira -= q; b.money += q * room.market.madeira; }
    if (b.money > 500 && b.builds.length < 2) {
      const kinds = ['infra', 'fabrica', 'fazenda', 'mina', 'serraria', 'usina', 'petroleo', 'mina_ouro', 'estrada', 'base', 'mina_rara', 'adubo'];
      const kind = kinds[(room.turn + b.id.length) % kinds.length];
      if (kind === 'infra') {
        const pr = ownProvinces(b).find(x => x.infra < 5);
        if (pr) { b.money -= 200; b.builds.push({ kind: 'infra', prov: b.provinces.indexOf(pr), until: room.turn + 1 }); }
      } else if (b.money > PROD_BUILDS[kind] && b.rec.concreto >= (CONCRETE_NEED[kind] || 0)) {
        b.money -= PROD_BUILDS[kind]; b.rec.concreto -= CONCRETE_NEED[kind] || 0; b.builds.push({ kind, until: room.turn + 1 });
      }
    }
    if (b.money > 1200 && b.mil < 12 && room.turn % 4 === 0) { b.money -= 150; b.mil += 1; }
    if (b.money > 900 && b.rec.terras_raras >= 4) {
      const ks = ['infantaria', 'blindados', 'artilharia', 'aviacao', 'porta_avioes'];
      const k = ks[room.turn % ks.length];
      if (b.units[k] < 3) { b.money -= UNIT_COSTS[k]; b.rec.terras_raras -= 4; b.units[k]++; }
    }
    for (const pr of room.proposals.filter(x => x.to === b.id)) {
      const from = room.players.find(x => x.id === pr.from);
      if (!from) continue;
      const rel = relBetween(b, from);
      const kind = pr.kind || 'alianca';
      const acc = kind === 'comercial' ? (rel >= 40 || b.money < 3000)
        : kind === 'alianca' ? rel >= 60
        : (b.mil <= from.mil || rel > 35);
      respondProposal(room, b, pr.from, acc, kind);
    }
    if (b.money > 4000 && room.turn % 3 === 0) {
      const em = humans.find(h => h.emergencyUntil > room.turn && relBetween(b, h) >= 45);
      if (em) {
        b.money -= 200; em.money += 200; em.emergencyUntil = 0;
        bumpRel(b, em, 15); b.aprov = Math.min(100, b.aprov + 2); em.aprov = Math.min(100, em.aprov + 2);
        log(room, `🤝 A IA ${cname(b)} enviou ajuda humanitária para ${cname(em)} (+$200).`);
      }
    }
    if (room.turn > 12 && humans.length && b.mil >= 4 && Math.random() * botsAlive < 0.3 && room.turn >= room.noWarUntil) {
      const ts = humans.filter(h => !b.allies.includes(h.id) && !b.wars.includes(h.id) && !(((b.pacts && b.pacts[h.id]) || 0) > room.turn));
      if (ts.length) {
        const h = ts[Math.floor(Math.random() * ts.length)];
        b.wars.push(h.id); h.wars.push(b.id);
        log(room, `🤖⚔️ ${cname(b)} declarou GUERRA a ${cname(h)}!`);
        if (Math.random() < 0.6) botAttack(room, b, h);
      }
    }
    if (humans.length && b.trades.length < 3 && Math.random() * botsAlive < 0.2) {
      const h = humans[Math.floor(Math.random() * humans.length)];
      if (!b.trades.includes(h.id) && !b.wars.includes(h.id) && !room.proposals.some(x => x.from === b.id && x.to === h.id)) {
        room.proposals.push({ from: b.id, to: h.id, kind: 'comercial' });
        log(room, `🤖💼 ${cname(b)} propõe um ACORDO COMERCIAL a ${cname(h)}.`);
      }
    }
  }
}

const NEWS_TEMPLATES = [
  a => `🗞️ Escândalo de corrupção abala o governo de ${a}.`,
  a => `🗞️ Economia de ${a} surpreende analistas com crescimento recorde.`,
  a => `🗞️ ${a} anuncia candidatura para sediar a Copa do Mundo.`,
  a => `🗞️ Multidões protestam nas ruas de ${a} por melhores salários.`,
  a => `🗞️ Cientistas de ${a} anunciam avanço histórico em energia limpa.`,
  a => `🗞️ Seleção de ${a} vence amistoso internacional e país festeja.`,
  a => `🗞️ Queda nas bolsas globais afeta investimentos em ${a}.`,
  a => `🗞️ ${a} inaugura nova linha de trem de alta velocidade.`,
];
function worldNews(room) {
  if (Math.random() > 0.75) return;
  const pool = room.players.filter(p => p.alive && p.bot);
  if (!pool.length) return;
  const a = pool[Math.floor(Math.random() * pool.length)];
  log(room, NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)](cname(a)));
}
function randomEvent(room) {
  if (Math.random() > 0.45) return;
  const alive = room.players.filter(p => p.alive);
  if (!alive.length) return;
  const pick = alive[Math.floor(Math.random() * alive.length)];
  switch (Math.floor(Math.random() * 10)) {
    case 0: alive.forEach(p => p.money += 80); log(room, '📈 Boom das commodities: todas as nações recebem +$80.'); break;
    case 1: pick.money = Math.max(0, pick.money - 150); log(room, `📉 Crise financeira atinge ${cname(pick)}: -$150.`); break;
    case 2: alive.forEach(p => p.aprov = Math.min(100, p.aprov + 3)); log(room, '🕊️ Cúpula de paz global: aprovação +3 para todos.'); break;
    case 3: pick.mil = Math.max(1, pick.mil - 2); pick.aprov = Math.max(0, pick.aprov - 4); log(room, `🪖 Tentativa de golpe em ${cname(pick)}: -2 militar, -4 aprovação.`); break;
    case 4: pick.eco += 1; log(room, `🛢️ ${cname(pick)} descobre novas reservas: economia +1.`); break;
    case 5: pick.aprov = Math.min(100, pick.aprov + 5); log(room, `🎉 Festival nacional em ${cname(pick)}: aprovação +5.`); break;
    case 6: { const provs = ownProvinces(pick).filter(pr => pr.infra < 5); if (provs.length) { provs[0].infra += 1; log(room, `🏗️ Obra concluída em ${provs[0].name} (${cname(pick)}): infraestrutura +1.`); } break; }
    case 7: pick.influencia += 2; log(room, `🎬 Cultura de ${cname(pick)} conquista o mundo: influência +2.`); break;
    case 8: { const provs = ownProvinces(pick).filter(pr => pr.infra > 0); if (provs.length) { const pr = provs[0]; pr.infra -= 1; pick.emergencyUntil = room.turn + 3; log(room, `🌪️ DESASTRE em ${pr.name} (${cname(pick)}): infra -1 e EMERGÊNCIA (-20% renda por 3 turnos). Peça ou receba ajuda!`); } break; }
    case 9: { const ks = Object.keys(pick.buildings).filter(k => pick.buildings[k] > 0); if (ks.length) { const k = ks[Math.floor(Math.random() * ks.length)]; pick.buildings[k] -= 1; pick.aprov = Math.max(0, pick.aprov - 5); pick.emergencyUntil = room.turn + 3; log(room, `🌍 TERREMOTO em ${cname(pick)}: ${PROD_NAMES[k] || k} destruído, -5 aprovação, EMERGÊNCIA declarada!`); } break; }
  }
}

/* ---------------- Ações ---------------- */
function spend(p, ap, cost) {
  if (p.ap < ap) { err(p.conn, 'Pontos de ação insuficientes neste turno.'); return false; }
  if (p.money < cost) { err(p.conn, 'Dinheiro insuficiente no caixa.'); return false; }
  p.ap -= ap; p.money -= cost;
  return true;
}

function performAction(room, p, msg) {
  if (room.phase !== 'game' || !p.alive) return;
  const target = msg.target ? room.players.find(x => x.id === msg.target) : null;

  switch (msg.action) {
    /* --- internos --- */
    case 'investir': if (!spend(p, 1, 250)) return; p.eco += 2; log(room, `🏭 ${cname(p)} investiu na economia (+2).`); break;
    case 'militar': {
      if (room.turn < room.noArmsUntil) { err(p.conn, '🇺🇳 Recrutamento proibido por resolução da ONU.'); return; }
      const cost = p.ideology === 'fascismo' ? 150 : 300;
      if (!spend(p, 1, cost)) return; p.mil += 3; log(room, `🪖 ${cname(p)} recrutou tropas (+3 militar).`); break;
    }
    case 'propaganda': if (!spend(p, 1, 150)) return; p.aprov = Math.min(100, p.aprov + 7); log(room, `📺 ${cname(p)} lançou campanha de propaganda (+7 aprovação).`); break;
    case 'ideologia':
      if (!IDEOLOGIES[msg.value]) return;
      if (!spend(p, 1, 0)) return;
      p.ideology = msg.value; p.aprov = Math.max(0, p.aprov - 5);
      log(room, `⚖️ ${cname(p)} adota a ideologia ${IDEOLOGIES[msg.value].name} (-5 aprovação na transição).`);
      break;
    case 'religiao':
      if (!RELIGIONS[msg.value]) return;
      if (!spend(p, 1, 0)) return;
      p.religion = msg.value; p.aprov = Math.max(0, p.aprov - 5);
      log(room, `🛐 ${cname(p)} adota a religião de Estado ${RELIGIONS[msg.value].name}.`);
      break;
    case 'ministro':
      if (!MINISTERS[msg.post] || !MINISTERS[msg.post][msg.value]) return;
      if (!spend(p, 1, 100)) return;
      p.ministers[msg.post] = msg.value;
      log(room, `💼 ${cname(p)} nomeia ${MINISTERS[msg.post][msg.value].name} para a pasta ${msg.post === 'eco' ? 'Economia' : msg.post === 'def' ? 'Defesa' : 'Diplomacia'}.`);
      break;
    case 'tech': {
      const t = TECHS[msg.value]; if (!t || p.techs.includes(msg.value)) return;
      const cost = p.ideology === 'republica' ? Math.round(t.cost * 0.75) : t.cost;
      if (!spend(p, 1, cost)) return;
      p.techs.push(msg.value);
      if (msg.value === 'automacao') p.eco += 2;
      log(room, `🔬 ${cname(p)} pesquisa ${t.name}!`);
      break;
    }
    case 'setor': {
      const sec = SECTORS.find(s => s[0] === msg.value); if (!sec) return;
      if (p.sectors[sec[0]] >= 5) return;
      const cost = p.ideology === 'comunismo' ? 75 : 150;
      if (!spend(p, 1, cost)) return;
      p.sectors[sec[0]] += 1;
      log(room, `🏙️ ${cname(p)} investe em ${sec[1]} (nível ${p.sectors[sec[0]]}).`);
      break;
    }
    case 'espacial': {
      if (p.space + p.builds.filter(b=>b.kind==='espacial').length >= 3) return;
      if (!spend(p, 2, SPACE_COSTS[p.space + p.builds.filter(b=>b.kind==='espacial').length])) return;
      p.builds.push({ kind: 'espacial', until: room.turn + 1 });
      log(room, `🚀 ${cname(p)} inicia etapa do programa espacial (conclui no próximo turno).`);
      break;
    }
    case 'imposto': p.taxRate = Math.max(0, Math.min(2, msg.value | 0)); log(room, `🧾 ${cname(p)} ajusta impostos para ${['baixa', 'média', 'alta'][p.taxRate]}.`); break;
    case 'emprestimo': p.money += 600; p.debt += 720; log(room, `🏦 ${cname(p)} contrai empréstimo de $600 (dívida $${p.debt}).`); break;
    case 'pagar': { const x = Math.min(p.debt, p.money); if (x <= 0) return; p.money -= x; p.debt -= x; log(room, `🏦 ${cname(p)} paga $${x} da dívida.`); break; }
    case 'infra': {
      const prov = p.provinces[msg.prov];
      if (!prov || prov.owner !== p.id || prov.infra >= 5) return;
      if (!spend(p, 1, 200)) return;
      p.builds.push({ kind: 'infra', prov: msg.prov, until: room.turn + 1 });
      log(room, `🏗️ ${cname(p)} inicia construção em ${prov.name} (conclui no próximo turno).`);
      break;
    }
    case 'nuclear':
      if (p.nuclear + p.builds.filter(b=>b.kind==='nuclear').length >= NUKE_MAX_LEVEL) { err(p.conn, 'Programa nuclear no nível máximo.'); return; }
      if (p.rec.uranio < 10) { err(p.conn, '☢️ O programa nuclear exige 10 de URÂNIO — minere numa jazida própria ou compre no mercado.'); return; }
      if (!spend(p, 2, 600)) return;
      p.rec.uranio -= 10;
      p.builds.push({ kind: 'nuclear', until: room.turn + 1 });
      log(room, `☢️ ${cname(p)} inicia etapa do programa nuclear (conclui no próximo turno).`);
      break;

    /* --- externos --- */
    case 'espionar': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 100))) return;
      info(p.conn, `🕵️ Relatório sobre ${cname(target)} — Caixa $${Math.round(target.money)} | Eco ${target.eco} | Mil ${target.mil} | ❤️ ${target.aprov}% | ☢️ ${target.nuclear} | ⚖️ ${target.influencia} | 🕌 ${target.fe} | Dívida $${target.debt}`);
      break;
    }
    case 'sabotagem': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 150))) return;
      const r = Math.random();
      if (r < 0.5) {
        const provs = ownProvinces(target).filter(pr => pr.infra > 0);
        if (provs.length) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.infra -= 1; log(room, `🧨 Sabotagem de ${cname(p)} destrói infraestrutura em ${pr.name} (${cname(target)})!`); }
        else { target.mil = Math.max(1, target.mil - 3); log(room, `🧨 Sabotagem de ${cname(p)} danifica o arsenal de ${cname(target)} (-3 militar)!`); }
        bumpRel(p, target, -5);
      } else if (r < 0.8) { p.aprov = Math.max(0, p.aprov - 5); target.aprov = Math.min(100, target.aprov + 2); log(room, `🚨 ${cname(p)} foi EXPOSTO sabotando ${cname(target)}!`); bumpRel(p, target, -10); }
      else log(room, `🕵️ Agentes de ${cname(p)} falham silenciosamente em ${cname(target)}.`);
      break;
    }
    case 'sancao': {
      if (!target || target === p || !target.alive) return;
      if (p.sanctioning.includes(target.id)) {
        p.sanctioning = p.sanctioning.filter(id => id !== target.id);
        target.sanctionedBy = target.sanctionedBy.filter(id => id !== p.id);
        log(room, `🕊️ ${cname(p)} suspende as sanções contra ${cname(target)}.`);
      } else {
        if (p.sanctioning.length >= 3) { err(p.conn, 'Máximo de 3 sanções ativas.'); return; }
        if (!spend(p, 1, 0)) return;
        p.sanctioning.push(target.id); target.sanctionedBy.push(p.id);
        bumpRel(p, target, -20);
        log(room, `🚫 ${cname(p)} impõe SANÇÕES econômicas a ${cname(target)}!`);
      }
      break;
    }
    case 'ajudar': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 200)) return;
      target.money += 200; p.aprov = Math.min(100, p.aprov + 2); target.aprov = Math.min(100, target.aprov + 2);
      const tinhaEm = room.turn < target.emergencyUntil;
      target.emergencyUntil = 0;
      bumpRel(p, target, 10);
      log(room, `🤝 ${cname(p)} enviou ajuda humanitária ($200) para ${cname(target)}${tinhaEm ? ' e encerrou a EMERGÊNCIA' : ''}!`);
      break;
    }
    case 'pedir_ajuda': {
      if (room.proposals.some(pr => pr.from === p.id && pr.kind === 'ajuda')) return;
      room.proposals.push({ from: p.id, to: 'ALL', kind: 'ajuda' });
      log(room, `🆘 ${cname(p)} pede AJUDA INTERNACIONAL${room.turn < p.emergencyUntil ? ' (em emergência!)' : ''}.`);
      break;
    }
    case 'lei': {
      const lei = LEIS[msg.value];
      if (!lei || p.leis.includes(msg.value)) return;
      if (!spend(p, 1, lei.cost)) return;
      p.leis.push(msg.value);
      if (msg.value === 'liberdade_imprensa') p.aprov = Math.min(100, p.aprov + 3);
      if (msg.value === 'campanha_patriotica') p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📜 ${cname(p)} aprova a lei "${lei.name}" (${lei.desc}).`);
      break;
    }
    case 'blindados': case 'aviacao': case 'frota': case 'infantaria': case 'artilharia': case 'submarinos': case 'porta_avioes': {
      const costs = { blindados: 300, aviacao: 400, frota: 500, infantaria: 200, artilharia: 350, submarinos: 450, porta_avioes: 700 };
      const UNAMES = { blindados: 'forças BLINDADAS', aviacao: 'sua AVIAÇÃO', frota: 'sua FROTA NAVAL', infantaria: 'sua INFANTARIA', artilharia: 'sua ARTILHARIA', submarinos: 'seus SUBMARINOS', porta_avioes: 'seu PORTA-AVIÕES' };
      if (p.units[msg.action] >= 3) { err(p.conn, 'Nível máximo de unidade.'); return; }
      if (p.rec.terras_raras < 4) { err(p.conn, '⚙️ Produzir unidades exige 4 TERRAS RARAS — construa uma Mina de terras raras.'); return; }
      if (!spend(p, 1, costs[msg.action])) return;
      p.rec.terras_raras -= 4;
      p.units[msg.action] += 1;
      log(room, `🎖️ ${cname(p)} fortalece ${UNAMES[msg.action]} (nível ${p.units[msg.action]}).`);
      break;
    }
    case 'embaixada': {
      if (!target || target === p || !target.alive || p.embassies.includes(target.id)) return;
      if (!spend(p, 1, dipCost(p, 200))) return;
      p.embassies.push(target.id); target.embassies.push(p.id);
      bumpRel(p, target, 10);
      log(room, `🏛️ ${cname(p)} abre embaixada em ${cname(target)}.`);
      break;
    }
    case 'comercial': {
      if (!target || target === p || !target.alive || p.trades.includes(target.id)) return;
      if (p.wars.includes(target.id)) { err(p.conn, 'Em guerra não há comércio.'); return; }
      if (room.proposals.some(pr => pr.from === p.id && pr.to === target.id && pr.kind === 'comercial')) return;
      room.proposals.push({ from: p.id, to: target.id, kind: 'comercial' });
      if (target.bot) { const acc = relBetween(target, p) >= 40 || Math.random() < 0.3; respondProposal(room, target, p.id, acc, 'comercial'); return; }
      info(target.conn, `💼 ${cname(p)} propôs um ACORDO COMERCIAL!`);
      break;
    }
    case 'alianca': {
      if (!target || target === p || !target.alive) return;
      if (p.wars.includes(target.id)) { err(p.conn, 'Assine a paz antes de propor aliança.'); return; }
      if (p.allies.includes(target.id)) { err(p.conn, 'Vocês já são aliados.'); return; }
      if (p.allies.length >= 3 || target.allies.length >= 3) { err(p.conn, 'Limite de 3 alianças.'); return; }
      if (room.proposals.some(pr => pr.from === p.id && pr.to === target.id && pr.kind === 'alianca')) return;
      room.proposals.push({ from: p.id, to: target.id, kind: 'alianca' });
      if (target.bot) { const acc = relBetween(target, p) >= 60; respondProposal(room, target, p.id, acc, 'alianca'); return; }
      info(target.conn, `🤝 ${cname(p)} propôs uma ALIANÇA com você!`);
      break;
    }
    case 'guerra': {
      if (!target || target === p || !target.alive) return;
      if (room.turn < room.noWarUntil) { err(p.conn, '🇺🇳 A ONU proibiu novas guerras neste período.'); return; }
      if (p.wars.includes(target.id)) { err(p.conn, 'Vocês já estão em guerra.'); return; }
      if (p.allies.includes(target.id)) { err(p.conn, 'Você não pode declarar guerra a um aliado.'); return; }
      if (((p.pacts && p.pacts[target.id]) || 0) > room.turn) { err(p.conn, '🤝 Um pacto de não-agressão com essa nação está vigente.'); return; }
      if (!spend(p, 1, 0)) return;
      p.wars.push(target.id); target.wars.push(p.id);
      p.trades = p.trades.filter(id => id !== target.id); target.trades = target.trades.filter(id => id !== p.id);
      p.relations[target.id] = 0; target.relations[p.id] = 0;
      p.aprov = Math.max(0, p.aprov - 2);
      const auth = room.warAuth && room.warAuth.by === p.id && room.warAuth.target === target.id && room.turn <= room.warAuth.until;
      if (!auth) {
        for (const o of room.players) if (o.alive && o.id !== p.id && o.id !== target.id) o.relations[p.id] = Math.max(0, relBetween(o, p) - 8);
        log(room, `⚠️ ${cname(p)} declarou GUERRA a ${cname(target)} sem autorização da ONU — relações abaladas com o mundo (-8)!`);
      } else log(room, `⚠️ ${cname(p)} declarou GUERRA a ${cname(target)} com autorização da ONU!`);
      break;
    }
    case 'paz': {
      if (!target || target === p || !target.alive || !p.wars.includes(target.id)) return;
      if (room.proposals.some(pr => pr.from === p.id && pr.to === target.id && pr.kind === 'paz')) return;
      room.proposals.push({ from: p.id, to: target.id, kind: 'paz' });
      if (target.bot) { const acc = (target.mil <= p.mil || relBetween(target, p) > 35); respondProposal(room, target, p.id, acc, 'paz'); return; }
      info(target.conn, `🕊️ ${cname(p)} propôs um tratado de PAZ!`);
      break;
    }
    case 'bloqueio': {
      if (!target || target === p || !target.alive || !p.wars.includes(target.id)) { err(p.conn, 'Bloqueio naval exige guerra.'); return; }
      if (p.units.frota < 1) { err(p.conn, 'Você precisa de uma FROTA (🎖️ frota nível 1+).'); return; }
      if (p.blockading.includes(target.id)) {
        p.blockading = p.blockading.filter(id => id !== target.id);
        target.blockadedBy = target.blockadedBy.filter(id => id !== p.id);
        log(room, `⛴️ ${cname(p)} suspende o bloqueio naval a ${cname(target)}.`);
      } else {
        if (!spend(p, 1, 0)) return;
        p.blockading.push(target.id); target.blockadedBy.push(p.id);
        log(room, `⛴️ ${cname(p)} impõe BLOQUEIO NAVAL a ${cname(target)} (-25% renda)!`);
      }
      break;
    }
    case 'atacar': {
      if (!target || target === p || !target.alive) return;
      if (p.allies.includes(target.id)) { err(p.conn, 'Você não pode atacar um aliado.'); return; }
      if (!p.wars.includes(target.id)) { err(p.conn, 'Declare GUERRA primeiro (⚠️, 1⚡).'); return; }
      if (p.ap < 2) { err(p.conn, 'Atacar custa 2 pontos de ação.'); return; }
      p.ap -= 2;
      allyDefend(room, p, target);
      let aM = 1, dM = 1;
      if (p.ideology === 'autoritarismo') aM += 0.15;
      if (p.techs.includes('exercito')) aM += 0.15;
      if (p.ministers.def === 'fal') aM += 0.10;
      aM += 0.05 * p.units.blindados + 0.02 * p.units.aviacao + 0.04 * p.units.artilharia + 0.02 * p.units.submarinos + 0.02 * p.units.porta_avioes;
      dM += 0.05 * target.units.aviacao + 0.03 * target.units.frota + 0.04 * target.units.infantaria + 0.02 * target.units.submarinos + 0.04 * target.units.porta_avioes;
      dM += 0.05 * Math.min(5, target.buildings.base || 0);
      if (p.leis.includes('servico_militar')) aM += 0.05;
      if (target.leis.includes('guarda_nacional')) dM += 0.05;
      if (target.ministers.def === 'estr') dM += 0.10;
      const aP = p.mil * aM * (0.85 + Math.random() * 0.45);
      const dP = target.mil * dM * (0.9 + Math.random() * 0.45) * 1.08;
      if (aP > dP) {
        const loot = Math.round(target.money * 0.25);
        target.money -= loot; p.money += loot;
        target.mil = Math.max(1, Math.round(target.mil * 0.8));
        p.mil = Math.max(1, Math.round(p.mil * 0.9));
        target.aprov = Math.max(0, target.aprov - 8);
        p.aprov = Math.max(0, p.aprov - 3);
        p.stats.vitorias++; p.xp += 15;
        log(room, `⚔️ ${cname(p)} atacou ${cname(target)} e VENCEU! Saque: $${loot}.`);
        const provs = ownProvinces(target);
        if (provs.length) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.owner = p.id; log(room, `🏴 ${cname(p)} OCUPA a província de ${pr.name}!`); }
      } else {
        p.mil = Math.max(1, Math.round(p.mil * 0.7));
        target.mil = Math.max(1, Math.round(target.mil * 0.92));
        p.aprov = Math.max(0, p.aprov - 6);
        target.aprov = Math.min(100, target.aprov + 4);
        log(room, `🛡️ ${cname(target)} REPELIU o ataque de ${cname(p)}!`);
      }
      break;
    }
    case 'nuke': {
      if (!target || target === p || !target.alive) return;
      if (p.allies.includes(target.id)) { err(p.conn, 'Você não pode atacar um aliado.'); return; }
      if (!p.wars.includes(target.id)) { err(p.conn, 'Declare GUERRA primeiro (⚠️, 1⚡).'); return; }
      if (p.nuclear < NUKE_MIN_LEVEL) { err(p.conn, `Programa nuclear insuficiente (nível ${NUKE_MIN_LEVEL}+ necessário).`); return; }
      if (p.ap < 3) { err(p.conn, 'Lançar um míssil custa 3 pontos de ação.'); return; }
      p.ap -= 3; p.nuclear -= 1;
      const shield = target.techs.includes('antiaerea');
      target.mil = Math.max(1, Math.round(target.mil * (shield ? 0.7 : 0.4)));
      target.aprov = Math.max(0, target.aprov - (shield ? 10 : 20));
      p.aprov = Math.max(0, p.aprov - 10);
      const provs = ownProvinces(target);
      const hits = shield ? 1 : 2;
      for (let i = 0; i < hits && provs.length; i++) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.infra = Math.max(0, pr.infra - 2); }
      log(room, `☢️💥 ${cname(p)} LANÇOU UM MÍSSIL NUCLEAR em ${cname(target)}!${shield ? ' (Defesa Antiaérea reduziu os danos!)' : ' Devastação total.'}`);
      break;
    }
    case 'comprar': {
      const q = Math.max(1, Math.min(100, msg.qty | 0));
      if (room.market[msg.res] == null) return;
      const cost = room.market[msg.res] * q;
      if (p.money < cost) { err(p.conn, 'Dinheiro insuficiente.'); return; }
      p.money -= cost; p.rec[msg.res] += q;
      if (!p.bot) { const sup = room.world[(room.turn * 7 + msg.res.length * 13) % room.world.length]; log(room, `🚢 Carregamento de ${msg.res} chegou de ${sup.name} (+${q}).`); }
      break;
    }
    case 'vender': {
      const q = Math.max(1, Math.min(100, msg.qty | 0));
      if (room.market[msg.res] == null || p.rec[msg.res] < q) return;
      p.rec[msg.res] -= q; p.money += room.market[msg.res] * q; p.stats.vendidas += q;
      break;
    }
    case 'construir': {
      if (!PROD_BUILDS[msg.kind]) return;
      if (msg.kind === 'mina_uranio' && !(p.depositos || []).includes('uranio')) { err(p.conn, '☢️ Seu país não possui jazidas de urânio — importe no mercado ou conquiste um território que tenha.'); return; }
      const need = CONCRETE_NEED[msg.kind] || 0;
      if (p.rec.concreto < need) { err(p.conn, `🧱 Precisa de ${need} de concreto — construa uma Fábrica de concreto primeiro.`); return; }
      let cCost = PROD_BUILDS[msg.kind];
      if (p.techs.includes('engenharia')) cCost = Math.ceil(cCost * 0.85);
      if (!spend(p, 1, cCost)) return;
      p.rec.concreto -= need;
      p.builds.push({ kind: msg.kind, until: room.turn + 1 });
      log(room, `🏗️ ${cname(p)} inicia ${PROD_NAMES[msg.kind]} (conclui no próximo turno).`);
      break;
    }
    case 'presente': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 100)) return;
      bumpRel(p, target, 8); p.stats.presentes++; p.xp += 2;
      log(room, `🎁 ${cname(p)} enviou um PRESENTE diplomático a ${cname(target)} (+8 relações).`);
      break;
    }
    case 'upgrade': {
      const k = msg.kind;
      if (!PROD_BUILDS[k]) return;
      if (!p.buildings[k]) { err(p.conn, 'Construa o prédio antes de melhorá-lo.'); return; }
      const lvl = (p.upgrades && p.upgrades[k]) || 0;
      if (lvl >= 2) { err(p.conn, '⬆️ Melhoria já está no nível máximo (3).'); return; }
      let uCost = Math.round(PROD_BUILDS[k] * 0.6 * (lvl + 1));
      if (p.techs.includes('engenharia')) uCost = Math.ceil(uCost * 0.85);
      if (!spend(p, 1, uCost)) return;
      p.upgrades = p.upgrades || {}; p.upgrades[k] = lvl + 1;
      log(room, `⬆️ ${cname(p)} melhora ${PROD_NAMES[k]} para o nível ${lvl + 2} (+50% de produção).`);
      break;
    }
    case 'treinar': {
      if (!spend(p, 1, 150)) return;
      p.mil = Math.min(25, p.mil + 1); p.stats.treinos = (p.stats.treinos || 0) + 1;
      log(room, `🏋️ ${cname(p)} treina suas forças armadas (poder militar +1).`);
      break;
    }
    case 'pacto': {
      if (!target || target === p || !target.alive) return;
      if (p.wars.includes(target.id)) { err(p.conn, 'Impossível assinar pacto em meio à guerra.'); return; }
      if (((p.pacts && p.pacts[target.id]) || 0) > room.turn) { err(p.conn, 'Já existe pacto de não-agressão vigente.'); return; }
      if (relBetween(p, target) < 40) { err(p.conn, 'Relações muito baixas (mínimo 40) para um pacto de não-agressão.'); return; }
      if (!spend(p, 1, 100)) return;
      const until = room.turn + 8;
      p.pacts = p.pacts || {}; target.pacts = target.pacts || {};
      p.pacts[target.id] = until; target.pacts[p.id] = until;
      bumpRel(p, target, 5);
      log(room, `🤝 ${cname(p)} e ${cname(target)} assinam um PACTO DE NÃO-AGRESSÃO (8 turnos).`);
      break;
    }
    case 'show': {
      if (p.lastShow === room.turn) { err(p.conn, 'Você já fez um show neste turno.'); return; }
      if (!spend(p, 1, 150)) return;
      p.lastShow = room.turn; p.aprov = Math.min(100, p.aprov + 5);
      log(room, `🎤 ${cname(p)} organizou um show nacional (+5 aprovação)!`);
      break;
    }
    case 'propor_resolucao': {
      if (!target || target === p || !target.alive) return;
      if (room.un) { err(p.conn, 'A ONU já está em sessão.'); return; }
      if (!spend(p, 1, 300)) return;
      room.un = { type: 'autorizar', desc: `Autorizar intervenção militar de ${cname(p)} contra ${cname(target)}`, target: target.id, proposer: p.id, votes: {}, deadline: Date.now() + 20000 };
      log(room, `🇺🇳 ${cname(p)} propôs resolução na ONU: ${room.un.desc}. Votação aberta!`);
      for (const b of room.players) if (b.bot && b.alive) room.un.votes[b.id] = relBetween(b, p) >= 45 || Math.random() < 0.25;
      break;
    }
    case 'subornar': {
      if (!room.un || room.un.type !== 'autorizar' || room.un.proposer !== p.id) { err(p.conn, 'Nenhuma resolução sua em votação.'); return; }
      if (!spend(p, 0, 200)) return;
      const nos = Object.keys(room.un.votes).filter(k => room.un.votes[k] === false);
      const flip = Math.ceil(nos.length / 2);
      let n = 0;
      for (const bid of nos) {
        if (n >= flip) break;
        room.un.votes[bid] = true; n++;
      }
      log(room, `💰 ${cname(p)} comprou apoio diplomático (+${n} votos na ONU).`);
      break;
    }
    case 'espalhar_ideologia': {
      if (!target || target === p || !target.alive) return;
      if (!p.ideology) { err(p.conn, 'Adote uma ideologia primeiro.'); return; }
      if (!spend(p, 1, 300)) return;
      if (Math.random() < 0.3 + relBetween(p, target) / 200) {
        target.ideology = p.ideology; bumpRel(p, target, 10); p.xp += 5;
        log(room, `⚖️ ${cname(p)} espalhou sua ideologia para ${cname(target)}!`);
      } else { bumpRel(p, target, -5); log(room, `⚖️ ${cname(target)} rejeitou a propaganda de ${cname(p)} (-5 relações).`); }
      break;
    }
    case 'espalhar_religiao': {
      if (!target || target === p || !target.alive) return;
      if (!p.religion || p.religion === 'laico') { err(p.conn, 'Adote uma religião de Estado primeiro.'); return; }
      if (!spend(p, 1, 300)) return;
      if (Math.random() < 0.3 + relBetween(p, target) / 200) {
        target.religion = p.religion; bumpRel(p, target, 10); p.xp += 5;
        log(room, `🛐 ${cname(p)} espalhou sua religião para ${cname(target)}!`);
      } else { bumpRel(p, target, -5); log(room, `🛐 ${cname(target)} rejeitou os missionários de ${cname(p)} (-5 relações).`); }
      break;
    }
    default: return;
  }
  p.xp = (p.xp || 0) + 1;
  checkEliminations(room);
  checkVictory(room);
  broadcast(room);
}

function bumpRel(a, b, d) {
  const v = Math.max(0, Math.min(100, relBetween(a, b) + d));
  a.relations[b.id] = v; b.relations[a.id] = v;
}

function respondProposal(room, p, fromId, accept, kind) {
  const idx = room.proposals.findIndex(pr => pr.from === fromId && pr.to === p.id && (pr.kind || 'alianca') === kind);
  if (idx === -1) return;
  room.proposals.splice(idx, 1);
  const from = room.players.find(x => x.id === fromId);
  if (!from || !from.alive || !p.alive) { broadcast(room); return; }
  if (kind === 'alianca') {
    if (!accept) { log(room, `🚫 ${cname(p)} recusou a aliança de ${cname(from)}.`); broadcast(room); return; }
    if (from.allies.includes(p.id) || from.allies.length >= 3 || p.allies.length >= 3) { broadcast(room); return; }
    from.allies.push(p.id); p.allies.push(from.id);
    from.relations[p.id] = 100; p.relations[from.id] = 100;
    log(room, `🤝 ALIANÇA firmada entre ${cname(from)} e ${cname(p)}!`);
  } else if (kind === 'paz') {
    if (!accept) { log(room, `🚫 ${cname(p)} recusou a paz proposta por ${cname(from)}.`); broadcast(room); return; }
    from.wars = from.wars.filter(id => id !== p.id); p.wars = p.wars.filter(id => id !== from.id);
    from.blockading = from.blockading.filter(id => id !== p.id); p.blockadedBy = p.blockadedBy.filter(id => id !== from.id);
    p.blockading = p.blockading.filter(id => id !== from.id); from.blockadedBy = from.blockadedBy.filter(id => id !== p.id);
    from.aprov = Math.min(100, from.aprov + 2); p.aprov = Math.min(100, p.aprov + 2);
    bumpRel(from, p, 30);
    log(room, `🕊️ TRATADO DE PAZ assinado entre ${cname(from)} e ${cname(p)}!`);
  } else if (kind === 'comercial') {
    if (!accept) { log(room, `🚫 ${cname(p)} recusou o acordo comercial de ${cname(from)}.`); broadcast(room); return; }
    from.trades.push(p.id); p.trades.push(from.id);
    bumpRel(from, p, 15);
    log(room, `💼 ACORDO COMERCIAL entre ${cname(from)} e ${cname(p)} (+$20/turno para ambos)!`);
  }
  broadcast(room);
}

/* ---------------- Conexões ---------------- */
function handleDisconnect(conn) {
  const meta = conn.meta;
  if (!meta) return;
  const { room, player } = meta;
  conn.meta = null;
  if (room.phase === 'lobby') {
    room.players = room.players.filter(p => p !== player);
    if (!room.players.length) { if (room.timer) clearInterval(room.timer); rooms.delete(room.code); return; }
    if (room.hostId === player.id) room.hostId = room.players[0].id;
    broadcast(room);
  } else {
    player.connected = false; player.conn = null;
    log(room, `📴 ${player.name} perdeu a conexão.`);
    if (room.hostId === player.id) { const next = room.players.find(p => p.connected); if (next) room.hostId = next.id; }
    if (!room.players.some(p => p.connected)) { if (room.timer) clearInterval(room.timer); rooms.delete(room.code); return; }
    broadcast(room);
  }
}
function sanitizeName(n) { return String(n || '').replace(/[^\p{L}\p{N} _\-.]/gu, '').trim().slice(0, 18) || 'Presidente'; }

function route(conn, msg) {
  switch (msg.t) {
    case 'create': { if (conn.meta) return; const room = newRoom(); addPlayer(room, conn, sanitizeName(msg.name), true); log(room, `👋 ${sanitizeName(msg.name)} criou a sala.`); broadcast(room); break; }
    case 'join': {
      if (conn.meta) return;
      const room = rooms.get(String(msg.code || '').toUpperCase().trim());
      if (!room) return err(conn, 'Sala não encontrada. Confira o código.');
      if (room.phase !== 'lobby') return err(conn, 'Essa partida já começou. Crie sua própria sala!');
      if (room.players.length >= COUNTRIES.length) return err(conn, 'Sala cheia (12 jogadores).');
      addPlayer(room, conn, sanitizeName(msg.name), false);
      log(room, `👋 ${sanitizeName(msg.name)} entrou na sala.`);
      broadcast(room); break;
    }
    case 'pick': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'lobby') return;
      const cid = String(msg.country || '');
      if (!COUNTRY_BY_ID[cid]) return;
      if (room.players.some(p => p.country === cid && p !== player)) return err(conn, 'Esse país já foi escolhido.');
      player.country = player.country === cid ? null : cid;
      broadcast(room); break;
    }
    case 'fundar': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'lobby') return;
      player.customName = sanitizeName(msg.name).slice(0, 24) || player.name;
      player.customFlag = FLAGS_ALLOWED.includes(msg.flag) ? msg.flag : '🏳️';
      broadcast(room);
      break;
    }
    case 'velocidade': { const { room, player } = conn.meta || {}; if (!room || player.id !== room.hostId) return; room.speed = msg.speed === 15 ? 15 : 45; if (room.phase === 'game' && !room.paused) room.timerEnd = Date.now() + room.speed * 1000; broadcast(room); break; }
    case 'pausar': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'game' || player.id !== room.hostId) return;
      if (!room.paused) { room.paused = true; room.pausedRemaining = Math.max(0, room.timerEnd - Date.now()); log(room, '⏸️ O anfitrião pausou a partida.'); }
      else { room.paused = false; room.timerEnd = Date.now() + room.pausedRemaining; log(room, '▶️ Partida retomada.'); }
      broadcast(room);
      break;
    }
    case 'start': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'lobby' || player.id !== room.hostId) return; startGame(room); break; }
    case 'action': { const { room, player } = conn.meta || {}; if (!room) return; performAction(room, player, msg); break; }
    case 'resp_alianca': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'game') return; respondProposal(room, player, msg.from, !!msg.accept, 'alianca'); break; }
    case 'resp_paz': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'game') return; respondProposal(room, player, msg.from, !!msg.accept, 'paz'); break; }
    case 'resp_ajuda': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'game') return;
      const idx = room.proposals.findIndex(pr => pr.from === msg.from && pr.kind === 'ajuda');
      if (idx === -1) return;
      const from = room.players.find(x => x.id === msg.from);
      if (!from || !from.alive || !player.alive || player.money < 200) { broadcast(room); return; }
      room.proposals.splice(idx, 1);
      player.money -= 200; from.money += 200;
      from.emergencyUntil = 0;
      from.aprov = Math.min(100, from.aprov + 2); player.aprov = Math.min(100, player.aprov + 2);
      bumpRel(player, from, 15);
      log(room, `🤝 ${cname(player)} atende ao pedido de ajuda de ${cname(from)} ($200, emergência encerrada)!`);
      broadcast(room);
      break;
    }
    case 'resp_comercial': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'game') return; respondProposal(room, player, msg.from, !!msg.accept, 'comercial'); break; }
    case 'voto_un': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'game' || !room.un || !player.alive) return;
      if (room.un.votes[player.id] != null) return;
      room.un.votes[player.id] = !!msg.accept;
      log(room, `${cname(player)} votou ${msg.accept ? 'A FAVOR' : 'CONTRA'} na ONU.`);
      const alive = room.players.filter(p => p.alive);
      if (alive.every(p => room.un.votes[p.id] != null)) resolveUN(room); else broadcast(room);
      break;
    }
    case 'fim_turno': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'game' || player.id !== room.hostId) return; resolveTurn(room); break; }
    case 'chat': {
      const { room, player } = conn.meta || {};
      if (!room) return;
      const text = String(msg.text || '').slice(0, 200).trim();
      if (!text) return;
      const c = COUNTRY_BY_ID[player.country];
      for (const p of room.players) if (p.conn && p.connected) p.conn.send({ t: 'chat', from: player.name, flag: c ? c.flag : '🏳️', text });
      break;
    }
  }
}
function handleClient(conn) {
  conn.onMessage = text => {
    let msg; try { msg = JSON.parse(text); } catch (e) { return; }
    if (!msg || typeof msg !== 'object') return;
    try { route(conn, msg); } catch (e) { console.error('route error:', e); }
  };
  conn.onClose = () => handleDisconnect(conn);
}

/* ---------------- HTTP ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/healthz' || url.pathname === '/health') { res.writeHead(200); return res.end('ok'); }
  const fp = path.normalize(path.join(PUBLIC_DIR, url.pathname === '/' ? '/index.html' : url.pathname));
  if (!fp.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('403'); }
  fs.readFile(fp, (e, data) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
});
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acceptKey(key) + '\r\n\r\n');
  socket.resume();
  handleClient(new WSConn(socket));
});
server.listen(PORT, '0.0.0.0', () => console.log(`🏛️ Presidente Online (VERSÃO TOTAL) em http://0.0.0.0:${PORT}`));
