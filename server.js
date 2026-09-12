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
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
/* ===== tempo real: 1 dia = 1 segundo em 1x; semana = 7 dias ===== */
const DAY_DIV = 7;            // economia diária = valores semanais / 7
const WEEK_DAYS = 7;          // dias por semana (ciclo estratégico)
const dayMsFor = mul => Math.round(3000 / ([1, 2, 3, 5].includes(mul) ? mul : 1));
const buildDays = (cost, p) => {                       // dias p/ concluir obra (varia por construção)
  let d = Math.min(30, Math.max(4, 3 + Math.round(cost / 40)));
  const lp = p ? leiProd(p) : null;                    // FASE 396: leis de produção encurtam a obra
  if (lp) d = Math.round(d * lp.obraPct) + lp.obraFixo;
  return Math.max(1, Math.min(30, d));
};
function restartDayTimer(room){ if (room.timer){ try{ clearInterval(room.timer); }catch{} } room.timer = setInterval(() => dayTick(room), room.dayMs || 1000); }
function ensureDayTimer(room){ if (room.phase === 'game' && !room.paused && !room.timer) restartDayTimer(room); }
const AP_PER_TURN = 4;
// limite real de jogadores humanos por sala (o mapa só tem 30 posições para nações novas)
const MAX_PLAYERS = 12;
// um jogador desconectado fica esse tempo na partida antes de ser dado como desertor
const ABANDON_MS = 10 * 60 * 1000;
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
const FLAGS_ALLOWED = ['🏳️','🦅','🐺','🦁','🐉','🐻','⭐','☀️','🌙','🔥','❄️','🌊','⚡','🛡️','⚔️','🌹','🌻','🍀','💎','🏴','🚩','👑','🕊️','🎌','🐯','🐆','🦈','🐍','🦉','🦚','🐢','🐙','🦀','🐊','🦒','🦩','🦜','🐼','🦘','🌵','🌴','🌍','🔱','⚓','🚀','🛸','♛','⚜️'];
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
  eco: { tec: { name: 'Tecocrata', desc: '+10% renda' }, pop: { name: 'Populista', desc: '+1 aprovação/turno, -5% renda' }, ind: { name: 'Industrialista', desc: '+20% renda de prédios' } },
  def: { fal: { name: 'Falcão', desc: '+10% ataque' }, estr: { name: 'Estrategista', desc: '+10% defesa' }, pac: { name: 'Pacifista', desc: '+2 aprovação/semana, -10% renda' } },
  dip: { neg: { name: 'Negociador', desc: 'diplomacia -50% custo' }, inf: { name: 'Influenciador', desc: '+1 influência/turno' }, esp: { name: 'Mestre-Espião', desc: '+10% sabotagem' }, cul: { name: 'Culturalista', desc: 'festival -50%, +1 doutrina/sem' } },
  soc: { art: { name: 'Artista', desc: '+1 aprovação/turno' }, atl: { name: 'Atleta', desc: '+5% renda' }, mec: { name: 'Mecenas', desc: '+1 influência/dia' } },
};
// Cinco árvores de desenvolvimento, 25 tecnologias cada, 5 níveis.
// Custos por nível medidos nas capturas do MA3: 50 / 99 / 198 / 396 / 797.
const TECH_COSTS = [50, 99, 198, 396, 797];
const TECH_MAX = 5;
const TECH_TREES = [
  ['economia',    '🏭 Economia'],
  ['combate',     '⚔️ Combate'],
  ['diplomacia',  '🤝 Diplomacia'],
  ['exploracao',  '🧭 Exploração'],
  ['espacial',    '🚀 Espacial'],
];
// [id, nome, efeito-resumo]
const TECHS = {
  /* ---------- ECONOMIA ---------- */
  serraria:      ['ec','Serraria',                    '+madeira'],
  mina_ouro_t:   ['ec','Mina de Ouro',                '+ouro'],
  mina_ferro:    ['ec','Mina de Ferro',               '+minério'],
  usina_concreto:['ec','Usina de Concreto',           '+concreto'],
  torre_petroleo:['ec','Torre de Petróleo',           '+petróleo'],
  mina_uranio_t: ['ec','Mina de Urânio',              '+urânio'],
  metais_raros:  ['ec','Fábrica de Metais Raros',     '+terras raras'],
  borracha:      ['ec','Fábrica de Borracha',         '+borracha'],
  usina_termica: ['ec','Usina Térmica',               '+energia'],
  usina_hidro:   ['ec','Usina Hidrelétrica',          '+energia limpa'],
  usina_nuclear: ['ec','Usina Nuclear',               '+energia (alta)'],
  energia_alt:   ['ec','Energia Alternativa',         '+energia limpa'],
  padaria:       ['ec','Padaria',                     '+alimentos'],
  estufa:        ['ec','Estufa',                      '+alimentos'],
  fazenda_gado:  ['ec','Fazenda de Gado',             '+alimentos'],
  mineral:       ['ec','Fábrica de Água Mineral',     '+alimentos'],
  acucar:        ['ec','Fábrica de Açúcar',           '+alimentos'],
  siderurgica:   ['ec','Siderúrgica',                 '+bens militares'],
  estaleiro:     ['ec','Estaleiro Naval',             '+bens militares'],
  motores:       ['ec','Fábrica de Motores',          '+bens militares'],
  maquinas:      ['ec','Fábrica de Máquinas',         '+bens militares'],
  infra:         ['ec','Melhorias de Infraestrutura', 'obras mais rápidas'],
  tolerancia:    ['ec','Tolerância Fiscal',           '+arrecadação'],
  valor_agreg:   ['ec','Valor Agregado',              '+receita de venda'],
  condicoes:     ['ec','Condições Favoráveis',        '+produção geral'],
  /* ---------- COMBATE ---------- */
  escola_oficiais:['cb','Escola de Oficiais de Infantaria', '+ataque infantaria'],
  orientacao:     ['cb','Sistema de Orientação a Laser',    '+precisão'],
  exoesqueleto:   ['cb','Exoesqueleto',                     '+defesa infantaria'],
  canhao_122:     ['cb','Uso de Canhões 122 mm',            '+ataque artilharia'],
  canhao_152:     ['cb','Uso de Canhões 152 mm',            '+ataque artilharia'],
  canhao_23:      ['cb','Uso de Canhões 23 mm',             '+defesa antiaérea'],
  cruzeiro:       ['cb','Precisão de Mísseis de Cruzeiro',  '+ataque aviação'],
  bombardeio:     ['cb','Programa de Bombardeio',           '+ataque aviação'],
  hipersonicos:   ['cb','Mísseis Hipersônicos',             '+ataque (forte)'],
  base_neutra:    ['cb','Ativação de Base em Zona Neutra',  '+projeção'],
  escudos:        ['cb','Instalação de Escudos Antichoque', '+defesa'],
  torpedos:       ['cb','Tubos de Torpedo',                 '+ataque frota'],
  sinalizacao:    ['cb','Conjunto de Sinalização Náutica',  '+defesa frota'],
  carboneto:      ['cb','Blindagem de Carboneto de Tungstênio','+defesa blindados'],
  carga:          ['cb','Aumentar a Carga Levantada',       '+capacidade'],
  balisticos:     ['cb','Mísseis Balísticos',               '+ataque nuclear'],
  interceptadores:['cb','Instalação de Mísseis Interceptadores','defesa antiaérea'],
  centro_pesq:    ['cb','Centro de Pesquisa Militar Estratégica','+pesquisa'],
  recrutamento:   ['cb','Recrutamento de Oficiais de Alto Escalão','+treino'],
  contraintelig:  ['cb','Divisão de Contrainteligência',    'contra-espionagem'],
  sabotagem:      ['cb','Tecnologia Avançada de Sabotagem', '+sabotagem'],
  saboteurs:      ['cb','Equipar Saboteurs',                '+sabotagem'],
  logistica:      ['cb','Melhoria da Logística',            '+movimento'],
  planejamento:   ['cb','Centro de Planejamento',           '+AP'],
  treino:         ['cb','Campo de Treino Avançado',         '+treino'],
  /* ---------- DIPLOMACIA ---------- */
  beneficios_emb: ['dp','Benefícios para a Embaixada', '+relações'],
  relacoes_int:   ['dp','Relações Internacionais',     '+relações'],
  ao_que_interessa:['dp','Vamos ao que Interessa',     '+negociação'],
  evite_problemas:['dp','Evite Problemas',             '-crise'],
  forme_maioria:  ['dp','Forme Maioria',               '+voto na ONU'],
  dominante:      ['dp','Politicamente Dominante',     '+influência'],
  politica_ext:   ['dp','Política Externa',            '+relações'],
  influencia_cult:['dp','Influência Cultural',         '+influência'],
  negociador:     ['dp','Negociador',                  'acordos melhores'],
  respeitado:     ['dp','Respeitado e Temido',         '+relações, +ameaça'],
  mobilizacao:    ['dp','Mobilização Precoce',         '+reação a guerra'],
  periodo_paz:    ['dp','Período de Paz',              '+aprovação'],
  confianca:      ['dp','Relações de Confiança',       '+alianças'],
  pegue_melhor:   ['dp','Pegue o Melhor',              '+contratos'],
  boas_maneiras:  ['dp','Boas Maneiras',               '+relações'],
  academia:       ['dp','Academia Nacional de Ciências','+pesquisa'],
  medicamento:    ['dp','Medicamento Grátis',          '+aprovação'],
  vencedores:     ['dp','Os Vencedores Escrevem a História','+prestígio'],
  estado_direito: ['dp','Estado de Direito',           '+aprovação'],
  recepcao:       ['dp','Uma Recepção Calorosa',       '+relações'],
  tradicoes:      ['dp','Tradições Compartilhadas',    '+fe'],
  devido_respeito:['dp','Devido Respeito',             '+relações'],
  banquetes:      ['dp','Grandes Banquetes',           '+relações'],
  centro_tur:     ['dp','Centro Turístico',            '+turismo'],
  solucao:        ['dp','Solução Necessária',          'resolve crises'],
  /* ---------- EXPLORAÇÃO ---------- */
  cartografia:    ['ex','Cartografia Avançada',        '+visão de mapa'],
  satelite:       ['ex','Satélite de Observação',      '+visão'],
  radar:          ['ex','Rede de Radar',               '+detecção'],
  sonar:          ['ex','Sonar de Profundidade',       '+detecção naval'],
  geodesia:       ['ex','Geodesia',                    '+depósitos'],
  prospeccao:     ['ex','Prospecção Geológica',        '+depósitos'],
  perfuracao:     ['ex','Perfuração Profunda',         '+petróleo'],
  antartica:      ['ex','Explore a Antártica',         '+território'],
  florestal:      ['ex','Gestão Florestal',            '+madeira'],
  pesqueira:      ['ex','Frota Pesqueira',             '+alimentos'],
  dessalinizacao: ['ex','Dessalinização',              '+água'],
  agricultura:    ['ex','Agricultura Intensiva',       '+alimentos'],
  adubos:         ['ex','Fábrica de Aditivos Nutricionais','+alimentos'],
  processados:    ['ex','Fábrica de Alimentos Processados','+alimentos'],
  premium:        ['ex','Fábrica de Alimentos Premium','+alimentos'],
  doces:          ['ex','Fábrica de Doces',            '+alimentos'],
  mina_sal:       ['ex','Mina de Sal',                 '+alimentos'],
  jardim:         ['ex','Jardim',                      '+alimentos'],
  rodovia:        ['ex','Rodovia',                     '+infra'],
  ferrovia:       ['ex','Linha Ferroviária',           '+infra'],
  metro:          ['ex','Metrô',                       '+infra'],
  aeroporto:      ['ex','Aeroporto',                   '+infra'],
  porto:          ['ex','Porto',                       '+infra'],
  heliporto:      ['ex','Heliporto',                   '+infra'],
  terminal:       ['ex','Terminal Intercontinental',   '+infra'],
  /* ---------- ESPACIAL ---------- */
  foguete:        ['sp','Programa de Foguetes',        'base espacial'],
  satelite_esp:   ['sp','Satélite Artificial',         '+visão'],
  modulo:         ['sp','Módulo Orbital',              'missão tripulada'],
  estacao:        ['sp','Estação Orbital',             '+pesquisa'],
  sonda_lunar:    ['sp','Sonda Lunar',                 'explora a Lua'],
  lua:            ['sp','Pouso na Lua',                '+prestígio'],
  base_lunar:     ['sp','Base Lunar',                  'presença permanente'],
  sonda_marte:    ['sp','Sonda Marciana',              'explora Marte'],
  marte:          ['sp','Missão a Marte',              '+prestígio'],
  colonia_marte:  ['sp','Colônia em Marte',            '+prestígio'],
  sonda_jupiter:  ['sp','Sonda a Júpiter',             'explora Júpiter'],
  jupiter:        ['sp','Missão a Júpiter',            '+prestígio'],
  telescopio:     ['sp','Telescópio Espacial',         '+pesquisa'],
  Plutao:         ['sp','Sonda a Plutão',              'explora Plutão'],
  minerio_esp:    ['sp','Mineração de Asteroides',     '+recursos'],
  energia_solar:  ['sp','Energia Solar Orbital',       '+energia'],
  defesa_esp:     ['sp','Defesa Planetária',           'contra asteroides'],
  propulsao:      ['sp','Propulsão Avançada',          'missões rápidas'],
  criogenia:      ['sp','Criogenia',                   'missões longas'],
  ia:             ['sp','Inteligência Artificial',     '+geral'],
  colonia_orb:    ['sp','Colônia Orbital',             '+população'],
  elevador:       ['sp','Elevador Espacial',           'lançamento barato'],
  warp:           ['sp','Pesquisa de Dobra',           'naves interestelares'],
  primeira_luz:   ['sp','Primeira Luz',                '+prestígio'],
  federacao:      ['sp','Federação Planetária',        'vitória diplomática'],
};
function techTree(k){ const t = TECHS[k]; return t ? t[0] : null; }
function techName(k){ const t = TECHS[k]; return t ? t[1] : k; }
function techDesc(k){ const t = TECHS[k]; return t ? t[2] : ''; }
function techCost(lvl){ return TECH_COSTS[Math.min(lvl, TECH_COSTS.length - 1)] || 999; }
function techLevel(p, k){ return (p.techLv && p.techLv[k]) || 0; }
const SECTORS = [
  ['educacao', 'Educação'], ['saude', 'Saúde'], ['cultura', 'Cultura'],
  ['esportes', 'Esportes'], ['habitacao', 'Habitação'], ['justica', 'Justiça'], ['turismo', 'Turismo'],
  ['infraestrutura', 'Infraestrutura'], ['ciencia', 'Ciência'],
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
const SPACE_COSTS = [500, 800, 1200, 2000, 3500];
const UN_TYPES = [
  { id: 'proibir_guerra', desc: 'Proibição de novas declarações de guerra por 3 turnos' },
  { id: 'proibir_armas',  desc: 'Proibição de recrutamento militar por 3 turnos' },
  { id: 'embargo',        desc: 'Embargo econômico contra {T} por 3 turnos' },
  { id: 'condenar',       desc: 'Condenação internacional de {T} (-6 aprovação)' },
  { id: 'manter_paz',    desc: 'Missão de paz: encerrar todas as guerras de {T}' },
  { id: 'bloqueio',       desc: 'Bloqueio total contra {T} por 3 turnos (renda -50%)' },
  { id: 'embargo_armas', desc: 'Embargo de armas contra {T} por 3 turnos (sem novas unidades)' },
  { id: 'ajuda_humanitaria', desc: 'Ajuda humanitária a {T} (+$500, +5 aprovação)' },
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
    // cliente aceita frames de estado comprimidos com gzip (negociado via ?gz=1)
    this.gz = false;
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
  // envia JSON já serializado (sem re-serializar) — usado pelo broadcast
  sendText(json) { if (this.closed) return; try { this.socket.write(encodeFrame(json)); } catch (e) { this._close(); } }
  sendBinary(buf) { if (this.closed) return; try { this.socket.write(encodeFrame(buf, 0x2)); } catch (e) { this._close(); } }
  close() { this._close(); }   /* FASE 400: o route chamava conn.close() (inexistente) -> TypeError silencioso */
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
    code: makeCode(), phase: 'lobby', turn: 0, day: 1, dayMs: 3000, speedMul: 1, timerEnd: 0, speed: 45,
    players: [], hostId: null, proposals: [], log: [], winner: null, timer: null,
    un: null, noWarUntil: 0, noArmsUntil: 0, embargo: null, paused: false, pausedRemaining: 0, era: 1, timeline: [],
    world: COUNTRIES.slice(), market: { comida: 8, minerio: 12, energia: 10, concreto: 10, madeira: 7, terras_raras: 20, uranio: 25, borracha: 14, carne: 11 }, missionIdx: 0, warAuth: null, paused: false, pausedRemaining: 0,
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

/* ===== jogo salvo ===== */
const SAVE_DIR = require('path').join(__dirname, 'saves');
function savePath(code){ return require('path').join(SAVE_DIR, String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'') + '.json'); }
function salvarJogo(room){
  try {
    const fs = require('fs');
    if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });
    // conn/timer nao serializam: sao reconstruidos no carregamento
    const snap = JSON.stringify(room, (k, v) => (k === 'conn' || k === 'timer' || k === 'sock') ? undefined : v);
    fs.writeFileSync(savePath(room.code), snap);
    return true;
  } catch (e) { console.error('salvarJogo:', e.message); return false; }
}
function carregarJogo(code){
  try {
    const fs = require('fs');
    const p = savePath(code);
    if (!fs.existsSync(p)) return null;
    const room = JSON.parse(fs.readFileSync(p, 'utf8'));
    room.timer = null; room.timerEnd = 0;
    room.paused = true;               // volta pausado
    if (!room.day) room.day = 1;
    if (!room.dayMs) room.dayMs = 1000;
    for (const pl of (room.players || [])) for (const b of (pl.builds || [])) if (b.untilDay == null) b.untilDay = room.day + 1;
    for (const pl of room.players) pl.conn = null;
    // rooms e um Map, mas aceita os dois para nao quebrar se mudar
    if (typeof rooms.set === 'function') rooms.set(room.code, room); else rooms[room.code] = room;
    return room;
  } catch (e) { console.error('carregarJogo:', e.message); return null; }
}
function temSave(code){ try { return require('fs').existsSync(savePath(code)); } catch { return false; } }

function floorRec(rec){ const o = {}; for (const k of ['comida','minerio','energia','concreto','madeira','terras_raras','uranio','borracha','carne']) o[k] = Math.floor((rec && rec[k]) || 0); return o; }
function snapshot(room) {
  return {
    t: 'state', phase: room.phase, code: room.code, turn: room.turn, day: room.day || 1,
    winner: room.winner,
    suprema: room.suprema || null,
    log: room.log.slice(0, 60), proposals: room.proposals,
    un: room.un, noWarUntil: room.noWarUntil, noArmsUntil: room.noArmsUntil, embargo: room.embargo, inverno: room.invernoUntil || 0, era: room.era || 1, timeline: room.timeline || [],
    players: room.players.map(p => ({
      id: p.id, name: p.name, country: p.country, color: p.color,
      money: Math.round(p.money), eco: p.eco, mil: p.mil, aprov: Math.round(p.aprov), ap: p.ap,
      alive: p.alive, allies: p.allies, connected: p.connected,
      isHost: p.id === room.hostId, reason: p.eliminatedReason,
      nuclear: p.nuclear, influencia: Math.round(p.influencia), fe: Math.round(p.fe), wars: p.wars, abrigo: !!p.abrigo,
      inflacao: Math.round(p.inflacao || 0),
      provinces: p.provinces, sanctioning: p.sanctioning, sanctionedBy: p.sanctionedBy,
      orgs: p.orgs || [], taxRate: p.taxRate, taxes: p.taxes || {corp:10, rend:10, prod:10, amb:5}, budget: p.budget || {exe:1, int:1, tra:1, edu:1, ambm:1}, debt: p.debt, ideology: p.ideology, religion: p.religion,
      ministers: p.ministers, techs: p.techs, techLv: p.techLv || {}, sectors: p.sectors, space: p.space, pollution: Math.round(p.pollution != null ? p.pollution : 10),
      relations: p.bot ? {} : p.relations, embassies: p.embassies, trades: p.trades,
      blockading: p.blockading, blockadedBy: p.blockadedBy,
      units: p.units, builds: p.builds, emergencyUntil: p.emergencyUntil, leis: p.leis, crise: p.crise || null,
      pop: Math.round(p.pop), rec: floorRec(p.rec), xp: p.xp, bot: p.bot, customName: p.customName, customFlag: p.customFlag,
      persona: p.persona || null, ciencia: p.ciencia || 0,
      pib: p.pib || pibOf(p), empregos: p.empregos || empregosOf(p),
      pibDetalhe: pibDetalhe(p), histRel: (p.histRel && typeof p.histRel === 'object') ? p.histRel : {},
      deltas: p.deltas || {}, estadoVisual: p.estadoVisual || [],
      coalizao: p.coalizao || null, riscoProtesto: Math.round(riscoProtesto(p) * 100),
      suprimento: p.suprimento != null ? p.suprimento : Math.round(taxaSuprimento(p) * 100),
      pressao: pressaoPolitica(p), grupos: gruposPoliticos(p),
      dailyIncome: Math.round(incomeOf(room, p) / DAY_DIV),
      buildings: p.buildings, stats: p.stats, famine: p.famine, blackout: p.blackout,
      depositos: p.depositos || [], upgrades: p.upgrades || {}, pacts: p.pacts || {},
      seguranca: p.seguranca || { defesa: 0, secreto: 0, policia: 0, guarda: 0 }, espioes: p.espioes || 0, spyShieldUntil: p.spyShieldUntil || 0,
    })),
    world: room.world, market: room.market, mission: MISSIONS[room.missionIdx % MISSIONS.length], missionIdx: room.missionIdx, paused: room.paused, speedMul: room.speedMul || 1, temSave: temSave(room.code),
  };
}
function broadcast(room) {
  const base = snapshot(room);
  let text = null, gz = null;
  for (const p of room.players) {
    if (!p.conn || !p.connected) continue;
    p.conn.send({ t: 'you', you: p.id });
    if (p.conn.gz) {
      if (!gz) {
        if (text === null) text = JSON.stringify(base);
        gz = zlib.gzipSync(Buffer.from(text), { level: 6 });
      }
      p.conn.sendBinary(gz);
    } else {
      if (text === null) text = JSON.stringify(base);
      p.conn.sendText('{"you":"' + p.id + '",' + text.slice(1));
    }
  }
}
/* atualização leve diária: dia + números de cada jogador (sem re-render pesado) */
function broadcastDay(room) {
  /* FASE 388/389/384: o payload diário também carrega o que a UI nova precisa.
     Sem isso, deltas, estados de crise e feed ficavam presos no servidor. */
  const light = { t: 'day', day: room.day, turn: room.turn, phase: room.phase,
    feed: room.feed || [],
    players: room.players.map(p => ({ id: p.id, money: Math.round(p.money), eco: p.eco, mil: p.mil,
      aprov: Math.round(p.aprov), ap: p.ap, alive: p.alive, pop: Math.round(p.pop),
      nuclear: p.nuclear, influencia: Math.round(p.influencia), fe: Math.round(p.fe),
      rec: floorRec(p.rec), builds: p.builds,
      pib: p.pib || pibOf(p), empregos: p.empregos || empregosOf(p),
      suprimento: p.suprimento != null ? p.suprimento : Math.round(taxaSuprimento(p) * 100),
      deltas: p.deltas || {}, estadoVisual: p.estadoVisual || [],
      coalizao: p.coalizao || null, riscoProtesto: Math.round(riscoProtesto(p) * 100) })) };
  const msg = JSON.stringify(light);
  for (const p of room.players) {
    if (!p.conn || !p.connected) continue;
    try { p.conn.sendText(msg); } catch {}
  }
}
function err(conn, msg) { if (conn) conn.send({ t: 'error', msg }); }
function info(conn, msg) { if (conn) conn.send({ t: 'info', msg }); }

function addPlayer(room, conn, name, isHost) {
  const p = {
    id: 'p' + (playerSeq++), conn, name, country: null, color: (playerSeq + 5) % 12,
    // segredo que permite reassumir este jogador depois de uma queda de conexão
    token: crypto.randomBytes(9).toString('base64url'), disconnectedAt: 0,
    money: 0, eco: 0, mil: 0, aprov: 50, ap: AP_PER_TURN, alive: true,
    allies: [], connected: true, eliminatedReason: null,
    nuclear: 0, influencia: 0, fe: 0, provinces: [], wars: [], abrigo: false, inflacao: 0,
    sanctioning: [], sanctionedBy: [],
    taxRate: 1, taxes: {corp:10, rend:10, prod:10, amb:5}, budget: {exe:1, int:1, tra:1, edu:1, ambm:1}, debt: 0, ideology: null, religion: 'laico',
    customName: null, customFlag: '🏳️', bot: false, pop: 0, rec: { comida: 0, minerio: 0, energia: 0, concreto: 25, madeira: 0, terras_raras: 12, uranio: 0, borracha: 0, carne: 0 },
    xp: 0, blackout: false, depositos: [], upgrades: {}, pacts: {},
    buildings: { fazenda: 0, mina: 0, usina: 0, petroleo: 0, fabrica: 0, serraria: 0, mina_ouro: 0, estrada: 0, base: 0, mina_rara: 0, adubo: 0, mina_uranio: 0, solar: 0, eolica: 0 }, stats: { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0, anexacoes: 0, ajuda: 0, mandatos: 0, conversoes: 0, doutrinacoes: 0, titulos: 0 }, famine: false,
    ministers: { eco: null, def: null, dip: null, soc: null },
    techs: [], techLv: {}, sectors: { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0, infraestrutura: 0, ciencia: 0 },
    space: 0, relations: {}, embassies: [], trades: [], blockading: [], blockadedBy: [],
    units: { blindados: 0, aviacao: 0, frota: 0, infantaria: 0, artilharia: 0, submarinos: 0, porta_avioes: 0, fuzileiros: 0, defesa_aerea: 0 }, builds: [], emergencyUntil: 0, leis: [],
    seguranca: { defesa: 0, secreto: 0, policia: 0, guarda: 0 },
    espioes: 1,
  };
  conn.meta = { room, player: p };
  room.players.push(p);
  if (isHost) room.hostId = p.id;
  return p;
}

/* ---------------- Fluxo ---------------- */
/* FASE 400 — PERSONALIDADE DA IA: cada bot nasce com um perfil que muda suas
   prioridades (guerra, militar, economia, ciência, diplomacia, defesa).
   Os bots obedecem às mesmas regras do mundo — a persona só redireciona o gasto. */
const PERSONAS = {
  expansionista: { nome: 'Expansionista', guerra: 1.9, mil: 1.4, eco: 0.8,  def: 0.6 },
  economico:     { nome: 'Econômico',     guerra: 0.4, mil: 0.7, eco: 1.8,  def: 0.8 },
  militarista:   { nome: 'Militarista',   guerra: 1.5, mil: 1.9, eco: 0.7,  def: 1.0 },
  diplomatico:   { nome: 'Diplomático',   guerra: 0.2, mil: 0.6, eco: 1.0,  def: 0.8 },
  cientifico:    { nome: 'Científico',    guerra: 0.5, mil: 0.8, eco: 0.9,  def: 0.8 },
  defensivo:     { nome: 'Defensivo',     guerra: 0.15, mil: 1.1, eco: 1.0, def: 2.0 },
  oportunista:   { nome: 'Oportunista',   guerra: 1.7, mil: 1.1, eco: 1.0,  def: 0.7 },
};
const PERSONA_KEYS = Object.keys(PERSONAS);
function personaOf(id) { let h = 0; for (const ch of String(id) + 'x') h = (h * 31 + ch.charCodeAt(0)) % 997; return PERSONA_KEYS[h % PERSONA_KEYS.length]; }
function makeAIBot(c) {
  let h = 0; for (const ch of c.id + 'x') h = (h * 31 + ch.charCodeAt(0)) % 997;
  return {
    id: c.id, name: c.name, country: c.id, bot: true, conn: null, connected: true, color: 0,
    persona: personaOf(c.id),
    customName: null, customFlag: null, isHost: false,
    money: 10000, eco: 3 + (h % 4), mil: 3 + ((h >> 2) % 4), pop: 0, rec: { comida: 0, minerio: 0, energia: 0, concreto: 25, madeira: 0, terras_raras: 12, uranio: 0, borracha: 0, carne: 0 }, xp: 0, blackout: false, depositos: depositosOf(c.id), upgrades: {}, pacts: {},
    aprov: 50, ap: AP_PER_TURN, alive: true, allies: [], eliminatedReason: null,
    nuclear: 0, influencia: 0, fe: 0, wars: [], abrigo: false, inflacao: 0,
    provinces: [{ name: c.name, infra: 1, owner: c.id, origem: c.id }],
    sanctioning: [], sanctionedBy: [], taxRate: 1, taxes: {corp:10, rend:10, prod:10, amb:5}, budget: {exe:1, int:1, tra:1, edu:1, ambm:1}, debt: 0, ideology: null, religion: 'laico',
    ministers: { eco: null, def: null, dip: null, soc: null },
    techs: [], techLv: {}, sectors: { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0, infraestrutura: 0, ciencia: 0 },
    space: 0, relations: {}, embassies: [], trades: [], blockading: [], blockadedBy: [],
    units: { blindados: 0, aviacao: 0, frota: 0, infantaria: 0, artilharia: 0, submarinos: 0, porta_avioes: 0, fuzileiros: 0, defesa_aerea: 0 },
    builds: [], emergencyUntil: 0, leis: [],
    buildings: { fazenda: 0, mina: 0, usina: 0, petroleo: 0, fabrica: 0, serraria: 0, mina_ouro: 0, estrada: 0, base: 0, mina_rara: 0, adubo: 0, mina_uranio: 0, solar: 0, eolica: 0 }, stats: { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0, anexacoes: 0, ajuda: 0, mandatos: 0, conversoes: 0, doutrinacoes: 0, titulos: 0 }, famine: false,
    ideology: Object.keys(IDEOLOGIES)[h % 6], religion: Object.keys(RELIGIONS)[h % 5],
    seguranca: { defesa: h % 2, secreto: (h >> 1) % 2, policia: (h >> 2) % 3, guarda: (h >> 3) % 2 },
    espioes: 1,
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
    p.money = 10000; p.eco = 3; p.mil = 3; p.pop = 0; p.rec = { comida: 0, minerio: 0, energia: 0, concreto: 25, madeira: 0, terras_raras: 12, uranio: 0, borracha: 0, carne: 0 }; p.xp = 0; p.blackout = false;
    p.depositos = depositosOf(cid); p.upgrades = {}; p.pacts = {};
    p.buildings = { fazenda: 0, mina: 0, usina: 0, petroleo: 0, fabrica: 0, serraria: 0, mina_ouro: 0, estrada: 0, base: 0, mina_rara: 0, adubo: 0, mina_uranio: 0, solar: 0, eolica: 0 }; p.stats = { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0, anexacoes: 0, ajuda: 0, mandatos: 0, conversoes: 0, doutrinacoes: 0, titulos: 0 }; p.famine = false;
    p.aprov = 50; p.ap = AP_PER_TURN; p.alive = true;
    p.allies = []; p.eliminatedReason = null; p.nuclear = 0; p.influencia = 0; p.fe = 0; p.wars = []; p.abrigo = false; p.inflacao = 0;
    p.provinces = [{ name: 'Capital de ' + nat.name, infra: 1, owner: p.id, origem: p.id }];
    p.sanctioning = []; p.sanctionedBy = []; p.crise = null; p.lastCrisis = 0; p.lastTeste = 0;
    p.taxRate = 1; p.taxes = {corp:10, rend:10, prod:10, amb:5}; p.budget = {exe:1, int:1, tra:1, edu:1, ambm:1}; p.debt = 0; p.ideology = null; p.religion = 'laico';
    p.ministers = { eco: null, def: null, dip: null };
    p.techs = []; p.techLv = {}; p.sectors = { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0, infraestrutura: 0, ciencia: 0 };
    p.space = 0; p.pollution = 10; p.relations = {}; p.embassies = []; p.trades = []; p.blockading = []; p.blockadedBy = [];
    p.units = { blindados: 0, aviacao: 0, frota: 0, infantaria: 0, artilharia: 0, submarinos: 0, porta_avioes: 0, fuzileiros: 0, defesa_aerea: 0 }; p.builds = []; p.emergencyUntil = 0; p.leis = [];
    p.seguranca = { defesa: 0, secreto: 0, policia: 0, guarda: 0 }; p.espioes = 1;
  });
  for (let i = 0; i < room.players.length; i++) for (let j = i + 1; j < room.players.length; j++) {
    room.players[i].relations[room.players[j].id] = 50; room.players[j].relations[room.players[i].id] = 50;
  }
  for (const c of COUNTRIES) room.players.push(makeAIBot(c));
  room.players.forEach((p, i) => { if (p.bot) p.color = i % 60; });
  room.phase = 'game'; room.turn = 1; room.day = 1; room.proposals = [];
  room.un = null; room.noWarUntil = 20; room.noArmsUntil = 0; room.embargo = null; room.bloqueio = null; room.invernoUntil = 0; room.nukesUsed = 0; room.era = 1; room.timeline = [];
  room.dayMs = dayMsFor(room.speedMul || 1);
  log(room, '🏳️ Cada jogador fundou sua própria nação: $10.000, 0 habitantes, reserva natural de 12⚙️ terras raras — tudo por construir.');
  log(room, `🤖 As ${COUNTRIES.length} nações do mundo estão sob controle da IA. É vocês contra elas!`);
  restartDayTimer(room);
  broadcast(room);
}

function checkEliminations(room) {
  for (const p of room.players) {
    if (!p.alive) continue;
    if (p.provinces.length && ownProvinces(p).length) p.exilio = 0;
    if (p.aprov <= 0 && p.bot) { p.alive = false; p.eliminatedReason = 'Deposto por revolta popular'; }
    else if (p.aprov <= 0) { p.aprov = 30; p.money = Math.round(p.money / 2); log(room, `🔄 ${cname(p)} (${p.name}) REFORMOU o governo após aprovação zerar! (-50% do caixa, o jogo continua)`); }
    else if (p.provinces.length && ownProvinces(p).length === 0 && p.bot) { p.alive = false; p.eliminatedReason = 'Conquista total do território'; }
    else if (p.provinces.length && ownProvinces(p).length === 0 && !p.exilio) { p.exilio = 1; log(room, `⛺ ${cname(p)} (${p.name}) perdeu todo o território — governo no exílio! Reconquiste suas províncias.`); }
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
  // JOGO INFINITO: nunca termina — vitorias viraram MARCOS comemorativos (1x por nacao).
  if (room.phase !== 'game') return;
  if (!room.marcos) room.marcos = {};
  const alive = room.players.filter(p => p.alive);
  const marco = (id, p, txt) => { if (p && !room.marcos[id + '_' + p.id]) { room.marcos[id + '_' + p.id] = 1; log(room, `🏆 MARCO: ${cname(p)} — ${txt} (o jogo continua: o mundo é infinito!)`); record(room, `🏆 ${cname(p)}: ${txt}`); salvarJogo(room); } };
  if (room.players.length > 1 && alive.length === 1) marco('unica', alive[0], 'última nação de pé — o mundo é seu!');
  marco('eco', alive.find(p => p.eco >= 60), 'hegemonia econômica (economia 60+)');
  marco('ideo', alive.find(p => p.influencia >= 60), 'hegemonia ideológica (doutrina 60+)');
  marco('fe', alive.find(p => p.fe >= 60), 'hegemonia religiosa (fé 60+)');
  marco('convR', alive.find(p => p.religion && p.religion !== 'laico' && alive.filter(o => o.religion === p.religion).length > alive.length / 2), 'sua fé converteu a maioria das nações');
  marco('convI', alive.find(p => p.ideology && alive.filter(o => o.ideology === p.ideology).length > alive.length / 2), 'sua doutrina governa a maioria das nações');
  marco('sociedade', alive.find(p => { const s = p.sectors || {}; return ['educacao','saude','cultura','esportes','habitacao','justica','turismo'].every(k => (s[k] || 0) >= 4); }), 'sociedade perfeita (7 setores Nv4+)');
  /* FASE 401 — vitórias científica e espacial (item 28): integrar ciência/espaço ao sistema de marcos. */
  marco('ciencia', alive.find(p => (p.ciencia || 0) >= 50 || ((p.techs || []).length >= 30)), 'potência científica (50+ ciência ou 30+ tecnologias)');
  marco('espaco', alive.find(p => (p.space || 0) >= 5), 'conquistou o espaço (programa espacial completo)');
  const supM = room.players.length > 1 && alive.length === 1 ? alive[0] : null;
  const supR = alive.find(p => p.religion && p.religion !== 'laico' && alive.length > 1 && alive.every(o => o.religion === p.religion));
  const supI = alive.find(p => p.ideology && alive.length > 1 && alive.every(o => o.ideology === p.ideology));
  const sup = supM || supR || supI;
  if (sup) {
    const tipo = supM ? 'MILITAR' : (supR ? 'RELIGIOSA' : 'IDEOLÓGICA');
    if (!room.marcos['suprema_' + sup.id]) { room.marcos['suprema_' + sup.id] = 1; log(room, `🌟 VITÓRIA SUPREMA ${tipo}: ${cname(sup)} dominou o mundo! (o jogo continua: defenda seu título!)`); record(room, `🌟 ${cname(sup)}: VITÓRIA SUPREMA ${tipo}`); }
    room.suprema = { by: sup.id, name: cname(sup), tipo };
  } else room.suprema = null;
}

// Aparato de segurança interna (nível 0..3 cada). Custo cresce por nível.
const SEG = {
  defesa:  { name: 'Ministério da Defesa', icon: '🛡️', desc: '+8% defesa por nível',              custos: [400, 900, 1800] },
  secreto: { name: 'Serviço Secreto',      icon: '🕵️', desc: 'espionagem mais forte, -12% dano de sabotagem por nível', custos: [350, 800, 1600] },
  policia: { name: 'Polícia',              icon: '🚓', desc: '+1 aprovação por semana por nível',  custos: [300, 700, 1400] },
  guarda:  { name: 'Guarda Nacional',      icon: '🪖', desc: '+6% defesa por nível e menos golpes', custos: [350, 800, 1600] },
};
const LEIS = {
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
};

/* FASE 396 — efeito agregado das leis de produção sobre a economia do jogador.
   Fonte única: mercado, produção diária, consumo de insumo e obras leem daqui. */
function leiProd(p) {
  const L = (p && p.leis) || [];
  const tem = k => L.includes(k);
  return {
    compra: 1 + (tem('lei_compra') ? -0.12 : 0) + (tem('lei_venda') ? 0.06 : 0),
    venda: 1 + (tem('lei_venda') ? 0.12 : 0) + (tem('lei_compra') ? -0.06 : 0),
    volume: 1 + (tem('lei_volume') ? 0.25 : 0) + (tem('lei_ritmo') ? 0.10 : 0),
    insumo: 1 + (tem('lei_volume') ? 0.25 : 0) + (tem('lei_ritmo') ? 0.10 : 0),
    obraCusto: 1 + (tem('lei_mutirao') ? 0.15 : 0),
    obraPct: 1 - (tem('lei_mutirao') ? 0.35 : 0),
    obraFixo: tem('lei_ritmo') ? -1 : 0,
  };
}

function incomeOf(room, p) {
  const prov = ownProvinces(p).reduce((s, pr) => s + pr.infra, 0) * PROV_INCOME;
  /* FASE 365: indústria só rende bem se tiver insumo — cadeia produtiva real */
  const _sup = taxaSuprimento(p);
  let bldMoney = 0;
  for (const k in p.buildings) {
    const n = p.buildings[k] || 0; if (!n) continue;
    const o = BUILD_OUT[k]; if (!o || !o.money) continue;
    let v = n * o.money * upM(p, k) * (p.ministers.eco === 'ind' ? 1.2 : 1);
    if (INSUMOS[k]) v *= (0.30 + 0.70 * _sup);   /* indústria de transformação */
    bldMoney += v;
  }
  let base = p.eco * 10 + prov + Math.floor(p.pop / 8) + bldMoney
    + p.allies.length * 25
    + (p.maravilhas || []).length * 50
    + ((p.depositos || []).includes('ouro') ? 15 : 0)
    - p.embassies.length * 10
    + p.trades.length * 20
    + ((p.sectors && p.sectors.turismo) || 0) * 15
    + (p.space >= 5 ? 130 : p.space >= 4 ? 80 : p.space >= 3 ? 30 : 0)
    + sectorSum(p) * 2
    + relBonus(p);
  base += 20 * techLevel(p, 'valor_agreg');
  /* FASE 365: PIB e empregos alimentam a receita */
  base += Math.round(pibOf(p) / 90);
  /* FASE 368: ministros mexem em vários campos */
  base *= 1 + ministroEfeito(p, 'eco', 'renda') + ministroEfeito(p, 'soc', 'renda') + ministroEfeito(p, 'def', 'renda');
  /* FASE 367: pressão política das leis — país contestado arrecada menos */
  const _press = pressaoPolitica(p);
  if (_press < -12) base *= 0.88;
  else if (_press > 12) base *= 1.06;
  if (p.leis.includes('reforma_agraria')) base += 10;
  if (p.leis.includes('abertura_comercial')) base += 10;
  if (p.leis.includes('zona_franca')) base += 20;
  if (p.budget){ base *= 1 + (p.budget.tra-1)*0.03 + (p.budget.edu-1)*0.02; }
  let mult = 1;
  if (p.ideology === 'democracia') mult += 0.05;
  if (p.ideology === 'comunismo') mult -= 0.10;
  if (p.ministers.eco === 'tec') mult += 0.10;
  if (p.ministers.eco === 'pop') mult -= 0.05;
  if (p.ministers.def === 'pac') mult -= 0.10;
  if (p.ministers.soc === 'atl') mult += 0.05;
  if (p.taxRate === 2) mult += 0.15;
  if (p.taxRate === 0) mult -= 0.10;
  if (room.embargo && room.embargo.target === p.id && room.turn < room.embargo.until) mult *= 0.7;
  if (room.bloqueio && room.bloqueio.target === p.id && room.turn < room.bloqueio.until) mult *= 0.5;
  if (room.turn < (room.invernoUntil || 0)) mult *= 0.9;
  if (p.blockadedBy.length) mult *= p.units.frota >= 1 ? 0.9 : 0.75;
  if (room.turn < p.emergencyUntil) mult *= 0.8;
  base *= mult;
  const costs = Math.round(p.mil * 2) + (p.budget ? (p.budget.exe-1)*40+(p.budget.int-1)*30+(p.budget.tra-1)*30+(p.budget.edu-1)*30+(p.budget.ambm-1)*20 : 0)
    + p.sanctionedBy.length * 50
    + p.sanctioning.length * 20
    + p.blockading.length * 15
    + Math.round(p.debt * 0.05);
  return Math.round(base - costs);
}

function resolveUN(room) {
  if (!room.un) return;
  const u = room.un;
  if (u.vetoedBy) { const vt = room.players.find(pp => pp.id === u.vetoedBy); log(room, `🛡️ ${cname(vt)} VETOU a resolução no Conselho de Segurança!`); room.un = null; checkEliminations(room); broadcast(room); return; }
  const yes = Object.values(u.votes).filter(v => v).length;
  const prop = u.proposer ? room.players.find(pp => pp.id === u.proposer) : null;
  const bonusVoto = ((prop && prop.influencia >= 40) ? 1 : 0) + ((prop && (room.cs || []).includes(prop.id)) ? 1 : 0);
  const no = Object.values(u.votes).filter(v => !v).length;
  const passed = (yes + bonusVoto) > no;
  const tgt = u.target ? room.players.find(p => p.id === u.target) : null;
  if (bonusVoto) log(room, `🕊️ Soft power de ${cname(prop)} pesou na votação (+1 voto).`);
  if (passed) {
    if (u.type === 'proibir_guerra') { room.noWarUntil = room.turn + 3; log(room, '🇺 A ONU APROVOU: proibição de novas guerras por 3 semanas!'); }
    if (u.type === 'proibir_armas') { room.noArmsUntil = room.turn + 3; log(room, '🇺 A ONU APROVOU: proibição de recrutamento por 3 semanas!'); }
    if (u.type === 'embargo' && tgt) { room.embargo = { target: tgt.id, until: room.turn + 3 }; log(room, `🇺🇳 A ONU APROVOU embargo econômico contra ${cname(tgt)}!`); }
    if (u.type === 'bloqueio' && tgt) { room.bloqueio = { target: tgt.id, until: room.turn + 3 }; log(room, `🇺🇳 A ONU APROVOU BLOQUEIO TOTAL contra ${cname(tgt)} (renda -50% por 3 semanas)!`); }
    if (u.type === 'embargo_armas' && tgt) { room.armsEmbargo = { target: tgt.id, until: room.turn + 3 }; log(room, `🇺🇳 A ONU APROVOU embargo de ARMAS contra ${cname(tgt)} (sem novas unidades por 3 semanas)!`); }
    if (u.type === 'ajuda_humanitaria' && tgt) { tgt.money += 500; tgt.aprov = Math.min(100, tgt.aprov + 5); log(room, `🇺🇳💙 A ONU enviou AJUDA HUMANITÁRIA a ${cname(tgt)} (+$500, +5❤️)!`); }
    if (u.type === 'condenar' && tgt) { tgt.aprov = Math.max(0, tgt.aprov - 6); log(room, `🇺🇳 A ONU CONDENOU ${cname(tgt)} (-6 aprovação)!`); }
    if (u.type === 'manter_paz' && tgt) {
      const foes = (tgt.wars || []).slice();
      for (const fid of foes) { const f = room.players.find(x => x.id === fid); if (!f) continue;
        tgt.wars = tgt.wars.filter(id => id !== fid); f.wars = (f.wars || []).filter(id => id !== tgt.id);
        tgt.blockading = (tgt.blockading || []).filter(id => id !== fid); f.blockadedBy = (f.blockadedBy || []).filter(id => id !== tgt.id);
        f.blockading = (f.blockading || []).filter(id => id !== tgt.id); tgt.blockadedBy = (tgt.blockadedBy || []).filter(id => id !== fid); }
      log(room, `🇺🇳🕊️ MISSÃO DE PAZ: a ONU encerrou ${foes.length} guerra(s) de ${cname(tgt)}! Capacetes azuis nas fronteiras.`);
    }
    if (u.type === 'autorizar') { room.warAuth = { by: u.proposer, target: u.target, until: room.turn + (u.duracao || 8) }; log(room, `🇺🇳 A ONU AUTORIZOU a intervenção militar! Válido por ${(u.duracao || 8)} semanas.`); }
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
  if (type.id === 'embargo' || type.id === 'condenar' || type.id === 'manter_paz' || type.id === 'bloqueio' || type.id === 'embargo_armas' || type.id === 'ajuda_humanitaria') target = alive[Math.floor(Math.random() * alive.length)];
  room.un = { type: type.id, desc: type.desc.replace('{T}', target ? cname(target) : ''), target: target ? target.id : null, votes: {}, deadline: Date.now() + 20000 };
  log(room, `🇺🇳 Sessão da ONU: ${room.un.desc}. Votação aberta!`);
  for (const b of room.players) if (b.bot && b.alive) {
    if (room.un.target) {
      const tp = room.players.find(x => x.id === room.un.target);
      { const posT = (room.un.type === 'manter_paz' || room.un.type === 'ajuda_humanitaria'); room.un.votes[b.id] = tp ? (posT ? relBetween(b, tp) >= 50 : relBetween(b, tp) < 50) : Math.random() < 0.5; }
    } else room.un.votes[b.id] = Math.random() < 0.5;
  }
}

function dayTick(room) {
  if (room.phase !== 'game' || room.paused) return;
  DIA_ATUAL = room.day;
  if (room.un && Date.now() >= room.un.deadline) resolveUN(room);
  /* FASE 384: feed mundial recalculado uma vez por dia */
  montarFeed(room);
  if (room.phase !== 'game') return;
  room.day++;
  for (const p of room.players) {
    if (!p.alive) continue;
    const done = p.builds.filter(b => (b.untilDay != null ? b.untilDay : room.day) <= room.day);
    p.builds = p.builds.filter(b => (b.untilDay != null ? b.untilDay : room.day) > room.day);
    for (const b of done) {
      if (b.kind === 'infra') { const pr = p.provinces[b.prov]; if (pr && pr.owner === p.id && pr.infra < 5) { pr.infra += 1; log(room, `🏗️ Construção concluída: ${pr.name} (${cname(p)}) infraestrutura ${pr.infra}.`); } }
      if (b.kind === 'nuclear' && p.nuclear < NUKE_MAX_LEVEL) { p.nuclear += 1; log(room, `☢️ ${cname(p)} conclui etapa do programa nuclear (nível ${p.nuclear}).`); }
      if (b.kind === 'espacial' && p.space < 5) { p.space += 1; p.aprov = Math.min(100, p.aprov + 2); log(room, `🚀 ${cname(p)} conclui etapa do programa espacial (nível ${p.space}).`); }
      if (PROD_NAMES[b.kind]) { p.buildings[b.kind] = (p.buildings[b.kind] || 0) + 1; p.stats.construidas++; log(room, `${PROD_NAMES[b.kind]} construíd${b.kind === 'mina' ? 'a' : 'o'} em ${cname(p)}.`); }
      if (b.kind === 'infra' || b.kind === 'nuclear') p.stats.construidas++;
    }
    p.money += incomeOf(room, p) / DAY_DIV;
    if (p.dividas && p.dividas.length) { const due = p.dividas.filter(d => room.day >= d.dia); p.dividas = p.dividas.filter(d => room.day < d.dia); for (const d of due) { const cr = room.players.find(x => x.id === d.to); const pag = Math.min(Math.max(0, p.money), d.valor); p.money -= pag; if (cr && cr.alive) { cr.money += pag; if (pag >= d.valor) { bumpRel(p, cr, 3); log(room, `💸 ${cname(p)} quitou o empréstimo de ${cname(cr)} ($${pag}).`); } else { bumpRel(p, cr, -10); log(room, `⚠️ ${cname(p)} deu CALOTE em ${cname(cr)} (pagou $${pag} de $${d.valor}, −10 relações)!`); } } } }
    if (p.money < 0) { p.money = 0; p.mil = Math.max(1, Math.round(p.mil * 0.9)); }
    // aprovação
    let dAprov = -1;
    if (techLevel(p, 'estado_direito') > 0) dAprov = Math.ceil(dAprov / (1 + techLevel(p, 'estado_direito')));
    dAprov += Math.min(1, Math.floor(sectorSum(p) / 3));
    if (p.ideology === 'autoritarismo') dAprov -= 1;
    if (p.ideology === 'monarquia') dAprov += 1;
    if (p.ministers.eco === 'pop') dAprov += 1;
    if (p.ministers.def === 'pac') dAprov += 2;
    if (p.ministers.soc === 'art') dAprov += 1;
    if (p.taxRate === 0) dAprov += 1;
    if (p.taxRate === 2) dAprov -= 2;
    if (p.taxes && p.taxes.amb >= 12) dAprov += 1;
    if (p.budget){ if (p.budget.int>=2) dAprov += 1; if (p.budget.ambm>=2) dAprov += 1; if (p.budget.edu===0) dAprov -= 1; }
    if (p.seguranca) dAprov += (p.seguranca.policia || 0);
    if (p.sectors) dAprov += (((p.sectors.habitacao || 0) >= 3) ? 1 : 0);
    // 🌍 ecologia (Fase 16): prédios poluem, verde limpa
    if (p.pollution == null) p.pollution = 10;
    let nPol = 0;
    for (const k in p.buildings) nPol += (p.buildings[k] || 0);
    let dPol = nPol * 0.3;
    if (p.taxes && p.taxes.amb >= 12) dPol -= 2;
    if (p.budget && p.budget.ambm >= 2) dPol -= 1.5;
    dPol = Math.max(-4, Math.min(6, dPol));
    p.pollution = Math.max(0, Math.min(100, p.pollution + dPol / DAY_DIV));
    if (p.pollution >= 70) dAprov -= 1;
    if (p.pollution >= 90) { dAprov -= 1; p.money = Math.max(0, p.money - 5 / DAY_DIV); }
    if (p.pollution >= 75 && !p.ecoAlert) { log(room, `🌍 ALERTA ECOLÓGICO em ${cname(p)}! Poluição ${Math.round(p.pollution)}% — aprovação caindo. Refloreste ou suba o imposto ambiental.`); p.ecoAlert = true; }
    else if (p.pollution < 60) p.ecoAlert = false;
    p.aprov = Math.max(0, Math.min(100, p.aprov + dAprov / DAY_DIV));
    // fé / influência passivos
    if (p.religion && p.religion !== 'laico') p.fe += 1 / DAY_DIV;
    if (p.ministers.dip === 'inf') p.influencia += 1 / DAY_DIV;
    if (p.ministers.dip === 'cul') p.influencia += 1 / DAY_DIV;
    if (p.ministers.soc === 'mec') p.influencia += 1 / DAY_DIV;
    p.influencia += techLevel(p, 'influencia_cult') / DAY_DIV;
    p.ap = AP_PER_TURN;
  }
  // população, produção de recursos e oscilação do mercado
  for (const p of room.players) if (p.alive) {
    const infra = ownProvinces(p).reduce((sx, x) => sx + x.infra, 0);
    let nBld = 0;
    for (const k in p.buildings) nBld += (p.buildings[k] || 0);
    const needEn = Math.ceil(nBld / 4) * (room.day < (p.racionUntil || 0) ? 0.5 : 1);
    p.rec.energia += (3 + infra * 2 + (p.solar ? 14 : 0)) / DAY_DIV;
    let mult = 1;
    if (nBld > 0 && p.rec.energia < needEn / DAY_DIV) {
      mult = 0.5;
      if (!p.blackout) { log(room, `🔌 APAGÃO em ${cname(p)}! Energia insuficiente — produção pela metade. Construa usinas.`); p.blackout = true; }
    } else { p.blackout = false; p.rec.energia -= needEn / DAY_DIV; }
    p.rec.comida += ((4 + infra * 3) * mult) / DAY_DIV;
    p.rec.minerio += ((2 + Math.round(p.eco * 0.8)) * mult) / DAY_DIV;
    p.rec.concreto += mult / DAY_DIV;
    // produção de cada prédio, direto do catálogo
    const lp = leiProd(p);   // FASE 396: volume/velocidade de produção vêm das leis
    for (const k in p.buildings) {
      const n = p.buildings[k] || 0; if (!n) continue;
      const o = BUILD_OUT[k]; if (!o || !o.res) continue;
      p.rec[o.res] = (p.rec[o.res] || 0) + (n * o.qtd * upM(p, k) * mult * lp.volume) / DAY_DIV;
    }
    /* FASE 365: a indústria CONSOME os insumos que os produtores geraram */
    const _need = insumoNecessario(p);
    for (const r in _need) {
      const take = Math.min((p.rec[r] || 0), _need[r] / DAY_DIV);
      p.rec[r] = (p.rec[r] || 0) - take;
    }
    p.suprimento = Math.round(taxaSuprimento(p) * 100);
    p.empregos = empregosOf(p);
    p.pib = pibOf(p);
    /* FASE 383: desdobramentos de eventos passados */
    processarDesdobramentos(room, p);
    /* FASE 386: protesto — pressão sustentada vai para a rua */
    if (Math.random() < riscoProtesto(p)) aplicarProtesto(room, p);
    /* FASE 387: crise ministerial (~2,5%/dia) */
    if (Math.random() < 0.025) criseMinisterial(room, p);
    /* FASE 391: evento único e raro */
    chanceEventoUnico(room, p);
    /* FASE 388/389: deltas e estado visual para o cliente */
    deltasDe(p);
    p.estadoVisual = estadoVisual(p, room);
    p.coalizao = coalizoes(p);
    /* FASE 390: vitórias híbridas */
    const vh = checarVitoriasHibridas(room, p);
    if (vh) {
      log(room, `🏆 ${cname(p)} conquistou ${vh.nome}! ${vh.desc}.`);
      record(room, `🏆 ${vh.nome} — ${cname(p)} (dia ${room.day}).`);
      room.hybridWins = room.hybridWins || {};
      if (!room.hybridWins[vh.id]) { room.hybridWins[vh.id] = p.id; p.stats.vitorias = (p.stats.vitorias || 0) + 1; }
    }
    const dep = p.depositos || [];
    if (dep.includes('petroleo')) p.rec.energia += 2 / DAY_DIV;
    if (dep.includes('minerio')) p.rec.minerio += 2 / DAY_DIV;
    if (dep.includes('madeira')) p.rec.madeira += 3 / DAY_DIV;
    if (dep.includes('comida')) p.rec.comida += 3 / DAY_DIV;
    if (dep.includes('terras_raras')) p.rec.terras_raras += 1 / DAY_DIV;
    if (dep.includes('uranio')) p.rec.uranio += 1 / DAY_DIV;
    const need = Math.ceil(p.pop / 10) / DAY_DIV;
    let g = (4 + infra * 2 + (p.sectors.saude || 0)) / DAY_DIV * (p.taxRate === 2 ? 0.7 : p.taxRate === 0 ? 1.2 : 1);
    if (p.rec.comida >= need) p.rec.comida -= need; else { p.rec.comida = 0; g = g / 3; }
    p.pop += g;
    if (p.rec.comida === 0 && p.pop > 0) {
      p.pop = Math.max(0, p.pop - 2 / DAY_DIV); p.aprov = Math.max(0, p.aprov - 3 / DAY_DIV);
      if (!p.famine) { log(room, `🍽️ FOME em ${cname(p)}! A população está morrendo — compre comida no mercado.`); p.famine = true; }
    } else p.famine = false;
  }
  if (room.day > 1 && (room.day - 1) % WEEK_DAYS === 0) resolveWeek(room);
  else broadcastDay(room);
}

/* ciclo estratégico semanal: mercado, diplomacia, IA, missões, ONU */
function eleicoes(room) {
  for (const p of room.players) {
    if (!p.alive) continue;
    p.stats = p.stats || {};
    p.stats.mandatos = p.stats.mandatos || 0;
    if (p.aprov >= 50) { record(room, 'Eleicao dia ' + room.day + ': ' + cname(p) + ' reeleito'); p.stats.mandatos++; p.money += 300; p.aprov = Math.min(100, p.aprov + 3); log(room, `🗳️ ${cname(p)} foi REELEITO com ${Math.round(p.aprov)}% de aprovação! (+$300, +3 ❤️, ${p.stats.mandatos}º mandato)`); }
    else if (p.aprov >= 35) { record(room, 'Eleicao dia ' + room.day + ': ' + cname(p) + ' vence no aperto'); p.aprov = Math.min(100, p.aprov + 1); log(room, `🗳️ ${cname(p)} vence a eleição no aperto (${Math.round(p.aprov)}%) — a oposição cresce.`); }
    else { p.aprov = Math.max(0, p.aprov - 5); record(room, 'Eleicao dia ' + room.day + ': ' + cname(p) + ' derrotado'); p.emergencyUntil = room.turn + 2; log(room, `🗳️ DERROTA nas urnas para ${cname(p)} (${Math.round(p.aprov)}%)! Protestos tomam as ruas — EMERGÊNCIA.`); }
  }
}

const ERAS = ['Fundação', 'Expansão', 'Potência', 'Lenda'];
function record(room, txt) { room.timeline = room.timeline || []; room.timeline.unshift({ day: room.day, txt }); if (room.timeline.length > 30) room.timeline.length = 30; }
function checarEra(room) {
  const nova = Math.min(4, Math.floor((room.day - 1) / 56) + 1);
  if (nova === (room.era || 1)) return;
  room.era = nova;
  for (const p of room.players) if (p.alive) { p.money += 100; p.aprov = Math.min(100, p.aprov + 2); }
  log(room, `NOVA ERA: ${ERAS[nova - 1]}! Todas as nações recebem +$100 e +2 coracoes.`);
  record(room, `Era ${ERAS[nova - 1]} começou (dia ${room.day}).`);
}

function premiosSemanais(room) {
  const alive = room.players.filter(p => p.alive);
  if (alive.length < 2) return;
  const poder = p => p.mil * 10 + Object.values(p.units || {}).reduce((a, b) => a + b, 0) * 15 + (p.nuclear || 0) * 20;
  const inds = p => Object.values(p.buildings || {}).reduce((a, b) => a + b, 0) + p.eco;
  const cats = [
    ['maior renda', p => incomeOf(room, p), p => { p.money += 150; }],
    ['maior poder militar', poder, p => { p.mil += 1; }],
    ['maior populacao', p => p.pop, p => { p.aprov = Math.min(100, p.aprov + 2); }],
    ['maior industria', inds, p => { p.money += 100; }],
    ['maior fe', p => p.fe || 0, p => { p.aprov = Math.min(100, p.aprov + 2); }],
    ['maior doutrina', p => p.influencia || 0, p => { p.influencia = Math.min(100, (p.influencia || 0) + 2); }],
    ['maior ciencia', p => (p.techs || []).length, p => { p.xp += 15; p.money += 100; }],
    ['maior riqueza', p => p.money, p => { p.money += 150; }],
    ['mais provincias', p => ownProvinces(p).length, p => { const prs = ownProvinces(p).filter(pr => pr.infra < 5); if (prs.length) prs[0].infra += 1; }],
    ['melhor diplomacia', p => (p.allies || []).length + (p.trades || []).length + (p.embassies || []).length, p => { p.aprov = Math.min(100, p.aprov + 2); }],
  ];
  for (const [nm, f, prize] of cats) {
    const win = alive.slice().sort((x, y) => f(y) - f(x))[0];
    prize(win);
    win.stats.titulos = (win.stats.titulos || 0) + 1;
  }
  const tops = cats.map(([nm, f]) => `${nm}: ${cname(alive.slice().sort((x, y) => f(y) - f(x))[0])}`).join(' | ');
  log(room, `PRÊMIOS SEMANAIS: ${tops}. Líderes recebem bônus + títulos!`);
  room.orgLeader = room.orgLeader || { interpol: null, fmi: null, omc: null };
  for (const k of ['interpol', 'fmi', 'omc']) { const ld = room.players.find(x => x.id === room.orgLeader[k] && x.alive && (x.orgs || []).includes(k)); if (ld) { ld.money += 150; ld.stats.titulos = (ld.stats.titulos || 0) + 1; } }
}

/* FASE 382 — preço por oferta e demanda */
function atualizarMercado(room) {
  const vivos = room.players.filter(p => p.alive && !p.botEliminado);
  for (const k of Object.keys(room.market)) {
    let oferta = 0, demanda = 0;
    for (const p of vivos) {
      for (const b in (p.buildings || {})) {
        const n = p.buildings[b] || 0; if (!n) continue;
        const o = BUILD_OUT[b]; if (!o) continue;
        if (o.res === k) oferta += n * o.qtd;
        const ins = INSUMOS[b];
        if (ins && ins.res === k) demanda += n * ins.qtd;
      }
      /* estoque parado também conta como oferta */
      oferta += Math.floor(((p.rec && p.rec[k]) || 0) / 40);
      /* população consome comida e energia */
      if (k === 'comida') demanda += Math.floor((p.pop || 0) / 12);
      if (k === 'energia') demanda += Math.floor((p.pop || 0) / 20);
    }
    const base = room.market[k];
    const ratio = demanda > 0 ? (oferta / demanda) : 2;
    let alvo = base;
    if (ratio > 1.6)      alvo = base * 0.93;   /* sobra: preço cai */
    else if (ratio > 1.1) alvo = base * 0.98;
    else if (ratio < 0.5) alvo = base * 1.14;   /* falta: preço sobe */
    else if (ratio < 0.8) alvo = base * 1.07;
    /* guerra e sanções encarecem o mundo inteiro */
    const guerras = vivos.reduce((n, p) => n + (p.wars || []).length, 0);
    const sancoes = vivos.reduce((n, p) => n + (p.sanctionedBy || []).length, 0);
    if (guerras > 0)  alvo *= 1 + Math.min(0.10, guerras * 0.012);
    if (sancoes > 0)  alvo *= 1 + Math.min(0.08, sancoes * 0.010);
    /* leve ruído para não ficar determinístico */
    alvo += (Math.random() * 1.6 - 0.8);
    room.market[k] = Math.max(3, Math.min(80, Math.round(alvo)));
  }
  room.marketAtualizadoEm = room.day || 0;
}

/* FASE 399 — INFLAÇÃO (indicador determinístico por país)
   Recalculada a cada semana a partir de sinais econômicos reais: dinheiro ocioso
   (superaquecimento), escassez de insumo, guerra, dívida e sanções. Encarece
   construções e pesquisas. Converge gradualmente (não salta) e fica em [-5, 40]. */
function atualizarInflacao(p) {
  const prev = p.inflacao || 0;
  let alvo = 0;
  if (p.money > 8000) alvo += 8; else if (p.money > 4000) alvo += 4;
  const sup = taxaSuprimento(p);
  if (sup < 0.4) alvo += 10; else if (sup < 0.7) alvo += 4;
  alvo += (p.wars || []).length * 6;
  if (p.debt > 3000) alvo += 6; else if (p.debt > 1000) alvo += 3;
  alvo += (p.sanctionedBy || []).length * 3;
  p.inflacao = Math.max(-5, Math.min(40, prev + (alvo - prev) * 0.25));
}

function resolveWeek(room) {
  room.turn++;
  /* FASE 400 — AUTOSAVE: salva o mundo toda semana (periódico) sem depender do host
     clicar em "salvar". Só salva se houver humano na sala (não polui o disco). */
  if (room.players.some(p => !p.bot)) salvarJogo(room);

  /* FASE 382 — MERCADO DINÂMICO
     Preço deixa de ser passeio aleatório e passa a refletir oferta, demanda,
     guerra e sanções. Excedente derruba o preço; escassez encarece. */
  atualizarMercado(room);

  // relações: decaimento + embaixadas
  const alive = room.players.filter(p => p.alive);
  for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
    const a = alive[i], b = alive[j];
    let dec = 2;
    if (a.ideology === 'fascismo' || b.ideology === 'fascismo') dec = 3;
    if (a.ideology && b.ideology && a.ideology !== b.ideology) dec += 1;
    if ((a.religion || 'laico') !== (b.religion || 'laico')) dec += 1;
    let v = relBetween(a, b) - dec;
    if (a.embassies.includes(b.id)) v += 3;
    if (b.embassies.includes(a.id)) v += 3;
    if (a.allies.includes(b.id)) v = Math.max(v, 80);
    v = Math.max(0, Math.min(100, v));
    a.relations[b.id] = v; b.relations[a.id] = v;
  }
  if ((room.day - 1) % 14 === 0){ randomEvent(room); worldNews(room); }
  if ((room.day - 1) % 28 === 0 && !room.un) openUN(room);
  if ((room.day - 1) % 56 === 0) eleicoes(room);
  premiosSemanais(room);
  checarEra(room);
  for (const p of room.players) if (p.alive && p.debt > 0) p.debt = Math.min(5000, Math.round(p.debt * 1.05));
  for (const p of room.players) if (p.alive) atualizarInflacao(p);
  if ((room.day - 1) % 14 === 0) aiTurn(room);
  const mNow = MISSIONS[room.missionIdx % MISSIONS.length];
  if (mNow) {
    const hero = room.players.find(p => p.alive && mNow.check(p));
    if (hero) {
      const rw = mNow.reward * (room.era || 1); hero.money += rw; hero.aprov = Math.min(100, hero.aprov + 3); hero.xp = (hero.xp || 0) + 10;
      log(room, `🏆 MISSÃO CUMPRIDA por ${cname(hero)}: ${mNow.desc} (+$${rw}, +3 aprovação)!`); record(room, `🏆 ${cname(hero)} cumpriu: ${mNow.desc}.`);
      room.missionIdx++;
    }
  }
  checkEliminations(room);
  checkVictory(room);
  broadcast(room);
}

/* ===== construções: 6 abas x 5 níveis (paridade com o MA3) =====
   BUILD_OUT diz o que cada prédio rende por nível: {res,qtd} ou {money} */
const BUILD_MAX = 5;
const BUILD_TABS = [['rec','⛏️ Recursos'], ['ene','⚡ Energia'], ['ali','🌾 Alimentos'], ['ind','🏭 Indústria'], ['mil','🎖️ Militar'], ['inf','🛣️ Infraestrutura']];
const PROD_BUILDS = {serraria:280, mina_ouro:500, fabrica:300, borracha:340, mina_rara:450, mina_uranio:500, petroleo:400, mina:300, usina:350, hidreletrica:520, usina_nuclear:900, solar:320, eolica:480, alternativa:600, agua:180, mina_sal:200, acucar:240, padaria:260, gado:300, fazenda:250, jardim:150, estufa:420, doces:280, adubo:260, processados:380, premium:560, estaleiro_naval:700, motores:620, maquinas:580, siderurgica:660, base:400, quartel:380, arsenal:420, hangar:520, aerodromo:560, estaleiro:620, centro_ind:700, campo_treino:340, armazem:260, estrada:150, ferrovia:380, metro:520, ciclovia:120, aeroporto:680, porto:600, heliporto:300, terminal:900,mina_carvao:320,mina_cobre:340,mina_bauxita:330,mina_prata:480,mina_litio:520,mina_niquel:350,mina_zinco:300,mina_diamante:750,mina_estanho:280,mina_manganes:360,plataforma_gas:620,pedreira:260,usina_carvao:420,usina_geotermica:600,usina_maremotriz:580,usina_biomassa:380,usina_ondas:450,reator_torio:850,dessalinizacao:500,hidrogenio:640,frota_pesqueira:420,aquicultura:350,trigo:220,arroz:220,milho:220,soja:260,cafe:380,cacau:360,citricos:240,vinicola:460,cervejaria:440,laticinios:400,frigorifico:480,oleo_vegetal:340,refinaria:600,petroquimica:680,plastico:380,vidro:360,papel:300,cimento:420,tecelagem:320,couro:330,moveis:390,eletronicos:620,semicondutores:880,montadora:760,caminhoes:640,aeronaves:820,fertilizantes:400,farmaceutica:700,quimica:560,baterias:480,paineis_solares:520,base_aerea:600,base_naval:650,academia_militar:450,inteligencia:550,drones:620,silo_misseis:800,antimisseis:750,radar:480,hospital_militar:420,centro_logistico:380,escola:250,universidade:520,instituto_tecnico:350,hospital:480,clinica:300,habitacao:420,saneamento:330,rede_agua:280,reciclagem:360,aterro:200,incineradora:420,barragem:600,canal:380,ponte:450,tunel:520,data_center:660,telecom:400,banco:700,bolsa_valores:850,estadio:550,teatro:320,museu:300,biblioteca:220,parque:180,hotel:500,shopping:620,zona_franca:580,porto_seco:420,observatorio:350,porto_espacial:950};
const CONCRETE_NEED = {serraria:8, mina_ouro:10, fabrica:0, borracha:8, mina_rara:10, mina_uranio:10, petroleo:8, mina:8, usina:8, hidreletrica:12, usina_nuclear:20, solar:6, eolica:12, alternativa:10, agua:5, mina_sal:5, acucar:6, padaria:6, gado:8, fazenda:8, jardim:3, estufa:10, doces:6, adubo:8, processados:8, premium:12, estaleiro_naval:15, motores:12, maquinas:12, siderurgica:15, base:10, quartel:10, arsenal:10, hangar:12, aerodromo:12, estaleiro:15, centro_ind:18, campo_treino:8, armazem:6, estrada:5, ferrovia:12, metro:15, ciclovia:3, aeroporto:18, porto:16, heliporto:8, terminal:22,mina_carvao:8,mina_cobre:8,mina_bauxita:8,mina_prata:10,mina_litio:10,mina_niquel:8,mina_zinco:8,mina_diamante:14,mina_estanho:7,mina_manganes:9,plataforma_gas:14,pedreira:6,usina_carvao:10,usina_geotermica:12,usina_maremotriz:14,usina_biomassa:8,usina_ondas:10,reator_torio:20,dessalinizacao:12,hidrogenio:12,frota_pesqueira:6,aquicultura:6,trigo:4,arroz:4,milho:4,soja:5,cafe:6,cacau:6,citricos:4,vinicola:8,cervejaria:8,laticinios:8,frigorifico:10,oleo_vegetal:7,refinaria:14,petroquimica:14,plastico:8,vidro:8,papel:6,cimento:10,tecelagem:6,couro:7,moveis:8,eletronicos:12,semicondutores:18,montadora:16,caminhoes:14,aeronaves:16,fertilizantes:8,farmaceutica:14,quimica:12,baterias:10,paineis_solares:10,base_aerea:12,base_naval:14,academia_militar:10,inteligencia:10,drones:12,silo_misseis:18,antimisseis:16,radar:10,hospital_militar:10,centro_logistico:8,escola:6,universidade:10,instituto_tecnico:8,hospital:10,clinica:7,habitacao:9,saneamento:8,rede_agua:6,reciclagem:8,aterro:5,incineradora:10,barragem:14,canal:8,ponte:10,tunel:12,data_center:12,telecom:8,banco:12,bolsa_valores:14,estadio:12,teatro:7,museu:7,biblioteca:5,parque:4,hotel:10,shopping:12,zona_franca:12,porto_seco:9,observatorio:8,porto_espacial:22};
const PROD_NAMES = {serraria:'🪵 Serraria', mina_ouro:'🏦 Mina de Ouro', fabrica:'🧱 Fábrica de Concreto', borracha:'🌳 Fábrica de Borracha', mina_rara:'⚙️ Mina de Terras Raras', mina_uranio:'☢️ Mina de Urânio', petroleo:'🛢️ Torre de Petróleo', mina:'⛏️ Mina de Ferro', usina:'⚡ Usina Termelétrica', hidreletrica:'💧 Usina Hidrelétrica', usina_nuclear:'☢️ Usina Nuclear', solar:'🌞 Usina Solar', eolica:'🌬️ Parque Eólico', alternativa:'♻️ Central de Energia Alternativa', agua:'💧 Fábrica de Água Mineral', mina_sal:'🧂 Mina de Sal', acucar:'🍬 Fábrica de Açúcar', padaria:'🍞 Padaria', gado:'🐄 Fazenda de Gado', fazenda:'🌾 Fazenda', jardim:'🌻 Jardim', estufa:'🏡 Estufa', doces:'🍭 Fábrica de Doces', adubo:'🌱 Fábrica de Aditivos Nutricionais', processados:'🥫 Fábrica de Alimentos Processados', premium:'🍾 Fábrica de Alimentos Premium', estaleiro_naval:'🚢 Estaleiro Naval', motores:'🔧 Fábrica de Motores', maquinas:'🏭 Fábrica de Máquinas', siderurgica:'🔩 Siderúrgica', base:'🎖️ Base Militar', quartel:'🏠 Quartel', arsenal:'🗃️ Arsenal', hangar:'🛡️ Hangar de Tanques', aerodromo:'✈️ Aeródromo', estaleiro:'⚓ Estaleiro Militar', centro_ind:'🏗️ Centro Industrial', campo_treino:'🏋️ Campo de Treino', armazem:'📦 Armazém', estrada:'🛣️ Rodovia', ferrovia:'🚂 Linha Ferroviária', metro:'🚇 Metrô', ciclovia:'🚲 Ciclovia', aeroporto:'🛫 Aeroporto', porto:'🚢 Porto', heliporto:'🚁 Heliporto', terminal:'🌐 Terminal Intercontinental',mina_carvao:'⬛ Mina de Carvão',mina_cobre:'🟧 Mina de Cobre',mina_bauxita:'🟫 Mina de Bauxita',mina_prata:'⬜ Mina de Prata',mina_litio:'🔋 Mina de Lítio',mina_niquel:'🪙 Mina de Níquel',mina_zinco:'⚙️ Mina de Zinco',mina_diamante:'💎 Mina de Diamantes',mina_estanho:'🥫 Mina de Estanho',mina_manganes:'⛏️ Mina de Manganês',plataforma_gas:'🌊 Plataforma de Gás',pedreira:'🪨 Pedreira',usina_carvao:'🏭 Usina a Carvão',usina_geotermica:'🌋 Usina Geotérmica',usina_maremotriz:'🌊 Usina Maremotriz',usina_biomassa:'🌿 Usina de Biomassa',usina_ondas:'🏄 Usina de Ondas',reator_torio:'⚛️ Reator de Tório',dessalinizacao:'💧 Usina de Dessalinização',hidrogenio:'💨 Central de Hidrogênio Verde',frota_pesqueira:'🎣 Frota Pesqueira',aquicultura:'🦐 Aquicultura',trigo:'🌾 Plantação de Trigo',arroz:'🍚 Rizicultura',milho:'🌽 Milharal',soja:'🫘 Plantação de Soja',cafe:'☕ Fazenda de Café',cacau:'🍫 Fazenda de Cacau',citricos:'🍊 Pomar de Cítricos',vinicola:'🍷 Vinícola',cervejaria:'🍺 Cervejaria',laticinios:'🧀 Laticínios',frigorifico:'🥩 Frigorífico',oleo_vegetal:'🫗 Fábrica de Óleo Vegetal',refinaria:'🛢️ Refinaria',petroquimica:'⚗️ Petroquímica',plastico:'🧴 Fábrica de Plástico',vidro:'🪟 Fábrica de Vidro',papel:'📄 Fábrica de Papel',cimento:'🏗️ Fábrica de Cimento',tecelagem:'🧵 Tecelagem',couro:'👜 Curtume de Couro',moveis:'🪑 Fábrica de Móveis',eletronicos:'📺 Fábrica de Eletrônicos',semicondutores:'💾 Fábrica de Semicondutores',montadora:'🚗 Montadora',caminhoes:'🚚 Fábrica de Caminhões',aeronaves:'🛩️ Fábrica de Aeronaves',fertilizantes:'🧪 Fábrica de Fertilizantes',farmaceutica:'💊 Indústria Farmacêutica',quimica:'🧫 Indústria Química',baterias:'🔋 Fábrica de Baterias',paineis_solares:'🔆 Fábrica de Painéis Solares',base_aerea:'🛫 Base Aérea',base_naval:'⚓ Base Naval',academia_militar:'🎓 Academia Militar',inteligencia:'🕵️ Agência de Inteligência',drones:'🛸 Fábrica de Drones',silo_misseis:'🚀 Silo de Mísseis',antimisseis:'🛡️ Defesa Antimísseis',radar:'📡 Estação de Radar',hospital_militar:'🏥 Hospital Militar',centro_logistico:'🚛 Centro Logístico',escola:'🏫 Escola',universidade:'🎓 Universidade',instituto_tecnico:'🔧 Instituto Técnico',hospital:'🏥 Hospital',clinica:'🩺 Clínica',habitacao:'🏘️ Conjunto Habitacional',saneamento:'🚰 Saneamento Básico',rede_agua:'💧 Rede de Água',reciclagem:'♻️ Usina de Reciclagem',aterro:'🗑️ Aterro Sanitário',incineradora:'🔥 Incineradora',barragem:'🌊 Barragem',canal:'🚣 Canal',ponte:'🌉 Ponte',tunel:'🚇 Túnel',data_center:'🖥️ Data Center',telecom:'📶 Torre de Telecom',banco:'🏦 Banco',bolsa_valores:'📈 Bolsa de Valores',estadio:'🏟️ Estádio',teatro:'🎭 Teatro',museu:'🖼️ Museu',biblioteca:'📚 Biblioteca',parque:'🌳 Parque',hotel:'🏨 Hotel',shopping:'🛍️ Shopping',zona_franca:'🏷️ Zona Franca',porto_seco:'🚂 Porto Seco',observatorio:'🔭 Observatório',porto_espacial:'🚀 Porto Espacial'};
const BUILD_TAB = {serraria:'rec', mina_ouro:'rec', fabrica:'rec', borracha:'rec', mina_rara:'rec', mina_uranio:'rec', petroleo:'rec', mina:'rec', usina:'ene', hidreletrica:'ene', usina_nuclear:'ene', solar:'ene', eolica:'ene', alternativa:'ene', agua:'ali', mina_sal:'ali', acucar:'ali', padaria:'ali', gado:'ali', fazenda:'ali', jardim:'ali', estufa:'ali', doces:'ind', adubo:'ind', processados:'ind', premium:'ind', estaleiro_naval:'ind', motores:'ind', maquinas:'ind', siderurgica:'ind', base:'mil', quartel:'mil', arsenal:'mil', hangar:'mil', aerodromo:'mil', estaleiro:'mil', centro_ind:'mil', campo_treino:'mil', armazem:'mil', estrada:'inf', ferrovia:'inf', metro:'inf', ciclovia:'inf', aeroporto:'inf', porto:'inf', heliporto:'inf', terminal:'inf',mina_carvao:'rec',mina_cobre:'rec',mina_bauxita:'rec',mina_prata:'rec',mina_litio:'rec',mina_niquel:'rec',mina_zinco:'rec',mina_diamante:'rec',mina_estanho:'rec',mina_manganes:'rec',plataforma_gas:'rec',pedreira:'rec',usina_carvao:'ene',usina_geotermica:'ene',usina_maremotriz:'ene',usina_biomassa:'ene',usina_ondas:'ene',reator_torio:'ene',dessalinizacao:'ene',hidrogenio:'ene',frota_pesqueira:'ali',aquicultura:'ali',trigo:'ali',arroz:'ali',milho:'ali',soja:'ali',cafe:'ali',cacau:'ali',citricos:'ali',vinicola:'ali',cervejaria:'ali',laticinios:'ali',frigorifico:'ali',oleo_vegetal:'ali',refinaria:'ind',petroquimica:'ind',plastico:'ind',vidro:'ind',papel:'ind',cimento:'ind',tecelagem:'ind',couro:'ind',moveis:'ind',eletronicos:'ind',semicondutores:'ind',montadora:'ind',caminhoes:'ind',aeronaves:'ind',fertilizantes:'ind',farmaceutica:'ind',quimica:'ind',baterias:'ind',paineis_solares:'ind',base_aerea:'mil',base_naval:'mil',academia_militar:'mil',inteligencia:'mil',drones:'mil',silo_misseis:'mil',antimisseis:'mil',radar:'mil',hospital_militar:'mil',centro_logistico:'mil',escola:'inf',universidade:'inf',instituto_tecnico:'inf',hospital:'inf',clinica:'inf',habitacao:'inf',saneamento:'inf',rede_agua:'inf',reciclagem:'inf',aterro:'inf',incineradora:'inf',barragem:'inf',canal:'inf',ponte:'inf',tunel:'inf',data_center:'inf',telecom:'inf',banco:'inf',bolsa_valores:'inf',estadio:'inf',teatro:'inf',museu:'inf',biblioteca:'inf',parque:'inf',hotel:'inf',shopping:'inf',zona_franca:'inf',porto_seco:'inf',observatorio:'inf',porto_espacial:'inf'};
const BUILD_OUT = {serraria:{res:'madeira',qtd:5}, mina_ouro:{money:25}, fabrica:{res:'concreto',qtd:6}, borracha:{res:'borracha',qtd:3}, mina_rara:{res:'terras_raras',qtd:3}, mina_uranio:{res:'uranio',qtd:2}, petroleo:{res:'energia',qtd:3}, mina:{res:'minerio',qtd:4}, usina:{res:'energia',qtd:4}, hidreletrica:{res:'energia',qtd:6}, usina_nuclear:{res:'energia',qtd:12}, solar:{res:'energia',qtd:3}, eolica:{res:'energia',qtd:5}, alternativa:{res:'energia',qtd:4}, agua:{res:'comida',qtd:2}, mina_sal:{res:'comida',qtd:2}, acucar:{res:'comida',qtd:3}, padaria:{res:'comida',qtd:4}, gado:{res:'carne',qtd:5}, fazenda:{res:'comida',qtd:5}, jardim:{res:'comida',qtd:2}, estufa:{res:'comida',qtd:7}, doces:{money:8}, adubo:{res:'comida',qtd:4}, processados:{res:'comida',qtd:6}, premium:{money:18}, estaleiro_naval:{money:12}, motores:{money:14}, maquinas:{res:'minerio',qtd:3}, siderurgica:{res:'minerio',qtd:6}, base:{}, quartel:{}, arsenal:{}, hangar:{}, aerodromo:{}, estaleiro:{}, centro_ind:{}, campo_treino:{}, armazem:{}, estrada:{money:5}, ferrovia:{money:8}, metro:{money:10}, ciclovia:{money:2}, aeroporto:{money:14}, porto:{money:12}, heliporto:{money:6}, terminal:{money:20},mina_carvao:{res:'energia',qtd:3},mina_cobre:{res:'minerio',qtd:4},mina_bauxita:{res:'minerio',qtd:4},mina_prata:{money:14},mina_litio:{res:'terras_raras',qtd:2},mina_niquel:{res:'minerio',qtd:4},mina_zinco:{res:'minerio',qtd:3},mina_diamante:{money:22},mina_estanho:{res:'minerio',qtd:3},mina_manganes:{res:'minerio',qtd:4},plataforma_gas:{res:'energia',qtd:5},pedreira:{res:'concreto',qtd:4},usina_carvao:{res:'energia',qtd:5},usina_geotermica:{res:'energia',qtd:6},usina_maremotriz:{res:'energia',qtd:5},usina_biomassa:{res:'energia',qtd:4},usina_ondas:{res:'energia',qtd:4},reator_torio:{res:'energia',qtd:10},dessalinizacao:{money:7},hidrogenio:{res:'energia',qtd:6},frota_pesqueira:{res:'comida',qtd:5},aquicultura:{res:'comida',qtd:4},trigo:{res:'comida',qtd:4},arroz:{res:'comida',qtd:4},milho:{res:'comida',qtd:4},soja:{res:'comida',qtd:5},cafe:{money:12},cacau:{money:10},citricos:{res:'comida',qtd:3},vinicola:{money:14},cervejaria:{money:13},laticinios:{res:'comida',qtd:5},frigorifico:{res:'comida',qtd:6},oleo_vegetal:{res:'comida',qtd:4},refinaria:{res:'energia',qtd:4},petroquimica:{money:16},plastico:{money:10},vidro:{money:9},papel:{money:8},cimento:{res:'concreto',qtd:5},tecelagem:{money:9},couro:{money:9},moveis:{money:11},eletronicos:{money:15},semicondutores:{money:20},montadora:{money:18},caminhoes:{money:15},aeronaves:{money:19},fertilizantes:{res:'comida',qtd:3},farmaceutica:{money:17},quimica:{money:13},baterias:{money:12},paineis_solares:{res:'energia',qtd:2},base_aerea:{},base_naval:{},academia_militar:{},inteligencia:{},drones:{},silo_misseis:{},antimisseis:{},radar:{},hospital_militar:{},centro_logistico:{},escola:{money:4},universidade:{money:9},instituto_tecnico:{money:6},hospital:{money:5},clinica:{money:5},habitacao:{money:7},saneamento:{money:4},rede_agua:{money:4},reciclagem:{res:'minerio',qtd:2},aterro:{money:3},incineradora:{res:'energia',qtd:2},barragem:{res:'energia',qtd:4},canal:{money:4},ponte:{money:6},tunel:{money:6},data_center:{money:13},telecom:{money:8},banco:{money:16},bolsa_valores:{money:22},estadio:{money:10},teatro:{money:6},museu:{money:5},biblioteca:{money:3},parque:{money:3},hotel:{money:11},shopping:{money:14},zona_franca:{money:15},porto_seco:{money:9},observatorio:{money:4},porto_espacial:{money:25}};
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
  { id: 'fe_15',      desc: 'Alcance 15 de fé',                       reward: 500, check: p => (p.fe || 0) >= 15 },
  { id: 'doc_15',     desc: 'Alcance 15 de doutrina',                 reward: 500, check: p => (p.influencia || 0) >= 15 },
  { id: 'rede_3',     desc: 'Tenha 3 agentes secretos',               reward: 550, check: p => (p.espioes || 0) >= 3 },
  { id: 'nuke_2',     desc: 'Chegue ao Nv 2 nuclear',                 reward: 600, check: p => (p.nuclear || 0) >= 2 },
  { id: 'abrigo_1',   desc: 'Construa abrigos nucleares',             reward: 450, check: p => !!p.abrigo },
  { id: 'aliados_2',  desc: 'Tenha 2 aliados',                        reward: 550, check: p => (p.allies || []).length >= 2 },
  { id: 'tech_5',     desc: 'Domine 5 tecnologias',                   reward: 600, check: p => (p.techs || []).length >= 5 },
  { id: 'titulo_1',   desc: 'Ganhe 1 título semanal',                 reward: 500, check: p => (p.stats.titulos || 0) >= 1 },
  { id: 'orgs_3',      desc: 'Polo Geopolítico: entre nas 3 organizações', reward: 800, check: p => (p.orgs || []).length >= 3 },
  { id: 'maravilha_1',  desc: 'Erga 1 maravilha mundial',               reward: 700, check: p => (p.maravilhas || []).length >= 1 },
  { id: 'vencer_5',     desc: 'Vença 5 batalhas (Coronel)',             reward: 1000, check: p => (p.stats.vitorias || 0) >= 5 },
  { id: 'tesouro_15k',  desc: 'Acumule $15.000 no tesouro (Capitalista)', reward: 800, check: p => p.money >= 15000 },
  /* FASE 400 — catálogo ampliado (econômicas, militares, políticas, diplomáticas,
     científicas e espaciais) — item 25 da spec. */
  { id: 'pib_1k',      desc: 'Eleve seu PIB a $1.000 (Industrial)',            reward: 800, check: p => pibOf(p) >= 1000 },
  { id: 'mil_30',      desc: 'Alcance 30 de poder militar (General)',           reward: 900, check: p => p.mil >= 30 },
  { id: 'mil_60',      desc: 'Alcance 60 de poder militar (Marechal)',          reward: 1500, check: p => p.mil >= 60 },
  { id: 'pop_200',     desc: 'Alcance 200 habitantes (Metrópole)',              reward: 900, check: p => p.pop >= 200 },
  { id: 'prov_5',      desc: 'Controle 5 províncias (Império)',                 reward: 1000, check: p => ownProvinces(p).length >= 5 },
  { id: 'eco_30',      desc: 'Economia nível 30 (Potência industrial)',         reward: 900, check: p => p.eco >= 30 },
  { id: 'influencia_40', desc: 'Alcance 40 de influência (Diplomata)',           reward: 900, check: p => (p.influencia || 0) >= 40 },
  { id: 'un_3',        desc: 'Vote em 3 resoluções da ONU',                     reward: 500, check: p => (p.stats.votosUn || 0) >= 3 },
  { id: 'espiao_3',    desc: 'Sabote 3 vezes com sucesso (Espião-mor)',         reward: 800, check: p => (p.stats.sabotagens || 0) >= 3 },
  { id: 'space_5',     desc: 'Conclua o programa espacial (Astronauta)',        reward: 1200, check: p => (p.space || 0) >= 5 },
  { id: 'nuclear_5',   desc: 'Domine a bomba (Potência nuclear)',               reward: 1200, check: p => (p.nuclear || 0) >= 5 },
  { id: 'tratado_3',   desc: 'Tenha 3 acordos comerciais (Mercador)',           reward: 700, check: p => (p.trades || []).length >= 3 },
  { id: 'leis_5',      desc: 'Aprove 5 leis (Legislador)',                      reward: 800, check: p => (p.leis || []).length >= 5 },
  { id: 'xp_200',      desc: 'Acumule 200 XP (Veterano)',                       reward: 1000, check: p => (p.xp || 0) >= 200 },
];

/* FASE 398 — fonte única dos custos de unidade (antes existiam 3 tabelas diferentes
   e as duas unidades novas não estavam aqui: bot pagava $200 por tudo). */
const UNIT_COSTS = { blindados: 300, aviacao: 400, frota: 500, infantaria: 200, artilharia: 350, submarinos: 450, porta_avioes: 700, fuzileiros: 350, defesa_aerea: 450 };
const UNIT_MAX = 3;
const upM = (p, k) => 1 + 0.5 * ((p.upgrades && p.upgrades[k]) || 0);

/* ============================================================
   FASE 384 — FEED MUNDIAL
   O log é uma fila cronológica. O feed é o que IMPORTA,
   classificado por relevância, para o jogador não se afogar.
   ============================================================ */
const FEED_PESO = [
  [/[☢️]|[💥]|nuclear|míssil/i,                        'nuclear',  100],
  [/declarou GUERRA|OFENSIVA|invas/i,                   'guerra',    90],
  [/SANÇÕES|EMBARGO|BLOQUEIO/i,                         'sancao',    75],
  [/aliança|ALIANÇA|pacto|PACTO/i,                      'alianca',   70],
  [/ONU|resolução|votação/i,                            'onu',       65],
  [/Terremoto|Seca|Pandemia|Revolta|Crise financeira|Boom|furac/i, 'crise', 80],
  [/VENCEU|vitória|hegemonia/i,                         'vitoria',   95],
  [/eleição|reelei|impeachment/i,                       'politica',  60],
  [/DESCOBRIU|espionagem|sabot/i,                       'espionagem',55],
  [/conclu/i,                                           'obra',      20]
];
function classificarFeed(msg) {
  for (const [re, tipo, peso] of FEED_PESO) if (re.test(msg)) return { tipo, peso };
  return { tipo: 'outro', peso: 10 };
}
function montarFeed(room) {
  const vistos = room.feedVistos || 0;
  const feed = [];
  for (let i = 0; i < (room.log || []).length && feed.length < 40; i++) {
    const e = room.log[i];
    const msg = e && e.msg ? e.msg : String(e || '');
    const c = classificarFeed(msg);
    feed.push({ msg, tipo: c.tipo, peso: c.peso, dia: e && e.turn ? e.turn : room.day });
  }
  feed.sort((a, b) => b.peso - a.peso);
  room.feed = feed.slice(0, 18);
  return room.feed;
}

/* ============================================================
   FASE 385 — COALIZÕES POLÍTICAS
   Grupos muito insatisfeitos se unem contra o governo.
   ============================================================ */
function coalizoes(p) {
  const g = gruposPoliticos(p);
  const contra = Object.keys(g).filter(k => g[k] <= -18);
  const aFavor = Object.keys(g).filter(k => g[k] >= 18);
  return {
    contra, aFavor,
    ativa: contra.length >= 2,
    /* dois ou mais grupos unidos conseguem pressão real */
    forca: contra.reduce((n, k) => n + Math.abs(g[k]), 0),
    texto: contra.length >= 2
      ? ('Coalizão contra o governo: ' + contra.join(', ') + '.')
      : null
  };
}

/* ============================================================
   FASE 386 — PROTESTOS
   Pressão política sustentada vira rua.
   ============================================================ */
function riscoProtesto(p) {
  const c = coalizoes(p);
  const press = pressaoPolitica(p);
  let r = 0;
  if (press <= -25) r += 0.10;
  if (press <= -40) r += 0.12;
  if ((p.aprov || 50) < 30) r += 0.10;
  if ((p.aprov || 50) < 18) r += 0.10;
  if (c.ativa) r += 0.12;
  if (p.famine) r += 0.08;
  if ((p.taxRate || 1) === 2) r += 0.05;
  if (p.ideology === 'autoritarismo') r -= 0.06;   // regime fecha a rua
  if (p.leis && p.leis.includes('toque_recolher')) r -= 0.05;
  if ((p.seguranca && p.seguranca.policia) || 0 >= 3) r -= 0.05;
  return Math.max(0, Math.min(0.55, r));
}

function aplicarProtesto(room, p) {
  const intensidade = Math.random();
  const mortos = intensidade > 0.85 ? Math.floor((p.pop || 0) * 0.001) : 0;
  p.pop = Math.max(0, (p.pop || 0) - mortos);
  p.aprov = Math.max(0, (p.aprov || 0) - (6 + Math.round(intensidade * 6)));
  const prejuizo = Math.round(150 + Math.random() * 500);
  p.money = Math.max(0, p.money - prejuizo);
  p.mil = Math.max(1, p.mil - (intensidade > 0.7 ? 1 : 0));
  p.protestoUntil = (room.day || 0) + 3;
  const c = coalizoes(p);
  let txt = `✊ PROTESTOS em ${cname(p)}: ${p.aprov}% de aprovação, −$${prejuizo} em prejuízo`;
  if (c.ativa) txt += ` — ${c.texto}`;
  if (mortos) txt += `, ${mortos} mortos em confronto`;
  txt += '.';
  log(room, txt);
  return txt;
}

/* ============================================================
   FASE 387 — CRISES MINISTERIAIS
   Ministro não é buff permanente: cobra, erra e desgasta.
   ============================================================ */
const CRISES_MINISTERIAIS = [
  { id:'orcamento', txt:(p,pasta) => `💼 O ministro de ${pasta} de ${cname(p)} exigiu verba extra.`,
    aplicar:(room,p) => { const v = Math.min(p.money, 300); p.money -= v;
      log(room, `💼 ${cname(p)} cedeu $${v} ao ministro (+2 ❤️ com o grupo).`); p.aprov = Math.min(100, p.aprov + 2); } },
  { id:'erro', txt:(p,pasta) => `📉 Uma decisão do ministro de ${pasta} de ${cname(p)} deu errado.`,
    aplicar:(room,p) => { p.aprov = Math.max(0, p.aprov - 5); p.money = Math.max(0, p.money - 200); } },
  { id:'critica', txt:(p,pasta) => `🗞️ A oposição pediu a saída do ministro de ${pasta} de ${cname(p)}.`,
    aplicar:(room,p) => { p.aprov = Math.max(0, p.aprov - 3); } },
  { id:'renuncia', txt:(p,pasta) => `🚪 O ministro de ${pasta} de ${cname(p)} RENUNCIOU.`,
    aplicar:(room,p,pasta) => { if (p.ministers && p.ministers[pasta]) p.ministers[pasta] = null;
      p.aprov = Math.max(0, p.aprov - 6); } }
];
const PASTAS = ['eco', 'def', 'soc'];

function criseMinisterial(room, p) {
  if (!p.ministers) return null;
  const pastas = PASTAS.filter(k => p.ministers[k]);
  if (!pastas.length) return null;
  const pasta = pastas[Math.floor(Math.random() * pastas.length)];
  const pesos = [0.35, 0.30, 0.25, 0.10];   // renúncia é a mais rara
  let r = Math.random(), i = 0;
  while (i < pesos.length - 1 && r > pesos[i]) { r -= pesos[i]; i++; }
  const c = CRISES_MINISTERIAIS[i];
  log(room, c.txt(p, pasta));
  c.aplicar(room, p, pasta);
  return c.id;
}

/* ============================================================
   FASE 388 — PAINEL "O QUE MUDOU?"
   O jogador precisa ver o deltas, não só os absolutos.
   ============================================================ */
function deltasDe(p) {
  const ant = p.deltaAnt || {};
  const agora = {
    money: Math.round(p.money || 0),
    pop: Math.round(p.pop || 0),
    pib: pibOf(p),
    aprov: Math.round(p.aprov || 0),
    mil: Math.round(p.mil || 0),
    eco: Math.round(p.eco || 0),
    fe: Math.round(p.fe || 0),
    doutrina: Math.round(p.doutrina || 0),
    empregos: empregosOf(p),
    suprimento: Math.round(taxaSuprimento(p) * 100),
    guerras: (p.wars || []).length,
    aliados: (p.allies || []).length,
    sancoes: (p.sanctionedBy || []).length
  };
  const d = {};
  for (const k in agora) d[k] = (ant[k] == null) ? 0 : (agora[k] - ant[k]);
  p.deltaAnt = agora;
  p.deltas = d;
  return d;
}

/* ============================================================
   FASE 389 — ESTADOS DE CRISE (para o cliente pintar a tela)
   ============================================================ */
function estadoVisual(p, room) {
  const e = [];
  if (p.famine) e.push('fome');
  if (p.blackout) e.push('apagao');
  if ((room.day || 0) < (p.emergencyUntil || 0)) e.push('emergencia');
  if ((room.day || 0) < (p.protestoUntil || 0)) e.push('protesto');
  if ((p.wars || []).length) e.push('guerra');
  if ((p.sanctionedBy || []).length) e.push('sancionado');
  if ((p.blockadedBy || []).length) e.push('bloqueado');
  if ((p.nuclear || 0) >= 3) e.push('nuclear');
  if (p.money < 500) e.push('falimentar');
  if (p.crise) e.push('crise');
  return e;
}

/* ============================================================
   FASE 390 — VITÓRIAS HÍBRIDAS
   Nem toda partida precisa terminar em guerra.
   ============================================================ */
const VITORIAS_HIBRIDAS = [
  { id:'hegemonia_economica', nome:'💰 Hegemonia Econômica',
    desc:'Maior PIB do mundo com comércio ativo e sem dívidas',
    testa:(room, p) => {
      const vivos = room.players.filter(x => x.alive);
      const maior = vivos.every(x => x.id === p.id || pibOf(x) < pibOf(p));
      return maior && pibOf(p) >= 40000 && (p.trades || []).length >= 2 && (p.debt || 0) <= 0;
    } },
  { id:'potencia_diplomatica', nome:'🕊️ Superpotência Diplomática',
    desc:'3 alianças, 3 organizações e influência alta',
    testa:(room, p) => (p.allies || []).length >= 3
      && (p.orgs || []).length >= 3 && (p.influencia || 0) >= 60 },
  { id:'sociedade_modelo', nome:'🏛️ Sociedade Modelo',
    desc:'7 setores no nível 5, aprovação alta e sem guerras',
    testa:(room, p) => {
      const base = ['educacao','saude','cultura','esportes','habitacao','justica','turismo'];
      return base.every(k => (p.sectors && p.sectors[k] || 0) >= 5)
        && (p.aprov || 0) >= 70 && !(p.wars || []).length;
    } }
];
function checarVitoriasHibridas(room, p) {
  for (const v of VITORIAS_HIBRIDAS) {
    try { if (v.testa(room, p)) return v; } catch (e) {}
  }
  return null;
}

/* ============================================================
   FASE 391 — EVENTOS ÚNICOS
   Raros, e por isso memoráveis. Criam história.
   ============================================================ */
const EVENTOS_UNICOS = [
  { id:'alianca_secreta', nome:'🤫 Aliança Secreta Revelada',
    txt: p => `Documentos vazados revelam que ${cname(p)} mantinha um pacto secreto. O mundo reage.`,
    aplicar:(room,p) => { for (const o of room.players) if (o.alive && o.id !== p.id)
      bumpRel(o, p, -7, 'pacto secreto revelado'); p.aprov = Math.max(0, p.aprov - 6); } },
  { id:'ouro_enterrado', nome:'💎 Descoberta Arqueológica',
    txt: p => `Escavações em ${cname(p)} revelam um tesouro histórico de valor incalculável.`,
    aplicar:(room,p) => { p.money += 3000; p.aprov = Math.min(100, p.aprov + 8);
      p.maravilhas = p.maravilhas || []; p.maravilhas.push('tesouro'); } },
  { id:'desertor', nome:'🏃 Desertor de Alto Escalão',
    txt: p => `Um general de ${cname(p)} desertou levando planos militares.`,
    aplicar:(room,p) => { p.mil = Math.max(1, Math.round(p.mil * 0.9)); p.aprov = Math.max(0, p.aprov - 5);
      const o = room.players.filter(x => x.alive && x.id !== p.id);
      if (o.length) { const q = o[Math.floor(Math.random() * o.length)]; q.mil += 1; } } },
  { id:'milagre_medico', nome:'🧬 Avanço Médico',
    txt: p => `Pesquisadores de ${cname(p)} anunciam um tratamento revolucionário.`,
    aplicar:(room,p) => { p.aprov = Math.min(100, p.aprov + 12);
      p.sectors = p.sectors || {}; p.sectors.saude = (p.sectors.saude || 0) + 1; } },
  { id:'ciberataque', nome:'💻 Ciberataque em Massa',
    txt: p => `Uma rede internacional derruba sistemas críticos de ${cname(p)}.`,
    aplicar:(room,p) => { p.money = Math.max(0, p.money * 0.9);
      p.rec && (p.rec.energia = Math.max(0, (p.rec.energia || 0) * 0.5));
      p.aprov = Math.max(0, p.aprov - 4); } }
];
function chanceEventoUnico(room, p) {
  /* raro: ~1,2% por dia por nação, e nunca repetido na mesma partida */
  if (Math.random() > 0.012) return null;
  p.eventosUnicosVistos = p.eventosUnicosVistos || [];
  const disp = EVENTOS_UNICOS.filter(e => !p.eventosUnicosVistos.includes(e.id));
  if (!disp.length) return null;
  const e = disp[Math.floor(Math.random() * disp.length)];
  p.eventosUnicosVistos.push(e.id);
  log(room, `${e.nome} — ${e.txt(p)}`);
  record(room, `${e.nome}: ${cname(p)} (dia ${room.day}).`);
  e.aplicar(room, p);
  return e.id;
}

/* ============================================================
   FASE 365 — CADEIA ECONÔMICA INTERLIGADA
   recursos → produção → indústria → empregos → PIB → receita
   Indústrias de transformação CONSOMEM insumos. Sem insumo,
   rendem menos. Isso cria dependência real entre os setores.
   ============================================================ */
const INSUMOS = {
  /* metal-mecânica */
  siderurgica:{res:'energia',qtd:4}, fabrica:{res:'minerio',qtd:2},
  montadora:{res:'minerio',qtd:3}, caminhoes:{res:'minerio',qtd:2},
  motores:{res:'minerio',qtd:2}, maquinas:{res:'energia',qtd:2},
  estaleiro_naval:{res:'minerio',qtd:3}, estaleiro:{res:'minerio',qtd:2},
  vidro:{res:'minerio',qtd:2}, quimica:{res:'minerio',qtd:2},
  fertilizantes:{res:'minerio',qtd:2},
  /* energia-intensivas */
petroquimica:{res:'energia',qtd:4},
  plastico:{res:'energia',qtd:2}, aluminio:{res:'energia',qtd:3},
  /* alimentos */
  padaria:{res:'energia',qtd:2}, processados:{res:'energia',qtd:3},
  frigorifico:{res:'carne',qtd:3}, laticinios:{res:'carne',qtd:2},
  cervejaria:{res:'comida',qtd:2}, vinicola:{res:'comida',qtd:2},
  doces:{res:'comida',qtd:2}, cafe:{res:'comida',qtd:2},
  cacau:{res:'comida',qtd:2}, oleo_vegetal:{res:'energia',qtd:2},
  farmaceutica:{res:'comida',qtd:2},
  /* madeira */
  papel:{res:'madeira',qtd:3}, moveis:{res:'madeira',qtd:4},
  tecelagem:{res:'madeira',qtd:2}, couro:{res:'carne',qtd:2},
  /* alta tecnologia */
  eletronicos:{res:'terras_raras',qtd:2}, semicondutores:{res:'terras_raras',qtd:3},
  baterias:{res:'terras_raras',qtd:2}, aeronaves:{res:'terras_raras',qtd:2},
  paineis_solares:{res:'terras_raras',qtd:1},
  /* nuclear */
  usina_nuclear:{res:'uranio',qtd:1}, reator_torio:{res:'uranio',qtd:1}
};

function insumoNecessario(p) {
  const need = {};
  for (const k in (p.buildings || {})) {
    const n = p.buildings[k] || 0; if (!n) continue;
    const ins = INSUMOS[k]; if (!ins || !ins.qtd) continue;
    need[ins.res] = (need[ins.res] || 0) + n * ins.qtd;
  }
  /* FASE 396: produzir mais rápido/volume maior queima mais insumo */
  const m = leiProd(p).insumo;
  if (m !== 1) for (const r in need) need[r] = need[r] * m;
  return need;
}

/* 0..1 — quanto da demanda industrial o país consegue suprir */
function taxaSuprimento(p) {
  const need = insumoNecessario(p), ks = Object.keys(need);
  if (!ks.length) return 1;
  let soma = 0;
  for (const r of ks) soma += Math.min(1, ((p.rec && p.rec[r]) || 0) / Math.max(1, need[r]));
  return soma / ks.length;
}

/* FASE 380 — EXPLICAÇÃO ECONÔMICA
   Devolve quanto cada fator contribui para o PIB. Sem isso o jogador olha
   para "siderúrgica rendendo 30%" e acha que é bug. */
function pibDetalhe(p) {
  let predios = 0;
  for (const k in (p.buildings || {})) {
    const n = p.buildings[k] || 0; if (!n) continue;
    const o = BUILD_OUT[k]; if (!o) continue;
    predios += n * (((o.money || 0) * 42) + ((o.qtd || 0) * 9));
  }
  const populacao = Math.floor(p.pop || 0) * 3 + (p.eco || 0) * 260;
  const setores = sectorSum(p) * 120;
  const comercio = (p.trades || []).length * 60;
  const aliados = (p.allies || []).length * 90;
  const bruto = predios + populacao + setores + comercio + aliados;
  const sup = taxaSuprimento(p);
  const mult = 0.35 + 0.65 * sup;
  const need = insumoNecessario(p);
  const faltando = Object.keys(need).filter(r => ((p.rec && p.rec[r]) || 0) < need[r]);
  return {
    predios: Math.round(predios * mult),
    populacao: Math.round(populacao * mult),
    setores: Math.round(setores * mult),
    comercio: Math.round(comercio * mult),
    aliados: Math.round(aliados * mult),
    suprimento: Math.round(bruto * (mult - 1)),
    total: Math.round(bruto * mult),
    taxaSuprimento: Math.round(sup * 100),
    insumosFaltando: faltando,
    /* alerta objetivo: o jogador precisa saber o que está travando a indústria */
    aviso: faltando.length
      ? ('Falta ' + faltando.slice(0, 3).join(', ').replace(/_/g, ' ') +
         ' — indústrias que dependem disso rendem apenas 30%.')
      : null
  };
}

function empregosOf(p) {
  let jobs = 0;
  for (const k in (p.buildings || {})) { const n = p.buildings[k] || 0; if (n) jobs += n * 9; }
  jobs += Math.floor(sectorSum(p) * 45) + Math.floor((p.mil || 0) * 2);
  return jobs;
}

function pibOf(p) {
  let v = 0;
  for (const k in (p.buildings || {})) {
    const n = p.buildings[k] || 0; if (!n) continue;
    const o = BUILD_OUT[k]; if (!o) continue;
    v += n * (((o.money || 0) * 42) + ((o.qtd || 0) * 9));
  }
  v += (p.eco || 0) * 260 + Math.floor(p.pop || 0) * 3 + sectorSum(p) * 120
     + (p.allies || []).length * 90 + (p.trades || []).length * 60;
  v *= 0.35 + 0.65 * taxaSuprimento(p);
  return Math.round(Math.max(0, v));
}

/* ============================================================
   FASE 367 — LEIS COM CONSEQUÊNCIA POLÍTICA
   Cada lei agrada e desagrada grupos. A soma vira pressão.
   ============================================================ */
const LEI_GRUPOS = {
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
};

function gruposPoliticos(p) {
  const g = { militares: 0, pacifistas: 0, empresarios: 0, religiosos: 0, intelectuais: 0 };
  for (const lei of (p.leis || [])) {
    const m = LEI_GRUPOS[lei]; if (!m) continue;
    for (const k in m) g[k] += m[k];
  }
  /* religião de estado influencia o grupo religioso */
  if (p.religiaoEstado) g.religiosos += 12; else g.religiosos -= 8;
  /* imposto alto desagrada empresários */
  if (p.taxRate === 2) { g.empresarios -= 18; g.pacifistas += 5; }
  if (p.taxRate === 0) { g.empresarios += 15; g.intelectuais -= 4; }
  return g;
}

/* pressão política líquida: positiva = apoio, negativa = contestação */
function pressaoPolitica(p) {
  const g = gruposPoliticos(p);
  let soma = 0, n = 0;
  for (const k in g) { soma += g[k]; n++; }
  return Math.round(soma / n);
}

/* ============================================================
   FASE 368 — MINISTROS REAIS
   Cada ministro altera VÁRIOS sistemas, não só um número.
   ============================================================ */
const MINISTRO_EFEITOS = {
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
};

function ministroEfeito(p, pasta, campo) {
  const escolha = p.ministers && p.ministers[pasta];
  if (!escolha) return 0;
  const t = MINISTRO_EFEITOS[pasta] && MINISTRO_EFEITOS[pasta][escolha];
  return (t && t[campo]) || 0;
}

/* ============================================================
   FASE 369 — ESPIONAGEM COM RISCO
   ============================================================ */
function riscoEspionagem(p, alvo) {
  const defesa = (alvo.techLv && alvo.techLv.contraespionagem) || 0;
  const seg = (alvo.seguranca && alvo.seguranca.espiao) || 0;
  const base = 0.34 - defesa * 0.05 - seg * 0.04
             + ((alvo.ideology === 'autoritarismo') ? 0.08 : 0)
             + ministroEfeito(alvo, 'def', 'militar') * 0.2;
  return Math.max(0.05, Math.min(0.7, base));
}

/* ============================================================
   FASE 366 — EVENTOS SISTÊMICOS
   Um desastre mexe em vários sistemas de uma vez.
   ============================================================ */
const EVENTOS_SISTEMICOS = {
  terremoto: {
    nome: '🌪️ Terremoto',
    aplicar: (room, p) => {
      const mortes = Math.floor((p.pop || 0) * (0.004 + Math.random() * 0.012));
      p.pop = Math.max(0, (p.pop || 0) - mortes);
      p.money = Math.max(0, p.money - 900);
      for (const pr of p.provinces) if (pr.owner === p.id && Math.random() < 0.28 && pr.infra > 1) pr.infra -= 1;
      p.aprov = Math.max(0, p.aprov - 5);
      p.emergencyUntil = (room.turn || 0) + 6;
      return `Terremoto em ${cname(p)}: ${mortes} mortos, infraestrutura danificada, estado de emergência.`;
    }
  },
  seca: {
    nome: '🌵 Seca prolongada',
    aplicar: (room, p) => {
      p.rec.comida = Math.max(0, (p.rec.comida || 0) * 0.45);
      p.famine = true;
      p.aprov = Math.max(0, p.aprov - 7);
      return `Seca em ${cname(p)}: produção de alimentos pela metade e risco de fome.`;
    }
  },
  crise_financeira: {
    nome: '📉 Crise financeira',
    aplicar: (room, p) => {
      p.money = Math.max(0, p.money * 0.78);
      p.taxRate = Math.max(0, (p.taxRate || 1) - 1);
      p.aprov = Math.max(0, p.aprov - 9);
      return `Crise financeira em ${cname(p)}: reservas derretem e arrecadação cai.`;
    }
  },
  pandemia: {
    nome: '🦠 Pandemia',
    aplicar: (room, p) => {
      const mortes = Math.floor((p.pop || 0) * 0.006);
      p.pop = Math.max(0, (p.pop || 0) - mortes);
      const hosp = (p.buildings && p.buildings.hospital) || 0;
      if (hosp >= 3) { p.aprov = Math.max(0, p.aprov - 1); }
      else { p.aprov = Math.max(0, p.aprov - 8); }
      p.emergencyUntil = (room.turn || 0) + 4;
      return `Pandemia em ${cname(p)}: ${mortes} mortos` + (hosp >= 3 ? ', mas a rede hospitalar segurou a crise.' : ', sistema de saúde insuficiente.');
    }
  },
  revolta: {
    nome: '✊ Revolta popular',
    aplicar: (room, p) => {
      p.aprov = Math.max(0, p.aprov - 14);
      p.mil = Math.max(1, Math.round((p.mil || 1) * 0.94));
      p.pollution = Math.min(100, (p.pollution || 0) + 3);
      return `Revolta popular em ${cname(p)}: aprovação despenca e tropas se desorganizam.`;
    }
  },
  boom: {
    nome: '📈 Boom econômico',
    aplicar: (room, p) => {
      p.money += 1200;
      p.aprov = Math.min(100, (p.aprov || 0) + 8);
      return `Boom econômico em ${cname(p)}: investimentos externos e otimismo popular.`;
    }
  }
};

/* FASE 383 — CADEIA DE EVENTOS
   Um evento planta uma consequência. Não é sorte: depende de como o país
   reagiu. Pandemia sem hospital vira revolta; revolta mal contida vira
   crise financeira. */
const EVENTOS_ENCADEADOS = {
  pandemia: {
    se: p => ((p.buildings && p.buildings.hospital) || 0) < 2 || (p.aprov || 100) < 40,
    proximo: 'revolta', delay: 2,
    texto: 'A pandemia mal administrada virou revolta popular.'
  },
  seca: {
    se: p => !!(p.famine),
    proximo: 'revolta', delay: 3,
    texto: 'A fome gerada pela seca virou revolta popular.'
  },
  crise_financeira: {
    se: p => (p.aprov || 100) < 45,
    proximo: 'revolta', delay: 3,
    texto: 'A crise econômica derrubou a confiança no governo.'
  },
  terremoto: {
    se: p => true,
    proximo: 'crise_financeira', delay: 4,
    texto: 'Os custos da reconstrução pesaram nas contas públicas.'
  },
  revolta: {
    se: p => (p.aprov || 100) < 28,
    proximo: 'crise_financeira', delay: 2,
    texto: 'A instabilidade afugentou investidores.'
  }
};

function agendarDesdobramento(p, eventoKey) {
  const cadeia = EVENTOS_ENCADEADOS[eventoKey];
  if (!cadeia) return;
  try { if (!cadeia.se(p)) return; } catch (e) { return; }
  p.eventosPendentes = p.eventosPendentes || [];
  if (p.eventosPendentes.some(x => x.evt === cadeia.proximo)) return;  // sem duplicar
  p.eventosPendentes.push({ evt: cadeia.proximo, dia: DIA_ATUAL + (cadeia.delay || 2), texto: cadeia.texto });
}

function processarDesdobramentos(room, p) {
  if (!p.eventosPendentes || !p.eventosPendentes.length) return;
  const prontos = p.eventosPendentes.filter(x => room.day >= x.dia);
  if (!prontos.length) return;
  p.eventosPendentes = p.eventosPendentes.filter(x => room.day < x.dia);
  for (const pd of prontos) {
    const ev = EVENTOS_SISTEMICOS[pd.evt];
    if (!ev) continue;
    if (pd.texto) log(room, `⛓️ ${pd.texto}`);
    ev.aplicar(room, p);
    agendarDesdobramento(p, pd.evt);   /* a cadeia pode continuar */
  }
}

function dispararEventoSistemico(room, p) {
  const ks = Object.keys(EVENTOS_SISTEMICOS);
  const k = ks[Math.floor(Math.random() * ks.length)];
  const ev = EVENTOS_SISTEMICOS[k];
  const txt = ev.aplicar(room, p);
  log(room, `${ev.nome} ${txt}`);
  agendarDesdobramento(p, k);
  return k;
}

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
  aM += 0.15 * techLevel(a, 'escola_oficiais');
  aM += 0.05 * a.units.blindados + 0.02 * a.units.aviacao + 0.04 * a.units.artilharia + 0.02 * a.units.submarinos + 0.02 * a.units.porta_avioes
      + 0.04 * (a.units.fuzileiros || 0);                                    // FASE 397
  dM += 0.05 * d.units.aviacao + 0.03 * d.units.frota + 0.04 * d.units.infantaria + 0.02 * d.units.submarinos + 0.04 * d.units.porta_avioes
      + 0.06 * (d.units.defesa_aerea || 0) + 0.03 * (d.units.fuzileiros || 0); // FASE 397
  dM += 0.05 * Math.min(5, d.buildings.base || 0);
  if (a.leis.includes('servico_militar')) aM += 0.05;
  if (d.leis.includes('guarda_nacional')) dM += 0.05;
  const aP = a.mil * aM * (0.85 + Math.random() * 0.45);
  const dP = d.mil * dM * (0.9 + Math.random() * 0.45) * 1.3;
  const sup = (a.mil * aM) > (d.mil * dM) * 1.5;
  if (aP > dP * 1.15) {
    const loot = Math.round(d.money * 0.08);
    d.money -= loot; a.money += loot;
    d.mil = Math.max(1, Math.round(d.mil * 0.8)); a.mil = Math.max(1, Math.round(a.mil * 0.9));
    d.aprov = Math.max(0, d.aprov - 4); a.stats.vitorias++;
    log(room, `🤖⚔️ ${cname(a)} atacou ${cname(d)} e VENCEU! Saque: $${loot}.`);
    const provs = ownProvinces(d);
    if (provs.length && sup) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.owner = a.id; log(room, `🏴 ${cname(a)} OCUPA a província de ${pr.name}!`); }
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
    const per = PERSONAS[b.persona] || PERSONAS.economico;
    /* FASE 400 — a persona redireciona o caixa do bot para a sua prioridade.
       Todos os efeitos usam dinheiro real do bot (nada de recurso infinito). */
    if (b.money > 600) {
      if (per.eco >= 1.5 && b.money > 900) { b.money -= 400; b.eco += 1; }
      if (per.mil >= 1.5 && b.money > 800) { b.money -= 300; b.mil += 1; }
      if (per.def >= 1.5 && b.money > 700 && (b.seguranca.defesa || 0) < 3) { b.money -= 350; b.seguranca.defesa = (b.seguranca.defesa || 0) + 1; }
      if (b.persona === 'cientifico' && b.money > 1000) { const tk = Object.keys(TECHS)[(room.turn + b.id.length) % Object.keys(TECHS).length]; b.techLv = b.techLv || {}; if ((b.techLv[tk] || 0) < 3) { b.techLv[tk]++; b.money -= 200; } }
      if (b.persona === 'diplomatico' && b.money > 800) { const al = room.players.find(o => o.alive && o !== b && relBetween(b, o) >= 55 && !b.allies.includes(o.id) && !b.wars.includes(o.id)); if (al && b.allies.length < 3) { b.money -= 150; b.allies.push(al.id); al.allies.push(b.id); b.relations[al.id] = 100; al.relations[b.id] = 100; log(room, `🤝 ${cname(b)} (${per.nome}) firmou aliança com ${cname(al)}.`); } }
    }
    const need = Math.ceil(b.pop / 10) + 10;
    if (b.rec.comida > need + 20) { const q = Math.floor((b.rec.comida - need) / 2); b.rec.comida -= q; b.money += q * room.market.comida; }
    if (b.rec.madeira > 30) { const q = Math.floor(b.rec.madeira / 3); b.rec.madeira -= q; b.money += q * room.market.madeira; }
    if (b.money > 500 && b.builds.length < 2) {
      const kinds = ['infra', 'fabrica', 'fazenda', 'mina', 'serraria', 'usina', 'petroleo', 'mina_ouro', 'estrada', 'base', 'mina_rara', 'adubo'];
      const kind = kinds[(room.turn + b.id.length) % kinds.length];
      if (kind === 'infra') {
        const pr = ownProvinces(b).find(x => x.infra < 5);
        if (pr) { b.money -= 200; b.builds.push({ kind: 'infra', prov: b.provinces.indexOf(pr), untilDay: room.day + 6 }); }
      } else if (b.money > PROD_BUILDS[kind] && b.rec.concreto >= (CONCRETE_NEED[kind] || 0)) {
        b.money -= PROD_BUILDS[kind]; b.rec.concreto -= CONCRETE_NEED[kind] || 0; b.builds.push({ kind, untilDay: room.day + buildDays(PROD_BUILDS[kind] || 300) });
      }
    }
    if (b.money > 1200 && b.mil < 18 && room.turn % 4 === 0) { b.money -= 150; b.mil += 1; }
    if (b.money > 900 && b.rec.terras_raras >= 4) {
      /* FASE 398: a IA usava só 5 das 9 unidades e pagava um custo próprio */
      const ks = Object.keys(UNIT_COSTS);
      const k = ks[room.turn % ks.length];
      if ((b.units[k] || 0) < UNIT_MAX) { b.money -= UNIT_COSTS[k]; b.rec.terras_raras -= 4; b.units[k] = (b.units[k] || 0) + 1; }
    }
    // crescimento da IA (Fase 20): bots evoluem eco/tech/leis como gente
    if (b.money > 2000 && room.turn % 5 === 0 && b.eco < 40) { b.money -= 500; b.eco += 1; }
    if (b.money > 1500 && room.turn % 6 === 0) { const _tk = Object.keys(TECHS)[(room.turn + b.id.length) % Object.keys(TECHS).length]; b.techLv = b.techLv || {}; if ((b.techLv[_tk] || 0) < 3) { b.techLv[_tk]++; b.money -= 200; } }
    if (b.money > 3000 && room.turn % 7 === 0 && (b.leis || []).length < 6) { b.leis = b.leis || []; const _lk = Object.keys(LEIS).find(k => !b.leis.includes(k)); if (_lk) { b.leis.push(_lk); b.money -= LEIS[_lk].cost; } }
    if (b.crise) resolverCrise(room, b, (b.money > 500) ? 0 : 2);
    if (b.religion && b.religion !== 'laico' && b.money > 500 && Math.random() < 0.25) { const tgts = room.players.filter(o => o.alive && o !== b && o.religion !== b.religion); if (tgts.length) { const t3 = tgts[Math.floor(Math.random() * tgts.length)]; if (Math.random() < 0.3 + relBetween(b, t3) / 200) { t3.religion = b.religion; bumpRel(b, t3, 10); b.stats.conversoes = (b.stats.conversoes || 0) + 1; log(room, `🛐 ${cname(b)} espalhou sua religião para ${cname(t3)}!`); } } }
    if ((b.fe || 0) >= 10 && b.money < 1000) { b.money += Math.round((b.fe || 0) * 8); b.aprov = Math.max(0, b.aprov - 3); }
    if ((b.fe || 0) >= 20 && b.religion && b.religion !== 'laico' && b.money > 800 && Math.random() < 0.06) { const fs = room.players.find(o => o.alive && o !== b && o.religion !== b.religion); if (fs && Math.random() < 0.5) { b.money -= 200; b.mil += 12; bumpRel(b, fs, -15); log(room, `🕌 ${cname(b)} conclama GUERRA SANTA contra ${cname(fs)}!`); } }
    if (b.money > 2000 && Math.random() < 0.08) { b.money -= 300; b.influencia = Math.min(100, (b.influencia || 0) + 5); b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 600 && Math.random() < 0.1) { const fo = room.players.find(o => o.alive && o !== b && relBetween(b, o) < 30); if (fo) { b.money -= 100; fo.aprov = Math.max(0, fo.aprov - 4); bumpRel(b, fo, -6); } }
    if ((b.crise && b.crise.tipo === 'pandemia') || b.aprov < 50) { if (b.money > 600) { b.money -= 250; b.pop += 3; b.aprov = Math.min(100, b.aprov + 6); if (b.crise && b.crise.tipo === 'pandemia') b.crise = null; } }
    if (b.money > 4000 && Math.random() < 0.08) { b.money -= 500; b.pop += 8; b.aprov = Math.min(100, b.aprov + 5); if ((b.sectors.saude || 0) < 5) b.sectors.saude += 1; }
    if (b.money > 4000 && ((b.sectors && b.sectors.educacao) || 0) < 5 && Math.random() < 0.08) { b.money -= 700; b.sectors.educacao = ((b.sectors && b.sectors.educacao) || 0) + 1; }
    if (((b.seguranca && b.seguranca.policia) || 0) >= 1 && b.money < 1500 && b.money > 300) { b.money += 150 + 50 * b.seguranca.policia - 200; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.aprov < 30 && ((b.seguranca && b.seguranca.guarda) || 0) >= 1 && b.money > 300) { b.money -= 100; b.aprov = Math.min(100, b.aprov + 8); }
    if (b.money > 3000 && Math.random() < 0.08) { const bk = ['policia', 'guarda'][Math.floor(Math.random() * 2)]; b.seguranca = b.seguranca || {}; if ((b.seguranca[bk] || 0) < 3) { b.money -= 350; b.seguranca[bk] = (b.seguranca[bk] || 0) + 1; } }
    if (b.money < 1000 && room.market) { const rk = Object.keys(room.market).find(k => (b.rec[k] || 0) >= 20); if (rk) { b.rec[rk] -= 20; b.money += Math.round(room.market[rk] * 20 * Math.min(1.2, 1 + 0.03 * b.trades.length)); } }
    if (b.blackout && b.money > 600) { b.money -= 300; b.rec.energia += 40; }
    if (!b.solar && b.money > 3000 && Math.random() < 0.08) { b.money -= 500; b.solar = true; }
    if (b.money < 800 && b.money > 300) { b.money += 100 + (b.eco || 0) * 30 - 200; }
    if (b.money > 5000 && Math.random() < 0.06) { b.money -= 400; b.eco += 1; }
    if (!b.ministers.eco && b.money > 2000) { b.money -= 300; b.ministers = { eco: ['tec', 'pop', 'ind'][Math.floor(Math.random() * 3)], def: ['fal', 'estr', 'pac'][Math.floor(Math.random() * 3)], dip: ['neg', 'inf', 'esp', 'cul'][Math.floor(Math.random() * 4)], soc: ['art', 'atl', 'mec'][Math.floor(Math.random() * 3)] }; }
    if (((b.sectors && b.sectors.esportes) || 0) >= 1 && b.money > 3000 && Math.random() < 0.05) { b.money -= 400; b.aprov = Math.min(100, b.aprov + 3); log(room, `🎾 ${cname(b)} sediou a Copa Davis.`); }
    if (((b.sectors && b.sectors.esportes) || 0) >= 2 && b.money > 5000 && Math.random() < 0.06) { b.money -= 700; b.aprov = Math.min(100, b.aprov + 10); b.influencia = Math.min(100, (b.influencia || 0) + 5); log(room, `🏟️ ${cname(b)} sediou os JOGOS OLÍMPICOS!`); }
    if (b.money > 4000 && ((b.sectors && b.sectors.turismo) || 0) < 5 && Math.random() < 0.08) { b.money -= 500; b.sectors.turismo = ((b.sectors && b.sectors.turismo) || 0) + 1; }
    if (b.money > 4000 && ((b.sectors && b.sectors.habitacao) || 0) < 5 && Math.random() < 0.08) { b.money -= 600; b.sectors.habitacao = ((b.sectors && b.sectors.habitacao) || 0) + 1; b.pop += 5; }
    if (b.aprov < 45 && ((b.sectors && b.sectors.habitacao) || 0) >= 1 && b.money > 500) { b.money -= 200; b.pop += 2; b.aprov = Math.min(100, b.aprov + 5); }
    if (b.money > 4000 && ((b.sectors && b.sectors.justica) || 0) < 5 && Math.random() < 0.08) { b.money -= 600; b.sectors.justica = ((b.sectors && b.sectors.justica) || 0) + 1; b.money += 150; }
    if (b.money > 4000 && ((b.sectors && b.sectors.infraestrutura) || 0) < 5 && Math.random() < 0.08) { b.money -= 600; b.sectors.infraestrutura = ((b.sectors && b.sectors.infraestrutura) || 0) + 1; }
    if (b.money > 4500 && ((b.sectors && b.sectors.ciencia) || 0) < 5 && Math.random() < 0.08) { b.money -= 700; b.sectors.ciencia = ((b.sectors && b.sectors.ciencia) || 0) + 1; }
    if (((b.sectors && b.sectors.justica) || 0) >= 2 && b.money > 500 && Math.random() < 0.1) { b.money += 200 + 50 * b.sectors.justica - 250; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.crise && b.money > 500) resolverCrise(room, b, 0); else if (b.crise && Math.random() < 0.1) resolverCrise(room, b, 2);
    if (b.aprov < 55 && b.money > 500) { b.money -= 50; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 2000 && Math.random() < 0.03) { const va = room.players.find(o => o.alive && o.bot && o !== b && relBetween(b, o) >= 85 && !b.wars.includes(o.id)); if (va) { for (const pr of va.provinces) pr.owner = b.id; b.provinces = b.provinces.concat(va.provinces); va.provinces = []; va.alive = false; va.eliminatedReason = `Anexada por acordo por ${cname(b)}`; b.money -= 300; log(room, `🗺️ ${cname(b)} ANEXOU ${cname(va)} por acordo diplomático!`); } }
    if (b.money > 1000 && Math.random() < 0.1) { const prs = ownProvinces(b).filter(pr => pr.infra < 5); if (prs.length) { b.money -= 200; prs[0].infra = Math.min(5, prs[0].infra + 1); } }
    if (b.mil < 10 && b.money > 1500 && Math.random() < 0.2) { b.money -= 150; b.mil = Math.min(25, b.mil + 1); }
    if (b.money < 300 && Math.random() < 0.15) { b.money += 1500; b.aprov = Math.max(0, b.aprov - 8); }
    if (b.religion && b.religion !== 'laico' && b.money > 1000 && Math.random() < 0.15) { b.money -= 200; b.fe = Math.min(100, (b.fe || 0) + 4); }
    if (b.money > 2000 && Math.random() < 0.05) { const fo = room.players.filter(o => o.alive && o !== b).sort((x, y) => relBetween(b, y) - relBetween(b, x))[0]; if (fo && relBetween(b, fo) > 0) { b.money -= 100; bumpRel(b, fo, 8); } }
    if (b.money > 3000 && Math.random() < 0.05) { b.money -= 600; b.aprov = Math.min(100, b.aprov + 8); b.influencia = Math.min(100, (b.influencia || 0) + 3); }
    if (b.money > 1000 && Math.random() < 0.05 && b.leis) { const op = Object.keys(LEIS).filter(k => !b.leis.includes(k)); if (op.length && b.money >= LEIS[op[0]].cost + 500) { b.money -= LEIS[op[0]].cost; b.leis.push(op[0]); } }
    if (b.rec && (b.rec.terras_raras || 0) >= 4 && b.money > 1000 && Math.random() < 0.08) { const us = Object.keys(UNIT_COSTS).filter(k => (b.units[k] || 0) < UNIT_MAX); if (us.length) { const k = us[Math.floor(Math.random() * us.length)]; b.rec.terras_raras -= 4; b.money -= UNIT_COSTS[k]; b.units[k] = (b.units[k] || 0) + 1; } }
    if (b.money > 2500 && (b.trades || []).length >= 2 && Math.random() < 0.08) { b.money += 100 + 75 * b.trades.length - 200; }
    if (b.money > 2500 && ((b.sectors && b.sectors.turismo) || 0) < 5 && Math.random() < 0.06) { b.money -= 500; b.sectors.turismo = ((b.sectors && b.sectors.turismo) || 0) + 1; }
    if (b.crise && b.crise.tipo === 'pandemia' && b.money > 500 && Math.random() < 0.3) { b.money -= 250; b.crise = null; b.pop += 3; log(room, `💉 ${cname(b)} erradicou a pandemia com vacinação em massa!`); }
    if (b.money > 3000 && Math.random() < 0.05) { b.orgs = b.orgs || []; const oo = ['interpol','fmi','omc'].filter(k => !b.orgs.includes(k)); if (oo.length) { b.money -= 400; b.orgs.push(oo[0]); } }
    if ((b.orgs || []).length && b.money > 4000 && Math.random() < 0.05) { b.money -= 800; room.orgLeader = room.orgLeader || { interpol: null, fmi: null, omc: null }; const k = b.orgs[Math.floor(Math.random() * b.orgs.length)]; const sc = o => k === 'interpol' ? o.mil : k === 'fmi' ? o.eco + Math.floor(o.money / 1000) : (o.trades || []).length * 2 + o.eco; const cur = room.players.find(x => x.id === room.orgLeader[k] && x.alive); if (!cur || sc(b) > sc(cur)) { room.orgLeader[k] = b.id; log(room, `🏛️ ${cname(b)} assumiu a liderança da ${k.toUpperCase()}!`); } }
    if (b.money > 5000 && Math.random() < 0.03) { const poor = room.players.find(o => o.alive && o !== b && (o.money || 0) < 800 && relBetween(b, o) >= 50); if (poor) { b.money -= 1000; poor.money += 1000; poor.dividas = poor.dividas || []; poor.dividas.push({ to: b.id, valor: 1200, dia: room.day + 28 }); log(room, `💸 ${cname(b)} emprestou $1000 a ${cname(poor)}.`); } }
    if (b.money > 3000 && Math.random() < 0.05) { const so = room.players.find(o => o.alive && o !== b && o.crise && relBetween(b, o) >= 50); if (so) { b.money -= 300; so.money += 300; bumpRel(b, so, 10); } }
    if (((b.stats && b.stats.vitorias) || 0) > 0 && b.money > 1000 && Math.random() < 0.1) { b.money -= 200; b.mil = Math.min(25, b.mil + 1); b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 2000 && Math.random() < 0.08) { b.money -= 400; b.ciencia = (b.ciencia || 0) + 2; }
    if (b.money > 2000 && Math.random() < 0.06) { b.comandantes = b.comandantes || {}; const cp = ['marinha','policia','esportes','cultura','defesa'].filter(k => !b.comandantes[k]); if (cp.length) { b.money -= 300; b.comandantes[cp[0]] = 1; } }
    if ((b.rec.comida || 0) < 30 && b.money > 1500 && Math.random() < 0.15) { b.money -= 200; b.rec.comida = (b.rec.comida || 0) + 25; }
    if (b.money > 4000 && Math.random() < 0.04) { room.cs = room.cs || []; if (room.cs.length < 5 && !room.cs.includes(b.id)) { b.money -= 800; room.cs.push(b.id); log(room, `🛡️ ${cname(b)} entrou no Conselho de Segurança!`); } }
    if (b.money > 3000 && (b.ciencia || 0) >= 2 && Math.random() < 0.05) { b.money -= 600; b.ciencia += 2; b.influencia = Math.min(100, (b.influencia || 0) + 3); }
    if (((b.seguranca && b.seguranca.policia) || 0) >= 1 && b.money > 1000 && Math.random() < 0.1) { b.money -= 200; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 1500 && Math.random() < 0.08) { b.money -= 300; b.influencia = Math.min(100, (b.influencia || 0) + 3); }
    if (b.money < 200 && ownProvinces(b).length > 1 && Math.random() < 0.5) { const ps = ownProvinces(b).sort((x, y) => x.infra - y.infra); b.provinces = b.provinces.filter(x => x !== ps[0]); b.money += 300 + (ps[0].infra || 1) * 100; }
    if (b.money > 2000 && Math.random() < 0.06) { b.money -= 300; b.aprov = Math.min(100, b.aprov + 5); log(room, `🎪 ${cname(b)} realizou festas populares.`); }
    if (b.money > 2500 && Math.random() < 0.06) { b.money -= 400; b.aprov = Math.min(100, b.aprov + 2); log(room, `🏨 ${cname(b)} investiu em hotelaria.`); }
    if (b.money > 3000 && Math.random() < 0.08) { b.money -= 500; b.eco += 2; }
    if (b.money > 2000 && Math.random() < 0.06) { b.money -= 350; b.ciencia = (b.ciencia || 0) + 1; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 2500 && Math.random() < 0.06) { b.money -= 400; b.mil += 1; }
    if (b.mil > 8 && b.money > 500 && Math.random() < 0.05) { b.money -= 100; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 800 && Math.random() < 0.10) { b.money -= 200; b.aprov = Math.min(100, b.aprov + 5); }
    if (b.money > 600 && Math.random() < 0.08) { b.money -= 150; b.aprov = Math.min(100, b.aprov + 2); }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 800; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 300; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money < 800 && Math.random() < 0.06) { b.money += 600; b.aprov = Math.max(0, b.aprov - 4); }
    if (b.mil < 3 && Math.random() < 0.04) { b.mil = Math.max(1, b.mil - 0); b.aprov = Math.min(100, b.aprov + 2); }
    if (b.money > 2500 && Math.random() < 0.04) { b.money -= 600; b.eco = (b.eco || 3) + 2; }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 300; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money < 600 && Math.random() < 0.06) { b.money += 400; }
    if (b.money > 1000 && Math.random() < 0.05) { b.money -= 200; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 300; b.aprov = Math.min(100, b.aprov + 5); }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 400; b.mil = (b.mil || 3) + 3; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 250; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 5000 && Math.random() < 0.03) { b.money -= 1000; b.aprov = Math.min(100, b.aprov + 8); }
    if (b.money > 4000 && Math.random() < 0.03) { b.money -= 800; b.aprov = Math.min(100, b.aprov + 6); }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 200; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 250; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 150; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.05) { b.money -= 200; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 200; b.money += 400; }
    if (b.money > 800 && Math.random() < 0.06) { b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 200; b.mil = (b.mil || 3) + 1; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.mil = (b.mil || 3) + 3; }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 300; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 700; b.eco = (b.eco || 3) + 2; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 600; b.money += 700; }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 600; b.eco = (b.eco || 3) + 2; }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 300; b.aprov = Math.min(100, b.aprov + 5); }
    if (b.money > 3500 && Math.random() < 0.04) { b.money -= 800; b.mil = (b.mil || 3) + 3; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 300; b.aprov = Math.min(100, b.aprov + 1); }
    if (b.money > 1200 && Math.random() < 0.05) { b.money -= 200; b.aprov = Math.min(100, b.aprov + 1); }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 700; b.money += 800; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.mil = (b.mil || 3) + 3; }
    if (b.money < 600 && Math.random() < 0.07) { b.money += 500; b.aprov = Math.max(0, b.aprov - 3); }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 600; b.mil = (b.mil || 3) + 3; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.aprov = Math.min(100, b.aprov + 6); }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 700; b.money += 500; }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 200; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 700; b.aprov = Math.min(100, b.aprov + 6); }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 450; }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 700; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 600; b.eco = (b.eco || 3) + 2; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 600; b.money += 500; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 600; b.mil = (b.mil || 3) + 3; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.money += 400; }
    if (b.money > 1000 && Math.random() < 0.07) { b.money -= 200; b.money += 500; }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 700; b.eco = (b.eco || 3) + 2; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 300; b.money += 300; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 200; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.aprov = Math.min(100, b.aprov + 6); }
    if (b.money > 4000 && Math.random() < 0.04) { b.money -= 900; b.money += 1000; }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 600; b.eco = (b.eco || 3) + 2; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.aprov = Math.min(100, b.aprov + 5); }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 500; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 300; b.mil = (b.mil || 3) + 1; }
    if (b.money > 800 && Math.random() < 0.07) { b.money += 500; }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 700; b.money += 700; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 500; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.money += 500; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 500; b.money += 450; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.money += 350; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 450; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 400; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.money += 500; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.money += 700; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 300; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 200; b.money += 400; }
    if (b.money > 4000 && Math.random() < 0.04) { b.money -= 800; b.money += 900; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.aprov = Math.min(100, b.aprov + 4); }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 200; b.money += 300; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.money += 400; }
    if (b.money > 2000 && Math.random() < 0.06) { b.money -= 400; b.money += 300; }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 600; b.money += 500; }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 600; b.money += 600; }
    if (b.money > 2000 && Math.random() < 0.06) { b.money -= 400; b.money += 350; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.money += 250; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.money += 400; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.money += 400; }
    if (b.money > 3500 && Math.random() < 0.04) { b.money -= 700; b.money += 650; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.money += 250; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.money += 300; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 350; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 3500 && Math.random() < 0.04) { b.money -= 700; b.money += 500; }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 600; b.money += 550; }
    if (b.money > 3000 && Math.random() < 0.04) { b.money -= 600; b.money += 550; }
    if (b.money > 5000 && Math.random() < 0.03) { b.money -= 1000; b.money += 800; }
    if (b.money > 4500 && Math.random() < 0.03) { b.money -= 900; b.money += 700; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 350; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.money += 300; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.money += 250; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 350; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 5000 && Math.random() < 0.03) { b.money -= 1000; b.money += 900; }
    if (b.money > 6000 && Math.random() < 0.03) { b.money -= 1200; b.money += 900; }
    if (b.money > 4500 && Math.random() < 0.03) { b.money -= 900; b.money += 700; }
    if (b.money > 2500 && Math.random() < 0.05) { b.money -= 500; b.money += 400; }
    if (b.money > 4000 && Math.random() < 0.03) { b.money -= 800; b.money += 700; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 1500 && Math.random() < 0.06) { b.money -= 300; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 2000 && Math.random() < 0.05) { b.money -= 400; b.money += 350; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 350; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 350; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 350; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 350; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 350; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 350; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 350; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 250; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 350; }
    if (b.money > 1000 && Math.random() < 0.06) { b.money -= 200; b.money += 150; }
    if (b.money > 800 && Math.random() < 0.06) { b.money -= 150; b.money += 200; }
    if (b.money > 1200 && Math.random() < 0.06) { b.money -= 250; b.money += 300; }
    if ((b.nukeShieldUntil || 0) <= room.turn && b.money > 1500 && Math.random() < 0.05) { b.money -= 400; b.nukeShieldUntil = room.turn + 6; }
    if ((b.debt || 0) > 0 && b.money > 2000 && Math.random() < 0.08) { b.money -= 300; b.debt = Math.max(0, b.debt - 360); }
    if (b.money > 3000 && Math.random() < 0.05 && (b.units.infantaria || 0) < UNIT_MAX) { b.money -= 400; b.units.infantaria = Math.min(UNIT_MAX, (b.units.infantaria || 0) + 2); }
    if ((b.armsEmbargoUntil || 0) > room.turn && b.money > 1200 && Math.random() < 0.1) { b.money -= 300; b.armsEmbargoUntil = 0; }
    if (b.money > 2500 && Math.random() < 0.04) { b.money -= 500; b.aprov = Math.min(100, b.aprov + 3); }
    if (b.money > 1500 && Math.random() < 0.05) { b.money -= 200; b.aprov = Math.min(100, b.aprov + 2); }
    if (b.money > 2000 && Math.random() < 0.04) { b.money -= 100; b.influencia = Math.min(100, (b.influencia || 0) + 2); }
    if (b.ideology && b.money > 500 && Math.random() < 0.25) { const tgts2 = room.players.filter(o => o.alive && o !== b && o.ideology !== b.ideology); if (tgts2.length) { const t4 = tgts2[Math.floor(Math.random() * tgts2.length)]; if (Math.random() < 0.3 + relBetween(b, t4) / 200) { t4.ideology = b.ideology; bumpRel(b, t4, 10); b.stats.doutrinacoes = (b.stats.doutrinacoes || 0) + 1; log(room, `⚖️ ${cname(b)} espalhou sua ideologia para ${cname(t4)}!`); } } }
    if ((b.nuclear || 0) >= 3 && (b.wars || []).length && (b.mil || 0) < 6 && Math.random() < 0.3) { const fw = room.players.find(o => o.alive && (b.wars || []).includes(o.id)); if (fw) { b.nuclear -= 1; const sh = techLevel(fw, 'interceptadores') > 0 || (fw.space || 0) >= 5; fw.mil = Math.max(1, Math.round(fw.mil * (sh ? 0.7 : 0.4))); fw.aprov = Math.max(0, fw.aprov - (sh ? 10 : 20)); b.aprov = Math.max(0, b.aprov - 10); room.nukesUsed = (room.nukesUsed || 0) + 1; if (room.nukesUsed >= 3 && !(room.turn < room.invernoUntil)) { room.invernoUntil = room.turn + 6; log(room, `❄️ INVERNO NUCLEAR! ${room.nukesUsed} ogivas detonadas — renda global -10% por 6 semanas.`); record(room, `❄️ INVERNO NUCLEAR começou (dia ${room.day}).`); } log(room, `☢️💥 ${cname(b)} LANÇOU UM MÍSSIL NUCLEAR em ${cname(fw)}!${sh ? ' (Defesa Antiaérea reduziu os danos!)' : ' Devastação total.'}`); record(room, `☢️ ${cname(b)} lançou ogiva em ${cname(fw)} (dia ${room.day}).`); } }
    if ((b.space || 0) < 3 && b.money > 5000 && Math.random() < 0.1) { b.money -= 1200; b.space = (b.space || 0) + 1; }
    if (b.money < 300 && (b.debt || 0) <= 2000 && Math.random() < 0.3) { b.money += 600; b.debt = (b.debt || 0) + 720; }
    if (b.debt > 0 && b.money > 1500) { const bx = Math.min(b.debt, Math.floor(b.money * 0.4)); b.money -= bx; b.debt -= bx; }
    if ((b.espioes || 0) < 3 && b.money > 800) { b.money -= 150; b.espioes = (b.espioes || 0) + 1; }
    if ((b.spyShieldUntil || 0) < room.day && b.money > 1500 && Math.random() < 0.1) { b.money -= 250; b.spyShieldUntil = room.day + 14; }
    if ((b.espioes || 0) >= 2 && b.money > 1200 && Math.random() < 0.08) { const fn = room.players.find(o => o.alive && o !== b && (o.nuclear || 0) > 0 && relBetween(b, o) < 30); if (fn && Math.random() < 0.5) { b.money -= 400; fn.nuclear = Math.max(0, fn.nuclear - 1); log(room, `☢️ STUXNET! Agentes de ${cname(b)} sabotaram o programa nuclear de ${cname(fn)}!`); } }
    if ((b.espioes || 0) >= 2 && b.money > 600 && Math.random() < 0.2) { const fs = room.players.filter(o => o.alive && o !== b && relBetween(b, o) < 40); if (fs.length) { const ft = fs[Math.floor(Math.random() * fs.length)]; b.money -= 150; const sAb = (b.seguranca && b.seguranca.secreto) || 0; const sDb = (ft.seguranca && ft.seguranca.secreto) || 0; if (Math.random() < Math.min(0.9, 0.5 + 0.08 * sAb + 0.05 * (b.espioes || 0))) { if (sDb >= 2 && Math.random() < 0.15 * sDb) { b.espioes = Math.max(0, (b.espioes || 0) - 1); log(room, `🕵️ O Serviço Secreto de ${cname(ft)} DETECTOU e conteve a sabotagem de ${cname(b)}! Um agente foi capturado.`); } else { const prs = ownProvinces(ft).filter(pr => pr.infra > 0); if (prs.length) { const pr = prs[Math.floor(Math.random() * prs.length)]; pr.infra -= 1; log(room, `🧨 Sabotagem de ${cname(b)} destrói infraestrutura em ${cname(ft)}!`); } else { ft.mil = Math.max(1, ft.mil - 3); log(room, `🧨 Sabotagem de ${cname(b)} danifica o arsenal de ${cname(ft)} (-3 militar)!`); } } bumpRel(b, ft, -5); } } }
    if (!room.un && Math.random() < 0.12 && b.money > 400) { const foes = room.players.filter(o => o.alive && o !== b && relBetween(b, o) < 35); if (foes.length) { const fe = foes[Math.floor(Math.random() * foes.length)]; const tp2 = Math.random() < 0.5 ? 'condenar' : 'embargo'; b.money -= 300; room.un = { type: tp2, desc: (tp2 === 'condenar' ? 'Condenação internacional de ' : 'Embargo econômico contra ') + cname(fe) + (tp2 === 'condenar' ? ' (-6 aprovação)' : ' por 3 turnos'), target: fe.id, proposer: b.id, votes: {}, deadline: Date.now() + 20000 }; room.un.votes[b.id] = true; for (const bb of room.players) if (bb.bot && bb.alive && bb.id !== b.id) room.un.votes[bb.id] = relBetween(bb, fe) < 50; log(room, `🇺🇳 ${cname(b)} propôs resolução na ONU: ${room.un.desc}. Votação aberta!`); } }
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
    if (room.turn > 20 && humans.length && b.mil >= 8 && Math.random() * botsAlive < 0.08 * per.guerra && room.turn >= room.noWarUntil) {
      const ts = humans.filter(h => !b.allies.includes(h.id) && !b.wars.includes(h.id) && !(((b.pacts && b.pacts[h.id]) || 0) > room.turn) && relBetween(b, h) < 45 && b.mil >= h.mil * 1.75 && h.wars.length < 2 && ownProvinces(h).length > 1 && h.money > 500);
      if (ts.length) {
        const h = ts[Math.floor(Math.random() * ts.length)];
        b.wars.push(h.id); h.wars.push(b.id);
        log(room, `🤖⚔️ ${cname(b)} declarou GUERRA a ${cname(h)}!`);
        if (Math.random() < 0.25) botAttack(room, b, h);
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
function novaCrise(room, pick, tipo) {
  if (pick.crise || (pick.lastCrisis && room.day - pick.lastCrisis < 21)) { pick.money += 40; log(room, `📦 ${cname(pick)} recebe doações de rotina (+$40).`); return; }
  pick.crise = { tipo, desde: room.day };
  pick.lastCrisis = room.day;
  const dmg = { terremoto: '🏚️ TERREMOTO', pandemia: '🦠 PANDEMIA', seca: '🏜️ SECA SEVERA', enchente: '🌊 ENCHENTE', motim: '🔥 MOTIM POPULAR', escandalo: '🤬 ESCÂNDALO POLÍTICO', piratas: '🏴‍☠️ ATAQUE PIRATA', terroristas: '💣 ATENTADO TERRORISTA', apagao: '⚡ APAGÃO NACIONAL', greve_geral: '✊ GREVE GERAL', manifestacao: '📢 MANIFESTAÇÃO NACIONAL', recessao: '📉 RECESSÃO ECONÔMICA' }[tipo];
  if (tipo === 'terremoto') { const prs = ownProvinces(pick).filter(pr => pr.infra > 0); if (prs.length) prs[0].infra -= 1; pick.aprov = Math.max(0, pick.aprov - 4); }
  if (tipo === 'pandemia') { pick.pop = Math.max(0, (pick.pop || 0) - 15); pick.aprov = Math.max(0, pick.aprov - 5); }
  if (tipo === 'seca') { pick.rec.comida = 0; pick.aprov = Math.max(0, pick.aprov - 3); }
  if (tipo === 'enchente') { pick.money = Math.max(0, pick.money - 200); pick.aprov = Math.max(0, pick.aprov - 3); }
  if (tipo === 'motim') { pick.money = Math.max(0, pick.money - 100); pick.aprov = Math.max(0, pick.aprov - 8); }
  if (tipo === 'escandalo') { pick.aprov = Math.max(0, pick.aprov - 10); }
  if (tipo === 'piratas') { pick.money = Math.max(0, pick.money - 300); pick.aprov = Math.max(0, pick.aprov - 4); }
  if (tipo === 'terroristas') { pick.pop = Math.max(0, (pick.pop || 0) - 5); pick.aprov = Math.max(0, pick.aprov - 6); }
  if (tipo === 'apagao') { pick.rec.energia = 0; pick.aprov = Math.max(0, pick.aprov - 5); }
  if (tipo === 'greve_geral') { pick.money = Math.max(0, pick.money - 200); pick.aprov = Math.max(0, pick.aprov - 7); }
  if (tipo === 'manifestacao') { pick.aprov = Math.max(0, pick.aprov - 6); }
  if (tipo === 'recessao') { pick.money = Math.max(0, pick.money - 300); pick.eco = Math.max(0, pick.eco - 1); pick.aprov = Math.max(0, pick.aprov - 4); }
  log(room, `${dmg} atinge ${cname(pick)}! Abra 🚨 CRISES e escolha como responder.`);
  /* FASE 366: 40% das crises viram evento sistêmico — mexe em vários sistemas */
  if (Math.random() < 0.40) dispararEventoSistemico(room, pick);
}

function resolverCrise(room, p, ch) {
  const c = p.crise; if (!c) return;
  const t = c.tipo; ch = ch | 0;
  const done = txt => { p.crise = null; log(room, txt); };
  if (t === 'terremoto') {
    if (ch === 0) { if (!spend(p, 1, 400)) return; const prs = ownProvinces(p).filter(pr => pr.infra < 5); if (prs.length) prs[0].infra = Math.min(5, prs[0].infra + 2); p.aprov = Math.min(100, p.aprov + 4); done(`🏗️ ${cname(p)} reconstruiu após o terremoto (+2 infra, +4 ❤️).`); }
    else if (ch === 1) { if (!room.proposals.some(pr => pr.from === p.id && pr.kind === 'ajuda')) room.proposals.push({ from: p.id, to: 'ALL', kind: 'ajuda' }); p.aprov = Math.min(100, p.aprov + 1); done(`🆘 ${cname(p)} pediu ajuda internacional contra o terremoto.`); }
    else { p.aprov = Math.max(0, p.aprov - 8); p.mil = Math.max(1, p.mil - 1); done(`🏚️ ${cname(p)} ignorou o terremoto (−8 ❤️, −1 militar).`); }
  } else if (t === 'pandemia') {
    if (ch === 0) { if (!spend(p, 1, 350)) return; p.aprov = Math.min(100, p.aprov + 5); done(`💉 ${cname(p)} vacinou a população (+5 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 1, 0)) return; p.money = Math.max(0, p.money - 150); p.aprov = Math.min(100, p.aprov + 2); done(`🔒 ${cname(p)} decretou lockdown (−$150, +2 ❤️).`); }
    else { p.pop = Math.max(0, (p.pop || 0) - 10); p.aprov = Math.max(0, p.aprov - 10); done(`🦠 A pandemia se alastrou em ${cname(p)} (−10 pop, −10 ❤️).`); }
  } else if (t === 'seca') {
    if (ch === 0) { if (!spend(p, 1, 250)) return; p.rec.comida += 50; p.aprov = Math.min(100, p.aprov + 3); done(`🚰 ${cname(p)} enviou caminhões-pipa (+50 comida, +3 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 2, 500)) return; p.rec.comida += 120; p.aprov = Math.min(100, p.aprov + 5); done(`🌧️ ${cname(p)} fez transposição de águas (+120 comida, +5 ❤️).`); }
    else { p.pop = Math.max(0, (p.pop || 0) - 5); p.aprov = Math.max(0, p.aprov - 8); done(`🏜️ A seca castigou ${cname(p)} (−5 pop, −8 ❤️).`); }
  } else if (t === 'enchente') {
    if (ch === 0) { if (!spend(p, 1, 200)) return; p.aprov = Math.min(100, p.aprov + 4); done(`🚤 ${cname(p)} fez resgates na enchente (+4 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 2, 450)) return; const prs = ownProvinces(p).filter(pr => pr.infra < 5); if (prs.length) prs[0].infra = Math.min(5, prs[0].infra + 1); p.aprov = Math.min(100, p.aprov + 6); done(`🏗️ ${cname(p)} fez obras de drenagem (+1 infra, +6 ❤️).`); }
    else { p.money = Math.max(0, p.money - 150); p.aprov = Math.max(0, p.aprov - 8); done(`🌊 A enchente causou prejuízos em ${cname(p)} (−$150, −8 ❤️).`); }
  } else if (t === 'motim') {
    if (ch === 0) { if (!spend(p, 1, 300)) return; p.aprov = Math.min(100, p.aprov + 6); done(`🤝 ${cname(p)} negociou com os manifestantes (+6 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 1, 100)) return; p.aprov = Math.min(100, p.aprov + 2); p.pop = Math.max(0, (p.pop || 0) - 3); done(`🪖 ${cname(p)} reprimiu o motim (+2 ❤️, −3 pop).`); }
    else { p.aprov = Math.max(0, p.aprov - 12); p.mil = Math.max(1, p.mil - 2); done(`🔥 O motim virou revolta em ${cname(p)} (−12 ❤️, −2 militar).`); }
  } else if (t === 'escandalo') {
    if (ch === 0) { if (!spend(p, 1, 200)) return; p.aprov = Math.min(100, p.aprov + 5); done(`📺 ${cname(p)} se explicou em rede nacional (+5 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 2, 0)) return; p.money = Math.max(0, p.money - 100); p.aprov = Math.min(100, p.aprov + 6); done(`🔍 CPI em ${cname(p)} puniu culpados (+6 ❤️, −$100).`); }
    else { p.aprov = Math.max(0, p.aprov - 8); p.money = Math.max(0, p.money - 200); done(`🤬 O escândalo afundou ${cname(p)} (−8 ❤️, −$200).`); }
  } else if (t === 'piratas') {
    if (ch === 0) { if (!spend(p, 1, 400)) return; p.aprov = Math.min(100, p.aprov + 2); done(`💰 ${cname(p)} pagou resgate aos piratas (−$400, +2 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 2, 100)) return; const v = ((p.units && p.units.frota) || 0) >= 1 || Math.random() < 0.5; if (v) { p.aprov = Math.min(100, p.aprov + 4); p.xp += 5; done(`⚓ ${cname(p)} DESTRUIU os piratas em operação naval (+4 ❤️, +5 XP)!`); } else { p.money = Math.max(0, p.money - 200); done(`⚓ A operação naval de ${cname(p)} falhou (−$200).`); } }
    else { p.money = Math.max(0, p.money - 500); p.aprov = Math.max(0, p.aprov - 8); done(`🏴‍☠️ Piratas saquearam ${cname(p)} (−$500, −8 ❤️).`); }
  } else if (t === 'terroristas') {
    if (ch === 0) { if (!spend(p, 2, 200)) return; p.aprov = Math.min(100, p.aprov + 5); p.xp += 5; done(`🎯 ${cname(p)} neutralizou os terroristas em operação especial (+5 ❤️, +5 XP)!`); }
    else if (ch === 1) { if (!spend(p, 1, 300)) return; p.money = Math.max(0, p.money - 200); p.aprov = Math.min(100, p.aprov + 2); done(`🤝 ${cname(p)} negociou com os terroristas (−$500 total, +2 ❤️).`); }
    else { p.pop = Math.max(0, (p.pop || 0) - 8); p.aprov = Math.max(0, p.aprov - 10); done(`💣 Onda de atentados em ${cname(p)} (−8 pop, −10 ❤️).`); }
  } else if (t === 'apagao') {
    if (ch === 0) { if (!spend(p, 1, 300)) return; p.rec.energia += 20; p.aprov = Math.min(100, p.aprov + 3); done(`🔌 ${cname(p)} importou energia emergencial (+20 energia, +3 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 1, 100)) return; p.eco = Math.max(0, p.eco - 1); p.aprov = Math.min(100, p.aprov + 1); done(`🕯️ ${cname(p)} decretou RACIONAMENTO (−1 eco, +1 ❤️).`); }
    else { p.eco = Math.max(0, p.eco - 2); p.aprov = Math.max(0, p.aprov - 10); done(`⚡ O apagão paralisou ${cname(p)} (−2 eco, −10 ❤️).`); }
  } else if (t === 'greve_geral') {
    if (ch === 0) { if (!spend(p, 1, 400)) return; p.aprov = Math.min(100, p.aprov + 5); done(`🤝 ${cname(p)} negociou com os grevistas (+5 ❤️).`); }
    else if (ch === 1) { if (!spend(p, 1, 0)) return; p.money += 200; p.aprov = Math.max(0, p.aprov - 6); done(`✂️ ${cname(p)} cortou direitos e encerrou a greve (+$200, −6 ❤️).`); }
    else { p.money = Math.max(0, p.money - 400); p.aprov = Math.max(0, p.aprov - 9); done(`✊ A greve geral afundou ${cname(p)} (−$400, −9 ❤️).`); }
  } else if (t === 'manifestacao') {
    if (ch === 0) { if (!spend(p, 1, 300)) return; p.aprov = Math.min(100, p.aprov + 6); done(`🤝 ${cname(p)} atendeu as pautas da MANIFESTAÇÃO (+6❤️).`); }
    else if (ch === 1) { if (!spend(p, 1, 100)) return; p.aprov = Math.min(100, p.aprov + 2); p.pop = Math.max(0, (p.pop || 0) - 2); done(`🪖 ${cname(p)} dispersou a MANIFESTAÇÃO (+2❤️, −2 pop).`); }
    else { p.aprov = Math.max(0, p.aprov - 10); p.eco = Math.max(0, p.eco - 1); done(`📢 A MANIFESTAÇÃO paralisou ${cname(p)} (−10❤️, −1 eco).`); }
  } else if (t === 'recessao') {
    if (ch === 0) { if (!spend(p, 2, 500)) return; p.eco += 2; p.aprov = Math.min(100, p.aprov + 4); done(`💰 ${cname(p)} lançou um PACOTE anticrise (+2 eco, +4❤️).`); }
    else if (ch === 1) { if (!spend(p, 1, 0)) return; p.money += 200; p.aprov = Math.max(0, p.aprov - 5); done(`✂️ ${cname(p)} fez AUSTERIDADE fiscal (+$200, −5❤️).`); }
    else { p.money = Math.max(0, p.money - 400); p.aprov = Math.max(0, p.aprov - 8); done(`📉 A RECESSÃO afundou ${cname(p)} (−$400, −8❤️).`); }
  } else p.crise = null;
}

function randomEvent(room) {
  if (Math.random() > 0.45) return;
  const alive = room.players.filter(p => p.alive);
  if (!alive.length) return;
  const pick = alive[Math.floor(Math.random() * alive.length)];
  switch (Math.floor(Math.random() * 22)) {
    case 0: alive.forEach(p => p.money += 80); log(room, '📈 Boom das commodities: todas as nações recebem +$80.'); break;
    case 1: pick.money = Math.max(0, pick.money - 150); log(room, `📉 Crise financeira atinge ${cname(pick)}: -$150.`); break;
    case 2: alive.forEach(p => p.aprov = Math.min(100, p.aprov + 3)); log(room, '🕊️ Cúpula de paz global: aprovação +3 para todos.'); break;
    case 3: {
      const g = (pick.seguranca && pick.seguranca.guarda) || 0;
      if (g >= 2 && Math.random() < 0.25 * g) { log(room, `🪖 A Guarda Nacional de ${cname(pick)} abortou uma tentativa de golpe!`); break; }
      const jg = ((pick.sectors && pick.sectors.justica) || 0);
      if (jg >= 2 && Math.random() < 0.15 * jg) { log(room, `⚖️ A Justiça de ${cname(pick)} barrou uma tentativa de golpe na lei!`); break; }
      pick.mil = Math.max(1, pick.mil - 2); pick.aprov = Math.max(0, pick.aprov - 4);
      log(room, `🪖 Tentativa de golpe em ${cname(pick)}: -2 militar, -4 aprovação.`); break;
    }
    case 4: pick.eco += 1; log(room, `🛢️ ${cname(pick)} descobre novas reservas: economia +1.`); break;
    case 5: pick.aprov = Math.min(100, pick.aprov + 5); log(room, `🎉 Festival nacional em ${cname(pick)}: aprovação +5.`); break;
    case 6: { const provs = ownProvinces(pick).filter(pr => pr.infra < 5); if (provs.length) { provs[0].infra += 1; log(room, `🏗️ Obra concluída em ${provs[0].name} (${cname(pick)}): infraestrutura +1.`); } break; }
    case 7: pick.influencia += 2; log(room, `🎬 Cultura de ${cname(pick)} conquista o mundo: influência +2.`); break;
    case 8: { if ((pick.defCivilUntil || 0) > room.turn) { log(room, `🛡️ Defesa Civil de ${cname(pick)} conteve o desastre (sem danos)!`); break; } const provs = ownProvinces(pick).filter(pr => pr.infra > 0); if (provs.length) { const pr = provs[0]; pr.infra -= 1; pick.emergencyUntil = room.turn + 3; log(room, `🌪️ DESASTRE em ${pr.name} (${cname(pick)}): infra -1 e EMERGÊNCIA (-20% renda por 3 turnos). Peça ou receba ajuda!`); } break; }
    case 9: { if ((pick.defCivilUntil || 0) > room.turn) { log(room, `🛡️ Defesa Civil de ${cname(pick)} conteve o terremoto (sem danos)!`); break; } const ks = Object.keys(pick.buildings).filter(k => pick.buildings[k] > 0); if (ks.length) { const k = ks[Math.floor(Math.random() * ks.length)]; pick.buildings[k] -= 1; pick.aprov = Math.max(0, pick.aprov - 5); pick.emergencyUntil = room.turn + 3; log(room, `🌍 TERREMOTO em ${cname(pick)}: ${PROD_NAMES[k] || k} destruído, -5 aprovação, EMERGÊNCIA declarada!`); } break; }
    case 10: novaCrise(room, pick, 'terremoto'); break;
    case 11: novaCrise(room, pick, 'pandemia'); break;
    case 12: novaCrise(room, pick, 'seca'); break;
    case 13: novaCrise(room, pick, 'enchente'); break;
    case 14: novaCrise(room, pick, 'motim'); break;
    case 15: novaCrise(room, pick, 'escandalo'); break;
    case 16: novaCrise(room, pick, 'piratas'); break;
    case 17: novaCrise(room, pick, 'terroristas'); break;
    case 18: novaCrise(room, pick, 'apagao'); break;
    case 19: novaCrise(room, pick, 'greve_geral'); break;
    case 20: novaCrise(room, pick, 'manifestacao'); break;
    case 21: novaCrise(room, pick, 'recessao'); break;
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
    case 'gerador_emergencia': {
      if (!spend(p, 1, 300)) return;
      p.rec.energia += 40;
      log(room, `🔌 ${cname(p)} ligou GERADORES de emergência (+40⚡).`);
      break;
    }
    case 'racionamento': {
      if (!spend(p, 1, 0)) return;
      p.racionUntil = room.day + 7; p.aprov = Math.max(0, p.aprov - 2);
      log(room, `💡 ${cname(p)} decretou RACIONAMENTO de energia (−2❤️, consumo −50% por 7 dias).`);
      break;
    }
    case 'especialista_eco': {
      if (!spend(p, 1, 500)) return;
      p.eco += 2; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🧑‍💼 ${cname(p)} contratou um ESPECIALISTA econômico (+2 eco, +1❤️).`);
      break;
    }
    case 'especialista_mil': {
      if (!spend(p, 1, 500)) return;
      p.mil += 2; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🎖️ ${cname(p)} contratou um ESPECIALISTA militar (+2 mil, +1❤️).`);
      break;
    }
    case 'investir': if (!spend(p, 1, 250)) return; p.eco += 2; log(room, `🏭 ${cname(p)} investiu na economia (+2).`); break;
    case 'militar': {
      if (room.turn < room.noArmsUntil) { err(p.conn, '🇺🇳 Recrutamento proibido por resolução da ONU.'); return; } if ((p.armsEmbargoUntil || 0) > room.turn) { err(p.conn, '🚫 Embargo de armas contra você — sem recrutar.'); return; }
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
    case 'fe': {
      /* FASE 399 — o botão FÉ existia no cliente (data-act="fe", custo [1,200])
         mas NÃO tinha handler no servidor: caía no default e não fazia nada.
         Agora envia missionários (+2 fé), alimentando dízimo e guerra santa. */
      if (!spend(p, 1, 200)) return;
      p.fe = Math.min(100, (p.fe || 0) + 2);
      log(room, `🕌 ${cname(p)} enviou missionários (+2 fé).`);
      break;
    }
    case 'religiao':
      if (!RELIGIONS[msg.value]) return;
      if (!spend(p, 1, 0)) return;
      p.religion = msg.value; p.aprov = Math.max(0, p.aprov - 5);
      log(room, `🛐 ${cname(p)} adota a religião de Estado ${RELIGIONS[msg.value].name}.`);
      break;
    case 'dizimo': {
      if ((p.fe || 0) < 5) { err(p.conn, '⛪ Precisa de 5+ fé para recolher o dízimo.'); return; }
      if (!spend(p, 1, 0)) return;
      const dz = Math.round((p.fe || 0) * 8);
      p.money += dz; p.aprov = Math.max(0, p.aprov - 3);
      log(room, `⛪ ${cname(p)} recolheu o DÍZIMO dos fiéis (+$${dz}, −3 aprovação).`);
      break;
    }
    case 'guerra_santa': {
      if (!target || target === p || !target.alive) return;
      if ((p.fe || 0) < 15) { err(p.conn, '🕌 Precisa de 15+ fé para conclamar a Guerra Santa.'); return; }
      if (!p.religion || p.religion === 'laico' || target.religion === p.religion) { err(p.conn, '🕌 Guerra Santa exige alvo de OUTRA fé.'); return; }
      if (!spend(p, 2, 200)) return;
      p.mil += 12; p.aprov = Math.min(100, p.aprov + 3);
      bumpRel(p, target, -15);
      for (const o of room.players) { if (o.alive && o !== p && o.religion === p.religion) bumpRel(p, o, 5); }
      log(room, `🕌 ${cname(p)} conclama GUERRA SANTA contra ${cname(target)}! (+12 voluntários da fé, fiéis aprovam).`);
      break;
    }
    case 'condenar_estado': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 100)) return;
      target.aprov = Math.max(0, target.aprov - 4);
      p.influencia = Math.min(100, (p.influencia || 0) + 2);
      bumpRel(p, target, -6);
      log(room, `📢 ${cname(p)} CONDENOU ${cname(target)} perante o mundo (−4❤️ deles, +2 doutrina).`);
      break;
    }
    case 'apoiar_estado': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 150)) return;
      target.aprov = Math.min(100, target.aprov + 4);
      p.influencia = Math.min(100, (p.influencia || 0) + 1);
      bumpRel(p, target, 6);
      log(room, `🤝 ${cname(p)} declarou APOIO a ${cname(target)} (+4❤️ deles, +6 relações).`);
      break;
    }
    case 'festival': {
      if (!spend(p, 1, (p.ministers.dip === 'cul' ? 150 : 300))) return;
      p.influencia = Math.min(100, (p.influencia || 0) + 5);
      p.aprov = Math.min(100, p.aprov + 4); p.money += 100;
      log(room, `🎪 ${cname(p)} realizou um FESTIVAL CULTURAL mundial (+5 doutrina, +4❤️, +$100 turismo).`);
      break;
    }
    case 'vacinacao': {
      if (!spend(p, 1, 250)) return;
      p.pop += 3; p.aprov = Math.min(100, p.aprov + 6);
      let cura = '';
      if (p.crise && p.crise.tipo === 'pandemia') { p.crise = null; cura = ' — PANDEMIA ERRADICADA!'; }
      log(room, `💉 ${cname(p)} fez VACINAÇÃO EM MASSA (+3 pop, +6❤️${cura}).`);
      break;
    }
    case 'hospital_campanha': {
      if (!spend(p, 2, 500)) return;
      p.pop += 8; p.aprov = Math.min(100, p.aprov + 5);
      if ((p.sectors.saude || 0) < 5) p.sectors.saude += 1;
      log(room, `🏥 ${cname(p)} abriu um HOSPITAL DE CAMPANHA (+8 pop, +5❤️, +1 Saúde).`);
      break;
    }
    case 'escola_tecnica': {
      if (!spend(p, 1, 350)) return;
      p.ciencia = (p.ciencia || 0) + 1; p.aprov = Math.min(100, p.aprov + 3); p.eco += 1;
      log(room, `🏫 ${cname(p)} abriu uma ESCOLA TÉCNICA (+1 ciência, +3❤️, +1 eco).`);
      break;
    }
    case 'alfabetizacao': {
      if (!spend(p, 1, 250)) return;
      p.aprov = Math.min(100, p.aprov + 5); p.pop += 2;
      log(room, `📖 ${cname(p)} lançou a campanha de ALFABETIZAÇÃO (+5❤️, +2 pop).`);
      break;
    }
    case 'universidade': {
      if (!spend(p, 2, 700)) return;
      if ((p.sectors.educacao || 0) < 5) p.sectors.educacao += 1;
      p.xp += 5; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🎓 ${cname(p)} fundou uma UNIVERSIDADE (+1 Educação, pesquisas −4%/Nv).`);
      break;
    }
    case 'operacao_policial': {
      const pol = (p.seguranca && p.seguranca.policia) || 0;
      if (pol < 1) { err(p.conn, '🚔 Precisa da Polícia estruturada (Nv 1+).'); return; }
      if (!spend(p, 1, 200)) return;
      const apre = 150 + 50 * pol;
      p.money += apre; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🚔 ${cname(p)} fez OPERAÇÃO POLICIAL contra o crime (+$${apre} apreendidos, +3❤️).`);
      break;
    }
    case 'toque_recolher': {
      const gd = (p.seguranca && p.seguranca.guarda) || 0;
      if (gd < 1) { err(p.conn, '🌙 Precisa da Guarda Nacional (Nv 1+).'); return; }
      if (!spend(p, 1, 100)) return;
      p.aprov = Math.min(100, p.aprov + 8);
      p.influencia = Math.max(0, (p.influencia || 0) - 2);
      log(room, `🌙 ${cname(p)} decretou TOQUE DE RECOLHER: ordem restaurada (+8❤️, −2 doutrina).`);
      break;
    }
    case 'termeletrica': {
      if (!spend(p, 1, 300)) return;
      p.rec.energia += 40; p.pollution = Math.min(100, (p.pollution || 0) + 2);
      log(room, `⚡ ${cname(p)} ligou TERMELÉTRICAS de emergência (+40 energia, +2 poluição).`);
      break;
    }
    case 'painel_solar': {
      if (p.solar) { err(p.conn, '☀️ Programa solar já ativo.'); return; }
      if (!spend(p, 2, 500)) return;
      p.solar = true; p.pollution = Math.max(0, (p.pollution || 0) - 1);
      log(room, `☀️ ${cname(p)} lançou o PROGRAMA SOLAR nacional (+2 energia/dia para sempre, −1 poluição).`);
      break;
    }
    case 'usina_nuclear_civil': {
      const temJaz = (p.depositos || []).includes('uranio');
      if (!temJaz && (p.rec.uranio || 0) < 5) { err(p.conn, '☢️ Precisa de jazida ou 5 urânio.'); return; }
      if (!spend(p, 2, 800)) return;
      if (!temJaz) p.rec.uranio -= 5;
      p.rec.energia += 60; p.pollution = Math.min(100, (p.pollution || 0) + 3);
      p.aprov = Math.max(0, p.aprov - 2);
      log(room, `☢️ ${cname(p)} inaugurou uma USINA NUCLEAR civil (+60 energia, +3 poluição, −2❤️).`);
      break;
    }
    case 'auditoria_fiscal': {
      if (!spend(p, 1, 200)) return;
      const rec = 100 + (p.eco || 0) * 30;
      p.money += rec;
      log(room, `🧾 ${cname(p)} fez AUDITORIA FISCAL contra sonegadores (+$${rec} recuperados).`);
      break;
    }
    case 'incentivo_fiscal': {
      if (!spend(p, 1, 400)) return;
      p.eco += 1; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏭 ${cname(p)} deu INCENTIVO FISCAL à indústria (+1 economia, +2❤️).`);
      break;
    }
    case 'olimpiada': {
      if (((p.sectors && p.sectors.esportes) || 0) < 2) { err(p.conn, '🏟️ Precisa de Esportes Nv 2+ para sediar os jogos.'); return; }
      if (!spend(p, 2, 1000)) return;
      p.aprov = Math.min(100, p.aprov + 10);
      p.influencia = Math.min(100, (p.influencia || 0) + 5);
      p.money += 300;
      log(room, `🏟️ ${cname(p)} sediou os JOGOS OLÍMPICOS! (+10❤️, +5 doutrina, +$300 turismo).`);
      break;
    }
    case 'hotel': {
      if (!spend(p, 1, 400)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏨 ${cname(p)} inaugurou um HOTEL 5 estrelas (+$250, +2❤️).`);
      break;
    }
    case 'resort': {
      if (((p.sectors && p.sectors.turismo) || 0) < 1) { err(p.conn, '🏖️ Precisa de Turismo Nv 1+ para abrir um resort.'); return; }
      if (!spend(p, 2, 800)) return;
      if ((p.sectors.turismo || 0) < 5) p.sectors.turismo += 1;
      p.money += 500; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🏖️ ${cname(p)} abriu um RESORT internacional! (+$500, +4❤️, +1 Turismo).`);
      break;
    }
    case 'marco_turistico': {
      if (!spend(p, 2, 700)) return;
      if ((p.sectors.turismo || 0) < 5) p.sectors.turismo += 1;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🗽 ${cname(p)} ergueu um MARCO TURÍSTICO mundial (+1 Turismo, +$200, +3❤️).`);
      break;
    }
    case 'conjunto_habitacional': {
      if (!spend(p, 2, 600)) return;
      if ((p.sectors.habitacao || 0) < 5) p.sectors.habitacao += 1;
      p.pop += 5; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🏠 ${cname(p)} entregou um CONJUNTO HABITACIONAL (+1 Habitação, +5 pop, +4❤️).`);
      break;
    }
    case 'aluguel_social': {
      if (((p.sectors && p.sectors.habitacao) || 0) < 1) { err(p.conn, '🏠 Precisa de Habitação Nv 1+.'); return; }
      if (!spend(p, 1, 200)) return;
      p.pop += 2; p.aprov = Math.min(100, p.aprov + 5);
      log(room, `🏠 ${cname(p)} criou o ALUGUEL SOCIAL (+2 pop, +5❤️).`);
      break;
    }
    case 'tribunal': {
      if (!spend(p, 2, 600)) return;
      if ((p.sectors.justica || 0) < 5) p.sectors.justica += 1;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `⚖️ ${cname(p)} inaugurou um TRIBUNAL federal (+1 Justiça, +$150 multas, +3❤️).`);
      break;
    }
    case 'lava_jato': {
      const jj = ((p.sectors && p.sectors.justica) || 0);
      if (jj < 2) { err(p.conn, '⚖️ Precisa de Justiça Nv 2+ para a operação.'); return; }
      if (!spend(p, 1, 250)) return;
      const dev = 200 + 50 * jj;
      p.money += dev; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⚖️ ${cname(p)} deflagrou a LAVA JATO (+$${dev} devolvidos, +4❤️).`);
      break;
    }
    case 'comicio': {
      if (!spend(p, 1, 100)) return;
      p.aprov = Math.min(100, p.aprov + 4); p.money += 50;
      log(room, `📢 ${cname(p)} fez um COMÍCIO (+4❤️, +$50 doações).`);
      break;
    }
    case 'debate': {
      if (!spend(p, 2, 0)) return;
      if (Math.random() < 0.5) { p.aprov = Math.min(100, p.aprov + 10); log(room, `🎤 ${cname(p)} VENCEU o debate nacional (+10❤️)!`); }
      else { p.aprov = Math.max(0, p.aprov - 5); log(room, `🎤 ${cname(p)} foi mal no debate (−5❤️).`); }
      break;
    }
    case 'pacificar': {
      const prs = ownProvinces(p).filter(pr => pr.infra < 5);
      if (!prs.length) { err(p.conn, '🕊️ Todas as províncias já estão pacificadas.'); return; }
      if (!spend(p, 1, 200)) return;
      prs[0].infra = Math.min(5, prs[0].infra + 1);
      p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🕊️ ${cname(p)} pacificou ${prs[0].name} com obras (+1 infra, +2❤️).`);
      break;
    }
    case 'censo': {
      if (!spend(p, 1, 100)) return;
      p.pop += 2; p.money += 50;
      log(room, `📋 ${cname(p)} fez o CENSO nacional (+2 pop contada, +$50 contribuintes).`);
      break;
    }
    case 'alistamento': {
      if (!spend(p, 1, 0)) return;
      p.mil = Math.min(25, p.mil + 2); p.aprov = Math.max(0, p.aprov - 6);
      log(room, `🪖 ${cname(p)} decretou ALISTAMENTO obrigatório (+2 militar, −6❤️).`);
      break;
    }
    case 'milicia': {
      if (!spend(p, 1, 200)) return;
      p.mil = Math.min(25, p.mil + 2); p.aprov = Math.max(0, p.aprov - 2);
      log(room, `🔫 ${cname(p)} armou MILÍCIAS paramilitares (+2 militar, −2❤️).`);
      break;
    }
    case 'emprestimo': {
      if (!spend(p, 1, 0)) return;
      p.money += 1500 + ((p.orgs || []).includes('fmi') ? 500 : 0); p.eco += 1; p.aprov = Math.max(0, p.aprov - 8);
      log(room, `🏦 ${cname(p)} pegou EMPRÉSTIMO do FMI (+$1500, +1 eco, −8❤️ austeridade).`);
      break;
    }
    case 'privatizar': {
      if (!spend(p, 1, 0)) return;
      p.money += 800; p.eco += 1; p.aprov = Math.max(0, p.aprov - 3);
      log(room, `🏷️ ${cname(p)} PRIVATIZOU uma estatal (+$800, +1 eco, −3❤️).`);
      break;
    }
    case 'peregrinacao': {
      if (!spend(p, 1, 150)) return;
      p.fe = Math.min(100, (p.fe || 0) + 3); p.money += 150; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🕋 ${cname(p)} organizou uma PEREGRINAÇÃO nacional (+3 fé, +$150 turismo, +2❤️).`);
      break;
    }
    case 'concordata': {
      if (!spend(p, 1, 300)) return;
      const bonus = p.religion !== 'laico' ? 8 : 3;
      p.fe = Math.min(100, (p.fe || 0) + 2); p.aprov = Math.min(100, p.aprov + bonus);
      log(room, `🤝 ${cname(p)} assinou CONCORDATA com líderes religiosos (+2 fé, +${bonus}❤️).`);
      break;
    }
    case 'visita_estado': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 300)) return;
      bumpRel(p, target, 15); p.aprov = Math.min(100, p.aprov + 2); p.xp += 3;
      log(room, `🤝 ${cname(p)} fez VISITA DE ESTADO a ${cname(target)} (+15 relações, +2❤️).`);
      break;
    }
    case 'intercambio': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 200)) return;
      bumpRel(p, target, 10); p.eco += 1;
      log(room, `🎓 ${cname(p)} firmou INTERCÂMBIO estudantil com ${cname(target)} (+10 relações, +1 eco).`);
      break;
    }
    case 'davis': {
      if (!spend(p, 1, 400)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 200;
      p.influencia = Math.min(100, (p.influencia || 0) + 2);
      log(room, `🎾 ${cname(p)} sediou a COPA DAVIS de tênis! (+3❤️, +$200, +2 doutrina).`);
      break;
    }
    case 'rugby': {
      if (((p.sectors && p.sectors.esportes) || 0) < 2) { err(p.conn, '🏉 Precisa de Esportes Nv 2+ para sediar a Copa do Mundo de Rugby.'); return; }
      if (!spend(p, 2, 900)) return;
      p.aprov = Math.min(100, p.aprov + 5); p.money += 600;
      p.influencia = Math.min(100, (p.influencia || 0) + 5);
      log(room, `🏉 ${cname(p)} sediou a COPA DO MUNDO DE RUGBY! (+5❤️, +$600, +5 doutrina).`);
      break;
    }
    case 'copa_mundo': {
      if (((p.sectors && p.sectors.esportes) || 0) < 2) { err(p.conn, '⚽ Precisa de Esportes Nv 2+ para sediar a Copa do Mundo.'); return; }
      if (!spend(p, 2, 1200)) return;
      p.aprov = Math.min(100, p.aprov + 6); p.money += 800;
      p.influencia = Math.min(100, (p.influencia || 0) + 6);
      log(room, `🏆 ${cname(p)} sediou a COPA DO MUNDO FIFA! (+6❤️, +$800 turismo, +6 doutrina).`);
      break;
    }
    case 'copa_nacional': {
      if (((p.sectors && p.sectors.esportes) || 0) < 1) { err(p.conn, '⚽ Precisa de Esportes Nv 1+ para sediar a copa.'); return; }
      if (!spend(p, 2, 600)) return;
      p.aprov = Math.min(100, p.aprov + 8); p.money += 300;
      p.influencia = Math.min(100, (p.influencia || 0) + 3);
      log(room, `⚽ ${cname(p)} sediou a COPA NACIONAL! (+8❤️, +$300, +3 doutrina).`);
      break;
    }
    case 'tv_estatal': {
      if (!spend(p, 1, 400)) return;
      p.aprov = Math.min(100, p.aprov + 5);
      p.influencia = Math.min(100, (p.influencia || 0) + 3);
      log(room, `📺 ${cname(p)} inaugurou a TV ESTATAL (+5❤️, +3 doutrina).`);
      break;
    }
    case 'feira_internacional': {
      if (!spend(p, 1, 200)) return;
      const ganho = 100 + 75 * (p.trades || []).length;
      p.money += ganho; p.xp += 2;
      log(room, `🚢 ${cname(p)} sediou uma FEIRA INTERNACIONAL (+$${ganho} em negócios).`);
      break;
    }
    case 'subsidio_export': {
      if (!spend(p, 1, 300)) return;
      p.subsUntil = room.turn + 3;
      log(room, `📦 ${cname(p)} criou SUBSÍDIO À EXPORTAÇÃO (+25% nas vendas por 3 turnos).`);
      break;
    }
    case 'maravilha': {
      const MW = { torre_eiffel: '🗼 Torre Eiffel', coliseu: '🏟️ Coliseu', big_ben: '🕰️ Big Ben', est_liberdade: '🗽 Estátua da Liberdade' };
      if (!MW[msg.value]) return;
      if (((p.sectors && p.sectors.turismo) || 0) < 2) { err(p.conn, '🗽 Precisa de Turismo Nv 2+ para erguer uma maravilha.'); return; }
      p.maravilhas = p.maravilhas || [];
      if (p.maravilhas.includes(msg.value)) { err(p.conn, 'Essa maravilha já foi erguida.'); return; }
      if (!spend(p, 2, 1200)) return;
      p.maravilhas.push(msg.value);
      p.money += 400; p.aprov = Math.min(100, p.aprov + 5);
      p.influencia = Math.min(100, (p.influencia || 0) + 5);
      log(room, `${cname(p)} ergueu a MARAVILHA ${MW[msg.value]}! (+$400, +5❤️, +5 doutrina, +$50/sem).`);
      break;
    }
    case 'festival_cinema': {
      if (!spend(p, 1, 250)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 150;
      p.influencia = Math.min(100, (p.influencia || 0) + 2);
      log(room, `🎬 ${cname(p)} sediou um FESTIVAL DE CINEMA mundial (+3❤️, +$150, +2 doutrina).`);
      break;
    }
    case 'policlinica': {
      if (!spend(p, 1, 300)) return;
      p.pop += 4; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🏩 ${cname(p)} inaugurou uma POLICLÍNICA (+4 pop, +3❤️).`);
      break;
    }
    case 'combate_cancer': {
      if (!spend(p, 2, 600)) return;
      p.pop += 5; p.aprov = Math.min(100, p.aprov + 6); p.ciencia = (p.ciencia || 0) + 1;
      log(room, `🎗️ ${cname(p)} lançou o programa COMBATE AO CÂNCER (+5 pop, +6❤️, +1 ciência).`);
      break;
    }
    case 'liderar_org': {
      const oid = msg.value; const ON2 = { interpol: '🚔 INTERPOL', fmi: '🏦 FMI', omc: '🌐 OMC' };
      if (!ON2[oid]) return;
      if (!(p.orgs || []).includes(oid)) { err(p.conn, 'Só membros podem disputar a liderança.'); return; }
      if (!spend(p, 2, 800)) return;
      room.orgLeader = room.orgLeader || { interpol: null, fmi: null, omc: null };
      const score = o => oid === 'interpol' ? o.mil + ((o.seguranca && o.seguranca.policia) || 0) * 2 : oid === 'fmi' ? o.eco + Math.floor(o.money / 1000) : (o.trades || []).length * 2 + o.eco;
      const cur = room.players.find(x => x.id === room.orgLeader[oid] && x.alive);
      if (!cur || score(p) > score(cur)) {
        room.orgLeader[oid] = p.id;
        log(room, `${ON2[oid]} ${cname(p)} assumiu a LIDERANÇA da organização! (+$150/sem).`);
      } else {
        log(room, `${ON2[oid]} ${cname(p)} disputou a liderança mas ${cname(cur)} segue no comando.`);
      }
      break;
    }
    case 'org_interpol': case 'org_fmi': case 'org_omc': {
      const ON = { org_interpol: ['interpol', '🚔 INTERPOL'], org_fmi: ['fmi', '🏦 FMI'], org_omc: ['omc', '🌐 OMC'] };
      const oid = ON[msg.action][0];
      p.orgs = p.orgs || [];
      if (p.orgs.includes(oid)) { err(p.conn, 'Sua nação já é membro.'); return; }
      if (!spend(p, 1, 400)) return;
      p.orgs.push(oid);
      if (oid === 'fmi') p.money += 200;
      p.aprov = Math.min(100, p.aprov + 3);
      log(room, `${ON[msg.action][1]} ${cname(p)} aderiu à ${ON[msg.action][1].split(' ')[1]}! (+3❤️${oid === 'fmi' ? ', +$200 linha de crédito' : ''}).`);
      break;
    }
    case 'emprestar': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 1000)) return;
      target.money += 1000;
      target.dividas = target.dividas || [];
      target.dividas.push({ to: p.id, valor: 1200, dia: room.day + 28 });
      bumpRel(p, target, 5);
      log(room, `💸 ${cname(p)} EMPRESTOU $1000 a ${cname(target)} (devolve $1200 em 28 dias).`);
      break;
    }
    case 'perdoar': {
      if (!target || target === p || !target.alive) return;
      target.dividas = target.dividas || [];
      const antes = target.dividas.length;
      target.dividas = target.dividas.filter(d => d.to !== p.id);
      if (target.dividas.length === antes) { err(p.conn, 'Essa nação não te deve nada.'); return; }
      if (!spend(p, 1, 0)) return;
      bumpRel(p, target, 15); p.aprov = Math.min(100, p.aprov + 2);
      log(room, `💙 ${cname(p)} PERDOOU as dívidas de ${cname(target)} (+15 relações, +2❤️).`);
      break;
    }
    case 'doar_provincia': {
      if (!target || target === p || !target.alive) return;
      const mines = ownProvinces(p).sort((a, b) => a.infra - b.infra);
      if (mines.length < 2) { err(p.conn, '🗺️ Você precisa de ao menos 2 províncias para doar uma.'); return; }
      if (!spend(p, 1, 0)) return;
      const pr = mines[0];
      pr.owner = target.id;
      p.provinces = p.provinces.filter(x => x !== pr);
      target.provinces.push(pr);
      bumpRel(p, target, 20); p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🎁 ${cname(p)} DOOU a província ${pr.name} a ${cname(target)} (+20 relações, +3❤️).`);
      break;
    }
    case 'ajuda_crise': {
      if (!target || target === p || !target.alive) return;
      if (!target.crise) { err(p.conn, 'Essa nação não está em crise.'); return; }
      if (!spend(p, 1, 300)) return;
      target.money += 300;
      bumpRel(p, target, 10);
      log(room, `💙 ${cname(p)} enviou AJUDA HUMANITÁRIA a ${cname(target)} em crise (+$300 para ela, +10 relações).`);
      break;
    }
    case 'apoiar_soberania': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 200)) return;
      bumpRel(p, target, 10); target.aprov = Math.min(100, target.aprov + 3);
      log(room, `🕊️ ${cname(p)} declarou APOIO À SOBERANIA de ${cname(target)} (+10 relações, +3❤️ para ela).`);
      break;
    }
    case 'condecorar': {
      if (!((p.stats && p.stats.vitorias) || 0)) { err(p.conn, '🎖️ Vença ao menos 1 batalha para condecorar veteranos.'); return; }
      if (!spend(p, 1, 200)) return;
      p.mil = Math.min(25, p.mil + 1); p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🎖️ ${cname(p)} CONDECOROU os veteranos de guerra (+1 militar, +3❤️).`);
      break;
    }
    case 'exercicio_naval': {
      if (!spend(p, 1, 400)) return;
      p.mil += 1; p.aprov = Math.min(100, p.aprov + 2); p.xp += 3;
      log(room, `⚓ ${cname(p)} fez EXERCÍCIO NAVAL (+1 mil, +2❤️, +3 XP).`);
      break;
    }
    case 'exercicio_conjunto': {
      if (!spend(p, 2, 600)) return;
      p.mil += 2; p.xp += 4;
      for (const aid of (p.allies || [])) { const al = room.players.find(x => x.id === aid); if (al && al.alive) bumpRel(p, al, 5); }
      log(room, `🪖 ${cname(p)} liderou EXERCÍCIO CONJUNTO com aliados (+2 mil, +4 XP, +5 relações).`);
      break;
    }
    case 'parada_militar': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 5);
      p.influencia = Math.min(100, (p.influencia || 0) + 2); p.xp += 3;
      log(room, `🎺 ${cname(p)} fez uma PARADA MILITAR (+5❤️, +2 doutrina, +3 XP).`);
      break;
    }
    case 'acordo_pesquisa': {
      if (!target || target === p || !target.alive) return;
      if (p.wars.includes(target.id)) { err(p.conn, 'Em guerra não há ciência conjunta.'); return; }
      if (!spend(p, 1, 300)) return;
      p.ciencia = (p.ciencia || 0) + 1; target.ciencia = (target.ciencia || 0) + 1;
      bumpRel(p, target, 8);
      log(room, `🔬 ${cname(p)} firmou ACORDO DE PESQUISA com ${cname(target)} (+1 ciência cada, +8 relações).`);
      break;
    }
    case 'bolsa_pesquisa': {
      if (!spend(p, 1, 400)) return;
      p.ciencia = (p.ciencia || 0) + 2; p.eco += 1;
      log(room, `🎓 ${cname(p)} criou BOLSAS DE PESQUISA (+2 ciência, +1 eco).`);
      break;
    }
    case 'nomear_comandante': {
      const CP = { marinha: '⚓ Marinha', policia: '🚔 Polícia', esportes: '🏅 Esportes', cultura: '🎭 Cultura', defesa: '🛡️ Defesa' };
      if (!CP[msg.post]) return;
      p.comandantes = p.comandantes || {};
      if (p.comandantes[msg.post]) { err(p.conn, 'Esse comando já está ocupado.'); return; }
      if (!spend(p, 1, 300)) return;
      p.comandantes[msg.post] = 1;
      if (msg.post === 'marinha') { p.units.frota = Math.min(3, (p.units.frota || 0) + 1); }
      if (msg.post === 'policia') { p.spyShieldUntil = room.day + 7; }
      if (msg.post === 'esportes') { p.aprov = Math.min(100, p.aprov + 4); }
      if (msg.post === 'cultura') { p.influencia = Math.min(100, (p.influencia || 0) + 4); }
      if (msg.post === 'defesa') { p.mil = Math.min(25, p.mil + 1); }
      log(room, `🎖️ ${cname(p)} nomeou o Comandante da ${CP[msg.post]}!`);
      break;
    }
    case 'feira_livre': {
      if (!spend(p, 1, 150)) return;
      p.pop += 2; p.aprov = Math.min(100, p.aprov + 2); p.money += 50;
      log(room, `🧺 ${cname(p)} criou FEIRAS LIVRES (+2 pop, +2❤️, +$50).`);
      break;
    }
    case 'cesta_basica': {
      if (!spend(p, 1, 200)) return;
      p.pop += 3; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🍲 ${cname(p)} distribuiu CESTAS BÁSICAS (+3 pop, +4❤️).`);
      break;
    }
    case 'entrar_cs': {
      room.cs = room.cs || [];
      if (room.cs.includes(p.id)) { err(p.conn, 'Sua nação já é membro permanente.'); return; }
      if (room.cs.length >= 5) { err(p.conn, '🛡️ O Conselho já tem 5 membros permanentes.'); return; }
      if (!spend(p, 2, 800)) return;
      room.cs.push(p.id);
      p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🛡️ ${cname(p)} virou MEMBRO PERMANENTE do Conselho de Segurança! (+1 voto, poder de veto).`);
      break;
    }
    case 'vetar': {
      room.cs = room.cs || [];
      if (!room.cs.includes(p.id)) { err(p.conn, '🛡️ Só membros do Conselho de Segurança podem vetar.'); return; }
      if (!room.un) { err(p.conn, 'Nenhuma resolução em votação.'); return; }
      if (!spend(p, 1, 0)) return;
      room.un.vetoedBy = p.id;
      log(room, `🛡️ ${cname(p)} anunciou VETO à resolução em votação!`);
      break;
    }
    case 'satelite': {
      if (!spend(p, 2, 600)) return;
      p.ciencia = (p.ciencia || 0) + 2;
      p.influencia = Math.min(100, (p.influencia || 0) + 3);
      p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🛰️ ${cname(p)} lançou um SATÉLITE nacional (+2 ciência, +3 doutrina, +2❤️).`);
      break;
    }
    case 'missao_marte': {
      if (((p.ciencia || 0)) < 3) { err(p.conn, '🔴 Precisa de 3+ ciência para a missão a Marte.'); return; }
      if (!spend(p, 1, 1500)) return;
      p.aprov = Math.min(100, p.aprov + 8);
      p.influencia = Math.min(100, (p.influencia || 0) + 8);
      p.ciencia = (p.ciencia || 0) + 3; p.xp += 10;
      log(room, `🚀🔴 ${cname(p)} lançou a MISSÃO A MARTE! (+8❤️, +8 doutrina, +3 ciência, +10 XP).`);
      break;
    }
    case 'patrulha': {
      if (((p.seguranca && p.seguranca.policia) || 0) < 1) { err(p.conn, '🚓 Precisa da Polícia Nv 1+ para patrulhar as ruas.'); return; }
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.pop += 1;
      log(room, `🚓 ${cname(p)} colocou PATRULHAS nas ruas (+3❤️, +1 pop segura).`);
      break;
    }
    case 'operacao_policial': {
      if (((p.seguranca && p.seguranca.policia) || 0) < 1) { err(p.conn, '🚓 Precisa da Polícia Nv 1+ para operações.'); return; }
      if (!spend(p, 2, 400)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🚨 ${cname(p)} fez uma OPERAÇÃO POLICIAL (+$300 bens apreendidos, +2❤️).`);
      break;
    }
    case 'museu': {
      if (!spend(p, 1, 300)) return;
      p.influencia = Math.min(100, (p.influencia || 0) + 3); p.money += 100; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏛️ ${cname(p)} inaugurou um MUSEU nacional (+3 doutrina, +$100, +2❤️).`);
      break;
    }
    case 'biblioteca': {
      if (!spend(p, 1, 250)) return;
      p.ciencia = (p.ciencia || 0) + 1; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `📚 ${cname(p)} abriu uma BIBLIOTECA pública (+1 ciência, +2❤️).`);
      break;
    }
    case 'saquear_provincia': {
      const mines = ownProvinces(p).sort((x, y) => x.infra - y.infra);
      if (mines.length < 2) { err(p.conn, '🗺️ Você precisa de ao menos 2 províncias para saquear uma.'); return; }
      if (!spend(p, 1, 0)) return;
      const v = mines[0]; const loot = 150 + (v.infra || 0) * 50;
      v.infra = Math.max(0, (v.infra || 1) - 1); p.money += loot; p.aprov = Math.max(0, p.aprov - 3);
      const conq = v.origem !== p.id ? ' conquistada' : '';
      log(room, `🏴 ${cname(p)} SAQUEOU a província${conq} ${v.name} (+$${loot}, −1 infra, −3❤️).`);
      break;
    }
    case 'cacar_piratas': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `☠️ ${cname(p)} CAÇOU PIRATAS nos mares (+$200 em espólio, +2❤️).`);
      break;
    }
    case 'operacao_antiterror': {
      if (!spend(p, 1, 250)) return;
      p.aprov = Math.min(100, p.aprov + 4); p.money += 100;
      log(room, `🛡️ ${cname(p)} lançou OPERAÇÃO ANTITERROR (+4❤️, +$100 apreendidos).`);
      break;
    }
    case 'lei_economica': {
      if (!spend(p, 1, 200)) return;
      p.eco = (p.eco || 3) + 1; p.money += 250; p.aprov = Math.max(0, p.aprov - 2);
      log(room, `⚖️ ${cname(p)} promulgou LEI ECONÔMICA (+1 eco, +$250, −2❤️).`);
      break;
    }
    case 'lei_social': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 5);
      log(room, `⚖️ ${cname(p)} promulgou LEI SOCIAL (+5❤️).`);
      break;
    }
    case 'intimidar_provincia': {
      if (!spend(p, 1, 100)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 100;
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -3);
      log(room, `😠 ${cname(p)} INTIMIDOU as províncias: ordem pelo medo (+3❤️, +$100, −3 relações).`);
      break;
    }
    case 'olimpiadas': {
      if (!spend(p, 1, 800)) return;
      p.aprov = Math.min(100, p.aprov + 8); p.eco = (p.eco || 3) + 2; p.money += 500;
      log(room, `🏟️ ${cname(p)} sediou as OLIMPÍADAS (+8❤️, +2 eco, +$500).`);
      break;
    }
    case 'vila_olimpica': {
      if (!spend(p, 1, 500)) return;
      p.aprov = Math.min(100, p.aprov + 4); p.money += 400;
      log(room, `🏘️ ${cname(p)} construiu a VILA OLÍMPICA (+4❤️, +$400).`);
      break;
    }
    case 'campanha_eleitoral': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 6);
      log(room, `📢 ${cname(p)} lançou CAMPANHA ELEITORAL (+6❤️).`);
      break;
    }
    case 'convocar_eleicoes': {
      if (!spend(p, 1, 0)) return;
      if ((p.aprov || 50) >= 50) { p.money += 600; p.aprov = Math.min(100, p.aprov + 2); log(room, `🗳️ ${cname(p)} venceu as ELEIÇÕES (+$600, +2❤️).`); }
      else { p.aprov = Math.max(0, p.aprov - 8); log(room, `🗳️ ${cname(p)} perdeu as ELEIÇÕES (−8❤️).`); }
      break;
    }
    case 'guarda_nacional': {
      if (!spend(p, 1, 400)) return;
      p.aprov = Math.min(100, p.aprov + 4); p.mil = (p.mil || 3) + 2;
      log(room, `🛡️ ${cname(p)} mobilizou a GUARDA NACIONAL (+4❤️, +2 mil).`);
      break;
    }
    case 'policia_federal': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 200;
      log(room, `🚔 ${cname(p)} acionou a POLÍCIA FEDERAL (+3❤️, +$200).`);
      break;
    }
    case 'aumentar_impostos': {
      if (!spend(p, 1, 0)) return;
      p.money += 600; p.aprov = Math.max(0, p.aprov - 4);
      log(room, `💸 ${cname(p)} AUMENTOU IMPOSTOS (+$600, −4❤️).`);
      break;
    }
    case 'reduzir_impostos': {
      if (!spend(p, 1, 100)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `💸 ${cname(p)} REDUZIU IMPOSTOS (+4❤️).`);
      break;
    }
    case 'desarmamento': {
      if (!spend(p, 1, 0)) return;
      p.mil = Math.max(1, (p.mil || 3) - 1); p.aprov = Math.min(100, p.aprov + 2);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, 5);
      log(room, `🕊️ ${cname(p)} assinou o DESARMAMENTO (+2❤️, +5 relações, −1 mil).`);
      break;
    }
    case 'inspecao_onu': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 2);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, 3);
      log(room, `🇺🇳 ${cname(p)} recebeu INSPEÇÃO DA ONU (+2❤️, +3 relações).`);
      break;
    }
    case 'banco_central': {
      if (!spend(p, 1, 600)) return;
      p.eco = (p.eco || 3) + 2; p.money += 300;
      log(room, `🏦 ${cname(p)} fundou o BANCO CENTRAL (+2 eco, +$300).`);
      break;
    }
    case 'ajustar_juros': {
      if (!spend(p, 1, 0)) return;
      p.money += 400; p.aprov = Math.max(0, p.aprov - 2);
      log(room, `📈 ${cname(p)} AJUSTOU OS JUROS (+$400, −2❤️).`);
      break;
    }
    case 'negociar_separatistas': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 5);
      log(room, `🤝 ${cname(p)} fechou ACORDO com SEPARATISTAS (+5❤️).`);
      break;
    }
    case 'reprimir_separatistas': {
      if (!spend(p, 1, 200)) return;
      p.mil = (p.mil || 3) + 1; p.aprov = Math.max(0, p.aprov - 4);
      log(room, `🔨 ${cname(p)} REPRIMIU SEPARATISTAS (+1 mil, −4❤️).`);
      break;
    }
    case 'sancoes_comerciais': {
      if (!spend(p, 1, 0)) return;
      p.money += 400;
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -2);
      log(room, `🛃 ${cname(p)} impôs SANÇÕES COMERCIAIS (+$400, −2 relações).`);
      break;
    }
    case 'tarifas_aduaneiras': {
      if (!spend(p, 1, 100)) return;
      p.money += 500; p.aprov = Math.max(0, p.aprov - 3);
      log(room, `🧾 ${cname(p)} criou TARIFAS ADUANEIRAS (+$500, −3❤️).`);
      break;
    }
    case 'interceptar_fundos': {
      if (!spend(p, 1, 0)) return;
      p.money += 300;
      log(room, `🕵️ ${cname(p)} teve FUNDOS INTERCEPTADOS de espiões (+$300).`);
      break;
    }
    case 'prender_espiao': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 150;
      log(room, `🔒 ${cname(p)} manteve ESPIÃO PRESO (+3❤️, +$150).`);
      break;
    }
    case 'quarentena': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 5);
      log(room, `🦠 ${cname(p)} decretou QUARENTENA (+5❤️).`);
      break;
    }
    case 'auxilio_emergencial': {
      if (!spend(p, 1, 500)) return;
      p.aprov = Math.min(100, p.aprov + 7);
      log(room, `🆘 ${cname(p)} pagou AUXÍLIO EMERGENCIAL (+7❤️).`);
      break;
    }
    case 'promover_general': {
      if (!spend(p, 1, 400)) return;
      p.mil = (p.mil || 3) + 3; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `⭐ ${cname(p)} PROMOVEU GENERAL (+3 mil, +2❤️).`);
      break;
    }
    case 'promover_almirante': {
      if (!spend(p, 1, 400)) return;
      p.mil = (p.mil || 3) + 2; p.money += 200;
      log(room, `⚓ ${cname(p)} PROMOVEU ALMIRANTE (+2 mil, +$200).`);
      break;
    }
    case 'ministro_saude': {
      if (!spend(p, 1, 250)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🏛️ ${cname(p)} nomeou MINISTRO DA SAÚDE (+4❤️).`);
      break;
    }
    case 'ministro_educacao': {
      if (!spend(p, 1, 250)) return;
      p.eco = (p.eco || 3) + 1; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏛️ ${cname(p)} nomeou MINISTRO DA EDUCAÇÃO (+1 eco, +2❤️).`);
      break;
    }
    case 'torre_eiffel': {
      if (!spend(p, 1, 1000)) return;
      p.aprov = Math.min(100, p.aprov + 8); p.eco = (p.eco || 3) + 1;
      log(room, `🗼 ${cname(p)} construiu a TORRE EIFFEL (+8❤️, +1 eco).`);
      break;
    }
    case 'big_ben': {
      if (!spend(p, 1, 800)) return;
      p.aprov = Math.min(100, p.aprov + 6); p.money += 500;
      log(room, `🕰️ ${cname(p)} construiu o BIG BEN (+6❤️, +$500).`);
      break;
    }
    case 'colosseu': {
      if (!spend(p, 1, 800)) return;
      p.aprov = Math.min(100, p.aprov + 6); p.money += 400;
      log(room, `🏟️ ${cname(p)} construiu o COLOSSEU (+6❤️, +$400).`);
      break;
    }
    case 'estatua_liberdade': {
      if (!spend(p, 1, 800)) return;
      p.aprov = Math.min(100, p.aprov + 5);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, 3);
      log(room, `🗽 ${cname(p)} ergueu a ESTÁTUA DA LIBERDADE (+5❤️, +3 relações).`);
      break;
    }
    case 'missao_religiosa': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 100;
      log(room, `⛪ ${cname(p)} enviou MISSÃO RELIGIOSA (+3❤️, +$100).`);
      break;
    }
    case 'santuario_nacional': {
      if (!spend(p, 1, 600)) return;
      p.aprov = Math.min(100, p.aprov + 6);
      log(room, `🛕 ${cname(p)} ergueu SANTUÁRIO NACIONAL (+6❤️).`);
      break;
    }
    case 'defesa_civil': {
      if (!spend(p, 1, 250)) return;
      p.aprov = Math.min(100, p.aprov + 4); p.defCivilUntil = room.turn + 6;
      log(room, `🌍 ${cname(p)} acionou a DEFESA CIVIL (+4❤️, protege de desastres por 6 semanas).`);
      break;
    }
    case 'ajuda_humanitaria': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 2);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, 4);
      log(room, `💗 ${cname(p)} enviou AJUDA HUMANITÁRIA (+2❤️, +4 relações).`);
      break;
    }
    case 'promover_turismo': {
      if (!spend(p, 1, 150)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `✈️ ${cname(p)} PROMOVEU O TURISMO (+$300, +2❤️).`);
      break;
    }
    case 'isentar_visto': {
      if (!spend(p, 1, 0)) return;
      p.money += 150;
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, 2);
      log(room, `🛂 ${cname(p)} deixou VISTOS ISENTOS (+$150, +2 relações).`);
      break;
    }
    case 'censura': {
      if (!spend(p, 1, 0)) return;
      p.aprov = Math.min(100, p.aprov + 3);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -2);
      log(room, `📰 ${cname(p)} impôs CENSURA (+3❤️, −2 relações).`);
      break;
    }
    case 'jornal_estatal': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📺 ${cname(p)} fundou JORNAL ESTATAL (+4❤️).`);
      break;
    }
    case 'tratado_comercial': {
      if (!spend(p, 1, 200)) return;
      p.money += 400;
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, 2);
      log(room, `🤝 ${cname(p)} assinou TRATADO COMERCIAL (+$400, +2 relações).`);
      break;
    }
    case 'zona_desmilitarizada': {
      if (!spend(p, 1, 0)) return;
      p.aprov = Math.min(100, p.aprov + 2);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, 4);
      log(room, `☮️ ${cname(p)} criou ZONA DESMILITARIZADA (+2❤️, +4 relações).`);
      break;
    }
    case 'plebiscito': {
      if (!spend(p, 1, 0)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 100;
      log(room, `🗳️ ${cname(p)} convocou PLEBISCITO (+3❤️, +$100).`);
      break;
    }
    case 'referendo': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 5);
      log(room, `🗳️ ${cname(p)} aprovou em REFERENDO (+5❤️).`);
      break;
    }
    case 'fechar_fronteiras': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 2); p.mil = (p.mil || 3) + 1;
      log(room, `🧱 ${cname(p)} manteve FRONTEIRAS FECHADAS (+2❤️, +1 mil).`);
      break;
    }
    case 'patrulha_fronteira': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 2); p.money += 200;
      log(room, `🚁 ${cname(p)} lançou PATRULHA DE FRONTEIRA (+2❤️, +$200).`);
      break;
    }
    case 'esquadrao_helicopteros': {
      if (!spend(p, 1, 500)) return;
      p.mil = (p.mil || 3) + 3; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🚁 ${cname(p)} criou ESQUADRÃO DE HELICÓPTEROS (+3 mil, +1❤️).`);
      break;
    }
    case 'batalhao_tanques': {
      if (!spend(p, 1, 500)) return;
      p.mil = (p.mil || 3) + 2; p.money += 200;
      log(room, `🛡️ ${cname(p)} formou BATALHÃO DE TANQUES (+2 mil, +$200).`);
      break;
    }
    case 'lei_marcial': {
      if (!spend(p, 1, 0)) return;
      p.mil = (p.mil || 3) + 2; p.aprov = Math.min(100, p.aprov + 2);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -3);
      log(room, `⚖️ ${cname(p)} decretou LEI MARCIAL (+2 mil, +2❤️, −3 relações).`);
      break;
    }
    case 'prevenir_golpe': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🛡️ ${cname(p)} manteve GOLPE CONTIDO (+4❤️).`);
      break;
    }
    case 'hidreletrica': {
      if (!spend(p, 1, 700)) return;
      p.eco = (p.eco || 3) + 2; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `⚡ ${cname(p)} inaugurou HIDRELÉTRICA (+2 eco, +3❤️).`);
      break;
    }
    case 'parque_eolico': {
      if (!spend(p, 1, 500)) return;
      p.eco = (p.eco || 3) + 1; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🌬️ ${cname(p)} construiu PARQUE EÓLICO (+1 eco, +3❤️).`);
      break;
    }
    case 'mina_ouro': {
      if (!spend(p, 1, 600)) return;
      p.money += 700;
      log(room, `⛏️ ${cname(p)} abriu MINA DE OURO (+$700).`);
      break;
    }
    case 'mina_uranio': {
      if (!spend(p, 1, 800)) return;
      p.money += 500; p.eco = (p.eco || 3) + 1;
      log(room, `☢️ ${cname(p)} abriu MINA DE URÂNIO (+$500, +1 eco).`);
      break;
    }
    case 'ferrovia': {
      if (!spend(p, 1, 600)) return;
      p.eco = (p.eco || 3) + 2;
      log(room, `🚂 ${cname(p)} construiu FERROVIA (+2 eco).`);
      break;
    }
    case 'porto_moderno': {
      if (!spend(p, 1, 600)) return;
      p.money += 400; p.eco = (p.eco || 3) + 1;
      log(room, `⚓ ${cname(p)} modernizou o PORTO MODERNO (+$400, +1 eco).`);
      break;
    }
    case 'negociar_greve': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 5);
      log(room, `🤝 ${cname(p)} fechou GREVE: ACORDO (+5❤️).`);
      break;
    }
    case 'reprimir_greve': {
      if (!spend(p, 1, 200)) return;
      p.mil = (p.mil || 3) + 1; p.aprov = Math.max(0, p.aprov - 4);
      log(room, `🔨 ${cname(p)} deixou GREVE REPRIMIDA (+1 mil, −4❤️).`);
      break;
    }
    case 'radar_nacional': {
      if (!spend(p, 1, 400)) return;
      p.mil = (p.mil || 3) + 2;
      log(room, `📡 ${cname(p)} ativou RADAR NACIONAL (+2 mil).`);
      break;
    }
    case 'escudo_antimissil': {
      if (!spend(p, 1, 800)) return;
      p.mil = (p.mil || 3) + 3; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🛡️ ${cname(p)} ergueu ESCUDO ANTIMÍSSIL (+3 mil, +2❤️).`);
      break;
    }
    case 'doar_dinheiro': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 1);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, 4);
      log(room, `💵 ${cname(p)} DOOU DINHEIRO ao mundo (+1❤️, +4 relações).`);
      break;
    }
    case 'comprar_influencia': {
      if (!spend(p, 1, 400)) return;
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, 5);
      log(room, `🤫 ${cname(p)} COMPROU INFLUÊNCIA (+5 relações).`);
      break;
    }
    case 'veto_onu': {
      if (!spend(p, 1, 0)) return;
      p.aprov = Math.min(100, p.aprov + 2);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -3);
      log(room, `🇺🇳 ${cname(p)} usou VETO NA ONU (+2❤️, −3 relações).`);
      break;
    }
    case 'resolucao_onu': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 1);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, 3);
      log(room, `📜 ${cname(p)} aprovou RESOLUÇÃO NA ONU (+1❤️, +3 relações).`);
      break;
    }
    case 'poco_petroleo': {
      if (!spend(p, 1, 700)) return;
      p.money += 800;
      log(room, `🛢️ ${cname(p)} perfurou POÇO DE PETRÓLEO (+$800).`);
      break;
    }
    case 'refinaria': {
      if (!spend(p, 1, 600)) return;
      p.money += 500; p.eco = (p.eco || 3) + 1;
      log(room, `🏭 ${cname(p)} construiu REFINARIA (+$500, +1 eco).`);
      break;
    }
    case 'muro_fronteira': {
      if (!spend(p, 1, 500)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.mil = (p.mil || 3) + 1;
      log(room, `🧱 ${cname(p)} ergueu MURO NA FRONTEIRA (+3❤️, +1 mil).`);
      break;
    }
    case 'alfandega': {
      if (!spend(p, 1, 200)) return;
      p.money += 350;
      log(room, `🛃 ${cname(p)} modernizou a ALFÂNDEGA (+$350).`);
      break;
    }
    case 'bateria_artilharia': {
      if (!spend(p, 1, 500)) return;
      p.mil = (p.mil || 3) + 3;
      log(room, `💥 ${cname(p)} posicionou BATERIA DE ARTILHARIA (+3 mil).`);
      break;
    }
    case 'esquadrao_bombardeiros': {
      if (!spend(p, 1, 700)) return;
      p.mil = (p.mil || 3) + 4;
      log(room, `✈️ ${cname(p)} lançou ESQUADRÃO DE BOMBARDEIROS (+4 mil).`);
      break;
    }
    case 'corte_gastos': {
      if (!spend(p, 1, 0)) return;
      p.money += 500; p.aprov = Math.max(0, p.aprov - 3);
      log(room, `✂️ ${cname(p)} fez CORTE DE GASTOS (+$500, −3❤️).`);
      break;
    }
    case 'congelar_salarios': {
      if (!spend(p, 1, 0)) return;
      p.money += 300; p.aprov = Math.max(0, p.aprov - 2);
      log(room, `🧊 ${cname(p)} decidiu CONGELAR SALÁRIOS (+$300, −2❤️).`);
      break;
    }
    case 'fragata_naval': {
      if (!spend(p, 1, 600)) return;
      p.mil = (p.mil || 3) + 3;
      log(room, `🚢 ${cname(p)} comissionou FRAGATA NAVAL (+3 mil).`);
      break;
    }
    case 'embargo_naval': {
      if (!spend(p, 1, 200)) return;
      p.money += 300;
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -3);
      log(room, `⛔ ${cname(p)} decretou EMBARGO NAVAL (+$300, −3 relações).`);
      break;
    }
    case 'constituicao': {
      if (!spend(p, 1, 500)) return;
      p.aprov = Math.min(100, p.aprov + 6); p.eco = (p.eco || 3) + 1;
      log(room, `📜 ${cname(p)} promulgou a CONSTITUIÇÃO (+6❤️, +1 eco).`);
      break;
    }
    case 'emenda_constitucional': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 3);
      log(room, `📝 ${cname(p)} aprovou EMENDA CONSTITUCIONAL (+3❤️).`);
      break;
    }
    case 'aeroporto': {
      if (!spend(p, 1, 700)) return;
      p.money += 500; p.eco = (p.eco || 3) + 1;
      log(room, `✈️ ${cname(p)} inaugurou AEROPORTO (+$500, +1 eco).`);
      break;
    }
    case 'arsenal': {
      if (!spend(p, 1, 500)) return;
      p.mil = (p.mil || 3) + 3;
      log(room, `🔫 ${cname(p)} construiu ARSENAL (+3 mil).`);
      break;
    }
    case 'impor_ideologia': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -3);
      log(room, `💡 ${cname(p)} IMPÔS SUA IDEOLOGIA (+4❤️, −3 relações).`);
      break;
    }
    case 'exportar_ideologia': {
      if (!spend(p, 1, 300)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -1);
      log(room, `🌍 ${cname(p)} EXPORTOU IDEOLOGIA (+$200, +2❤️, −1 relações).`);
      break;
    }
    case 'guerra_drogas': {
      if (!spend(p, 1, 400)) return;
      p.aprov = Math.min(100, p.aprov + 4); p.money += 200;
      log(room, `💊 ${cname(p)} declarou GUERRA ÀS DROGAS (+4❤️, +$200).`);
      break;
    }
    case 'reabilitacao': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 5);
      log(room, `💚 ${cname(p)} criou programa de REABILITAÇÃO (+5❤️).`);
      break;
    }
    case 'estadio': {
      if (!spend(p, 1, 700)) return;
      p.aprov = Math.min(100, p.aprov + 6); p.money += 300;
      log(room, `🏟️ ${cname(p)} construiu ESTÁDIO (+6❤️, +$300).`);
      break;
    }
    case 'ginasio': {
      if (!spend(p, 1, 400)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🏀 ${cname(p)} construiu GINÁSIO (+4❤️).`);
      break;
    }
    case 'serraria': {
      if (!spend(p, 1, 400)) return;
      p.money += 450;
      log(room, `🪓 ${cname(p)} abriu SERRARIA (+$450).`);
      break;
    }
    case 'madeireira': {
      if (!spend(p, 1, 500)) return;
      p.money += 500; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🪵 ${cname(p)} abriu MADEIREIRA (+$500, +1❤️).`);
      break;
    }
    case 'metro': {
      if (!spend(p, 1, 700)) return;
      p.aprov = Math.min(100, p.aprov + 4); p.eco = (p.eco || 3) + 1;
      log(room, `🚇 ${cname(p)} inaugurou METRÔ (+4❤️, +1 eco).`);
      break;
    }
    case 'trem_bala': {
      if (!spend(p, 1, 800)) return;
      p.aprov = Math.min(100, p.aprov + 5); p.eco = (p.eco || 3) + 1;
      log(room, `🚄 ${cname(p)} inaugurou TREM-BALA (+5❤️, +1 eco).`);
      break;
    }
    case 'ponte': {
      if (!spend(p, 1, 600)) return;
      p.eco = (p.eco || 3) + 2;
      log(room, `🌉 ${cname(p)} construiu PONTE (+2 eco).`);
      break;
    }
    case 'tunel': {
      if (!spend(p, 1, 600)) return;
      p.money += 300; p.eco = (p.eco || 3) + 1;
      log(room, `🚇 ${cname(p)} perfurou TÚNEL (+$300, +1 eco).`);
      break;
    }
    case 'mina_ferro': {
      if (!spend(p, 1, 600)) return;
      p.money += 500; p.mil = (p.mil || 3) + 1;
      log(room, `⛏️ ${cname(p)} abriu MINA DE FERRO (+$500, +1 mil).`);
      break;
    }
    case 'siderurgica': {
      if (!spend(p, 1, 800)) return;
      p.money += 600; p.eco = (p.eco || 3) + 1;
      log(room, `🏭 ${cname(p)} ergueu SIDERÚRGICA (+$600, +1 eco).`);
      break;
    }
    case 'esquadrao_drones': {
      if (!spend(p, 1, 600)) return;
      p.mil = (p.mil || 3) + 3;
      log(room, `🛸 ${cname(p)} ativou ESQUADRÃO DE DRONES (+3 mil).`);
      break;
    }
    case 'base_misseis': {
      if (!spend(p, 1, 900)) return;
      p.mil = (p.mil || 3) + 4; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🚀 ${cname(p)} instalou BASE DE MÍSSEIS (+4 mil, +1❤️).`);
      break;
    }
    case 'pesca_artesanal': {
      if (!spend(p, 1, 300)) return;
      p.money += 400; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🎣 ${cname(p)} incentivou PESCA ARTESANAL (+$400, +1❤️).`);
      break;
    }
    case 'porto_pesca': {
      if (!spend(p, 1, 500)) return;
      p.money += 500;
      log(room, `⚓ ${cname(p)} construiu PORTO DE PESCA (+$500).`);
      break;
    }
    case 'exportar_cafe': {
      if (!spend(p, 1, 200)) return;
      p.money += 500;
      log(room, `☕ ${cname(p)} deixou CAFÉ EXPORTADO (+$500).`);
      break;
    }
    case 'exportar_cacau': {
      if (!spend(p, 1, 200)) return;
      p.money += 400; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍫 ${cname(p)} deixou CACAU EXPORTADO (+$400, +2❤️).`);
      break;
    }
    case 'barragem': {
      if (!spend(p, 1, 700)) return;
      p.eco = (p.eco || 3) + 2;
      log(room, `💧 ${cname(p)} construiu BARRAGEM (+2 eco).`);
      break;
    }
    case 'saneamento': {
      if (!spend(p, 1, 500)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🚿 ${cname(p)} ampliou SANEAMENTO (+4❤️).`);
      break;
    }
    case 'reciclagem': {
      if (!spend(p, 1, 300)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `♻️ ${cname(p)} lançou RECICLAGEM (+$300, +2❤️).`);
      break;
    }
    case 'coleta_seletiva': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🗑️ ${cname(p)} criou COLETA SELETIVA (+4❤️).`);
      break;
    }
    case 'anistia': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⚖️ ${cname(p)} concedeu ANISTIA (+4❤️).`);
      break;
    }
    case 'indulto': {
      if (!spend(p, 1, 100)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 100;
      log(room, `🕊️ ${cname(p)} assinou INDULTO (+3❤️, +$100).`);
      break;
    }
    case 'corpo_bombeiros': {
      if (!spend(p, 1, 400)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🚒 ${cname(p)} equipou o CORPO DE BOMBEIROS (+4❤️).`);
      break;
    }
    case 'guarda_municipal': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 100;
      log(room, `👮 ${cname(p)} criou GUARDA MUNICIPAL (+3❤️, +$100).`);
      break;
    }
    case 'aumentar_salario_minimo': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 6);
      log(room, `💰 ${cname(p)} AUMENTOU O SALÁRIO MÍNIMO (+6❤️).`);
      break;
    }
    case 'moeda_forte': {
      if (!spend(p, 1, 0)) return;
      p.money += 400; p.aprov = Math.max(0, p.aprov - 1);
      log(room, `💵 ${cname(p)} valorizou a MOEDA FORTE (+$400, −1❤️).`);
      break;
    }
    case 'plataforma_petroleo': {
      if (!spend(p, 1, 900)) return;
      p.money += 1000;
      log(room, `🛢️ ${cname(p)} instalou PLATAFORMA DE PETRÓLEO (+$1000).`);
      break;
    }
    case 'garimpo_legal': {
      if (!spend(p, 1, 400)) return;
      p.money += 550;
      log(room, `⛏️ ${cname(p)} abriu GARIMPO LEGAL (+$550).`);
      break;
    }
    case 'rodovia': {
      if (!spend(p, 1, 600)) return;
      p.eco = (p.eco || 3) + 2;
      log(room, `🛣️ ${cname(p)} asfaltou RODOVIA (+2 eco).`);
      break;
    }
    case 'pedagio': {
      if (!spend(p, 1, 100)) return;
      p.money += 400;
      log(room, `💰 ${cname(p)} instalou PEDÁGIO (+$400).`);
      break;
    }
    case 'observatorio': {
      if (!spend(p, 1, 500)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.eco = (p.eco || 3) + 1;
      log(room, `🔭 ${cname(p)} fundou OBSERVATÓRIO (+3❤️, +1 eco).`);
      break;
    }
    case 'farol': {
      if (!spend(p, 1, 300)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🗼 ${cname(p)} acendeu FAROL (+$250, +2❤️).`);
      break;
    }
    case 'unesco': {
      if (!spend(p, 1, 400)) return;
      p.aprov = Math.min(100, p.aprov + 5);
      log(room, `🏛️ ${cname(p)} ganhou selo UNESCO (+5❤️).`);
      break;
    }
    case 'patrimonio_historico': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🏰 ${cname(p)} tombou PATRIMÔNIO HISTÓRICO (+4❤️).`);
      break;
    }
    case 'presidio': {
      if (!spend(p, 1, 400)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 100;
      log(room, `🔒 ${cname(p)} construiu PRESÍDIO (+3❤️, +$100).`);
      break;
    }
    case 'penitenciaria': {
      if (!spend(p, 1, 500)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⛓️ ${cname(p)} ergueu PENITENCIÁRIA (+4❤️).`);
      break;
    }
    case 'delegacia': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 150;
      log(room, `🚔 ${cname(p)} abriu DELEGACIA (+3❤️, +$150).`);
      break;
    }
    case 'distrito_policial': {
      if (!spend(p, 1, 250)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🚨 ${cname(p)} criou DISTRITO POLICIAL (+4❤️).`);
      break;
    }
    case 'salina': {
      if (!spend(p, 1, 400)) return;
      p.money += 500;
      log(room, `🧂 ${cname(p)} explorou SALINA (+$500).`);
      break;
    }
    case 'engenho': {
      if (!spend(p, 1, 500)) return;
      p.money += 550; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🎋 ${cname(p)} moeu cana no ENGENHO (+$550, +1❤️).`);
      break;
    }
    case 'compostagem': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌱 ${cname(p)} lançou COMPOSTAGEM (+$150, +2❤️).`);
      break;
    }
    case 'aterro_sanitario': {
      if (!spend(p, 1, 400)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🗑️ ${cname(p)} construiu ATERRO SANITÁRIO (+$200, +3❤️).`);
      break;
    }
    case 'torre_vigia': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 2); p.mil = (p.mil || 3) + 1;
      log(room, `🗼 ${cname(p)} ergueu TORRE DE VIGIA (+2❤️, +1 mil).`);
      break;
    }
    case 'muralha': {
      if (!spend(p, 1, 600)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.mil = (p.mil || 3) + 2;
      log(room, `🧱 ${cname(p)} ergueu MURALHA (+3❤️, +2 mil).`);
      break;
    }
    case 'loteria': {
      if (!spend(p, 1, 0)) return;
      p.money += 500; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🎰 ${cname(p)} lançou LOTERIA (+$500, +1❤️).`);
      break;
    }
    case 'cassino': {
      if (!spend(p, 1, 300)) return;
      p.money += 600; p.aprov = Math.max(0, p.aprov - 2);
      log(room, `🎲 ${cname(p)} legalizou CASSINO (+$600, −2❤️).`);
      break;
    }
    case 'gasoduto': {
      if (!spend(p, 1, 700)) return;
      p.money += 700; p.eco = (p.eco || 3) + 1;
      log(room, `🔥 ${cname(p)} construiu GASODUTO (+$700, +1 eco).`);
      break;
    }
    case 'oleoduto': {
      if (!spend(p, 1, 700)) return;
      p.money += 800;
      log(room, `🛢️ ${cname(p)} construiu OLEODUTO (+$800).`);
      break;
    }
    case 'silo': {
      if (!spend(p, 1, 400)) return;
      p.money += 500;
      log(room, `🌾 ${cname(p)} encheu SILO (+$500).`);
      break;
    }
    case 'armazem': {
      if (!spend(p, 1, 400)) return;
      p.money += 450; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🏚️ ${cname(p)} abriu ARMAZÉM (+$450, +1❤️).`);
      break;
    }
    case 'estufa': {
      if (!spend(p, 1, 500)) return;
      p.money += 500; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌱 ${cname(p)} cultivou ESTUFA (+$500, +2❤️).`);
      break;
    }
    case 'hidroponia': {
      if (!spend(p, 1, 600)) return;
      p.money += 600;
      log(room, `💧 ${cname(p)} plantou HIDROPONIA (+$600).`);
      break;
    }
    case 'irrigacao': {
      if (!spend(p, 1, 500)) return;
      p.money += 450; p.eco = (p.eco || 3) + 1;
      log(room, `💦 ${cname(p)} ligou IRRIGAÇÃO (+$450, +1 eco).`);
      break;
    }
    case 'fertilizante': {
      if (!spend(p, 1, 300)) return;
      p.money += 350;
      log(room, `🧪 ${cname(p)} distribuiu FERTILIZANTE (+$350).`);
      break;
    }
    case 'padaria': {
      if (!spend(p, 1, 300)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍞 ${cname(p)} abriu PADARIA (+$350, +2❤️).`);
      break;
    }
    case 'moinho': {
      if (!spend(p, 1, 400)) return;
      p.money += 450;
      log(room, `🌾 ${cname(p)} girou MOINHO (+$450).`);
      break;
    }
    case 'laticinio': {
      if (!spend(p, 1, 400)) return;
      p.money += 450; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🥛 ${cname(p)} abriu LATICÍNIO (+$450, +1❤️).`);
      break;
    }
    case 'frigorifico': {
      if (!spend(p, 1, 500)) return;
      p.money += 550;
      log(room, `🥩 ${cname(p)} abriu FRIGORÍFICO (+$550).`);
      break;
    }
    case 'mercado_municipal': {
      if (!spend(p, 1, 400)) return;
      p.money += 400; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏪 ${cname(p)} abriu MERCADO MUNICIPAL (+$400, +2❤️).`);
      break;
    }
    case 'ceasa': {
      if (!spend(p, 1, 500)) return;
      p.money += 550;
      log(room, `🚚 ${cname(p)} abasteceu CEASA (+$550).`);
      break;
    }
    case 'trator': {
      if (!spend(p, 1, 500)) return;
      p.money += 500; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🚜 ${cname(p)} comprou TRATOR (+$500, +1❤️).`);
      break;
    }
    case 'colheitadeira': {
      if (!spend(p, 1, 600)) return;
      p.money += 650;
      log(room, `🌾 ${cname(p)} colheu com COLHEITADEIRA (+$650).`);
      break;
    }
    case 'bolsa_valores': {
      if (!spend(p, 1, 500)) return;
      p.money += 700;
      log(room, `📈 ${cname(p)} listou na BOLSA DE VALORES (+$700).`);
      break;
    }
    case 'corretora': {
      if (!spend(p, 1, 400)) return;
      p.money += 550;
      log(room, `💹 ${cname(p)} abriu CORRETORA (+$550).`);
      break;
    }
    case 'seguro_nacional': {
      if (!spend(p, 1, 400)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🛡️ ${cname(p)} criou SEGURO NACIONAL (+$300, +3❤️).`);
      break;
    }
    case 'previdencia_privada': {
      if (!spend(p, 1, 400)) return;
      p.money += 400; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏦 ${cname(p)} fundou PREVIDÊNCIA PRIVADA (+$400, +2❤️).`);
      break;
    }
    case 'pix_nacional': {
      if (!spend(p, 1, 200)) return;
      p.money += 400;
      log(room, `📱 ${cname(p)} lançou PIX NACIONAL (+$400).`);
      break;
    }
    case 'banco_digital': {
      if (!spend(p, 1, 500)) return;
      p.money += 550; p.eco = (p.eco || 3) + 1;
      log(room, `💳 ${cname(p)} fundou BANCO DIGITAL (+$550, +1 eco).`);
      break;
    }
    case 'fundo_soberano': {
      if (!spend(p, 1, 800)) return;
      p.money += 900; p.eco = (p.eco || 3) + 1;
      log(room, `💰 ${cname(p)} capitalizou FUNDO SOBERANO (+$900, +1 eco).`);
      break;
    }
    case 'tesouro_direto': {
      if (!spend(p, 1, 300)) return;
      p.money += 450;
      log(room, `🏛️ ${cname(p)} emitiu TESOURO DIRETO (+$450).`);
      break;
    }
    case 'forum': {
      if (!spend(p, 1, 300)) return;
      p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⚖️ ${cname(p)} inaugurou FÓRUM (+4❤️).`);
      break;
    }
    case 'defensoria': {
      if (!spend(p, 1, 200)) return;
      p.aprov = Math.min(100, p.aprov + 3); p.money += 100;
      log(room, `🤝 ${cname(p)} abriu DEFENSORIA (+3❤️, +$100).`);
      break;
    }
    case 'cartorio': {
      if (!spend(p, 1, 200)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `📝 ${cname(p)} digitalizou CARTÓRIO (+$300, +1❤️).`);
      break;
    }
    case 'leilao': {
      if (!spend(p, 1, 100)) return;
      p.money += 400;
      log(room, `🔨 ${cname(p)} fez LEILÃO (+$400).`);
      break;
    }
    case 'banco_sementes': {
      if (!spend(p, 1, 300)) return;
      p.money += 400; p.eco = (p.eco || 3) + 1;
      log(room, `🌾 ${cname(p)} guardou BANCO DE SEMENTES (+$400, +1 eco).`);
      break;
    }
    case 'drone_agricola': {
      if (!spend(p, 1, 500)) return;
      p.money += 550;
      log(room, `🚁 ${cname(p)} voou DRONE AGRÍCOLA (+$550).`);
      break;
    }
    case 'teatro': {
      if (!spend(p, 1, 400)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🎭 ${cname(p)} abriu TEATRO (+$300, +3❤️).`);
      break;
    }
    case 'circo': {
      if (!spend(p, 1, 300)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🎪 ${cname(p)} montou CIRCO (+$250, +3❤️).`);
      break;
    }
    case 'arena': {
      if (!spend(p, 1, 600)) return;
      p.money += 500; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏟️ ${cname(p)} ergueu ARENA (+$500, +2❤️).`);
      break;
    }
    case 'piscina': {
      if (!spend(p, 1, 400)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🏊 ${cname(p)} inaugurou PISCINA (+$300, +3❤️).`);
      break;
    }
    case 'autodromo': {
      if (!spend(p, 1, 600)) return;
      p.money += 600; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🏎️ ${cname(p)} asfaltou AUTÓDROMO (+$600, +1❤️).`);
      break;
    }
    case 'kartodromo': {
      if (!spend(p, 1, 400)) return;
      p.money += 450;
      log(room, `🏁 ${cname(p)} abriu KARTÓDROMO (+$450).`);
      break;
    }
    case 'velodromo': {
      if (!spend(p, 1, 400)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🚴 ${cname(p)} pedala no VELODROMO (+$350, +2❤️).`);
      break;
    }
    case 'pista_skate': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🛹 ${cname(p)} manobrou na PISTA DE SKATE (+$150, +3❤️).`);
      break;
    }
    case 'restaurante_popular': {
      if (!spend(p, 1, 300)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🍽️ ${cname(p)} serviu no RESTAURANTE POPULAR (+$250, +3❤️).`);
      break;
    }
    case 'cozinha_comunitaria': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🍲 ${cname(p)} cozinhou na COZINHA COMUNITÁRIA (+$150, +4❤️).`);
      break;
    }
    case 'zoologico': {
      if (!spend(p, 1, 500)) return;
      p.money += 400; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🐘 ${cname(p)} abriu ZOOLÓGICO (+$400, +2❤️).`);
      break;
    }
    case 'aquario': {
      if (!spend(p, 1, 500)) return;
      p.money += 450; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} mergulhou no AQUÁRIO (+$450, +1❤️).`);
      break;
    }
    case 'planetario': {
      if (!spend(p, 1, 500)) return;
      p.money += 400; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🪐 ${cname(p)} olhou as estrelas no PLANETÁRIO (+$400, +2❤️).`);
      break;
    }
    case 'cinema': {
      if (!spend(p, 1, 300)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🎬 ${cname(p)} exibiu no CINEMA (+$350, +2❤️).`);
      break;
    }
    case 'parque_tematico': {
      if (!spend(p, 1, 700)) return;
      p.money += 650; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🎡 ${cname(p)} abriu PARQUE TEMÁTICO (+$650, +1❤️).`);
      break;
    }
    case 'roda_gigante': {
      if (!spend(p, 1, 500)) return;
      p.money += 500; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🎡 ${cname(p)} girou RODA-GIGANTE (+$500, +1❤️).`);
      break;
    }
    case 'maratona': {
      if (!spend(p, 1, 300)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🏃 ${cname(p)} correu MARATONA (+$250, +3❤️).`);
      break;
    }
    case 'atletismo': {
      if (!spend(p, 1, 300)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏅 ${cname(p)} competiu no ATLETISMO (+$300, +2❤️).`);
      break;
    }
    case 'natacao': {
      if (!spend(p, 1, 300)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏊 ${cname(p)} nadou na NATAÇÃO (+$300, +2❤️).`);
      break;
    }
    case 'ginastica': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🤸 ${cname(p)} fez GINÁSTICA (+$200, +3❤️).`);
      break;
    }
    case 'karaoke': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🎤 ${cname(p)} cantou no KARAOKÊ (+$250, +3❤️).`);
      break;
    }
    case 'boate': {
      if (!spend(p, 1, 300)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🪩 ${cname(p)} dançou na BOATE (+$350, +1❤️).`);
      break;
    }
    case 'fanfarra': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🎺 ${cname(p)} marchou com FANFARRA (+$150, +3❤️).`);
      break;
    }
    case 'coral': {
      if (!spend(p, 1, 150)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🎶 ${cname(p)} regeu CORAL (+$150, +3❤️).`);
      break;
    }
    case 'orquestra': {
      if (!spend(p, 1, 400)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🎻 ${cname(p)} regeu ORQUESTRA (+$350, +2❤️).`);
      break;
    }
    case 'galeria': {
      if (!spend(p, 1, 300)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🖼️ ${cname(p)} expôs na GALERIA (+$300, +2❤️).`);
      break;
    }
    case 'tirolesa': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🪂 ${cname(p)} desceu de TIROLESA (+$250, +2❤️).`);
      break;
    }
    case 'danceteria': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `💃 ${cname(p)} agitou a DANCETERIA (+$300, +2❤️).`);
      break;
    }
    case 'cristo_redentor': {
      if (!spend(p, 1, 700)) return;
      p.money += 500; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🗽 ${cname(p)} abençoou o CRISTO REDENTOR (+$500, +3❤️).`);
      break;
    }
    case 'coliseu': {
      if (!spend(p, 1, 600)) return;
      p.money += 550; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🏛️ ${cname(p)} lutou no COLISEU (+$550, +1❤️).`);
      break;
    }
    case 'piramide': {
      if (!spend(p, 1, 600)) return;
      p.money += 550; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🔺 ${cname(p)} ergueu PIRÂMIDE (+$550, +1❤️).`);
      break;
    }
    case 'muralha_china': {
      if (!spend(p, 1, 700)) return;
      p.money += 600; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🧱 ${cname(p)} caminhou na MURALHA DA CHINA (+$600, +1❤️).`);
      break;
    }
    case 'taj_mahal': {
      if (!spend(p, 1, 600)) return;
      p.money += 550; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🕌 ${cname(p)} visitou o TAJ MAHAL (+$550, +2❤️).`);
      break;
    }
    case 'opera_sydney': {
      if (!spend(p, 1, 500)) return;
      p.money += 450; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🎼 ${cname(p)} aplaudiu na ÓPERA DE SYDNEY (+$450, +2❤️).`);
      break;
    }
    case 'programa_nuclear': {
      if (!spend(p, 1, 1000)) return;
      p.money += 800; p.mil = (p.mil || 0) + 2;
      log(room, `☢️ ${cname(p)} ativou PROGRAMA NUCLEAR (+$800, +2 mil).`);
      break;
    }
    case 'foguete': {
      if (!spend(p, 1, 700)) return;
      p.money += 650; p.eco = (p.eco || 3) + 1;
      log(room, `🚀 ${cname(p)} lançou FOGUETE (+$650, +1 eco).`);
      break;
    }
    case 'estacao_espacial': {
      if (!spend(p, 1, 900)) return;
      p.money += 700; p.eco = (p.eco || 3) + 1;
      log(room, `🛰️ ${cname(p)} orbitou na ESTAÇÃO ESPACIAL (+$700, +1 eco).`);
      break;
    }
    case 'base_lunar': {
      if (!spend(p, 1, 1000)) return;
      p.money += 800;
      log(room, `🌙 ${cname(p)} pousou na BASE LUNAR (+$800).`);
      break;
    }
    case 'telescopio': {
      if (!spend(p, 1, 400)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🔭 ${cname(p)} apontou TELESCÓPIO (+$350, +2❤️).`);
      break;
    }
    case 'agente_secreto': {
      if (!spend(p, 1, 500)) return;
      p.money += 400; p.mil = (p.mil || 0) + 2;
      log(room, `🕵️ ${cname(p)} infiltrou AGENTE SECRETO (+$400, +2 mil).`);
      break;
    }
    case 'capoeira': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🤸 ${cname(p)} gingou na CAPOEIRA (+$200, +3❤️).`);
      break;
    }
    case 'samba': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🥁 ${cname(p)} sambou no SAMBA (+$200, +3❤️).`);
      break;
    }
    case 'catedral': {
      if (!spend(p, 1, 500)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `⛪ ${cname(p)} rezou na CATEDRAL (+$300, +3❤️).`);
      break;
    }
    case 'mesquita': {
      if (!spend(p, 1, 500)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🕌 ${cname(p)} orou na MESQUITA (+$300, +3❤️).`);
      break;
    }
    case 'sinagoga': {
      if (!spend(p, 1, 400)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `✡️ ${cname(p)} celebrou na SINAGOGA (+$250, +3❤️).`);
      break;
    }
    case 'terreiro': {
      if (!spend(p, 1, 300)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🪘 ${cname(p)} girou no TERREIRO (+$200, +4❤️).`);
      break;
    }
    case 'forro': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🪗 ${cname(p)} dançou FORRÓ (+$200, +3❤️).`);
      break;
    }
    case 'pagode': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🍻 ${cname(p)} cantou no PAGODE (+$200, +3❤️).`);
      break;
    }
    case 'festa_junina': {
      if (!spend(p, 1, 300)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🔥 ${cname(p)} pulou a fogueira na FESTA JUNINA (+$250, +3❤️).`);
      break;
    }
    case 'quadrilha': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `👒 ${cname(p)} dançou QUADRILHA (+$200, +3❤️).`);
      break;
    }
    case 'trio_eletrico': {
      if (!spend(p, 1, 400)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🎺 ${cname(p)} subiu no TRIO ELÉTRICO (+$350, +2❤️).`);
      break;
    }
    case 'frevo': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `☂️ ${cname(p)} sombrinhou no FREVO (+$200, +3❤️).`);
      break;
    }
    case 'maracatu': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🥁 ${cname(p)} desfilou no MARACATU (+$200, +3❤️).`);
      break;
    }
    case 'bale': {
      if (!spend(p, 1, 300)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🩰 ${cname(p)} pirou no BALÉ (+$250, +2❤️).`);
      break;
    }
    case 'vitoria_militar': {
      if (!spend(p, 1, 1000)) return;
      p.money += 900; p.mil = (p.mil || 0) + 2;
      log(room, `🏆 ${cname(p)} conquistou VITÓRIA MILITAR (+$900, +2 mil).`);
      break;
    }
    case 'vitoria_ideologica': {
      if (!spend(p, 1, 800)) return;
      p.money += 700; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🗽 ${cname(p)} espalhou VITÓRIA IDEOLÓGICA (+$700, +3❤️).`);
      break;
    }
    case 'bomba_atomica': {
      if (!spend(p, 1, 1200)) return;
      p.money += 900; p.mil = (p.mil || 0) + 3;
      log(room, `💣 ${cname(p)} detonou BOMBA ATÔMICA (+$900, +3 mil).`);
      break;
    }
    case 'ogiva': {
      if (!spend(p, 1, 800)) return;
      p.money += 650; p.mil = (p.mil || 0) + 2;
      log(room, `☢️ ${cname(p)} armou OGIVA (+$650, +2 mil).`);
      break;
    }
    case 'missil_balistico': {
      if (!spend(p, 1, 900)) return;
      p.money += 700; p.mil = (p.mil || 0) + 2;
      log(room, `🚀 ${cname(p)} disparou MÍSSIL BALÍSTICO (+$700, +2 mil).`);
      break;
    }
    case 'submarino_nuclear': {
      if (!spend(p, 1, 1100)) return;
      p.money += 850; p.mil = (p.mil || 0) + 2;
      log(room, `🛥️ ${cname(p)} submergiu SUBMARINO NUCLEAR (+$850, +2 mil).`);
      break;
    }
    case 'bunker': {
      if (!spend(p, 1, 500)) return;
      p.money += 400; p.mil = (p.mil || 0) + 2;
      log(room, `🕳️ ${cname(p)} blindou BUNKER (+$400, +2 mil).`);
      break;
    }
    case 'trincheira': {
      if (!spend(p, 1, 300)) return;
      p.money += 250; p.mil = (p.mil || 0) + 2;
      log(room, `⛏️ ${cname(p)} cavou TRINCHEIRA (+$250, +2 mil).`);
      break;
    }
    case 'vitoria_religiosa': {
      if (!spend(p, 1, 800)) return;
      p.money += 700; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🛐 ${cname(p)} pregou VITÓRIA RELIGIOSA (+$700, +3❤️).`);
      break;
    }
    case 'vitoria_diplomatica': {
      if (!spend(p, 1, 800)) return;
      p.money += 750; p.eco = (p.eco || 3) + 1;
      log(room, `🕊️ ${cname(p)} assinou VITÓRIA DIPLOMÁTICA (+$750, +1 eco).`);
      break;
    }
    case 'funk_nacional': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🎶 ${cname(p)} botou FUNK NACIONAL (+$250, +2❤️).`);
      break;
    }
    case 'sertanejo': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🤠 ${cname(p)} tocou SERTANEJO (+$250, +2❤️).`);
      break;
    }
    case 'axe': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `💃 ${cname(p)} pulou no AXÉ (+$200, +3❤️).`);
      break;
    }
    case 'lambada': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🌺 ${cname(p)} rodou na LAMBADA (+$200, +3❤️).`);
      break;
    }
    case 'micareta': {
      if (!spend(p, 1, 300)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🎭 ${cname(p)} ferveu na MICARETA (+$300, +2❤️).`);
      break;
    }
    case 'bloco_carnaval': {
      if (!spend(p, 1, 300)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥁 ${cname(p)} desfilou no BLOCO DE CARNAVAL (+$300, +2❤️).`);
      break;
    }
    case 'xote': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🪗 ${cname(p)} arrastou o pé no XOTE (+$200, +3❤️).`);
      break;
    }
    case 'baiao': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🌵 ${cname(p)} cantou BAIÃO (+$200, +3❤️).`);
      break;
    }
    case 'carro_alegorico': {
      if (!spend(p, 1, 400)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🎭 ${cname(p)} desfilou no CARRO ALEGÓRICO (+$350, +2❤️).`);
      break;
    }
    case 'fantasia_carnaval': {
      if (!spend(p, 1, 250)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `✨ ${cname(p)} vestiu FANTASIA DE CARNAVAL (+$250, +2❤️).`);
      break;
    }
    case 'acai': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍇 ${cname(p)} tomou AÇAÍ (+$250, +2❤️).`);
      break;
    }
    case 'tapioca': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🫓 ${cname(p)} recheou TAPIOCA (+$200, +2❤️).`);
      break;
    }
    case 'acaraje': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍤 ${cname(p)} fritou ACARAJÉ (+$250, +2❤️).`);
      break;
    }
    case 'vatapa': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍲 ${cname(p)} mexeu VATAPÁ (+$250, +2❤️).`);
      break;
    }
    case 'moqueca': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🥘 ${cname(p)} cozinhou MOQUECA (+$300, +1❤️).`);
      break;
    }
    case 'feijoada': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🫕 ${cname(p)} serviu FEIJOADA (+$300, +1❤️).`);
      break;
    }
    case 'pamonha': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌽 ${cname(p)} embrulhou PAMONHA (+$200, +2❤️).`);
      break;
    }
    case 'canjica': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥣 ${cname(p)} adoçou CANJICA (+$200, +2❤️).`);
      break;
    }
    case 'viola': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🎻 ${cname(p)} ponteou VIOLA (+$200, +3❤️).`);
      break;
    }
    case 'sanfona': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🪗 ${cname(p)} sanfonou SANFONA (+$200, +3❤️).`);
      break;
    }
    case 'cuscuz': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍚 ${cname(p)} cozinhou CUSCUZ (+$200, +2❤️).`);
      break;
    }
    case 'caldo_cana': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🎋 ${cname(p)} moeu CALDO DE CANA (+$200, +2❤️).`);
      break;
    }
    case 'coxinha': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍗 ${cname(p)} fritou COXINHA (+$200, +2❤️).`);
      break;
    }
    case 'brigadeiro': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍫 ${cname(p)} enrolou BRIGADEIRO (+$200, +2❤️).`);
      break;
    }
    case 'pandeiro': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🥁 ${cname(p)} repicou PANDEIRO (+$200, +3❤️).`);
      break;
    }
    case 'berimbau': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🏹 ${cname(p)} tocou BERIMBAU (+$200, +3❤️).`);
      break;
    }
    case 'cuica': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🎺 ${cname(p)} ronronou CUÍCA (+$200, +3❤️).`);
      break;
    }
    case 'tamborim': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🥁 ${cname(p)} virarou TAMBORIM (+$200, +3❤️).`);
      break;
    }
    case 'quindim': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍮 ${cname(p)} desenformou QUINDIM (+$200, +2❤️).`);
      break;
    }
    case 'pudim': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍮 ${cname(p)} caramelizou PUDIM (+$200, +2❤️).`);
      break;
    }
    case 'pacoca': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥜 ${cname(p)} socou PAÇOCA (+$200, +2❤️).`);
      break;
    }
    case 'cocada': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥥 ${cname(p)} ralou COCADA (+$200, +2❤️).`);
      break;
    }
    case 'cachaca': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🥃 ${cname(p)} destilou CACHAÇA (+$250, +1❤️).`);
      break;
    }
    case 'caipirinha': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🍋 ${cname(p)} macerou CAIPIRINHA (+$250, +1❤️).`);
      break;
    }
    case 'rapadura': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🟫 ${cname(p)} quebrou RAPADURA (+$200, +2❤️).`);
      break;
    }
    case 'bolo_fuba': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍰 ${cname(p)} assou BOLO DE FUBÁ (+$200, +2❤️).`);
      break;
    }
    case 'zabumba': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🥁 ${cname(p)} marcou ZABUMBA (+$200, +3❤️).`);
      break;
    }
    case 'reco_reco': {
      if (!spend(p, 1, 150)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🪮 ${cname(p)} raspou RECO-RECO (+$150, +3❤️).`);
      break;
    }
    case 'agogo': {
      if (!spend(p, 1, 150)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🔔 ${cname(p)} bateu AGOGÔ (+$150, +3❤️).`);
      break;
    }
    case 'atabaque': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🪘 ${cname(p)} vibrou ATABAQUE (+$200, +3❤️).`);
      break;
    }
    case 'guarana': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥤 ${cname(p)} gelou GUARANÁ (+$200, +2❤️).`);
      break;
    }
    case 'chimarrao': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🧉 ${cname(p)} ceveu CHIMARRÃO (+$200, +2❤️).`);
      break;
    }
    case 'curau': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌽 ${cname(p)} polvilhou CURAU (+$200, +2❤️).`);
      break;
    }
    case 'mungunza': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥣 ${cname(p)} cozinhou MUNGUNZÁ (+$200, +2❤️).`);
      break;
    }
    case 'bolo_milho': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌽 ${cname(p)} faturou BOLO DE MILHO (+$200, +2❤️).`);
      break;
    }
    case 'pe_de_moleque': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥜 ${cname(p)} crocou PÉ DE MOLEQUE (+$200, +2❤️).`);
      break;
    }
    case 'procissao': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⛪ ${cname(p)} seguiu PROCISSÃO (+$150, +4❤️).`);
      break;
    }
    case 'romaria': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🙏 ${cname(p)} peregrinou ROMARIA (+$150, +4❤️).`);
      break;
    }
    case 'cafe_coado': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `☕ ${cname(p)} coou CAFÉ COADO (+$200, +2❤️).`);
      break;
    }
    case 'suco_caju': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🧃 ${cname(p)} espremeu SUCO DE CAJU (+$200, +2❤️).`);
      break;
    }
    case 'terere': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🧉 ${cname(p)} gelou TERERÉ (+$200, +2❤️).`);
      break;
    }
    case 'mate_gelado': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🧊 ${cname(p)} serviu MATE GELADO (+$200, +2❤️).`);
      break;
    }
    case 'alfaia': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🥁 ${cname(p)} troou ALFAIA (+$200, +3❤️).`);
      break;
    }
    case 'surdo': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🥁 ${cname(p)} marcou SURDO (+$200, +3❤️).`);
      break;
    }
    case 'novena': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🙏 ${cname(p)} rezou NOVENA (+$150, +4❤️).`);
      break;
    }
    case 'ladainha': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📿 ${cname(p)} cantou LADAINHA (+$150, +4❤️).`);
      break;
    }
    case 'tutu': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🫘 ${cname(p)} amassou TUTU (+$200, +2❤️).`);
      break;
    }
    case 'virado': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍛 ${cname(p)} virou VIRADO (+$200, +2❤️).`);
      break;
    }
    case 'torresmo': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥓 ${cname(p)} pururucou TORRESMO (+$200, +2❤️).`);
      break;
    }
    case 'pastel_feira': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥟 ${cname(p)} fritou PASTEL DE FEIRA (+$200, +2❤️).`);
      break;
    }
    case 'missa': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⛪ ${cname(p)} celebrou MISSA (+$150, +4❤️).`);
      break;
    }
    case 'culto': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🙌 ${cname(p)} louvou no CULTO (+$150, +4❤️).`);
      break;
    }
    case 'sarapatel': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🍲 ${cname(p)} apurou SARAPATEL (+$250, +1❤️).`);
      break;
    }
    case 'buchada': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐐 ${cname(p)} recheou BUCHADA (+$250, +1❤️).`);
      break;
    }
    case 'caruru': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🥘 ${cname(p)} refogou CARURU (+$250, +1❤️).`);
      break;
    }
    case 'tacaca': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} sorveu TACACÁ (+$200, +2❤️).`);
      break;
    }
    case 'vigilia': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🕯️ ${cname(p)} velou VIGÍLIA (+$150, +4❤️).`);
      break;
    }
    case 'retiro': {
      if (!spend(p, 1, 250)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🏕️ ${cname(p)} silenciou no RETIRO (+$200, +3❤️).`);
      break;
    }
    case 'batismo': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `💧 ${cname(p)} celebrou BATISMO (+$150, +4❤️).`);
      break;
    }
    case 'crisma': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🕊️ ${cname(p)} ungiu CRISMA (+$150, +4❤️).`);
      break;
    }
    case 'repique': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🥁 ${cname(p)} dobrou REPIQUE (+$200, +3❤️).`);
      break;
    }
    case 'caixa_tarol': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🥁 ${cname(p)} rufou CAIXA TAROL (+$200, +3❤️).`);
      break;
    }
    case 'pirarucu': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou PIRARUCU (+$300, +1❤️).`);
      break;
    }
    case 'abara': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🫓 ${cname(p)} embrulhou ABARÁ (+$200, +2❤️).`);
      break;
    }
    case 'eucaristia': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⛪ ${cname(p)} comungou EUCARISTIA (+$150, +4❤️).`);
      break;
    }
    case 'casamento_comunitario': {
      if (!spend(p, 1, 300)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `💒 ${cname(p)} casou no CASAMENTO COMUNITÁRIO (+$250, +3❤️).`);
      break;
    }
    case 'acaca': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🫓 ${cname(p)} embrulhou ACAÇÁ (+$200, +2❤️).`);
      break;
    }
    case 'manisoba': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🍲 ${cname(p)} apurou MANISOBA (+$250, +1❤️).`);
      break;
    }
    case 'tambaqui': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} assou TAMBAQUI (+$300, +1❤️).`);
      break;
    }
    case 'tucunare': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} fisgou TUCUNARÉ (+$300, +1❤️).`);
      break;
    }
    case 'cupuacu': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} partiu CUPUAÇU (+$200, +2❤️).`);
      break;
    }
    case 'graviola': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} bateu GRAVIOLA (+$200, +2❤️).`);
      break;
    }
    case 'caja': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍒 ${cname(p)} chupou CAJÁ (+$200, +2❤️).`);
      break;
    }
    case 'umbu': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🫒 ${cname(p)} colheu UMBU (+$200, +2❤️).`);
      break;
    }
    case 'seriguela': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍇 ${cname(p)} catou SERIGUELA (+$200, +2❤️).`);
      break;
    }
    case 'pitanga': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍒 ${cname(p)} provou PITANGA (+$200, +2❤️).`);
      break;
    }
    case 'padroeiro': {
      if (!spend(p, 1, 250)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `⛪ ${cname(p)} festejou PADROEIRO (+$200, +3❤️).`);
      break;
    }
    case 'festejo': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🎉 ${cname(p)} animou FESTEJO (+$200, +3❤️).`);
      break;
    }
    case 'trezena': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🙏 ${cname(p)} rezou TREZENA (+$150, +4❤️).`);
      break;
    }
    case 'via_sacra': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `✝️ ${cname(p)} caminhou VIA-SACRA (+$150, +4❤️).`);
      break;
    }
    case 'ganza': {
      if (!spend(p, 1, 150)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🪇 ${cname(p)} chacoalhou GANZÁ (+$150, +3❤️).`);
      break;
    }
    case 'jabuticaba': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍇 ${cname(p)} colheu JABUTICABA (+$200, +2❤️).`);
      break;
    }
    case 'jaca': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} abriu JACA (+$200, +2❤️).`);
      break;
    }
    case 'fruta_pao': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍞 ${cname(p)} assou FRUTA-PÃO (+$200, +2❤️).`);
      break;
    }
    case 'surubim': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} pescou SURUBIM (+$300, +1❤️).`);
      break;
    }
    case 'pintado': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} fisgou PINTADO (+$300, +1❤️).`);
      break;
    }
    case 'dourada': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} grelhou DOURADA (+$300, +1❤️).`);
      break;
    }
    case 'robalo': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} serviu ROBALO (+$300, +1❤️).`);
      break;
    }
    case 'pato_tucupi': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🦆 ${cname(p)} cozinhou PATO NO TUCUPI (+$300, +1❤️).`);
      break;
    }
    case 'pequi': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🫒 ${cname(p)} roeu PEQUI (+$200, +2❤️).`);
      break;
    }
    case 'lava_pes': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🦶 ${cname(p)} celebrou LAVA-PÉS (+$150, +4❤️).`);
      break;
    }
    case 'setenario': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🙏 ${cname(p)} cumpriu SETENÁRIO (+$150, +4❤️).`);
      break;
    }
    case 'angelus': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🔔 ${cname(p)} tocou ANGELUS (+$150, +4❤️).`);
      break;
    }
    case 'te_deum': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🎶 ${cname(p)} entoou TE DEUM (+$150, +4❤️).`);
      break;
    }
    case 'jenipapo': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🫒 ${cname(p)} ralou JENIPAPO (+$200, +2❤️).`);
      break;
    }
    case 'sapoti': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} chupou SAPOTI (+$200, +2❤️).`);
      break;
    }
    case 'garoupa': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} pescou GAROUPA (+$300, +1❤️).`);
      break;
    }
    case 'traira': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} fisgou TRAÍRA (+$250, +1❤️).`);
      break;
    }
    case 'corvina': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} assou CORVINA (+$300, +1❤️).`);
      break;
    }
    case 'bagre': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐡 ${cname(p)} fritou BAGRE (+$250, +1❤️).`);
      break;
    }
    case 'murici': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍒 ${cname(p)} catou MURICI (+$200, +2❤️).`);
      break;
    }
    case 'bacuri': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} partiu BACURI (+$200, +2❤️).`);
      break;
    }
    case 'buriti': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌴 ${cname(p)} colheu BURITI (+$200, +2❤️).`);
      break;
    }
    case 'araca': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍋 ${cname(p)} provou ARAÇÁ (+$200, +2❤️).`);
      break;
    }
    case 'laudes': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🌅 ${cname(p)} cantou LAUDES (+$150, +4❤️).`);
      break;
    }
    case 'vesperas': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🌇 ${cname(p)} rezou VÉSPERAS (+$150, +4❤️).`);
      break;
    }
    case 'matinas': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🌙 ${cname(p)} velou MATINAS (+$150, +4❤️).`);
      break;
    }
    case 'completas': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🕯️ ${cname(p)} encerrou COMPLETAS (+$150, +4❤️).`);
      break;
    }
    case 'cambuci': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍋 ${cname(p)} chupou CAMBUCI (+$200, +2❤️).`);
      break;
    }
    case 'uvaia': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍊 ${cname(p)} provou UVAIA (+$200, +2❤️).`);
      break;
    }
    case 'piranha': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou PIRANHA (+$250, +1❤️).`);
      break;
    }
    case 'arraia': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} laçou ARRAIA (+$300, +1❤️).`);
      break;
    }
    case 'via_lucis': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `✨ ${cname(p)} percorreu VIA-LUCIS (+$150, +4❤️).`);
      break;
    }
    case 'prima': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🌅 ${cname(p)} rezou PRIMA (+$150, +4❤️).`);
      break;
    }
    case 'grumixama': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍒 ${cname(p)} colheu GRUMIXAMA (+$200, +2❤️).`);
      break;
    }
    case 'pitomba': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🫒 ${cname(p)} descascou PITOMBA (+$200, +2❤️).`);
      break;
    }
    case 'tainha': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} cercou TAINHA (+$250, +1❤️).`);
      break;
    }
    case 'pescada': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐡 ${cname(p)} fritou PESCADA (+$300, +1❤️).`);
      break;
    }
    case 'tercia': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `☀️ ${cname(p)} cantou TÉRCIA (+$150, +4❤️).`);
      break;
    }
    case 'sexta': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🌤️ ${cname(p)} orou SEXTA (+$150, +4❤️).`);
      break;
    }
    case 'kyrie': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🙏 ${cname(p)} suplicou KYRIE (+$150, +4❤️).`);
      break;
    }
    case 'gloria': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🎶 ${cname(p)} entoou GLÓRIA (+$150, +4❤️).`);
      break;
    }
    case 'credo': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🙏 ${cname(p)} professou CREDO (+$150, +4❤️).`);
      break;
    }
    case 'sanctus': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🎶 ${cname(p)} cantou SANCTUS (+$150, +4❤️).`);
      break;
    }
    case 'noa': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🌇 ${cname(p)} rezou NOA (+$150, +4❤️).`);
      break;
    }
    case 'agnus': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🐑 ${cname(p)} invocou AGNUS (+$150, +4❤️).`);
      break;
    }
    case 'banco_comida': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🍲 ${cname(p)} abasteceu BANCO DE COMIDA (+$250, +3❤️).`);
      break;
    }
    case 'cofre_nacional': {
      if (!spend(p, 1, 250)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🏦 ${cname(p)} lacrou COFRE NACIONAL (+$350, +1❤️).`);
      break;
    }
    case 'anel_viario': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🛣️ ${cname(p)} inaugurou ANEL VIÁRIO (+$200, +3❤️).`);
      break;
    }
    case 'ciclovia': {
      if (!spend(p, 1, 200)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 3);
      log(room, `🚲 ${cname(p)} pintou CICLOVIA (+$200, +3❤️).`);
      break;
    }
    case 'reserva_ouro': {
      if (!spend(p, 1, 250)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🪙 ${cname(p)} guardou RESERVA DE OURO (+$350, +1❤️).`);
      break;
    }
    case 'dividendo': {
      if (!spend(p, 1, 150)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `💵 ${cname(p)} pagou DIVIDENDO (+$250, +1❤️).`);
      break;
    }
    case 'guabiroba': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} catou GUABIROBA (+$200, +2❤️).`);
      break;
    }
    case 'tamarindo': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🫘 ${cname(p)} fez suco de TAMARINDO (+$200, +2❤️).`);
      break;
    }
    case 'ressocializacao': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🤝 ${cname(p)} promoveu RESSOCIALIZAÇÃO (+$150, +4❤️).`);
      break;
    }
    case 'mutirao': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `👷 ${cname(p)} puxou MUTIRÃO (+$150, +4❤️).`);
      break;
    }
    case 'benedictus': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `✝️ ${cname(p)} cantou BENEDICTUS (+$150, +4❤️).`);
      break;
    }
    case 'hosana': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🌿 ${cname(p)} aclamou HOSANA (+$150, +4❤️).`);
      break;
    }
    case 'cabeludinha': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍒 ${cname(p)} chupou CABELUDINHA (+$200, +2❤️).`);
      break;
    }
    case 'jaracatia': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} provou JARACATIÁ (+$200, +2❤️).`);
      break;
    }
    case 'lambari': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🐟 ${cname(p)} fritou LAMBARI (+$200, +2❤️).`);
      break;
    }
    case 'piaba': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🐠 ${cname(p)} pescou PIABA (+$200, +2❤️).`);
      break;
    }
    case 'superavit': {
      if (!spend(p, 1, 250)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `📈 ${cname(p)} anunciou SUPERÁVIT (+$350, +1❤️).`);
      break;
    }
    case 'auditoria': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🔍 ${cname(p)} concluiu AUDITORIA (+$250, +2❤️).`);
      break;
    }
    case 'amparo': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🫂 ${cname(p)} ofereceu AMPARO (+$150, +4❤️).`);
      break;
    }
    case 'auxilio': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `💝 ${cname(p)} distribuiu AUXÍLIO (+$150, +4❤️).`);
      break;
    }
    case 'boldo': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} tomou chá de BOLDO (+$200, +2❤️).`);
      break;
    }
    case 'cidreira': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌿 ${cname(p)} cheirou CIDREIRA (+$200, +2❤️).`);
      break;
    }
    case 'jau': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou JAÚ (+$300, +1❤️).`);
      break;
    }
    case 'curimbata': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} assou CURIMBATÁ (+$250, +1❤️).`);
      break;
    }
    case 'pax': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🕊️ ${cname(p)} desejou PAX (+$150, +4❤️).`);
      break;
    }
    case 'alleluia': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🎺 ${cname(p)} bradou ALLELUIA (+$150, +4❤️).`);
      break;
    }
    case 'guabiju': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍒 ${cname(p)} colheu GUABIJU (+$200, +2❤️).`);
      break;
    }
    case 'feijoa': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} partiu FEIJOA (+$200, +2❤️).`);
      break;
    }
    case 'apapa': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou APAPÁ (+$300, +1❤️).`);
      break;
    }
    case 'saicanga': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} laçou SAICANGA (+$250, +1❤️).`);
      break;
    }
    case 'rentabilidade': {
      if (!spend(p, 1, 250)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `📊 ${cname(p)} bateu RENTABILIDADE (+$350, +1❤️).`);
      break;
    }
    case 'lastro': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `⚖️ ${cname(p)} reforçou LASTRO (+$250, +2❤️).`);
      break;
    }
    case 'asilo': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🏠 ${cname(p)} manteve ASILO (+$150, +4❤️).`);
      break;
    }
    case 'orfanato': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🧒 ${cname(p)} amparou ORFANATO (+$150, +4❤️).`);
      break;
    }
    case 'camomila': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} serviu CAMOMILA (+$200, +2❤️).`);
      break;
    }
    case 'hortela': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌿 ${cname(p)} plantou HORTELÃ (+$200, +2❤️).`);
      break;
    }
    case 'dourado': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou DOURADO (+$300, +1❤️).`);
      break;
    }
    case 'piracanjuba': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} assou PIRACANJUBA (+$250, +1❤️).`);
      break;
    }
    case 'miserere': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `😔 ${cname(p)} salmodiou MISERERE (+$150, +4❤️).`);
      break;
    }
    case 'exultet': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🕯️ ${cname(p)} proclamou EXULTET (+$150, +4❤️).`);
      break;
    }
    case 'pindaiba': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} colheu PINDAÍBA (+$200, +2❤️).`);
      break;
    }
    case 'nespera': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍊 ${cname(p)} chupou NÊSPERA (+$200, +2❤️).`);
      break;
    }
    case 'itui': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou ITUÍ (+$250, +1❤️).`);
      break;
    }
    case 'mandi': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🐠 ${cname(p)} fritou MANDI (+$200, +2❤️).`);
      break;
    }
    case 'cambio': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `💱 ${cname(p)} operou CÂMBIO (+$250, +2❤️).`);
      break;
    }
    case 'spread': {
      if (!spend(p, 1, 150)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `📉 ${cname(p)} apertou SPREAD (+$250, +1❤️).`);
      break;
    }
    case 'oratorio': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⛪ ${cname(p)} ergueu ORATÓRIO (+$150, +4❤️).`);
      break;
    }
    case 'edicula': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🛕 ${cname(p)} benzou EDÍCULA (+$150, +4❤️).`);
      break;
    }
    case 'erva_doce': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} adocicou ERVA-DOCE (+$200, +2❤️).`);
      break;
    }
    case 'funcho': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌿 ${cname(p)} infusionou FUNCHO (+$200, +2❤️).`);
      break;
    }
    case 'barbado': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} laçou BARBADO (+$300, +1❤️).`);
      break;
    }
    case 'cachara': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐡 ${cname(p)} fisgou CACHARA (+$300, +1❤️).`);
      break;
    }
    case 'prefacio': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📖 ${cname(p)} leu PREFÁCIO (+$150, +4❤️).`);
      break;
    }
    case 'doxologia': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🎶 ${cname(p)} entoou DOXOLOGIA (+$150, +4❤️).`);
      break;
    }
    case 'bacaba': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍇 ${cname(p)} bateu BACABA (+$200, +2❤️).`);
      break;
    }
    case 'tucuma': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥥 ${cname(p)} ralou TUCUMÃ (+$200, +2❤️).`);
      break;
    }
    case 'filhote': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou FILHOTE (+$300, +1❤️).`);
      break;
    }
    case 'piramutaba': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐡 ${cname(p)} laçou PIRAMUTABA (+$300, +1❤️).`);
      break;
    }
    case 'debenture': {
      if (!spend(p, 1, 250)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `📜 ${cname(p)} emitiu DEBÊNTURE (+$350, +1❤️).`);
      break;
    }
    case 'agio': {
      if (!spend(p, 1, 150)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `💹 ${cname(p)} cobrou ÁGIO (+$250, +1❤️).`);
      break;
    }
    case 'ermida': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⛪ ${cname(p)} visitou ERMIDA (+$150, +4❤️).`);
      break;
    }
    case 'cenaculo': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🍞 ${cname(p)} ceou no CENÁCULO (+$150, +4❤️).`);
      break;
    }
    case 'macela': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} coou MACELA (+$200, +2❤️).`);
      break;
    }
    case 'alfazema': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `💜 ${cname(p)} perfumou ALFAZEMA (+$200, +2❤️).`);
      break;
    }
    case 'mapara': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} assou MAPARÁ (+$250, +1❤️).`);
      break;
    }
    case 'jaraqui': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} fritou JARAQUI (+$250, +1❤️).`);
      break;
    }
    case 'epiclese': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🔥 ${cname(p)} invocou EPICLESE (+$150, +4❤️).`);
      break;
    }
    case 'embolismo': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📿 ${cname(p)} rezou EMBOLISMO (+$150, +4❤️).`);
      break;
    }
    case 'inaja': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌴 ${cname(p)} colheu INAJÁ (+$200, +2❤️).`);
      break;
    }
    case 'pataua': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥥 ${cname(p)} extraiu PATAUÁ (+$200, +2❤️).`);
      break;
    }
    case 'pacu': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} assou PACU (+$250, +1❤️).`);
      break;
    }
    case 'pirarara': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐡 ${cname(p)} fisgou PIRARARA (+$300, +1❤️).`);
      break;
    }
    case 'selic': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏦 ${cname(p)} ajustou SELIC (+$250, +2❤️).`);
      break;
    }
    case 'caderneta': {
      if (!spend(p, 1, 150)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `📒 ${cname(p)} rendeu CADERNETA (+$250, +1❤️).`);
      break;
    }
    case 'santuario': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⛪ ${cname(p)} peregrinou ao SANTUÁRIO (+$150, +4❤️).`);
      break;
    }
    case 'capela': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🕯️ ${cname(p)} acendeu CAPELA (+$150, +4❤️).`);
      break;
    }
    case 'carqueja': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} ferveu CARQUEJA (+$200, +2❤️).`);
      break;
    }
    case 'espinheira': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌿 ${cname(p)} macerou ESPINHEIRA (+$200, +2❤️).`);
      break;
    }
    case 'matrinxa': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou MATRINXÃ (+$250, +1❤️).`);
      break;
    }
    case 'aracu': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🐠 ${cname(p)} fritou ARACU (+$200, +2❤️).`);
      break;
    }
    case 'ofertorio': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🍷 ${cname(p)} apresentou OFERTÓRIO (+$150, +4❤️).`);
      break;
    }
    case 'comunhao': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `✝️ ${cname(p)} distribuiu COMUNHÃO (+$150, +4❤️).`);
      break;
    }
    case 'cagaita': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍋 ${cname(p)} chupou CAGAITA (+$200, +2❤️).`);
      break;
    }
    case 'cereja': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍒 ${cname(p)} colheu CEREJA (+$200, +2❤️).`);
      break;
    }
    case 'bicuda': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou BICUDA (+$300, +1❤️).`);
      break;
    }
    case 'tabarana': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} laçou TABARANA (+$250, +1❤️).`);
      break;
    }
    case 'ipo': {
      if (!spend(p, 1, 250)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `📈 ${cname(p)} lançou IPO (+$350, +1❤️).`);
      break;
    }
    case 'followon': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `📊 ${cname(p)} fez FOLLOW-ON (+$250, +2❤️).`);
      break;
    }
    case 'convento': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⛪ ${cname(p)} fundou CONVENTO (+$150, +4❤️).`);
      break;
    }
    case 'seminario': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📚 ${cname(p)} abriu SEMINÁRIO (+$150, +4❤️).`);
      break;
    }
    case 'picao': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} coou PICÃO (+$200, +2❤️).`);
      break;
    }
    case 'mentrasto': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌿 ${cname(p)} pisou MENTRASTO (+$200, +2❤️).`);
      break;
    }
    case 'pirapitinga': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou PIRAPITINGA (+$300, +1❤️).`);
      break;
    }
    case 'acari': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🐠 ${cname(p)} cascou ACARI (+$200, +2❤️).`);
      break;
    }
    case 'aspersao': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `💧 ${cname(p)} fez ASPERSÃO (+$150, +4❤️).`);
      break;
    }
    case 'incenso': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🌫️ ${cname(p)} queimou INCENSO (+$150, +4❤️).`);
      break;
    }
    case 'marmelo': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍐 ${cname(p)} fez doce de MARMELO (+$200, +2❤️).`);
      break;
    }
    case 'pessego': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍑 ${cname(p)} colheu PÊSSEGO (+$200, +2❤️).`);
      break;
    }
    case 'namorado': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou NAMORADO (+$300, +1❤️).`);
      break;
    }
    case 'cherne': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐡 ${cname(p)} laçou CHERNE (+$300, +1❤️).`);
      break;
    }
    case 'fgts': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🏦 ${cname(p)} liberou FGTS (+$250, +2❤️).`);
      break;
    }
    case 'inss': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🧓 ${cname(p)} pagou INSS (+$150, +4❤️).`);
      break;
    }
    case 'pastoral': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `✝️ ${cname(p)} animou PASTORAL (+$150, +4❤️).`);
      break;
    }
    case 'catequese': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📖 ${cname(p)} ensinou CATEQUESE (+$150, +4❤️).`);
      break;
    }
    case 'erva_mate': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🧉 ${cname(p)} cevou ERVA-MATE (+$200, +2❤️).`);
      break;
    }
    case 'guaco': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} xaropeou GUACO (+$200, +2❤️).`);
      break;
    }
    case 'piraiba': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou PIRAÍBA (+$300, +1❤️).`);
      break;
    }
    case 'camurupim': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} assou CAMURUPIM (+$250, +1❤️).`);
      break;
    }
    case 'antifona': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🎶 ${cname(p)} cantou ANTÍFONA (+$150, +4❤️).`);
      break;
    }
    case 'versiculo': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📖 ${cname(p)} proclamou VERSÍCULO (+$150, +4❤️).`);
      break;
    }
    case 'biriba': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} chupou BIRIBA (+$200, +2❤️).`);
      break;
    }
    case 'poma': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍎 ${cname(p)} mordeu POMA (+$200, +2❤️).`);
      break;
    }
    case 'sargo': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou SARGO (+$250, +1❤️).`);
      break;
    }
    case 'olhodecao': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐡 ${cname(p)} laçou OLHO-DE-CÃO (+$300, +1❤️).`);
      break;
    }
    case 'remessa': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `💸 ${cname(p)} enviou REMESSA (+$250, +2❤️).`);
      break;
    }
    case 'tarifa': {
      if (!spend(p, 1, 150)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🧾 ${cname(p)} tabelou TARIFA (+$250, +1❤️).`);
      break;
    }
    case 'quermesse': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🎪 ${cname(p)} armou QUERMESSE (+$150, +4❤️).`);
      break;
    }
    case 'arraial': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🎇 ${cname(p)} acendeu ARRAIAL (+$150, +4❤️).`);
      break;
    }
    case 'cavalinha': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} ferveu CAVALINHA (+$200, +2❤️).`);
      break;
    }
    case 'chapeu': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌿 ${cname(p)} colheu CHAPÉU-DE-COURO (+$200, +2❤️).`);
      break;
    }
    case 'badejo': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou BADEJO (+$300, +1❤️).`);
      break;
    }
    case 'vermelho': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🔴 ${cname(p)} laçou VERMELHO (+$300, +1❤️).`);
      break;
    }
    case 'responsorio': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🎶 ${cname(p)} cantou RESPONSÓRIO (+$150, +4❤️).`);
      break;
    }
    case 'gradual': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📖 ${cname(p)} entoou GRADUAL (+$150, +4❤️).`);
      break;
    }
    case 'abiu': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍋 ${cname(p)} chupou ABIU (+$200, +2❤️).`);
      break;
    }
    case 'cutite': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} provou CUTITE (+$200, +2❤️).`);
      break;
    }
    case 'xareu': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou XARÉU (+$300, +1❤️).`);
      break;
    }
    case 'pampo': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} laçou PAMPO (+$250, +1❤️).`);
      break;
    }
    case 'consorcio': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🤝 ${cname(p)} fechou CONSÓRCIO (+$250, +2❤️).`);
      break;
    }
    case 'leasing': {
      if (!spend(p, 1, 250)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `📝 ${cname(p)} assinou LEASING (+$350, +1❤️).`);
      break;
    }
    case 'terco': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📿 ${cname(p)} rezou TERÇO (+$150, +4❤️).`);
      break;
    }
    case 'oficio': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🕯️ ${cname(p)} celebrou OFÍCIO (+$150, +4❤️).`);
      break;
    }
    case 'fedegoso': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} ferveu FEDEGOSO (+$200, +2❤️).`);
      break;
    }
    case 'vassourinha': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌿 ${cname(p)} varreu VASSOURINHA (+$200, +2❤️).`);
      break;
    }
    case 'serra': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou SERRA (+$300, +1❤️).`);
      break;
    }
    case 'cavala': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} assou CAVALA (+$250, +1❤️).`);
      break;
    }
    case 'introito': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⛪ ${cname(p)} cantou INTROITO (+$150, +4❤️).`);
      break;
    }
    case 'oferenda': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🍞 ${cname(p)} levou OFERENDA (+$150, +4❤️).`);
      break;
    }
    case 'cajamanga': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🥭 ${cname(p)} chupou CAJÁ-MANGA (+$200, +2❤️).`);
      break;
    }
    case 'atemoia': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} abriu ATEMOIA (+$200, +2❤️).`);
      break;
    }
    case 'bonito': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou BONITO (+$300, +1❤️).`);
      break;
    }
    case 'albacora': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐋 ${cname(p)} arpoou ALBACORA (+$300, +1❤️).`);
      break;
    }
    case 'caucao': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🔒 ${cname(p)} depositou CAUÇÃO (+$250, +2❤️).`);
      break;
    }
    case 'tesouro': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `💰 ${cname(p)} guardou TESOURO (+$250, +2❤️).`);
      break;
    }
    case 'jubileu': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🎉 ${cname(p)} celebrou JUBILEU (+$150, +4❤️).`);
      break;
    }
    case 'sermao': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📢 ${cname(p)} pregou SERMÃO (+$150, +4❤️).`);
      break;
    }
    case 'transagem': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} ferveu TRANSAGEM (+$200, +2❤️).`);
      break;
    }
    case 'losna': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌿 ${cname(p)} amargou LOSNA (+$200, +2❤️).`);
      break;
    }
    case 'mero': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou MERO (+$300, +1❤️).`);
      break;
    }
    case 'pargo': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} assou PARGO (+$250, +1❤️).`);
      break;
    }
    case 'kirie': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `⛪ ${cname(p)} cantou KYRIE (+$150, +4❤️).`);
      break;
    }
    case 'pater': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `🙏 ${cname(p)} rezou PATER (+$150, +4❤️).`);
      break;
    }
    case 'gabiroba': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍈 ${cname(p)} chupou GABIROBA (+$200, +2❤️).`);
      break;
    }
    case 'marolo': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍏 ${cname(p)} abriu MAROLO (+$200, +2❤️).`);
      break;
    }
    case 'olhete': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou OLHETE (+$300, +1❤️).`);
      break;
    }
    case 'guaivira': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} laçou GUAIVIRA (+$250, +1❤️).`);
      break;
    }
    case 'amortiza': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `📉 ${cname(p)} quitou AMORTIZA (+$250, +2❤️).`);
      break;
    }
    case 'financia': {
      if (!spend(p, 1, 250)) return;
      p.money += 350; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🏦 ${cname(p)} liberou FINANCIA (+$350, +1❤️).`);
      break;
    }
    case 'predica': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📢 ${cname(p)} fez PRÉDICA (+$150, +4❤️).`);
      break;
    }
    case 'preceito': {
      if (!spend(p, 1, 200)) return;
      p.money += 150; p.aprov = Math.min(100, p.aprov + 4);
      log(room, `📜 ${cname(p)} guardou PRECEITO (+$150, +4❤️).`);
      break;
    }
    case 'capimsanto': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🍵 ${cname(p)} ferveu CAPIM-SANTO (+$200, +2❤️).`);
      break;
    }
    case 'arnica': {
      if (!spend(p, 1, 150)) return;
      p.money += 200; p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🌼 ${cname(p)} macerou ARNICA (+$200, +2❤️).`);
      break;
    }
    case 'sororoca': {
      if (!spend(p, 1, 250)) return;
      p.money += 300; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐟 ${cname(p)} fisgou SOROROCA (+$300, +1❤️).`);
      break;
    }
    case 'enxova': {
      if (!spend(p, 1, 200)) return;
      p.money += 250; p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🐠 ${cname(p)} grelhou ENXOVA (+$250, +1❤️).`);
      break;
    }
    case 'autorizar_1mes': {
      if (room.un) { err(p.conn, 'A ONU já está em sessão.'); return; }
      if (!target || target === p || !target.alive) { err(p.conn, 'Escolha uma nação-alvo viva.'); return; }
      if (!spend(p, 1, 300)) return;
      room.un = { type: 'autorizar', desc: `Autorizar intervenção militar de ${cname(p)} contra ${cname(target)} (1 mês)`, target: target.id, proposer: p.id, duracao: 4, votes: {}, deadline: Date.now() + 20000 };
      log(room, `🇺🇳 ${cname(p)} propôs AUTORIZAÇÃO-1MÊS contra ${cname(target)}. Votação aberta!`);
      for (const b of room.players) if (b.bot && b.alive) room.un.votes[b.id] = relBetween(b, p) >= 45 || Math.random() < 0.25;
      break;
    }
    case 'autorizar_3anos': {
      if (room.un) { err(p.conn, 'A ONU já está em sessão.'); return; }
      if (!target || target === p || !target.alive) { err(p.conn, 'Escolha uma nação-alvo viva.'); return; }
      if (!spend(p, 1, 500)) return;
      room.un = { type: 'autorizar', desc: `Autorizar intervenção militar de ${cname(p)} contra ${cname(target)} (3 anos)`, target: target.id, proposer: p.id, duracao: 24, votes: {}, deadline: Date.now() + 20000 };
      log(room, `🇺🇳 ${cname(p)} propôs AUTORIZAÇÃO-3ANOS contra ${cname(target)}. Votação aberta!`);
      for (const b of room.players) if (b.bot && b.alive) room.un.votes[b.id] = relBetween(b, p) >= 45 || Math.random() < 0.25;
      break;
    }
    case 'escudo_abm': {
      if (!spend(p, 1, 400)) return;
      p.nukeShieldUntil = room.turn + 6;
      log(room, `🛡️ ${cname(p)} ativou o ESCUDO-ABM (proteção nuclear por 6 semanas).`);
      break;
    }
    case 'exigir_tributo': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 0)) return;
      if (p.mil >= target.mil * 2) {
        if (Math.random() < 0.7 && target.money >= 100) {
          const v = Math.min(300, Math.round(target.money));
          target.money -= v; p.money += v;
          log(room, `💰 ${cname(target)} PAGOU TRIBUTO de $${v} a ${cname(p)}!`);
        } else { bumpRel(p, target, -10); target.mil = Math.min(25, target.mil + 1); log(room, `💰❌ ${cname(target)} RECUSOU O TRIBUTO exigido por ${cname(p)} (-10 relações, +1 mil).`); }
      } else { bumpRel(p, target, -5); log(room, `💰 ${cname(target)} ignorou o TRIBUTO de ${cname(p)} (fraco demais, -5 relações).`); }
      break;
    }
    case 'embargo_armas': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 200)) return;
      target.armsEmbargoUntil = room.turn + 3;
      bumpRel(p, target, -10);
      log(room, `🚫 ${cname(p)} impôs EMBARGO DE ARMAS a ${cname(target)} (sem recrutar por 3 semanas).`);
      break;
    }
    case 'apelar_sancoes': {
      const hasS = (p.sanctionedBy || []).length > 0;
      const hasE = (p.armsEmbargoUntil || 0) > room.turn;
      if (!hasS && !hasE) { err(p.conn, 'Nenhuma sanção ou embargo contra você.'); return; }
      if (!spend(p, 1, 300)) return;
      if (hasS) { const sid = p.sanctionedBy.shift(); const s = room.players.find(x => x.id === sid); if (s) s.sanctioning = s.sanctioning.filter(id => id !== p.id); }
      p.armsEmbargoUntil = 0;
      log(room, `⚖️ ${cname(p)} conseguiu APELAÇÃO: sanções/embargos removidos!`);
      break;
    }
    case 'comprar_tropas': {
      /* FASE 398: aqui a infantaria passava do teto de 3 (chegou a 5 em teste de
         soak) — poder sem limite e barra de nível quebrada na tela. */
      if ((p.units.infantaria || 0) >= UNIT_MAX) { err(p.conn, `🪖 Infantaria já está no nível máximo (${UNIT_MAX}). Fortaleça outra unidade ou treine tropas.`); return; }
      if (!spend(p, 1, 400)) return;
      p.units.infantaria = Math.min(UNIT_MAX, (p.units.infantaria || 0) + 2);
      p.mil = Math.min(25, p.mil + 1);
      log(room, `🪖 ${cname(p)} COMPROU TROPAS mercenárias (infantaria nível ${p.units.infantaria}, +1 mil).`);
      break;
    }
    case 'doar_ouro': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 0, 300)) return;
      target.money += 300; bumpRel(p, target, 6);
      log(room, `💛 ${cname(p)} DOOU OURO ($300) a ${cname(target)} (+6 relações).`);
      break;
    }
    case 'apoiar_nacao': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 100)) return;
      bumpRel(p, target, 8); target.aprov = Math.min(100, target.aprov + 2);
      log(room, `🤝 ${cname(p)} APOIOU ${cname(target)} publicamente (+8 relações, +2❤️).`);
      break;
    }
    case 'condenar_publico': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 50)) return;
      bumpRel(p, target, -8); target.aprov = Math.max(0, target.aprov - 4); p.influencia = Math.min(100, (p.influencia || 0) + 2);
      log(room, `📢 ${cname(p)} CONDENOU ${cname(target)} publicamente (-8 relações, -4❤️).`);
      break;
    }
    case 'ajuda_emergencia': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 500)) return;
      target.money += 500; target.aprov = Math.min(100, target.aprov + 3);
      const em = (target.emergencyUntil || 0) > room.turn;
      bumpRel(p, target, em ? 12 : 6);
      if (em) p.stats.titulos = (p.stats.titulos || 0) + 1;
      log(room, `🚑 ${cname(p)} enviou AJUDA EMERGENCIAL de $500 a ${cname(target)} (+${em ? 12 : 6} relações${em ? ', +1 título humanitário' : ''}).`);
      break;
    }
    case 'perdoar_divida': {
      if (!target || target === p || !target.alive) return;
      if ((target.debt || 0) <= 0) { err(p.conn, 'Essa nação não tem dívidas com o banco.'); return; }
      if (!spend(p, 1, 200)) return;
      target.debt = 0; bumpRel(p, target, 10);
      log(room, `🕊️ ${cname(p)} PERDOOU A DÍVIDA bancária de ${cname(target)} (+10 relações).`);
      break;
    }
    case 'amortizar_divida': {
      if ((p.debt || 0) <= 0) { err(p.conn, 'Você não tem dívidas com o banco.'); return; }
      if (!spend(p, 1, 300)) return;
      p.debt = Math.max(0, p.debt - 360); p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🏦 ${cname(p)} AMORTIZOU a dívida bancária (-$360, restam $${Math.round(p.debt)}).`);
      break;
    }
    case 'cobrar_emprestimo': {
      if (!target || target === p || !target.alive) return;
      target.dividas = target.dividas || [];
      const my = target.dividas.filter(d => d.to === p.id);
      if (!my.length) { err(p.conn, 'Essa nação não te deve nada.'); return; }
      if (!spend(p, 1, 0)) return;
      let tot = 0;
      for (const d of my) { const v = Math.min(d.valor, Math.round(target.money)); target.money -= v; p.money += v; tot += v; }
      target.dividas = target.dividas.filter(d => d.to !== p.id);
      bumpRel(p, target, -5);
      log(room, `🧾 ${cname(p)} COBROU EMPRÉSTIMOS de ${cname(target)} (+$${tot}, -5 relações).`);
      break;
    }
    case 'fundar_provincia': {
      if (p.provinces.length >= 6) { err(p.conn, '🗺️ Limite de 6 províncias atingido.'); return; }
      if (!spend(p, 2, 1000)) return;
      p.provinces.push({ name: 'Nova ' + (p.provinces.length + 1), infra: 1, owner: p.id, origem: p.id });
      log(room, `🏘️ ${cname(p)} FUNDOU uma nova província (${p.provinces.length} no total).`);
      break;
    }
    case 'vender_provincia': {
      const mines = ownProvinces(p).sort((a, b) => a.infra - b.infra);
      if (mines.length < 2) { err(p.conn, '🗺️ Você precisa de ao menos 2 províncias para vender uma.'); return; }
      if (!spend(p, 1, 0)) return;
      const v = mines[0]; const price = 300 + (v.infra || 1) * 100;
      p.provinces = p.provinces.filter(x => x !== v); p.money += price;
      log(room, `💰 ${cname(p)} VENDEU a província ${v.name} por $${price}.`);
      break;
    }
    case 'ministro':
      if (!MINISTERS[msg.post] || !MINISTERS[msg.post][msg.value]) return;
      if (!spend(p, 1, 100)) return;
      p.ministers[msg.post] = msg.value;
      log(room, `💼 ${cname(p)} nomeia ${MINISTERS[msg.post][msg.value].name} para a pasta ${msg.post === 'eco' ? 'Economia' : msg.post === 'def' ? 'Defesa' : msg.post === 'soc' ? 'Cultura/Esportes' : 'Diplomacia'}.`);
      break;
    case 'tech': {
      const k = msg.value; if (!TECHS[k]) return;
      const lvl = techLevel(p, k);
      if (lvl >= TECH_MAX) return err(p.conn, 'Essa tecnologia já está no nível máximo.');
      const cost = Math.round(techCost(lvl) * (p.ideology === 'republica' ? 0.75 : 1) * (1 - 0.04 * ((p.sectors && p.sectors.educacao) || 0) - 0.03 * ((p.sectors && p.sectors.ciencia) || 0)) * (1 + ((p.inflacao || 0) / 100)));
      if (!spend(p, 1, cost)) return;
      p.techLv = p.techLv || {};
      p.techLv[k] = lvl + 1;
      if (!p.techs.includes(k)) p.techs.push(k);
      if (k === 'condicoes') p.eco += 1;
      p.xp += 5;
      log(room, `🔬 ${cname(p)}: ${techName(k)} nível ${lvl + 1}/${TECH_MAX} ($${cost})`);
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
      if (p.space + p.builds.filter(b=>b.kind==='espacial').length >= 5) return;
      if (!spend(p, 2, SPACE_COSTS[p.space + p.builds.filter(b=>b.kind==='espacial').length])) return;
      p.builds.push({ kind: 'espacial', untilDay: room.day + 12 });
      log(room, `🚀 ${cname(p)} inicia etapa do programa espacial (conclui no próximo turno).`);
      break;
    }
    case 'imposto': p.taxRate = Math.max(0, Math.min(2, msg.value | 0)); log(room, `🧾 ${cname(p)} ajusta impostos para ${['baixa', 'média', 'alta'][p.taxRate]}.`); break;
    case 'impostos': {
      const t = msg.taxes || {}; const cl = v => Math.max(0, Math.min(30, v|0));
      p.taxes = { corp: cl(t.corp ?? 10), rend: cl(t.rend ?? 10), prod: cl(t.prod ?? 10), amb: cl(t.amb ?? 5) };
      const avg = (p.taxes.corp + p.taxes.rend + p.taxes.prod) / 3;
      p.taxRate = avg < 8 ? 0 : avg > 15 ? 2 : 1;
      log(room, `🧾 ${cname(p)} redefine impostos: empresas ${p.taxes.corp}%, renda ${p.taxes.rend}%, produção ${p.taxes.prod}%, ambiental ${p.taxes.amb}%.`);
      break;
    }
    case 'orcamento': {
      const b = msg.budget || {}; const cl = v => Math.max(0, Math.min(3, v|0));
      p.budget = { exe: cl(b.exe ?? 1), int: cl(b.int ?? 1), tra: cl(b.tra ?? 1), edu: cl(b.edu ?? 1), ambm: cl(b.ambm ?? 1) };
      log(room, `🏛️ ${cname(p)} reorganiza o orçamento dos ministérios.`);
      break;
    }
    case 'emprestimo_banco': {
      if (p.debt > 2000) { err(p.conn, 'Dívida alta demais — o banco não empresta.'); return; }
      if (room.turn < (p.caloteUntil || 0)) { err(p.conn, 'Nome sujo após calote — aguarde.'); return; }
      p.money += 600; p.debt += 720;
      log(room, `🏦 ${cname(p)} contrai empréstimo de $600 (dívida $${p.debt}).`);
      break;
    }
    case 'calote': {
      if (p.debt <= 0) { err(p.conn, 'Sem dívida para calotear.'); return; }
      if (!spend(p, 1, 0)) return;
      p.debt = 0; p.caloteUntil = room.turn + 8;
      p.aprov = Math.max(0, p.aprov - 15);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -15);
      log(room, `💸 ${cname(p)} deu CALOTE na dívida! (−15 ❤️, −15 relações, sem crédito por 8 semanas)`);
      break;
    }
    case 'pagar': { const x = Math.min(p.debt, p.money); if (x <= 0) return; p.money -= x; p.debt -= x; log(room, `🏦 ${cname(p)} paga $${x} da dívida.`); break; }
    case 'tributo': {
      if (!target || target === p || !target.alive) return;
      if (p.allies.includes(target.id)) { err(p.conn, 'Não tribute aliados.'); return; }
      if (!spend(p, 1, 0)) return;
      if (p.mil >= (target.mil || 1) * 2) {
        const x = Math.min(300, Math.floor(target.money));
        target.money -= x; p.money += x;
        bumpRel(p, target, -10);
        log(room, `💰 ${cname(p)} EXIGIU tributo de ${cname(target)} (+$${x}, −10 relações).`);
      } else { bumpRel(p, target, -8); target.aprov = Math.min(100, target.aprov + 2); log(room, `💰 ${cname(target)} RIU da exigência de tributo de ${cname(p)} (−8 relações)!`); }
      break;
    }
    case 'infra': {
      const prov = p.provinces[msg.prov];
      if (!prov || prov.owner !== p.id || prov.infra >= 5) return;
      if (!spend(p, 1, 200)) return;
      p.builds.push({ kind: 'infra', prov: msg.prov, untilDay: room.day + 6 });
      log(room, `🏗️ ${cname(p)} inicia construção em ${prov.name} (conclui no próximo turno).`);
      break;
    }
    case 'nuclear':
      if (p.nuclear + p.builds.filter(b=>b.kind==='nuclear').length >= NUKE_MAX_LEVEL) { err(p.conn, 'Programa nuclear no nível máximo.'); return; }
      if (p.rec.uranio < 10) { err(p.conn, '☢️ O programa nuclear exige 10 de URÂNIO — minere numa jazida própria ou compre no mercado.'); return; }
      if (!spend(p, 2, 600)) return;
      p.rec.uranio -= 10;
      p.builds.push({ kind: 'nuclear', untilDay: room.day + 18 });
      log(room, `☢️ ${cname(p)} inicia etapa do programa nuclear (conclui no próximo turno).`);
      break;

    /* --- externos --- */
    case 'espionar': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 100))) return;
      /* FASE 369: espionar também pode ser descoberto (risco menor) */
      if (Math.random() < riscoEspionagem(p, target) * 0.30) {
        bumpRel(target, p, -14, 'espionagem detectada');
        log(room, `🕵️⚠️ ${cname(target)} detectou espionagem de ${cname(p)} (−14 relações).`);
      }
      info(p.conn, `🕵️ Relatório sobre ${cname(target)} — Caixa $${Math.round(target.money)} | Eco ${target.eco} | Mil ${target.mil} | ❤️ ${target.aprov}% | ☢️ ${target.nuclear} | ⚖️ ${target.influencia} | 🕌 ${target.fe} | Dívida $${target.debt}`);
      break;
    }
    case 'sabotagem': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 150))) return;
      /* FASE 369: risco real de ser descoberto */
      if (Math.random() < riscoEspionagem(p, target) * 0.55) {
        bumpRel(target, p, -22, 'sabotagem descoberta');
        p.aprov = Math.max(0, (p.aprov || 0) - 4);
        log(room, `🕵️❌ ${cname(target)} DESCOBRIU agentes de ${cname(p)}! Relações despencam (−22) e há escândalo interno.`);
        record(room, `🕵️ Operação de ${cname(p)} descoberta por ${cname(target)} (dia ${room.day}).`);
        target.crise = target.crise || { tipo: 'espionagem', dia: room.day };
        break;
      }
      const sAtk = (p.seguranca && p.seguranca.secreto) || 0;   // serviço secreto de quem ataca
      const sDef = (target.seguranca && target.seguranca.secreto) || 0; // de quem se defende
      const dDef = (target.seguranca && target.seguranca.defesa) || 0;
      const chance = Math.min(0.9, 0.5 + 0.08 * sAtk + 0.05 * (p.espioes || 0) + (p.ministers.dip === 'esp' ? 0.1 : 0) - ((target.spyShieldUntil || 0) > room.day ? 0.25 : 0) - 0.05 * dDef - ((target.orgs || []).includes('interpol') ? 0.15 : 0));
      const r = Math.random();
      if (r < chance) {
        if (sDef >= 2 && Math.random() < 0.15 * sDef) {
          p.espioes = Math.max(0, (p.espioes || 0) - 1);
          log(room, `🕵️ O Serviço Secreto de ${cname(target)} DETECTOU e conteve a sabotagem de ${cname(p)}! Um agente foi capturado.`);
          bumpRel(p, target, -3);
        } else {
          const provs = ownProvinces(target).filter(pr => pr.infra > 0);
          if (provs.length) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.infra -= 1; log(room, `🧨 Sabotagem de ${cname(p)} destrói infraestrutura em ${pr.name} (${cname(target)})!`); }
          else { target.mil = Math.max(1, target.mil - 3); log(room, `🧨 Sabotagem de ${cname(p)} danifica o arsenal de ${cname(target)} (-3 militar)!`); }
          p.stats.sabotagens = (p.stats.sabotagens || 0) + 1;
          bumpRel(p, target, -5);
        }
      } else if (r < chance + Math.max(0.1, 0.3 - 0.05 * sAtk)) { p.aprov = Math.max(0, p.aprov - 5); target.aprov = Math.min(100, target.aprov + 2); log(room, `🚨 ${cname(p)} foi EXPOSTO sabotando ${cname(target)}!`); bumpRel(p, target, -10); }
      else log(room, `🕵️ Agentes de ${cname(p)} falham silenciosamente em ${cname(target)}.`);
      break;
    }
    case 'recrutar_espiao': {
      const sA = (p.seguranca && p.seguranca.secreto) || 0;
      const maxE = 3 + sA * 2;
      if ((p.espioes || 0) >= maxE) { err(p.conn, 'Rede no máximo (' + maxE + ' agentes). Amplie o Serviço Secreto.'); return; }
      if (!spend(p, 1, 150)) return;
      p.espioes = (p.espioes || 0) + 1;
      log(room, `🕵️ ${cname(p)} recrutou um agente secreto (${p.espioes}/${maxE}).`);
      break;
    }
    case 'roubar_tech': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 200))) return;
      const sA2 = (p.seguranca && p.seguranca.secreto) || 0;
      const ch = Math.min(0.7, 0.3 + 0.07 * (p.espioes || 0) + 0.08 * sA2 + (p.ministers.dip === 'esp' ? 0.1 : 0) - ((target.spyShieldUntil || 0) > room.day ? 0.25 : 0));
      const pool = Object.keys(target.techLv || {}).filter(k => (target.techLv[k] || 0) > (((p.techLv || {}))[k] || 0) && TECHS[k]);
      if (Math.random() < ch && pool.length) {
        const k = pool[Math.floor(Math.random() * pool.length)];
        p.techLv = p.techLv || {}; p.techs = p.techs || [];
        p.techLv[k] = (p.techLv[k] || 0) + 1;
        if (!p.techs.includes(k)) p.techs.push(k);
        bumpRel(p, target, -4);
        log(room, `📡 Agentes de ${cname(p)} roubaram a tecnologia ${TECHS[k][1]} de ${cname(target)}!`);
      } else if (Math.random() < 0.3) { p.espioes = Math.max(0, (p.espioes || 0) - 1); bumpRel(p, target, -5); log(room, `🚨 ${cname(target)} capturou um espião de ${cname(p)} tentando roubar tecnologia!`); }
      else log(room, `🕵️ Agentes de ${cname(p)} voltaram de ${cname(target)} de mãos vazias.`);
      break;
    }
    case 'cacar_espioes': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 100))) return;
      const sA3 = (p.seguranca && p.seguranca.secreto) || 0;
      const tem = target.espioes || 0;
      if (!tem) { log(room, `🔍 Caça-espiões de ${cname(p)} não acharam nenhum agente em ${cname(target)}.`); break; }
      const kill = Math.min(tem, 1 + (Math.random() < 0.25 + 0.1 * sA3 + 0.05 * (p.espioes || 0) ? 1 : 0));
      target.espioes = tem - kill;
      bumpRel(p, target, -4);
      log(room, `🔍 Caça-espiões de ${cname(p)} eliminaram ${kill} agente(s) em ${cname(target)}!`);
      break;
    }
    case 'sabotar_nuke': {
      if (!target || target === p || !target.alive) return;
      if (!(target.nuclear > 0)) { err(p.conn, '☢️ O alvo não tem programa nuclear.'); return; }
      if ((p.espioes || 0) < 2) { err(p.conn, '☢️ Precisa de 2+ agentes para a operação STUXNET.'); return; }
      if (!spend(p, 2, dipCost(p, 400))) return;
      const sA4 = (p.seguranca && p.seguranca.secreto) || 0;
      const chN = Math.min(0.7, 0.3 + 0.07 * (p.espioes || 0) + 0.08 * sA4 - ((target.spyShieldUntil || 0) > room.day ? 0.25 : 0));
      if (Math.random() < chN) {
        target.nuclear = Math.max(0, (target.nuclear || 0) - 1);
        bumpRel(p, target, -10);
        log(room, `☢️ STUXNET! Agentes de ${cname(p)} sabotaram o programa nuclear de ${cname(target)} (Nv ${target.nuclear})!`);
      } else {
        p.aprov = Math.max(0, p.aprov - 8); target.aprov = Math.min(100, target.aprov + 2);
        bumpRel(p, target, -5);
        log(room, `☢️ Tentativa de sabotagem nuclear de ${cname(p)} contra ${cname(target)} foi DESMASCARADA!`);
      }
      break;
    }
    case 'contraespionagem': {
      if (!spend(p, 1, 250)) return;
      p.spyShieldUntil = room.day + 14;
      log(room, `🛡️ ${cname(p)} ativa CONTRA-ESPIONAGEM total por 14 dias (−25% nas operações inimigas).`);
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
      target.money += 200; p.aprov = Math.min(100, p.aprov + 2); p.stats.ajuda = (p.stats.ajuda || 0) + 1; target.aprov = Math.min(100, target.aprov + 2);
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
      if (msg.value === 'ensino_obrigatorio') { p.aprov = Math.min(100, p.aprov + 2); p.ciencia = (p.ciencia || 0) + 1; }
      if (msg.value === 'saude_universal') { p.aprov = Math.min(100, p.aprov + 3); p.pop += 2; }
      if (msg.value === 'codigo_florestal') p.eco += 1;
      if (msg.value === 'bolsa_familia') { p.aprov = Math.min(100, p.aprov + 4); p.pop += 1; }
      if (msg.value === 'lei_volume') p.aprov = Math.max(0, p.aprov - 2);   // FASE 396: jornada exaustiva
      log(room, `📜 ${cname(p)} aprova a lei "${lei.name}" (${lei.desc}).`);
      if (LEIS[msg.value].grupo === 'producao') {
        const lp = leiProd(p);
        info(p.conn, `🏭 ${lei.name} em vigor — compra ×${lp.compra.toFixed(2)}, venda ×${lp.venda.toFixed(2)}, produção ×${lp.volume.toFixed(2)}, insumo ×${lp.insumo.toFixed(2)}, obra ${Math.round(lp.obraPct * 100)}% do tempo.`);
      }
      break;
    }
    case 'blindados': case 'aviacao': case 'frota': case 'infantaria': case 'artilharia': case 'submarinos': case 'porta_avioes': case 'fuzileiros': case 'defesa_aerea': {
      const costs = UNIT_COSTS;   /* FASE 398: fonte unica (antes havia 3 tabelas) */
      const UNAMES = { blindados: 'forças BLINDADAS', aviacao: 'sua AVIAÇÃO', frota: 'sua FROTA NAVAL', infantaria: 'sua INFANTARIA', artilharia: 'sua ARTILHARIA', submarinos: 'seus SUBMARINOS', porta_avioes: 'seu PORTA-AVIÕES', fuzileiros: 'seus FUZILEIROS NAVAIS', defesa_aerea: 'sua DEFESA AÉREA' };
      if ((p.units[msg.action] || 0) >= UNIT_MAX) { err(p.conn, 'Nível máximo de unidade.'); return; }
      if (room.armsEmbargo && room.armsEmbargo.target === p.id && room.turn < room.armsEmbargo.until) { err(p.conn, '🔫 Embargo de armas da ONU em vigor — nenhuma nova unidade.'); return; }
      if (p.rec.terras_raras < 4) { err(p.conn, '⚙️ Produzir unidades exige 4 TERRAS RARAS — construa uma Mina de terras raras.'); return; }
      if (!spend(p, 1, costs[msg.action])) return;
      p.rec.terras_raras -= 4;
      p.units[msg.action] = (p.units[msg.action] || 0) + 1;
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
      bumpRel(p, target, -30, 'declarou guerra');
      p.trades = p.trades.filter(id => id !== target.id); target.trades = target.trades.filter(id => id !== p.id);
      p.relations[target.id] = 0; target.relations[p.id] = 0;
      p.aprov = Math.max(0, p.aprov - 2);
      if ((target.nuclear || 0) >= 3) { p.aprov = Math.max(0, p.aprov - 3); log(room, `☢️ DISSUASÃO: atacar ${cname(target)} (arsenal Nv${target.nuclear}) assusta seu povo (−3 ❤️ extra).`); }
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
      if (room.batalha && !room.batalha.fim) { err(p.conn, 'Já há uma batalha em andamento nesta sala.'); return; }
      if (p.pacts && p.pacts[target.id] > room.turn) { err(p.conn, 'Pacto de não-agressão vigente com essa nação.'); return; }
      p.ap -= 2;
      const fuel = ((p.buildings && p.buildings.petroleo) || 0) >= 1 ? 0 : 150;
      if (p.money < fuel) { p.ap += 2; err(p.conn, '⛽ Sem combustível: construa Torre de Petróleo ou tenha $150.'); return; }
      p.money -= fuel;
      allyDefend(room, p, target);
      iniciarBatalha(room, p, target);
      btEnviar(room);
      break;
    }
    case 'nuke': {
      if (!target || target === p || !target.alive) return;
      if (p.allies.includes(target.id)) { err(p.conn, 'Você não pode atacar um aliado.'); return; }
      if (!p.wars.includes(target.id)) { err(p.conn, 'Declare GUERRA primeiro (⚠️, 1⚡).'); return; }
      if (p.nuclear < NUKE_MIN_LEVEL) { err(p.conn, `Programa nuclear insuficiente (nível ${NUKE_MIN_LEVEL}+ necessário).`); return; }
      if (p.ap < 3) { err(p.conn, 'Lançar um míssil custa 3 pontos de ação.'); return; }
      p.ap -= 3; p.nuclear -= 1;
      const shield = techLevel(target, 'interceptadores') > 0 || (target.space || 0) >= 5 || ((target.buildings && target.buildings.antimisseis) || 0) > 0 || (target.nukeShieldUntil || 0) > room.turn;
      const abrig = !!target.abrigo; if (abrig) target.abrigo = false;
      target.mil = Math.max(1, Math.round(target.mil * (abrig ? 0.75 : (shield ? 0.7 : 0.4))));
      target.aprov = Math.max(0, target.aprov - (abrig ? 5 : (shield ? 10 : 20)));
      p.aprov = Math.max(0, p.aprov - 10);
      const provs = ownProvinces(target);
      const hits = shield ? 1 : 2;
      for (let i = 0; i < hits && provs.length; i++) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.infra = Math.max(0, pr.infra - 2); }
      log(room, `☢️💥 ${cname(p)} LANÇOU UM MÍSSIL NUCLEAR em ${cname(target)}!${shield ? ' (Defesa Antiaérea reduziu os danos!)' : ' Devastação total.'}`);
      record(room, `☢️ ${cname(p)} lançou ogiva em ${cname(target)} (dia ${room.day}).`);
      room.nukesUsed = (room.nukesUsed || 0) + 1;
      if (target.alive && (target.nuclear || 0) >= NUKE_MIN_LEVEL && Math.random() < 0.5) {
        target.nuclear -= 1;
        const pShield = techLevel(p, 'interceptadores') > 0 || (p.space || 0) >= 5 || ((p.buildings && p.buildings.antimisseis) || 0) > 0 || (p.nukeShieldUntil || 0) > room.turn;
        p.mil = Math.max(1, Math.round(p.mil * (pShield ? 0.7 : 0.4)));
        p.aprov = Math.max(0, p.aprov - (pShield ? 10 : 20));
        log(room, `☢️💥 RETALIAÇÃO NUCLEAR! ${cname(target)} revidou contra ${cname(p)}!${pShield ? ' (Defesas reduziram os danos!)' : ' Devastação total.'}`);
      }
      if (abrig) log(room, `🛡️ Abrigos nucleares de ${cname(target)} salvaram vidas (dano reduzido, abrigo consumido)!`);
      if (room.nukesUsed >= 3 && !(room.turn < room.invernoUntil)) { room.invernoUntil = room.turn + 6; log(room, `❄️ INVERNO NUCLEAR! ${room.nukesUsed} ogivas detonadas — renda global -10% por 6 semanas.`); record(room, `❄️ INVERNO NUCLEAR começou (dia ${room.day}).`); }
      break;
    }
    case 'teste_nuclear': {
      if ((p.nuclear || 0) < 2) { err(p.conn, 'Programa nuclear Nv2+ necessário para um teste.'); return; }
      if (p.lastTeste && room.turn - p.lastTeste < 4) { err(p.conn, 'Teste recente demais (1 a cada 4 semanas).'); return; }
      if (!spend(p, 1, 300)) return;
      p.lastTeste = room.turn;
      p.aprov = Math.min(100, p.aprov + 3);
      for (const o of room.players) if (o.alive && o.id !== p.id) bumpRel(p, o, -2);
      log(room, `☢️🧪 ${cname(p)} fez um TESTE NUCLEAR (+3 ❤️ em casa, −2 relações com o mundo). Dissuasão reforçada!`);
      break;
    }
    case 'abrigo': {
      if (p.abrigo) { err(p.conn, 'Abrigos já construídos.'); return; }
      if (!spend(p, 1, 250)) return;
      p.abrigo = true;
      log(room, `🛡️ ${cname(p)} construiu ABRIGOS nucleares (protege do próximo ataque).`);
      break;
    }
    case 'comprar': {
      const q = Math.max(1, Math.min(100, msg.qty | 0));
      if (room.market[msg.res] == null) return;
      const cost = Math.round(room.market[msg.res] * q * Math.max(0.8, 1 - 0.03 * p.trades.length) * (1 + 0.1 * p.sanctionedBy.length) * leiProd(p).compra);
      if (p.money < cost) { err(p.conn, 'Dinheiro insuficiente.'); return; }
      p.money -= cost; p.rec[msg.res] += q;
      if (!p.bot) { const sup = room.world[(room.turn * 7 + msg.res.length * 13) % room.world.length]; log(room, `🚢 Carregamento de ${msg.res} chegou de ${sup.name} (+${q}).`); }
      break;
    }
    case 'vender': {
      const q = Math.max(1, Math.min(100, msg.qty | 0));
      if (room.market[msg.res] == null || p.rec[msg.res] < q) return;
      p.rec[msg.res] -= q; p.money += Math.round(room.market[msg.res] * q * Math.min(1.2, 1 + 0.03 * p.trades.length) * (room.turn < (p.subsUntil || 0) ? 1.25 : 1) * ((p.orgs || []).includes('omc') ? 1.1 : 1) * leiProd(p).venda); p.stats.vendidas += q;
      break;
    }
    case 'construir': {
      if (!PROD_BUILDS[msg.kind]) return;
      if (msg.kind === 'mina_uranio' && !(p.depositos || []).includes('uranio')) { err(p.conn, '☢️ Seu país não possui jazidas de urânio — importe no mercado ou conquiste um território que tenha.'); return; }
      if (msg.kind === 'eolica' && (p.rec.terras_raras || 0) < 5) { err(p.conn, '🌬️ Turbinas eólicas exigem 5 ⚙️ terras raras em estoque.'); return; }
      const need = CONCRETE_NEED[msg.kind] || 0;
      if (p.rec.concreto < need) { err(p.conn, `🧱 Precisa de ${need} de concreto — construa uma Fábrica de concreto primeiro.`); return; }
      let cCost = PROD_BUILDS[msg.kind];
      cCost = Math.ceil(cCost * (1 - 0.05 * techLevel(p, 'infra') - 0.03 * ((p.sectors && p.sectors.infraestrutura) || 0)));
      cCost = Math.ceil(cCost * leiProd(p).obraCusto);   // FASE 396: mutirão encarece a obra
      cCost = Math.ceil(cCost * (1 + ((p.inflacao || 0) / 100)));   // FASE 399: inflação encarece obras
      if (!spend(p, 1, cCost)) return;
      p.rec.concreto -= need;
      const diasObra = buildDays(cCost, p);
      p.builds.push({ kind: msg.kind, untilDay: room.day + diasObra });
      log(room, `🏗️ ${cname(p)} inicia ${PROD_NAMES[msg.kind]} (pronto em ${diasObra} dia(s)).`);
      break;
    }
    case 'presente': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 100)) return;
      bumpRel(p, target, 8); p.stats.presentes++; p.xp += 2;
      log(room, `🎁 ${cname(p)} enviou um PRESENTE diplomático a ${cname(target)} (+8 relações).`);
      break;
    }
    /* ===== novas ações (equivalentes ao MA3) ===== */
    case 'enviar_tropas': {            // Send Troops
      if (!target || target === p || !target.alive) return;
      if (!p.allies.includes(target.id)) return err(p.conn, 'Só é possível enviar tropas a um ALIADO.');
      if (target.wars.length === 0) return err(p.conn, 'Seu aliado não está em guerra — não há onde empregar as tropas.');
      const n = Math.max(1, Math.floor(p.mil * 0.25));
      if (p.mil - n < 1) return err(p.conn, 'Seu exército é pequeno demais para ceder tropas.');
      if (!spend(p, 2, 400)) return;
      p.mil -= n; target.mil += n;
      bumpRel(p, target, 10); p.xp += 8;
      log(room, `🪖 ${cname(p)} ENVIOU TROPAS para ${cname(target)}: +${n} poder militar para o aliado.`);
      break;
    }
    case 'crise': {
      if (!p.crise) { err(p.conn, 'Nenhuma crise ativa.'); return; }
      resolverCrise(room, p, msg.choice | 0);
      break;
    }
    case 'convocar_reservas': {       // Emergency Reserves (pedido de players MA3)
      if ((p.mil || 0) >= 25) { err(p.conn, 'Exército já no máximo.'); return; }
      if (p.lastReserve && room.day - p.lastReserve < 14) { err(p.conn, 'Reservas em reorganização — tente em ' + (14 - (room.day - p.lastReserve)) + ' dias.'); return; }
      if (!spend(p, 1, 300)) return;
      p.lastReserve = room.day;
      p.mil = Math.min(25, (p.mil || 0) + 3);
      p.aprov = Math.max(0, p.aprov - 2);
      log(room, `🛡️ ${cname(p)} CONVOCOU AS RESERVAS (+3 militar, −2 aprovação, 14 dias p/ reorganizar).`);
      break;
    }
    case 'treino_conjunto': {        // Joint Training (pedido de players MA3)
      if (!target || target === p || !target.alive) return;
      if (!p.allies.includes(target.id)) return err(p.conn, 'Treino conjunto exige ALIANÇA.');
      if (p.wars.includes(target.id)) return err(p.conn, 'Impossível treinar com um inimigo.');
      if (!spend(p, 1, 200)) return;
      p.mil = Math.min(25, p.mil + 1); target.mil = Math.min(25, target.mil + 1);
      bumpRel(p, target, 5); p.xp += 3;
      log(room, `🏋️🤝 ${cname(p)} e ${cname(target)} fazem TREINO MILITAR CONJUNTO (+1 militar cada, +5 relações).`);
      break;
    }
    case 'convocar': {                 // Call to Arms
      if (!target || target === p || !target.alive) return;
      if (!p.allies.includes(target.id)) return err(p.conn, 'Só é possível convocar um ALIADO.');
      const meusInimigos = p.wars.filter(w => {
        const w2 = room.players.find(x => x.id === w); return w2 && w2.alive && !target.wars.includes(w);
      });
      if (!meusInimigos.length) return err(p.conn, 'Você não está em guerra, ou seu aliado já luta contra os mesmos inimigos.');
      if (!spend(p, 1, 200)) return;
      const inimigo = room.players.find(x => x.id === meusInimigos[0]);
      target.wars.push(inimigo.id); inimigo.wars.push(target.id);
      bumpRel(target, inimigo, -15);
      log(room, `📣 ${cname(p)} CONVOCOU ${cname(target)} às armas contra ${cname(inimigo)}!`);
      break;
    }
    case 'independencia': {            // Grant Independence
      if (room.phase !== 'game') return;
      const i = Number(msg.prov);
      const pr = p.provinces[i];
      if (!pr) return;
      if (pr.owner !== p.id) return err(p.conn, 'Você não controla essa província.');
      const origId = pr.origem;
      if (!origId || origId === p.id) return err(p.conn, 'Essa província é território original da sua nação.');
      if (!spend(p, 2, 400)) return;
      const devolver = p.provinces.filter(x => x.origem === origId && x.owner === p.id);
      for (const d of devolver) d.owner = origId;
      p.provinces = p.provinces.filter(x => devolver.indexOf(x) === -1);
      const nacao = room.players.find(x => x.id === origId);
      if (nacao) {
        const renasceu = !nacao.alive;
        nacao.provinces = nacao.provinces.concat(devolver);
        nacao.alive = true; nacao.eliminatedReason = null;
        nacao.aprov = Math.max(nacao.aprov, 45);
        bumpRel(p, nacao, 25); p.aprov = Math.min(100, p.aprov + 6); p.xp += 20;
        log(room, `🕊️ ${cname(p)} CONCEDEU A INDEPENDÊNCIA de ${cname(nacao)} (${devolver.length} província(s))!${renasceu ? ' A nação RENASCE no mapa.' : ''} +25 relações.`);
      }
      break;
    }
    case 'pesquisa': {                 // Research Contract
      if (!target || target === p || !target.alive) return;
      if (relBetween(p, target) < 60) return err(p.conn, 'Relações muito baixas (mínimo 60) para um contrato de pesquisa.');
      if (p.wars.includes(target.id)) return err(p.conn, 'Impossível em meio à guerra.');
      if (!spend(p, 1, 600)) return;
      const falta = k => (k === 'eco' ? 'economia' : 'conhecimento');
      let ganhou = 0;
      for (const quem of [p, target]) {
        quem.techLv = quem.techLv || {};
        const disp = Object.keys(TECHS).filter(k => techLevel(quem, k) < TECH_MAX);
        if (disp.length) { const k = disp[Math.floor(Math.random() * disp.length)];
          quem.techLv[k] = techLevel(quem, k) + 1;
          if (!quem.techs.includes(k)) quem.techs.push(k); ganhou++; }
        else quem.eco += 1;
      }
      bumpRel(p, target, 12); p.xp += 10;
      log(room, `🔬 CONTRATO DE PESQUISA entre ${cname(p)} e ${cname(target)}: ${ganhou} tecnologia(s) compartilhada(s), +12 relações.`);
      break;
    }
    case 'fechar_embaixada': {         // Destroy Embassy
      if (!target || target === p) return;
      if (!p.embassies.includes(target.id)) return err(p.conn, 'Não há embaixada aberta nesse país.');
      if (!spend(p, 1, 0)) return;
      p.embassies = p.embassies.filter(id => id !== target.id);
      target.embassies = target.embassies.filter(id => id !== p.id);
      bumpRel(p, target, -12);
      log(room, `🏛️❌ ${cname(p)} FECHOU a embaixada em ${cname(target)} (-12 relações).`);
      break;
    }
    case 'isentar': {                  // Exempt from Paying Taxes
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 150)) return;
      bumpRel(p, target, 15);
      target.aprov = Math.min(100, target.aprov + 5);
      p.aprov = Math.max(0, p.aprov - 1);
      log(room, `🧾 ${cname(p)} ISENTOU ${cname(target)} do pagamento de tributos (+15 relações, +5 aprovação para eles).`);
      break;
    }
    case 'dar_esperanca': {            // Give Hope
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, 200)) return;
      target.aprov = Math.min(100, target.aprov + 12);
      if (target.emergencyUntil > room.turn) target.emergencyUntil = 0;
      bumpRel(p, target, 8); p.xp += 5;
      log(room, `🕯️ ${cname(p)} LEVOU ESPERANÇA a ${cname(target)}: +12 aprovação e fim do estado de emergência.`);
      break;
    }
    case 'reflorestar': {
      if (p.pollution == null) p.pollution = 10;
      if (p.pollution <= 0) { err(p.conn, '🌍 O ar já está limpo.'); return; }
      if (!spend(p, 1, 250)) return;
      p.pollution = Math.max(0, p.pollution - 15);
      p.aprov = Math.min(100, p.aprov + 1);
      log(room, `🌱 ${cname(p)} inicia um mutirão de reflorestamento (poluição ${Math.round(p.pollution)}%).`);
      break;
    }
    case 'seguranca': {                // aparato de segurança interna
      if (room.phase !== 'game') return;
      const k = String(msg.value || '');
      const def = SEG[k];
      if (!def) return;
      p.seguranca = p.seguranca || { defesa: 0, secreto: 0, policia: 0, guarda: 0 };
      const lvl = p.seguranca[k] || 0;
      if (lvl >= 3) return err(p.conn, `${def.name} já está no nível máximo.`);
      const custo = def.custos[lvl];
      if (!spend(p, 1, custo)) return;
      p.seguranca[k] = lvl + 1;
      log(room, `${def.icon} ${cname(p)} estruturou a ${def.name} (nível ${lvl + 1}): ${def.desc}.`);
      break;
    }
    case 'upgrade': {
      const k = msg.kind;
      if (!PROD_BUILDS[k]) return;
      if (!p.buildings[k]) { err(p.conn, 'Construa o prédio antes de melhorá-lo.'); return; }
      const lvl = (p.upgrades && p.upgrades[k]) || 0;
      if (lvl >= BUILD_MAX - 1) { err(p.conn, `⬆️ Melhoria já está no nível máximo (${BUILD_MAX}).`); return; }
      let uCost = Math.round(PROD_BUILDS[k] * 0.6 * (lvl + 1));
      uCost = Math.ceil(uCost * (1 - 0.05 * techLevel(p, 'infra')));
      if (!spend(p, 1, uCost)) return;
      p.upgrades = p.upgrades || {}; p.upgrades[k] = lvl + 1;
      log(room, `⬆️ ${cname(p)} melhora ${PROD_NAMES[k]} para o nível ${lvl + 2}/${BUILD_MAX} (+50% de produção).`);
      break;
    }
    case 'treinar': {
      if ((p.armsEmbargoUntil || 0) > room.turn) { err(p.conn, '🚫 Embargo de armas contra você — sem treinar.'); return; }
      if (!spend(p, 1, 150)) return;
      p.mil = Math.min(25, p.mil + 1); p.stats.treinos = (p.stats.treinos || 0) + 1;
      log(room, `🏋️ ${cname(p)} treina suas forças armadas (poder militar +1).`);
      break;
    }
    case 'anexar': {
      if (!target || target === p || !target.alive) return;
      if (!target.bot) { err(p.conn, 'Só é possível exigir anexação de nações controladas pela IA.'); return; }
      if (p.wars.includes(target.id)) { err(p.conn, 'Em guerra, a anexação vem pela conquista militar.'); return; }
      const rel = relBetween(p, target);
      if (rel < 60) { err(p.conn, 'Relações muito baixas (mínimo 60) para exigir anexação.'); return; }
      if (!spend(p, 2, 300)) return;
      let prob = 0.3 + (rel - 60) * 0.02;
      if (p.religion !== 'laico' && p.religion === target.religion) prob += 0.15;
      if (p.ideology && p.ideology === target.ideology) prob += 0.15;
      if (p.mil >= target.mil * 2) prob += 0.2;
      if (rel >= 85) prob = 1;
      if (Math.random() < Math.min(0.95, prob)) {
        for (const pr of target.provinces) pr.owner = p.id;
        p.provinces = p.provinces.concat(target.provinces); target.provinces = [];
        target.alive = false; target.eliminatedReason = `Anexada por acordo diplomático por ${cname(p)}`;
        p.stats.anexacoes = (p.stats.anexacoes || 0) + 1;
        p.xp += 15;
        log(room, `🏴 ${cname(p)} ANEXOU ${cname(target)} por acordo diplomático! O território foi incorporado pacificamente.`);
      } else {
        bumpRel(p, target, -10);
        log(room, `🏴❌ ${cname(target)} RECUSOU a anexação exigida por ${cname(p)} (-10 relações).`);
      }
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
    case 'concerto': {
      if (p.lastShow === room.turn) { err(p.conn, 'Você já fez um evento musical neste turno.'); return; }
      if (!spend(p, 1, 300)) return;
      p.lastShow = room.turn; p.aprov = Math.min(100, p.aprov + 6); p.money += 150;
      log(room, `🎶 ${cname(p)} promoveu um CONCERTO internacional (+6❤️, +$150).`);
      break;
    }
    case 'carnaval': {
      if (!spend(p, 2, 700)) return;
      p.aprov = Math.min(100, p.aprov + 10); p.money += 400;
      p.influencia = Math.min(100, (p.influencia || 0) + 2);
      log(room, `🎪 ${cname(p)} realizou o CARNAVAL nacional! (+10❤️, +$400 turismo, +2 doutrina).`);
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
      if (room.un) { err(p.conn, 'A ONU já está em sessão.'); return; }
      const UN_IDS = UN_TYPES.map(u => u.id).concat('autorizar');
      const tipo = UN_IDS.includes(msg.tipo) ? msg.tipo : 'autorizar';
      const precisaAlvo = tipo === 'autorizar' || tipo === 'embargo' || tipo === 'condenar' || tipo === 'manter_paz' || tipo === 'bloqueio' || tipo === 'embargo_armas' || tipo === 'ajuda_humanitaria';
      // valida antes de gastar, para não comer ponto de ação à toa
      if (precisaAlvo && (!target || target === p || !target.alive)) { err(p.conn, 'Escolha uma nação-alvo viva para essa resolução.'); return; }
      if (!spend(p, 1, 300)) return;
      let desc, alvoId = null;
      if (tipo === 'autorizar') {
        alvoId = target.id;
        desc = `Autorizar intervenção militar de ${cname(p)} contra ${cname(target)}`;
      } else {
        const t = UN_TYPES.find(u => u.id === tipo);
        alvoId = precisaAlvo ? target.id : null;
        desc = t.desc.replace('{T}', precisaAlvo ? cname(target) : '');
      }
      room.un = { type: tipo, desc, target: alvoId, proposer: p.id, votes: {}, deadline: Date.now() + 20000 };
      log(room, `🇺🇳 ${cname(p)} propôs resolução na ONU: ${room.un.desc}. Votação aberta!`);
      for (const b of room.players) if (b.bot && b.alive) {
        if (tipo === 'autorizar') room.un.votes[b.id] = relBetween(b, p) >= 45 || Math.random() < 0.25;
        else if (alvoId) { const tp = room.players.find(x => x.id === alvoId); const posT = (tipo === 'manter_paz' || tipo === 'ajuda_humanitaria'); room.un.votes[b.id] = tp ? (posT ? relBetween(b, tp) >= 50 : relBetween(b, tp) < 50) : Math.random() < 0.5; }
        else room.un.votes[b.id] = Math.random() < 0.5;
      }
      break;
    }
    case 'subornar': {
      if (!room.un || room.un.proposer !== p.id) { err(p.conn, 'Nenhuma resolução sua em votação.'); return; }
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
    case 'centro_cultural': {
      if (!spend(p, 1, 200)) return;
      p.influencia = Math.min(100, (p.influencia || 0) + 4); p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🗽 ${cname(p)} inaugurou um centro cultural (+4 doutrina, +2 ❤️).`);
      break;
    }
    case 'espalhar_ideologia': {
      if (!target || target === p || !target.alive) return;
      if (!p.ideology) { err(p.conn, 'Adote uma ideologia primeiro.'); return; }
      if (!spend(p, 1, 300)) return;
      if (Math.random() < 0.3 + relBetween(p, target) / 200) {
        target.ideology = p.ideology; bumpRel(p, target, 10); p.xp += 5; p.stats.doutrinacoes = (p.stats.doutrinacoes || 0) + 1;
        log(room, `⚖️ ${cname(p)} espalhou sua ideologia para ${cname(target)}!`);
      } else { bumpRel(p, target, -5); log(room, `⚖️ ${cname(target)} rejeitou a propaganda de ${cname(p)} (-5 relações).`); }
      break;
    }
    case 'templo': {
      if (!spend(p, 1, 200)) return;
      p.fe = Math.min(100, (p.fe || 0) + 4); p.aprov = Math.min(100, p.aprov + 2);
      log(room, `🛕 ${cname(p)} ergueu um templo (+4 fé, +2 ❤️).`);
      break;
    }
    case 'espalhar_religiao': {
      if (!target || target === p || !target.alive) return;
      if (!p.religion || p.religion === 'laico') { err(p.conn, 'Adote uma religião de Estado primeiro.'); return; }
      if (!spend(p, 1, 300)) return;
      if (Math.random() < 0.3 + relBetween(p, target) / 200) {
        target.religion = p.religion; bumpRel(p, target, 10); p.xp += 5; p.stats.conversoes = (p.stats.conversoes || 0) + 1;
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

/* FASE 378 — MEMÓRIA DIPLOMÁTICA
   O mundo não esquece. Cada mudança de relação guarda o motivo.
   Isso alimenta tanto a IA (escalada) quanto a UI (histórico visual). */
let DIA_ATUAL = 0;

function bumpRel(a, b, d, motivo) {
  const v = Math.max(0, Math.min(100, relBetween(a, b) + d));
  a.relations[b.id] = v; b.relations[a.id] = v;
  if (motivo && d) {
    const reg = { m: motivo, v: Math.round(d), d: DIA_ATUAL };
    for (const x of [a, b]) {
      if (!x) continue;
      if (!x.histRel) x.histRel = {};
      const outro = (x === a) ? b.id : a.id;
      if (!x.histRel[outro]) x.histRel[outro] = [];
      x.histRel[outro].unshift(reg);
      if (x.histRel[outro].length > 14) x.histRel[outro].length = 14;
    }
  }
}

/* lê a memória de um país sobre outro */
function memoriaRel(p, outroId) {
  const h = (p.histRel && p.histRel[outroId]) || [];
  let guerras = 0, traicoes = 0, ajudas = 0, sancoes = 0;
  for (const r of h) {
    const m = (r.m || '').toLowerCase();
    if (/guerra|ataque|invas|nuclear/.test(m)) guerras += 1;
    if (/sabot|espion|traic|calote/.test(m)) traicoes += 1;
    if (/ajuda|presente|com.rci|empr.stimo|acordo/.test(m)) ajudas += 1;
    if (/san..o|bloqueio|embargo/.test(m)) sancoes += 1;
  }
  const rancor = guerras * 16 + traicoes * 13 + sancoes * 7 - ajudas * 11;
  return { guerras, traicoes, ajudas, sancoes, rancor, total: h.length };
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
    player.connected = false; player.conn = null; player.disconnectedAt = Date.now();
    log(room, `📴 ${player.name} perdeu a conexão (tem ${Math.round(ABANDON_MS / 60000)} min para voltar).`);
    if (room.hostId === player.id) { const next = room.players.find(p => p.connected); if (next) room.hostId = next.id; }
    /* FASE 400 — momento crítico: salvar quando o anfitrião cai, para não perder o mundo */
    salvarJogo(room);
    if (!room.players.some(p => p.connected)) { if (room.timer) clearInterval(room.timer); rooms.delete(room.code); return; }
    broadcast(room);
  }
}
function sanitizeName(n) { return String(n || '').replace(/[^\p{L}\p{N} _\-.]/gu, '').trim().slice(0, 18) || 'Presidente'; }

/* ---------------- Abandono ---------------- */
// rompe todos os vínculos diplomáticos de quem saiu, para a partida não travar
function severLinks(room, p) {
  const tira = (alvo, campo, outro) => {
    const q = room.players.find(x => x.id === alvo);
    if (q && Array.isArray(q[outro])) q[outro] = q[outro].filter(id => id !== p.id);
    return null;
  };
  p.allies.forEach(id => tira(id, 'allies', 'allies')); p.allies = [];
  p.sanctioning.forEach(id => tira(id, 'sanctioning', 'sanctionedBy')); p.sanctioning = [];
  p.sanctionedBy.forEach(id => tira(id, 'sanctionedBy', 'sanctioning')); p.sanctionedBy = [];
  p.wars.forEach(id => tira(id, 'wars', 'wars')); p.wars = [];
  p.trades.forEach(id => tira(id, 'trades', 'trades')); p.trades = [];
  p.blockading.forEach(id => tira(id, 'blockading', 'blockadedBy')); p.blockading = [];
  p.blockadedBy.forEach(id => tira(id, 'blockadedBy', 'blockading')); p.blockadedBy = [];
  p.embassies.forEach(id => tira(id, 'embassies', 'embassies')); p.embassies = [];
  for (const q of room.players) {
    if (q === p) continue;
    for (const c of ['allies', 'sanctioning', 'sanctionedBy', 'wars', 'trades', 'blockading', 'blockadedBy', 'embassies'])
      if (Array.isArray(q[c])) q[c] = q[c].filter(id => id !== p.id);
  }
}
// quem ficou desconectado demais é dado como desertor e sai da partida
setInterval(() => {
  const agora = Date.now();
  for (const room of rooms.values()) {
    if (room.phase !== 'game') continue;
    let mudou = false;
    for (const p of room.players) {
      if (p.bot || !p.alive || p.connected || !p.disconnectedAt) continue;
      if (agora - p.disconnectedAt < ABANDON_MS) continue;
      p.alive = false; p.eliminatedReason = 'Abandonou a partida'; p.conn = null;
      severLinks(room, p);
      log(room, `🏳️ ${cname(p)} abandonou a partida.`);
      mudou = true;
    }
    if (mudou) { checkVictory(room); broadcast(room); }
  }
}, 60000);

function route(conn, msg) {
  switch (msg.t) {
    case 'create': {
      if (conn.meta) return;
      const room = newRoom();
      const nome = sanitizeName(msg.name);
      const p = addPlayer(room, conn, nome, true);
      log(room, `👋 ${nome} criou a sala.`);
      conn.send({ t: 'sessao', code: room.code, token: p.token });
      broadcast(room); break;
    }
    case 'join': {
      if (conn.meta) return;
      let room = rooms.get(String(msg.code || '').toUpperCase().trim());
      if (!room) room = carregarJogo(msg.code);   // servidor reiniciou: tenta o save
      if (!room) return err(conn, 'Sala não encontrada. Confira o código.');
      if (room.phase !== 'lobby') return err(conn, 'Essa partida já começou. Crie sua própria sala!');
      if (room.players.length >= MAX_PLAYERS) return err(conn, `Sala cheia (${MAX_PLAYERS} jogadores).`);
      const nome = sanitizeName(msg.name);
      const p = addPlayer(room, conn, nome, false);
      log(room, `👋 ${nome} entrou na sala.`);
      conn.send({ t: 'sessao', code: room.code, token: p.token });
      broadcast(room); break;
    }
    // reassume um jogador que caiu (F5, wifi oscilando) sem perder a partida
    case 'reconnect': {
      if (conn.meta) return;
      let room = rooms.get(String(msg.code || '').toUpperCase().trim());
      if (!room) room = carregarJogo(msg.code);   // voltar outro dia
      if (!room) { conn.send({ t: 'sem_sessao' }); return; }
      const p = room.players.find(x => !x.bot && x.token && x.token === String(msg.token || ''));
      if (!p) { conn.send({ t: 'sem_sessao' }); return; }
      if (p.conn && p.conn !== conn) { // fecha a aba/conexão antiga se ainda existir
        try { p.conn.socket.destroy(); } catch (e) {}
      }
      p.conn = conn; p.connected = true; p.disconnectedAt = 0;
      conn.meta = { room, player: p };
      conn.send({ t: 'sessao', code: room.code, token: p.token });
      log(room, `🔄 ${p.name} voltou para a partida.`);
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
      const cor = parseInt(msg.color, 10); if (Number.isInteger(cor) && cor >= 0 && cor < 60) player.color = cor;
      broadcast(room);
      break;
    }
    case 'velocidade': { const { room, player } = conn.meta || {}; if (!room || player.id !== room.hostId) return; const mul = [1,2,3,5].includes(msg.speed) ? msg.speed : 1; room.speedMul = mul; room.dayMs = dayMsFor(mul); if (room.phase === 'game' && !room.paused) restartDayTimer(room); broadcast(room); break; }
    case 'salvar': {
      const { room, player } = conn.meta || {}; if (!room || player.id !== room.hostId) return;
      const okS = salvarJogo(room);
      conn.send(JSON.stringify({ t: 'aviso', msg: okS ? '💾 Jogo salvo. Você pode sair e continuar depois.' : '❌ Não foi possível salvar.' }));
      break;
    }
    case 'sair': {
      const { room, player } = conn.meta || {};
      if (!room) { conn.close(); break; }
      const eraHost = player.id === room.hostId;
      if (eraHost) salvarJogo(room);                       // anfitrião: salva
      if (eraHost) {                                        // ...e fecha a sala p/ todos
        for (const q of room.players) if (q.conn) { try { q.conn.send(JSON.stringify({ t: 'sair_ok', salvo: true })); } catch {} }
        setTimeout(() => { for (const q of room.players) if (q.conn) { try { q.conn.close(); } catch {} } }, 250);
        if (typeof rooms.delete === 'function') rooms.delete(room.code); else delete rooms[room.code];
      } else {
        try { conn.send(JSON.stringify({ t: 'sair_ok', salvo: false })); } catch {}
        conn.close();
      }
      break;
    }
    case 'tem_save': {
      conn.send(JSON.stringify({ t: 'tem_save', code: msg.code, tem: temSave(msg.code) }));
      break;
    }

    case 'pausar': {
      const { room, player } = conn.meta || {};
      if (!room || room.phase !== 'game' || player.id !== room.hostId) return;
      if (!room.paused) { room.paused = true; log(room, '⏸️ O anfitrião pausou a partida.'); }
      else { room.paused = false; ensureDayTimer(room); log(room, '▶️ Partida retomada.'); }
      broadcast(room);
      break;
    }
    case 'start': { const { room, player } = conn.meta || {}; if (!room || room.phase !== 'lobby' || player.id !== room.hostId) return; startGame(room); break; }
    case 'action': { const { room, player } = conn.meta || {}; if (!room) return; performAction(room, player, msg); if (room.phase === 'game') broadcastDay(room); break; }
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
      player.stats.votosUn = (player.stats.votosUn || 0) + 1;
      log(room, `${cname(player)} votou ${msg.accept ? 'A FAVOR' : 'CONTRA'} na ONU.`);
      const alive = room.players.filter(p => p.alive);
      if (alive.every(p => room.un.votes[p.id] != null)) resolveUN(room); else broadcast(room);
      break;
    }
    // ---- batalha tática ----
    case 'batalha_acao': {
      const { room, player } = conn.meta || {};
      if (!room) return;
      const b = room.batalha;
      if (!b || b.fim) return;
      if (player.id !== (b.vez === 'atk' ? b.atk : b.def)) return err(conn, 'Não é sua vez.');
      const u = b.unidades.find(x => x.uid === msg.uid && x.hp > 0);
      const alvo = b.unidades.find(x => x.uid === msg.alvoUid && x.hp > 0);
      if (!u || u.dono !== b.vez) return err(conn, 'Unidade inválida.');
      if (!alvo || alvo.dono === u.dono) return err(conn, 'Alvo inválido.');
      if (dist(u, alvo) > u.alc) return err(conn, `Fora de alcance (${u.alc}). Reposicione a unidade.`);
      btAtacar(room, u, alvo);
      b.proximaAcao = Date.now() + 1200;
      if (b.fim) { setTimeout(() => btEncerrar(room), 6000); }
      btEnviar(room);
      break;
    }
    case 'batalha_mover': {
      const { room, player } = conn.meta || {};
      if (!room) return;
      const b = room.batalha;
      if (!b || b.fim) return;
      if (player.id !== (b.vez === 'atk' ? b.atk : b.def)) return err(conn, 'Não é sua vez.');
      const u = b.unidades.find(x => x.uid === msg.uid && x.hp > 0);
      if (!u || u.dono !== b.vez) return err(conn, 'Unidade inválida.');
      const dx = Math.max(-1, Math.min(1, Number(msg.dx) || 0));
      const dy = Math.max(-1, Math.min(1, Number(msg.dy) || 0));
      const antes = u.x + ',' + u.y;
      btMover(room, u, dx, dy);
      if (u.x + ',' + u.y === antes) return err(conn, 'Movimento impossível (fora do campo ou casa ocupada).');
      b.proximaAcao = Date.now() + 1200;
      btEnviar(room);
      break;
    }
    case 'batalha_recuar': {
      const { room, player } = conn.meta || {};
      if (!room) return;
      const b = room.batalha;
      if (!b || b.fim) return;
      const lado = player.id === b.atk ? 'atk' : (player.id === b.def ? 'def' : null);
      if (!lado) return;
      btLog(b, `🏳️ ${cname(player)} ordena a RETIRADA.`);
      btFinalizar(room, lado === 'atk' ? 'atk' : 'def');
      setTimeout(() => btEncerrar(room), 6000);
      btEnviar(room);
      break;
    }
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
  /* FASE 399 — SEGURANÇA: limite de payload e rate limiting por conexão.
     Rejeita mensagens gigantes (>2 KB) e mais de 30 mensagens por janela de 3s
     (um cliente legítimo manda bem menos que isso). Fecha a conexão do abusador. */
  conn._msgs = 0; conn._win = Date.now();
  conn.onMessage = text => {
    if (text.length > 2048) { try { conn._close(); } catch (e) {} return; }
    const now = Date.now();
    if (now - conn._win > 3000) { conn._win = now; conn._msgs = 0; }
    if (++conn._msgs > 30) { try { conn._close(); } catch (e) {} return; }
    let msg; try { msg = JSON.parse(text); } catch (e) { return; }
    if (!msg || typeof msg !== 'object') return;
    try { route(conn, msg); } catch (e) { console.error('route error:', e); }
  };
  conn.onClose = () => handleDisconnect(conn);
}


/* ================= BATALHA TÁTICA POR TURNOS =================
   Substitui a rolagem abstrata do ataque por um combate em grade:
   cada lado posiciona suas unidades e, alternando turnos, escolhe
   atacar, mover ou recuar. Quem fica sem unidades perde.
   ============================================================ */
const BT = {
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
};
/* FASE 381 — COMPOSIÇÃO MILITAR
   Não basta contar tropas: cada tipo é forte contra uns e fraco contra outros.
   Isso faz a composição do exército importar tanto quanto o tamanho. */
const BT_VANTAGEM = {
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
};
function vantagemUnidade(atacante, defensor) {
  const v = BT_VANTAGEM[atacante];
  if (!v) return { mult: 1, tipo: '' };
  if ((v.contra || []).includes(defensor)) return { mult: v.mult, tipo: 'forte' };
  if ((v.fraca || []).includes(defensor))  return { mult: 1 / v.mult, tipo: 'fraco' };
  return { mult: 1, tipo: '' };
}
/* resumo legível da composição do exército — para o log da batalha */
function resumoComposicao(p) {
  const u = p.units || {};
  const partes = [];
  for (const k of Object.keys(BT_VANTAGEM)) {
    if (k === 'milicia') continue;
    const n = u[k] || 0; if (!n) continue;
    partes.push(BT[k].em + n);
  }
  return partes.length ? partes.join(' ') : 'só milícia';
}
const BT_COLS = 7, BT_LINHAS = 6;
const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

function btLog(b, msg) { b.log.unshift(msg); if (b.log.length > 40) b.log.length = 40; }

/* FASE 367 — fatores estratégicos de uma batalha.
   Tecnologia, terreno, logística e suprimento decidem tanto quanto o número
   de tropas. O defensor luta em casa; o atacante precisa de linha de suprimento. */
function fatoresGuerra(p, lado) {
  const b = p.buildings || {};
  /* tecnologia militar */
  const tech = techLevel(p, 'guerra_terrestre') * 0.045
             + techLevel(p, 'guerra_aerea') * 0.035
             + techLevel(p, 'guerra_naval') * 0.030
             + techLevel(p, 'drones_militares') * 0.030
             + techLevel(p, 'guerra_cibernetica') * 0.025;
  /* terreno: quem defende conhece o próprio solo */
  const infra = ownProvinces(p).reduce((s, pr) => s + (pr.infra || 0), 0);
  const provs = Math.max(1, ownProvinces(p).length);
  const terreno = lado === 'def' ? 0.10 + (infra / provs) * 0.035 : 0;
  /* logística: estradas, portos e centros sustentam a ofensiva */
  const logistica = Math.min(0.25,
      (b.estrada || 0) * 0.020 + (b.ferrovia || 0) * 0.025 +
      (b.porto || 0) * 0.030 + (b.centro_logistico || 0) * 0.050 +
      (b.armazem || 0) * 0.030 + (b.aeroporto || 0) * 0.020);
  /* suprimento: tropa sem comida nem energia luta mal */
  const suprimento = (taxaSuprimento(p) - 0.5) * 0.30;
  /* doutrina e ministro da defesa */
  const ministro = ministroEfeito(p, 'def', 'militar') + ministroEfeito(p, 'def', 'defesa');
  /* sanções e bloqueios corroem a capacidade de combate */
  const pressao = (p.sanctionedBy || []).length * -0.03 + (p.blockadedBy || []).length * -0.05;
  return { tech, terreno, logistica, suprimento, ministro, pressao,
           total: tech + terreno + logistica + suprimento + ministro + pressao };
}

function montarExercito(p, lado) {
  const tipos = [];
  for (const t of Object.keys(BT)) {
    if (t === 'milicia') continue;
    const n = (p.units && p.units[t]) || 0;
    for (let i = 0; i < n; i++) tipos.push(t);
  }
  // quem não tem forças treinadas luta com milícia proporcional ao poder militar
  const nMil = Math.max(3, Math.min(8, Math.round((p.mil || 1) / 2)));
  for (let i = 0; i < nMil; i++) tipos.push('milicia');
  const md = ((p.ministers || {}).def);
  const fg = fatoresGuerra(p, lado);
  const bonus = 1 + (p.mil || 0) * 0.02
    + (lado === 'atk' && md === 'fal' ? 0.1 : 0)
    + (lado === 'def' && md === 'estr' ? 0.1 : 0)
    + fg.total;
  const lista = tipos.slice(0, 10);
  return lista.map((t, i) => {
    const s = BT[t];
    return {
      uid: lado + '_' + i, dono: lado, tipo: t,
      hp: Math.round(s.hp * bonus), hpMax: Math.round(s.hp * bonus),
      atk: +(s.atk * bonus).toFixed(1), def: s.def, alc: s.alc,
      x: i % BT_COLS,
      y: lado === 'atk' ? (i < BT_COLS ? 1 : 0) : (i < BT_COLS ? BT_LINHAS - 2 : BT_LINHAS - 1),
    };
  });
}

/* FASE 368 — IA DIPLOMÁTICA REATIVA
   Quando uma nação ataca, as outras não ficam paradas: condenam, oferecem
   aliança ao agredido, aplicam sanções ou bloqueiam. Depende de relação,
   ideologia, doutrina e se há pacto prévio. */
function reacaoDiplomatica(room, atk, def) {
  for (const o of room.players) {
    if (!o.alive || o.id === atk.id || o.id === def.id) continue;
    const relAtk = relBetween(o, atk), relDef = relBetween(o, def);
    const r = Math.random();

    /* FASE 378: a memória endurece a resposta — agressor reincidente é tratado pior */
    const mem = memoriaRel(o, atk.id);
    const escalada = Math.min(0.30, Math.max(0, mem.rancor) * 0.012);
    const ajuste = escalada;

    /* aliado do agredido entra em guerra contra o agressor */
    if (o.allies.includes(def.id) && !o.wars.includes(atk.id) && r < 0.75 + ajuste) {
      o.wars.push(atk.id); atk.wars.push(o.id);
      bumpRel(o, atk, -30); bumpRel(o, def, +12);
      log(room, `🤝 ${cname(o)} honrou a aliança e DECLAROU GUERRA a ${cname(atk)}.`);
      record(room, `⚔️ ${cname(o)} entrou na guerra ao lado de ${cname(def)} (dia ${room.day}).`);
      continue;
    }
    /* inimigo do agressor aproveita para sancionar */
    if ((relAtk < 30 || mem.rancor > 24) && !o.sanctioning.includes(atk.id) && r < 0.55 + ajuste) {
      o.sanctioning.push(atk.id); atk.sanctionedBy.push(o.id);
      bumpRel(o, atk, -12);
      log(room, `🚫 ${cname(o)} aplicou SANÇÕES a ${cname(atk)} após a agressão.`);
      continue;
    }
    /* amigo do agredido oferece ajuda */
    if (relDef > 65 && r < 0.35) {
      const ajuda = Math.min(o.money, 400);
      if (ajuda > 50) {
        o.money -= ajuda; def.money += ajuda;
        bumpRel(o, def, +8); bumpRel(o, atk, -8);
        log(room, `💸 ${cname(o)} enviou $${ajuda} de ajuda humanitária a ${cname(def)}.`);
      }
      continue;
    }
    /* pacifista condena publicamente */
    if ((o.ministers && o.ministers.def === 'pac') || o.ideology === 'democracia') {
      if (r < 0.45 + ajuste) {
        bumpRel(o, atk, -6); bumpRel(o, def, +4);
        log(room, `🕊️ ${cname(o)} CONDENOU publicamente a agressão de ${cname(atk)}.`);
      }
      continue;
    }
    /* oportunista aproveita a distração */
    if (relAtk < 45 && relDef > 25 && r > 0.88) {
      bumpRel(o, def, -5);
      log(room, `🌍 ${cname(o)} observa o conflito com atenção — pode haver oportunismo.`);
    }
  }
}

function iniciarBatalha(room, atk, def) {
  const b = {
    atk: atk.id, def: def.id,
    unidades: montarExercito(atk, 'atk').concat(montarExercito(def, 'def')),
    vez: 'atk', round: 1,
    deadline: Date.now() + 40000,
    proximaAcao: Date.now() + 1500,
    log: [], fim: null, resultado: null,
  };
  room.batalha = b;
  btLog(b, `⚔️ BATALHA CAMPO ABERTO — ${cname(atk)} invade ${cname(def)}!`);
  /* FASE 367: transparência dos fatores estratégicos */
  const fa = fatoresGuerra(atk, 'atk'), fd = fatoresGuerra(def, 'def');
  const pct = v => (v >= 0 ? '+' : '') + Math.round(v * 100) + '%';
  btLog(b, `📊 ${cname(atk)}: tech ${pct(fa.tech)} · logística ${pct(fa.logistica)} · suprimento ${pct(fa.suprimento)}`);
  btLog(b, `📊 ${cname(def)}: tech ${pct(fd.tech)} · terreno ${pct(fd.terreno)} · logística ${pct(fd.logistica)}`);
  btLog(b, `🎖️ ${cname(atk)}: ${resumoComposicao(atk)}`);
  btLog(b, `🎖️ ${cname(def)}: ${resumoComposicao(def)}`);
  /* FASE 368: o mundo reage à agressão */
  reacaoDiplomatica(room, atk, def);
  btLog(b, `Turno de ${cname(atk)}. Escolha uma unidade e uma ação.`);
  log(room, `⚔️ ${cname(atk)} lançou uma OFENSIVA contra ${cname(def)} — batalha tática em curso!`);
  return b;
}

function btVivos(b, lado) { return b.unidades.filter(u => u.dono === lado && u.hp > 0); }

function btPassarVez(room) {
  const b = room.batalha; if (!b || b.fim) return;
  if (!btVivos(b, 'atk').length || !btVivos(b, 'def').length) return btFinalizar(room);
  if (b.vez === 'atk') { b.vez = 'def'; }
  else { b.vez = 'atk'; b.round++; }
  // a ofensiva não pode ficar travada para sempre: após 30 rodadas decide por HP
  if (b.round > 22) {
    const hpA = btVivos(b, 'atk').reduce((s, u) => s + u.hp, 0);
    const hpD = btVivos(b, 'def').reduce((s, u) => s + u.hp, 0);
    btLog(b, `⏳ A ofensiva se arrasta por 22 rodadas — decidida por poder restante (${hpA} × ${hpD}).`);
    return btFinalizar(room, hpA > hpD ? 'def' : 'atk');
  }
  b.deadline = Date.now() + 40000;
  b.proximaAcao = Date.now() + 1200;
  const dono = room.players.find(p => p.id === (b.vez === 'atk' ? b.atk : b.def));
  btLog(b, `🔄 Rodada ${b.round} — vez de ${dono ? cname(dono) : '?'}.`);
}

function btAtacar(room, u, alvo) {
  const b = room.batalha; if (!b || b.fim) return;
  /* FASE 381: vantagem de composição entra no dano */
  const vg = vantagemUnidade(u.tipo, alvo.tipo);
  const dano = Math.max(1, Math.round(u.atk * vg.mult * (0.85 + Math.random() * 0.4) - alvo.def * 0.4));
  alvo.hp -= dano;
  const morto = alvo.hp <= 0;
  if (morto) alvo.hp = 0;
  btLog(b, `${BT[u.tipo].em} ${BT[u.tipo].nome} atinge ${BT[alvo.tipo].em} ${BT[alvo.tipo].nome}: -${dano} HP` +
    (vg.tipo === 'forte' ? ` 💥 VANTAGEM (×${vg.mult.toFixed(2)})` : (vg.tipo === 'fraco' ? ` ⚠️ em desvantagem (×${vg.mult.toFixed(2)})` : '')) +
           (morto ? ' ☠️ DESTRUÍDO' : ` (${alvo.hp} restante)`));
  btPassarVez(room);
}

function btMover(room, u, dx, dy) {
  const b = room.batalha; if (!b || b.fim) return;
  const nx = Math.max(0, Math.min(BT_COLS - 1, u.x + dx));
  const ny = Math.max(0, Math.min(BT_LINHAS - 1, u.y + dy));
  // cada lado fica no seu campo: atacante nas linhas 0-2, defensor nas 3-5
  const limite = u.dono === 'atk' ? [0, 2] : [3, BT_LINHAS - 1];
  if (ny < limite[0] || ny > limite[1]) return;
  const ocupada = b.unidades.some(o => o !== u && o.hp > 0 && o.x === nx && o.y === ny);
  if (ocupada) return;
  u.x = nx; u.y = ny;
  btLog(b, `${BT[u.tipo].em} ${BT[u.tipo].nome} reposiciona para (${nx + 1},${ny + 1}).`);
  btPassarVez(room);
}

function btIA(room) {
  const b = room.batalha; if (!b || b.fim) return;
  const lado = b.vez;
  const minhas = btVivos(b, lado);
  const inimigos = b.unidades.filter(u => u.dono !== lado && u.hp > 0);
  if (!minhas.length || !inimigos.length) return btFinalizar(room);
  // ataca se houver alvo no alcance; prioriza o mais ferido
  let u = null, alvo = null;
  for (const m of minhas) {
    const poss = inimigos.filter(i => dist(m, i) <= m.alc);
    if (poss.length) { u = m; alvo = poss.sort((a, c) => a.hp - c.hp)[0]; break; }
  }
  if (u && alvo) return btAtacar(room, u, alvo);
  // senão, a unidade mais avançada (mais perto do inimigo) continua avançando
  const ordem = minhas.slice().sort((a, c) => (lado === 'atk' ? c.y - a.y : a.y - c.y));
  for (const m of ordem) {
    const antes = m.x + ',' + m.y;
    btMover(room, m, 0, lado === 'atk' ? 1 : -1);
    if (m.x + ',' + m.y !== antes) return;      // conseguiu mover
  }
  // nenhuma unidade pode avançar: ataca o que estiver no alcance, senão recua uma
  for (const m of ordem) {
    const poss = inimigos.filter(i => dist(m, i) <= m.alc);
    if (poss.length) return btAtacar(room, m, poss[0]);
  }
  const ult = ordem[ordem.length - 1];
  btMover(room, ult, 0, lado === 'atk' ? -1 : 1);
  if (!b.fim) btPassarVez(room);
}

function btFinalizar(room, recuou) {
  const b = room.batalha; if (!b || b.fim) return;
  const atk = room.players.find(p => p.id === b.atk);
  const def = room.players.find(p => p.id === b.def);
  if (!atk || !def) { room.batalha = null; return; }
  const vivosA = btVivos(b, 'atk').length, vivosD = btVivos(b, 'def').length;
  const atkGanhou = recuou === 'def' ? true : recuou === 'atk' ? false : (vivosA > 0 && vivosD === 0);

  // atrito: unidades destruídas são perdas permanentes (milícia não conta)
  for (const u of b.unidades) {
    if (u.hp > 0 || u.tipo === 'milicia') continue;
    const dono = u.dono === 'atk' ? atk : def;
    if (dono.units && dono.units[u.tipo] != null) dono.units[u.tipo] = Math.max(0, dono.units[u.tipo] - 1);
  }

  if (atkGanhou) {
    const loot = Math.round(def.money * 0.08);
    def.money -= loot; atk.money += loot;
    def.mil = Math.max(1, Math.round(def.mil * 0.8));
    atk.mil = Math.max(1, Math.round(atk.mil * 0.9));
    def.aprov = Math.max(0, def.aprov - 4);
    atk.aprov = Math.max(0, atk.aprov - 3);
    atk.stats.vitorias = (atk.stats.vitorias || 0) + 1; atk.xp += 15;
    const provs = ownProvinces(def);
    let capturou = null;
    if (provs.length && vivosD === 0 && atk.mil >= def.mil) {
      const pr = provs[Math.floor(Math.random() * provs.length)];
      pr.owner = atk.id; capturou = pr.name;
    }
    b.resultado = { vencedor: 'atk', loot, provincia: capturou };
    log(room, `⚔️ ${cname(atk)} VENCEU a batalha contra ${cname(def)}! Saque: $${loot}.` +
              (capturou ? ` 🏴 Ocupou ${capturou}.` : ''));
  } else {
    atk.mil = Math.max(1, Math.round(atk.mil * 0.7));
    def.mil = Math.max(1, Math.round(def.mil * 0.92));
    atk.aprov = Math.max(0, atk.aprov - 3);
    def.aprov = Math.min(100, def.aprov + 4);
    def.stats.vitorias = (def.stats.vitorias || 0) + 1; def.xp += 10;
    b.resultado = { vencedor: 'def', loot: 0, provincia: null };
    log(room, `🛡️ ${cname(def)} REPELIU a ofensiva de ${cname(atk)}!`);
  }
  b.fim = { atkGanhou, vivosA, vivosD, recuou: recuou || null };
  b.resultado.algumTempo = Date.now();
  checkEliminations(room); checkVictory(room);
}

function btSnapshot(room) {
  const b = room.batalha; if (!b) return null;
  const nomear = id => { const p = room.players.find(x => x.id === id); return p ? cname(p) : '?'; };
  return {
    t: 'batalha', atk: b.atk, def: b.def, vez: b.vez, round: b.round,
    deadline: b.deadline, unidades: b.unidades, log: b.log.slice(0, 14),
    cols: BT_COLS, linhas: BT_LINHAS,
    nomes: { atk: nomear(b.atk), def: nomear(b.def) },
    fim: b.fim, resultado: b.resultado,
  };
}
function btEnviar(room) {
  const base = btSnapshot(room); if (!base) return;
  for (const id of [room.batalha.atk, room.batalha.def]) {
    const p = room.players.find(x => x.id === id);
    if (p && p.conn && p.connected) p.conn.send({ ...base, you: id, lado: id === base.atk ? 'atk' : 'def' });
  }
}
function btEncerrar(room) {
  if (!room.batalha) return;
  btEnviar(room);
  room.batalha = null;
  broadcast(room);
}

// relógio da batalha: roda a IA quando é a vez dela, ou quando o humano demora
setInterval(() => {
  const agora = Date.now();
  for (const room of rooms.values()) {
    const b = room.batalha; if (!b || b.fim) continue;
    if (agora < (b.proximaAcao || 0)) continue;
    const j = room.players.find(p => p.id === (b.vez === 'atk' ? b.atk : b.def));
    const humanoPode = j && !j.bot && j.connected;
    if (!humanoPode || agora >= b.deadline) {
      if (humanoPode && agora >= b.deadline) btLog(b, '⏱️ Tempo esgotado — o comando assume a jogada.');
      btIA(room);
      b.proximaAcao = agora + 900;
      if (b.fim) { setTimeout(() => btEncerrar(room), 6000); }
      btEnviar(room);
    }
  }
}, 600);

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
  const conn = new WSConn(socket);
  conn.gz = /(?:^|[?&])gz=1(?:&|$)/.test(String(req.url || ''));
  handleClient(conn);
});
server.listen(PORT, '0.0.0.0', () => console.log(`🏛️ Presidente Online (VERSÃO TOTAL) em http://0.0.0.0:${PORT}`));
