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
const buildDays = cost => Math.min(30, Math.max(4, 3 + Math.round(cost / 40)));  // dias p/ concluir obra (varia por construção)
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
  dip: { neg: { name: 'Negociador', desc: 'diplomacia -50% custo' }, inf: { name: 'Influenciador', desc: '+1 influência/turno' }, esp: { name: 'Mestre-Espião', desc: '+10% sabotagem' } },
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
  { id: 'manter_paz',    desc: 'Missão de paz: encerrar todas as guerras de {T}' },
  { id: 'bloqueio',       desc: 'Bloqueio total contra {T} por 3 turnos (renda -50%)' },
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
    un: null, noWarUntil: 0, noArmsUntil: 0, embargo: null, paused: false, pausedRemaining: 0,
    world: COUNTRIES.slice(), market: { comida: 8, minerio: 12, energia: 10, concreto: 10, madeira: 7, terras_raras: 20, uranio: 25, borracha: 14 }, missionIdx: 0, warAuth: null, paused: false, pausedRemaining: 0,
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

function floorRec(rec){ const o = {}; for (const k of ['comida','minerio','energia','concreto','madeira','terras_raras','uranio','borracha']) o[k] = Math.floor((rec && rec[k]) || 0); return o; }
function snapshot(room) {
  return {
    t: 'state', phase: room.phase, code: room.code, turn: room.turn, day: room.day || 1,
    winner: room.winner,
    log: room.log.slice(0, 60), proposals: room.proposals,
    un: room.un, noWarUntil: room.noWarUntil, noArmsUntil: room.noArmsUntil, embargo: room.embargo,
    players: room.players.map(p => ({
      id: p.id, name: p.name, country: p.country, color: p.color,
      money: Math.round(p.money), eco: p.eco, mil: p.mil, aprov: Math.round(p.aprov), ap: p.ap,
      alive: p.alive, allies: p.allies, connected: p.connected,
      isHost: p.id === room.hostId, reason: p.eliminatedReason,
      nuclear: p.nuclear, influencia: Math.round(p.influencia), fe: Math.round(p.fe), wars: p.wars,
      provinces: p.provinces, sanctioning: p.sanctioning, sanctionedBy: p.sanctionedBy,
      taxRate: p.taxRate, taxes: p.taxes || {corp:10, rend:10, prod:10, amb:5}, budget: p.budget || {exe:1, int:1, tra:1, edu:1, ambm:1}, debt: p.debt, ideology: p.ideology, religion: p.religion,
      ministers: p.ministers, techs: p.techs, techLv: p.techLv || {}, sectors: p.sectors, space: p.space, pollution: Math.round(p.pollution != null ? p.pollution : 10),
      relations: p.bot ? {} : p.relations, embassies: p.embassies, trades: p.trades,
      blockading: p.blockading, blockadedBy: p.blockadedBy,
      units: p.units, builds: p.builds, emergencyUntil: p.emergencyUntil, leis: p.leis, crise: p.crise || null,
      pop: Math.round(p.pop), rec: floorRec(p.rec), xp: p.xp, bot: p.bot, customName: p.customName, customFlag: p.customFlag,
      dailyIncome: Math.round(incomeOf(room, p) / DAY_DIV),
      buildings: p.buildings, stats: p.stats, famine: p.famine, blackout: p.blackout,
      depositos: p.depositos || [], upgrades: p.upgrades || {}, pacts: p.pacts || {},
      seguranca: p.seguranca || { defesa: 0, secreto: 0, policia: 0, guarda: 0 },
    })),
    world: room.world, market: room.market, mission: MISSIONS[room.missionIdx % MISSIONS.length], paused: room.paused, speedMul: room.speedMul || 1, temSave: temSave(room.code),
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
  const light = { t: 'day', day: room.day, turn: room.turn, phase: room.phase,
    players: room.players.map(p => ({ id: p.id, money: Math.round(p.money), eco: p.eco, mil: p.mil,
      aprov: Math.round(p.aprov), ap: p.ap, alive: p.alive, pop: Math.round(p.pop),
      nuclear: p.nuclear, influencia: Math.round(p.influencia), fe: Math.round(p.fe),
      rec: floorRec(p.rec), builds: p.builds })) };
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
    nuclear: 0, influencia: 0, fe: 0, provinces: [], wars: [],
    sanctioning: [], sanctionedBy: [],
    taxRate: 1, taxes: {corp:10, rend:10, prod:10, amb:5}, budget: {exe:1, int:1, tra:1, edu:1, ambm:1}, debt: 0, ideology: null, religion: 'laico',
    customName: null, customFlag: '🏳️', bot: false, pop: 0, rec: { comida: 0, minerio: 0, energia: 0, concreto: 25, madeira: 0, terras_raras: 12, uranio: 0, borracha: 0 },
    xp: 0, blackout: false, depositos: [], upgrades: {}, pacts: {},
    buildings: { fazenda: 0, mina: 0, usina: 0, petroleo: 0, fabrica: 0, serraria: 0, mina_ouro: 0, estrada: 0, base: 0, mina_rara: 0, adubo: 0, mina_uranio: 0, solar: 0, eolica: 0 }, stats: { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0, anexacoes: 0, ajuda: 0, mandatos: 0, conversoes: 0, doutrinacoes: 0 }, famine: false,
    ministers: { eco: null, def: null, dip: null },
    techs: [], techLv: {}, sectors: { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0 },
    space: 0, relations: {}, embassies: [], trades: [], blockading: [], blockadedBy: [],
    units: { blindados: 0, aviacao: 0, frota: 0, infantaria: 0, artilharia: 0, submarinos: 0, porta_avioes: 0 }, builds: [], emergencyUntil: 0, leis: [],
    seguranca: { defesa: 0, secreto: 0, policia: 0, guarda: 0 },
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
    money: 10000, eco: 3 + (h % 4), mil: 3 + ((h >> 2) % 4), pop: 0, rec: { comida: 0, minerio: 0, energia: 0, concreto: 25, madeira: 0, terras_raras: 12, uranio: 0, borracha: 0 }, xp: 0, blackout: false, depositos: depositosOf(c.id), upgrades: {}, pacts: {},
    aprov: 50, ap: AP_PER_TURN, alive: true, allies: [], eliminatedReason: null,
    nuclear: 0, influencia: 0, fe: 0, wars: [],
    provinces: [{ name: c.name, infra: 1, owner: c.id, origem: c.id }],
    sanctioning: [], sanctionedBy: [], taxRate: 1, taxes: {corp:10, rend:10, prod:10, amb:5}, budget: {exe:1, int:1, tra:1, edu:1, ambm:1}, debt: 0, ideology: null, religion: 'laico',
    ministers: { eco: null, def: null, dip: null },
    techs: [], techLv: {}, sectors: { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0 },
    space: 0, relations: {}, embassies: [], trades: [], blockading: [], blockadedBy: [],
    units: { blindados: 0, aviacao: 0, frota: 0, infantaria: 0, artilharia: 0, submarinos: 0, porta_avioes: 0 },
    builds: [], emergencyUntil: 0, leis: [],
    buildings: { fazenda: 0, mina: 0, usina: 0, petroleo: 0, fabrica: 0, serraria: 0, mina_ouro: 0, estrada: 0, base: 0, mina_rara: 0, adubo: 0, mina_uranio: 0, solar: 0, eolica: 0 }, stats: { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0, anexacoes: 0, ajuda: 0, mandatos: 0, conversoes: 0, doutrinacoes: 0 }, famine: false,
    ideology: Object.keys(IDEOLOGIES)[h % 6], religion: Object.keys(RELIGIONS)[h % 5],
    seguranca: { defesa: h % 2, secreto: (h >> 1) % 2, policia: (h >> 2) % 3, guarda: (h >> 3) % 2 },
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
    p.money = 10000; p.eco = 3; p.mil = 3; p.pop = 0; p.rec = { comida: 0, minerio: 0, energia: 0, concreto: 25, madeira: 0, terras_raras: 12, uranio: 0, borracha: 0 }; p.xp = 0; p.blackout = false;
    p.depositos = depositosOf(cid); p.upgrades = {}; p.pacts = {};
    p.buildings = { fazenda: 0, mina: 0, usina: 0, petroleo: 0, fabrica: 0, serraria: 0, mina_ouro: 0, estrada: 0, base: 0, mina_rara: 0, adubo: 0, mina_uranio: 0, solar: 0, eolica: 0 }; p.stats = { construidas: 0, vendidas: 0, vitorias: 0, presentes: 0, treinos: 0 }; p.famine = false;
    p.aprov = 50; p.ap = AP_PER_TURN; p.alive = true;
    p.allies = []; p.eliminatedReason = null; p.nuclear = 0; p.influencia = 0; p.fe = 0; p.wars = [];
    p.provinces = [{ name: 'Capital de ' + nat.name, infra: 1, owner: p.id, origem: p.id }];
    p.sanctioning = []; p.sanctionedBy = [];
    p.taxRate = 1; p.taxes = {corp:10, rend:10, prod:10, amb:5}; p.budget = {exe:1, int:1, tra:1, edu:1, ambm:1}; p.debt = 0; p.ideology = null; p.religion = 'laico';
    p.ministers = { eco: null, def: null, dip: null };
    p.techs = []; p.techLv = {}; p.sectors = { educacao: 0, saude: 0, cultura: 0, esportes: 0, habitacao: 0, justica: 0, turismo: 0 };
    p.space = 0; p.pollution = 10; p.relations = {}; p.embassies = []; p.trades = []; p.blockading = []; p.blockadedBy = [];
    p.units = { blindados: 0, aviacao: 0, frota: 0, infantaria: 0, artilharia: 0, submarinos: 0, porta_avioes: 0 }; p.builds = []; p.emergencyUntil = 0; p.leis = [];
    p.seguranca = { defesa: 0, secreto: 0, policia: 0, guarda: 0 };
  });
  for (let i = 0; i < room.players.length; i++) for (let j = i + 1; j < room.players.length; j++) {
    room.players[i].relations[room.players[j].id] = 50; room.players[j].relations[room.players[i].id] = 50;
  }
  for (const c of COUNTRIES) room.players.push(makeAIBot(c));
  room.players.forEach((p, i) => { if (p.bot) p.color = i % 60; });
  room.phase = 'game'; room.turn = 1; room.day = 1; room.proposals = [];
  room.un = null; room.noWarUntil = 20; room.noArmsUntil = 0; room.embargo = null; room.bloqueio = null;
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
  const marco = (id, p, txt) => { if (p && !room.marcos[id + '_' + p.id]) { room.marcos[id + '_' + p.id] = 1; log(room, `🏆 MARCO: ${cname(p)} — ${txt} (o jogo continua: o mundo é infinito!)`); } };
  if (room.players.length > 1 && alive.length === 1) marco('unica', alive[0], 'última nação de pé — o mundo é seu!');
  marco('eco', alive.find(p => p.eco >= 60), 'hegemonia econômica (economia 60+)');
  marco('ideo', alive.find(p => p.influencia >= 60), 'hegemonia ideológica (doutrina 60+)');
  marco('fe', alive.find(p => p.fe >= 60), 'hegemonia religiosa (fé 60+)');
  marco('convR', alive.find(p => p.religion && p.religion !== 'laico' && alive.filter(o => o.religion === p.religion).length > alive.length / 2), 'sua fé converteu a maioria das nações');
  marco('convI', alive.find(p => p.ideology && alive.filter(o => o.ideology === p.ideology).length > alive.length / 2), 'sua doutrina governa a maioria das nações');
  marco('sociedade', alive.find(p => { const s = p.sectors || {}; return ['educacao','saude','cultura','esportes','habitacao','justica','turismo'].every(k => (s[k] || 0) >= 4); }), 'sociedade perfeita (7 setores Nv4+)');
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
};

function incomeOf(room, p) {
  const prov = ownProvinces(p).reduce((s, pr) => s + pr.infra, 0) * PROV_INCOME;
  let bldMoney = 0;
  for (const k in p.buildings) {
    const n = p.buildings[k] || 0; if (!n) continue;
    const o = BUILD_OUT[k]; if (!o || !o.money) continue;
    bldMoney += n * o.money * upM(p, k) * (p.ministers.eco === 'ind' ? 1.2 : 1);
  }
  let base = p.eco * 10 + prov + Math.floor(p.pop / 8) + bldMoney
    + p.allies.length * 25
    + ((p.depositos || []).includes('ouro') ? 15 : 0)
    - p.embassies.length * 10
    + p.trades.length * 20
    + (p.space >= 3 ? 30 : 0)
    + sectorSum(p) * 2
    + relBonus(p);
  base += 20 * techLevel(p, 'valor_agreg');
  if (p.leis.includes('reforma_agraria')) base += 10;
  if (p.leis.includes('abertura_comercial')) base += 10;
  if (p.budget){ base *= 1 + (p.budget.tra-1)*0.03 + (p.budget.edu-1)*0.02; }
  let mult = 1;
  if (p.ideology === 'democracia') mult += 0.05;
  if (p.ideology === 'comunismo') mult -= 0.10;
  if (p.ministers.eco === 'tec') mult += 0.10;
  if (p.ministers.eco === 'pop') mult -= 0.05;
  if (p.ministers.def === 'pac') mult -= 0.10;
  if (p.taxRate === 2) mult += 0.15;
  if (p.taxRate === 0) mult -= 0.10;
  if (room.embargo && room.embargo.target === p.id && room.turn < room.embargo.until) mult *= 0.7;
  if (room.bloqueio && room.bloqueio.target === p.id && room.turn < room.bloqueio.until) mult *= 0.5;
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
  const yes = Object.values(u.votes).filter(v => v).length;
  const prop = u.proposer ? room.players.find(pp => pp.id === u.proposer) : null;
  const bonusVoto = (prop && prop.influencia >= 40) ? 1 : 0;
  const no = Object.values(u.votes).filter(v => !v).length;
  const passed = (yes + bonusVoto) > no;
  const tgt = u.target ? room.players.find(p => p.id === u.target) : null;
  if (bonusVoto) log(room, `🕊️ Soft power de ${cname(prop)} pesou na votação (+1 voto).`);
  if (passed) {
    if (u.type === 'proibir_guerra') { room.noWarUntil = room.turn + 3; log(room, '🇺 A ONU APROVOU: proibição de novas guerras por 3 semanas!'); }
    if (u.type === 'proibir_armas') { room.noArmsUntil = room.turn + 3; log(room, '🇺 A ONU APROVOU: proibição de recrutamento por 3 semanas!'); }
    if (u.type === 'embargo' && tgt) { room.embargo = { target: tgt.id, until: room.turn + 3 }; log(room, `🇺🇳 A ONU APROVOU embargo econômico contra ${cname(tgt)}!`); }
    if (u.type === 'bloqueio' && tgt) { room.bloqueio = { target: tgt.id, until: room.turn + 3 }; log(room, `🇺🇳 A ONU APROVOU BLOQUEIO TOTAL contra ${cname(tgt)} (renda -50% por 3 semanas)!`); }
    if (u.type === 'condenar' && tgt) { tgt.aprov = Math.max(0, tgt.aprov - 6); log(room, `🇺🇳 A ONU CONDENOU ${cname(tgt)} (-6 aprovação)!`); }
    if (u.type === 'manter_paz' && tgt) {
      const foes = (tgt.wars || []).slice();
      for (const fid of foes) { const f = room.players.find(x => x.id === fid); if (!f) continue;
        tgt.wars = tgt.wars.filter(id => id !== fid); f.wars = (f.wars || []).filter(id => id !== tgt.id);
        tgt.blockading = (tgt.blockading || []).filter(id => id !== fid); f.blockadedBy = (f.blockadedBy || []).filter(id => id !== tgt.id);
        f.blockading = (f.blockading || []).filter(id => id !== tgt.id); tgt.blockadedBy = (tgt.blockadedBy || []).filter(id => id !== fid); }
      log(room, `🇺🇳🕊️ MISSÃO DE PAZ: a ONU encerrou ${foes.length} guerra(s) de ${cname(tgt)}! Capacetes azuis nas fronteiras.`);
    }
    if (u.type === 'autorizar') { room.warAuth = { by: u.proposer, target: u.target, until: room.turn + 8 }; log(room, `🇺🇳 A ONU AUTORIZOU a intervenção militar! Válido por 8 semanas.`); }
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
  if (type.id === 'embargo' || type.id === 'condenar' || type.id === 'manter_paz' || type.id === 'bloqueio') target = alive[Math.floor(Math.random() * alive.length)];
  room.un = { type: type.id, desc: type.desc.replace('{T}', target ? cname(target) : ''), target: target ? target.id : null, votes: {}, deadline: Date.now() + 20000 };
  log(room, `🇺🇳 Sessão da ONU: ${room.un.desc}. Votação aberta!`);
  for (const b of room.players) if (b.bot && b.alive) {
    if (room.un.target) {
      const tp = room.players.find(x => x.id === room.un.target);
      room.un.votes[b.id] = tp ? relBetween(b, tp) < 50 : Math.random() < 0.5;
    } else room.un.votes[b.id] = Math.random() < 0.5;
  }
}

function dayTick(room) {
  if (room.phase !== 'game' || room.paused) return;
  if (room.un && Date.now() >= room.un.deadline) resolveUN(room);
  if (room.phase !== 'game') return;
  room.day++;
  for (const p of room.players) {
    if (!p.alive) continue;
    const done = p.builds.filter(b => (b.untilDay != null ? b.untilDay : room.day) <= room.day);
    p.builds = p.builds.filter(b => (b.untilDay != null ? b.untilDay : room.day) > room.day);
    for (const b of done) {
      if (b.kind === 'infra') { const pr = p.provinces[b.prov]; if (pr && pr.owner === p.id && pr.infra < 5) { pr.infra += 1; log(room, `🏗️ Construção concluída: ${pr.name} (${cname(p)}) infraestrutura ${pr.infra}.`); } }
      if (b.kind === 'nuclear' && p.nuclear < NUKE_MAX_LEVEL) { p.nuclear += 1; log(room, `☢️ ${cname(p)} conclui etapa do programa nuclear (nível ${p.nuclear}).`); }
      if (b.kind === 'espacial' && p.space < 3) { p.space += 1; p.aprov = Math.min(100, p.aprov + 2); log(room, `🚀 ${cname(p)} conclui etapa do programa espacial (nível ${p.space}).`); }
      if (PROD_NAMES[b.kind]) { p.buildings[b.kind] = (p.buildings[b.kind] || 0) + 1; p.stats.construidas++; log(room, `${PROD_NAMES[b.kind]} construíd${b.kind === 'mina' ? 'a' : 'o'} em ${cname(p)}.`); }
      if (b.kind === 'infra' || b.kind === 'nuclear') p.stats.construidas++;
    }
    p.money += incomeOf(room, p) / DAY_DIV;
    if (p.money < 0) { p.money = 0; p.mil = Math.max(1, Math.round(p.mil * 0.9)); }
    // aprovação
    let dAprov = -1;
    if (techLevel(p, 'estado_direito') > 0) dAprov = Math.ceil(dAprov / (1 + techLevel(p, 'estado_direito')));
    dAprov += Math.min(1, Math.floor(sectorSum(p) / 3));
    if (p.ideology === 'autoritarismo') dAprov -= 1;
    if (p.ideology === 'monarquia') dAprov += 1;
    if (p.ministers.eco === 'pop') dAprov += 1;
    if (p.ministers.def === 'pac') dAprov += 2;
    if (p.taxRate === 0) dAprov += 1;
    if (p.taxRate === 2) dAprov -= 2;
    if (p.taxes && p.taxes.amb >= 12) dAprov += 1;
    if (p.budget){ if (p.budget.int>=2) dAprov += 1; if (p.budget.ambm>=2) dAprov += 1; if (p.budget.edu===0) dAprov -= 1; }
    if (p.seguranca) dAprov += (p.seguranca.policia || 0);
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
    p.influencia += techLevel(p, 'influencia_cult') / DAY_DIV;
    p.ap = AP_PER_TURN;
  }
  // população, produção de recursos e oscilação do mercado
  for (const p of room.players) if (p.alive) {
    const infra = ownProvinces(p).reduce((sx, x) => sx + x.infra, 0);
    let nBld = 0;
    for (const k in p.buildings) nBld += (p.buildings[k] || 0);
    const needEn = Math.ceil(nBld / 4);
    p.rec.energia += (3 + infra * 2) / DAY_DIV;
    let mult = 1;
    if (nBld > 0 && p.rec.energia < needEn / DAY_DIV) {
      mult = 0.5;
      if (!p.blackout) { log(room, `🔌 APAGÃO em ${cname(p)}! Energia insuficiente — produção pela metade. Construa usinas.`); p.blackout = true; }
    } else { p.blackout = false; p.rec.energia -= needEn / DAY_DIV; }
    p.rec.comida += ((4 + infra * 3) * mult) / DAY_DIV;
    p.rec.minerio += ((2 + Math.round(p.eco * 0.8)) * mult) / DAY_DIV;
    p.rec.concreto += mult / DAY_DIV;
    // produção de cada prédio, direto do catálogo
    for (const k in p.buildings) {
      const n = p.buildings[k] || 0; if (!n) continue;
      const o = BUILD_OUT[k]; if (!o || !o.res) continue;
      p.rec[o.res] = (p.rec[o.res] || 0) + (n * o.qtd * upM(p, k) * mult) / DAY_DIV;
    }
    const dep = p.depositos || [];
    if (dep.includes('petroleo')) p.rec.energia += 2 / DAY_DIV;
    if (dep.includes('minerio')) p.rec.minerio += 2 / DAY_DIV;
    if (dep.includes('madeira')) p.rec.madeira += 3 / DAY_DIV;
    if (dep.includes('comida')) p.rec.comida += 3 / DAY_DIV;
    if (dep.includes('terras_raras')) p.rec.terras_raras += 1 / DAY_DIV;
    if (dep.includes('uranio')) p.rec.uranio += 1 / DAY_DIV;
    const need = Math.ceil(p.pop / 10) / DAY_DIV;
    let g = (4 + infra * 2) / DAY_DIV;
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
    if (!p.alive || p.bot) continue;
    p.stats = p.stats || {};
    p.stats.mandatos = p.stats.mandatos || 0;
    if (p.aprov >= 50) { p.stats.mandatos++; p.money += 300; p.aprov = Math.min(100, p.aprov + 3); log(room, `🗳️ ${cname(p)} foi REELEITO com ${Math.round(p.aprov)}% de aprovação! (+$300, +3 ❤️, ${p.stats.mandatos}º mandato)`); }
    else if (p.aprov >= 35) { p.aprov = Math.min(100, p.aprov + 1); log(room, `🗳️ ${cname(p)} vence a eleição no aperto (${Math.round(p.aprov)}%) — a oposição cresce.`); }
    else { p.aprov = Math.max(0, p.aprov - 5); p.emergencyUntil = room.turn + 2; log(room, `🗳️ DERROTA nas urnas para ${cname(p)} (${Math.round(p.aprov)}%)! Protestos tomam as ruas — EMERGÊNCIA.`); }
  }
}

function resolveWeek(room) {
  room.turn++;
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
  if ((room.day - 1) % 14 === 0){ randomEvent(room); worldNews(room); }
  if ((room.day - 1) % 28 === 0 && !room.un) openUN(room);
  if ((room.day - 1) % 56 === 0) eleicoes(room);
  if ((room.day - 1) % 14 === 0) aiTurn(room);
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
const BUILD_OUT = {serraria:{res:'madeira',qtd:5}, mina_ouro:{money:25}, fabrica:{res:'concreto',qtd:6}, borracha:{res:'borracha',qtd:3}, mina_rara:{res:'terras_raras',qtd:3}, mina_uranio:{res:'uranio',qtd:2}, petroleo:{res:'energia',qtd:3}, mina:{res:'minerio',qtd:4}, usina:{res:'energia',qtd:4}, hidreletrica:{res:'energia',qtd:6}, usina_nuclear:{res:'energia',qtd:12}, solar:{res:'energia',qtd:3}, eolica:{res:'energia',qtd:5}, alternativa:{res:'energia',qtd:4}, agua:{res:'comida',qtd:2}, mina_sal:{res:'comida',qtd:2}, acucar:{res:'comida',qtd:3}, padaria:{res:'comida',qtd:4}, gado:{res:'comida',qtd:5}, fazenda:{res:'comida',qtd:5}, jardim:{res:'comida',qtd:2}, estufa:{res:'comida',qtd:7}, doces:{money:8}, adubo:{res:'comida',qtd:4}, processados:{res:'comida',qtd:6}, premium:{money:18}, estaleiro_naval:{money:12}, motores:{money:14}, maquinas:{res:'minerio',qtd:3}, siderurgica:{res:'minerio',qtd:6}, base:{}, quartel:{}, arsenal:{}, hangar:{}, aerodromo:{}, estaleiro:{}, centro_ind:{}, campo_treino:{}, armazem:{}, estrada:{money:5}, ferrovia:{money:8}, metro:{money:10}, ciclovia:{money:2}, aeroporto:{money:14}, porto:{money:12}, heliporto:{money:6}, terminal:{money:20},mina_carvao:{res:'energia',qtd:3},mina_cobre:{res:'minerio',qtd:4},mina_bauxita:{res:'minerio',qtd:4},mina_prata:{money:14},mina_litio:{res:'terras_raras',qtd:2},mina_niquel:{res:'minerio',qtd:4},mina_zinco:{res:'minerio',qtd:3},mina_diamante:{money:22},mina_estanho:{res:'minerio',qtd:3},mina_manganes:{res:'minerio',qtd:4},plataforma_gas:{res:'energia',qtd:5},pedreira:{res:'concreto',qtd:4},usina_carvao:{res:'energia',qtd:5},usina_geotermica:{res:'energia',qtd:6},usina_maremotriz:{res:'energia',qtd:5},usina_biomassa:{res:'energia',qtd:4},usina_ondas:{res:'energia',qtd:4},reator_torio:{res:'energia',qtd:10},dessalinizacao:{money:7},hidrogenio:{res:'energia',qtd:6},frota_pesqueira:{res:'comida',qtd:5},aquicultura:{res:'comida',qtd:4},trigo:{res:'comida',qtd:4},arroz:{res:'comida',qtd:4},milho:{res:'comida',qtd:4},soja:{res:'comida',qtd:5},cafe:{money:12},cacau:{money:10},citricos:{res:'comida',qtd:3},vinicola:{money:14},cervejaria:{money:13},laticinios:{res:'comida',qtd:5},frigorifico:{res:'comida',qtd:6},oleo_vegetal:{res:'comida',qtd:4},refinaria:{res:'energia',qtd:4},petroquimica:{money:16},plastico:{money:10},vidro:{money:9},papel:{money:8},cimento:{res:'concreto',qtd:5},tecelagem:{money:9},couro:{money:9},moveis:{money:11},eletronicos:{money:15},semicondutores:{money:20},montadora:{money:18},caminhoes:{money:15},aeronaves:{money:19},fertilizantes:{res:'comida',qtd:3},farmaceutica:{money:17},quimica:{money:13},baterias:{money:12},paineis_solares:{res:'energia',qtd:2},base_aerea:{},base_naval:{},academia_militar:{},inteligencia:{},drones:{},silo_misseis:{},antimisseis:{},radar:{},hospital_militar:{},centro_logistico:{},escola:{money:4},universidade:{money:9},instituto_tecnico:{money:6},hospital:{money:5},clinica:{money:5},habitacao:{money:7},saneamento:{money:4},rede_agua:{money:4},reciclagem:{res:'minerio',qtd:2},aterro:{money:3},incineradora:{res:'energia',qtd:2},barragem:{res:'energia',qtd:4},canal:{money:4},ponte:{money:6},tunel:{money:6},data_center:{money:13},telecom:{money:8},banco:{money:16},bolsa_valores:{money:22},estadio:{money:10},teatro:{money:6},museu:{money:5},biblioteca:{money:3},parque:{money:3},hotel:{money:11},shopping:{money:14},zona_franca:{money:15},porto_seco:{money:9},observatorio:{money:4},porto_espacial:{money:25}};
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
  aM += 0.15 * techLevel(a, 'escola_oficiais');
  aM += 0.05 * a.units.blindados + 0.02 * a.units.aviacao + 0.04 * a.units.artilharia + 0.02 * a.units.submarinos + 0.02 * a.units.porta_avioes;
  dM += 0.05 * d.units.aviacao + 0.03 * d.units.frota + 0.04 * d.units.infantaria + 0.02 * d.units.submarinos + 0.04 * d.units.porta_avioes;
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
      const ks = ['infantaria', 'blindados', 'artilharia', 'aviacao', 'porta_avioes'];
      const k = ks[room.turn % ks.length];
      if (b.units[k] < 3) { b.money -= UNIT_COSTS[k]; b.rec.terras_raras -= 4; b.units[k]++; }
    }
    // crescimento da IA (Fase 20): bots evoluem eco/tech/leis como gente
    if (b.money > 2000 && room.turn % 5 === 0 && b.eco < 40) { b.money -= 500; b.eco += 1; }
    if (b.money > 1500 && room.turn % 6 === 0) { const _tk = Object.keys(TECHS)[(room.turn + b.id.length) % Object.keys(TECHS).length]; b.techLv = b.techLv || {}; if ((b.techLv[_tk] || 0) < 3) { b.techLv[_tk]++; b.money -= 200; } }
    if (b.money > 3000 && room.turn % 7 === 0 && (b.leis || []).length < 6) { b.leis = b.leis || []; const _lk = Object.keys(LEIS).find(k => !b.leis.includes(k)); if (_lk) { b.leis.push(_lk); b.money -= LEIS[_lk].cost; } }
    if (b.crise) resolverCrise(room, b, (b.money > 500) ? 0 : 2);
    if (b.religion && b.religion !== 'laico' && b.money > 500 && Math.random() < 0.25) { const tgts = room.players.filter(o => o.alive && o !== b && o.religion !== b.religion); if (tgts.length) { const t3 = tgts[Math.floor(Math.random() * tgts.length)]; if (Math.random() < 0.3 + relBetween(b, t3) / 200) { t3.religion = b.religion; bumpRel(b, t3, 10); b.stats.conversoes = (b.stats.conversoes || 0) + 1; log(room, `🛐 ${cname(b)} espalhou sua religião para ${cname(t3)}!`); } } }
    if (b.ideology && b.money > 500 && Math.random() < 0.25) { const tgts2 = room.players.filter(o => o.alive && o !== b && o.ideology !== b.ideology); if (tgts2.length) { const t4 = tgts2[Math.floor(Math.random() * tgts2.length)]; if (Math.random() < 0.3 + relBetween(b, t4) / 200) { t4.ideology = b.ideology; bumpRel(b, t4, 10); b.stats.doutrinacoes = (b.stats.doutrinacoes || 0) + 1; log(room, `⚖️ ${cname(b)} espalhou sua ideologia para ${cname(t4)}!`); } } }
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
    if (room.turn > 20 && humans.length && b.mil >= 8 && Math.random() * botsAlive < 0.08 && room.turn >= room.noWarUntil) {
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
  const dmg = { terremoto: '🏚️ TERREMOTO', pandemia: '🦠 PANDEMIA', seca: '🏜️ SECA SEVERA', enchente: '🌊 ENCHENTE' }[tipo];
  if (tipo === 'terremoto') { const prs = ownProvinces(pick).filter(pr => pr.infra > 0); if (prs.length) prs[0].infra -= 1; pick.aprov = Math.max(0, pick.aprov - 4); }
  if (tipo === 'pandemia') { pick.pop = Math.max(0, (pick.pop || 0) - 15); pick.aprov = Math.max(0, pick.aprov - 5); }
  if (tipo === 'seca') { pick.rec.comida = 0; pick.aprov = Math.max(0, pick.aprov - 3); }
  if (tipo === 'enchente') { pick.money = Math.max(0, pick.money - 200); pick.aprov = Math.max(0, pick.aprov - 3); }
  log(room, `${dmg} atinge ${cname(pick)}! Abra 🚨 CRISES e escolha como responder.`);
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
  } else p.crise = null;
}

function randomEvent(room) {
  if (Math.random() > 0.45) return;
  const alive = room.players.filter(p => p.alive);
  if (!alive.length) return;
  const pick = alive[Math.floor(Math.random() * alive.length)];
  switch (Math.floor(Math.random() * 14)) {
    case 0: alive.forEach(p => p.money += 80); log(room, '📈 Boom das commodities: todas as nações recebem +$80.'); break;
    case 1: pick.money = Math.max(0, pick.money - 150); log(room, `📉 Crise financeira atinge ${cname(pick)}: -$150.`); break;
    case 2: alive.forEach(p => p.aprov = Math.min(100, p.aprov + 3)); log(room, '🕊️ Cúpula de paz global: aprovação +3 para todos.'); break;
    case 3: {
      const g = (pick.seguranca && pick.seguranca.guarda) || 0;
      if (g >= 2 && Math.random() < 0.25 * g) { log(room, `🪖 A Guarda Nacional de ${cname(pick)} abortou uma tentativa de golpe!`); break; }
      pick.mil = Math.max(1, pick.mil - 2); pick.aprov = Math.max(0, pick.aprov - 4);
      log(room, `🪖 Tentativa de golpe em ${cname(pick)}: -2 militar, -4 aprovação.`); break;
    }
    case 4: pick.eco += 1; log(room, `🛢️ ${cname(pick)} descobre novas reservas: economia +1.`); break;
    case 5: pick.aprov = Math.min(100, pick.aprov + 5); log(room, `🎉 Festival nacional em ${cname(pick)}: aprovação +5.`); break;
    case 6: { const provs = ownProvinces(pick).filter(pr => pr.infra < 5); if (provs.length) { provs[0].infra += 1; log(room, `🏗️ Obra concluída em ${provs[0].name} (${cname(pick)}): infraestrutura +1.`); } break; }
    case 7: pick.influencia += 2; log(room, `🎬 Cultura de ${cname(pick)} conquista o mundo: influência +2.`); break;
    case 8: { const provs = ownProvinces(pick).filter(pr => pr.infra > 0); if (provs.length) { const pr = provs[0]; pr.infra -= 1; pick.emergencyUntil = room.turn + 3; log(room, `🌪️ DESASTRE em ${pr.name} (${cname(pick)}): infra -1 e EMERGÊNCIA (-20% renda por 3 turnos). Peça ou receba ajuda!`); } break; }
    case 9: { const ks = Object.keys(pick.buildings).filter(k => pick.buildings[k] > 0); if (ks.length) { const k = ks[Math.floor(Math.random() * ks.length)]; pick.buildings[k] -= 1; pick.aprov = Math.max(0, pick.aprov - 5); pick.emergencyUntil = room.turn + 3; log(room, `🌍 TERREMOTO em ${cname(pick)}: ${PROD_NAMES[k] || k} destruído, -5 aprovação, EMERGÊNCIA declarada!`); } break; }
    case 10: novaCrise(room, pick, 'terremoto'); break;
    case 11: novaCrise(room, pick, 'pandemia'); break;
    case 12: novaCrise(room, pick, 'seca'); break;
    case 13: novaCrise(room, pick, 'enchente'); break;
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
      const k = msg.value; if (!TECHS[k]) return;
      const lvl = techLevel(p, k);
      if (lvl >= TECH_MAX) return err(p.conn, 'Essa tecnologia já está no nível máximo.');
      const cost = p.ideology === 'republica' ? Math.round(techCost(lvl) * 0.75) : techCost(lvl);
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
      if (p.space + p.builds.filter(b=>b.kind==='espacial').length >= 3) return;
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
    case 'emprestimo': p.money += 600; p.debt += 720; log(room, `🏦 ${cname(p)} contrai empréstimo de $600 (dívida $${p.debt}).`); break;
    case 'pagar': { const x = Math.min(p.debt, p.money); if (x <= 0) return; p.money -= x; p.debt -= x; log(room, `🏦 ${cname(p)} paga $${x} da dívida.`); break; }
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
      info(p.conn, `🕵️ Relatório sobre ${cname(target)} — Caixa $${Math.round(target.money)} | Eco ${target.eco} | Mil ${target.mil} | ❤️ ${target.aprov}% | ☢️ ${target.nuclear} | ⚖️ ${target.influencia} | 🕌 ${target.fe} | Dívida $${target.debt}`);
      break;
    }
    case 'sabotagem': {
      if (!target || target === p || !target.alive) return;
      if (!spend(p, 1, dipCost(p, 150))) return;
      const sAtk = (p.seguranca && p.seguranca.secreto) || 0;   // serviço secreto de quem ataca
      const sDef = (target.seguranca && target.seguranca.secreto) || 0; // de quem se defende
      const chance = Math.min(0.85, 0.5 + 0.08 * sAtk + (p.ministers.dip === 'esp' ? 0.1 : 0));
      const r = Math.random();
      if (r < chance) {
        if (sDef >= 2 && Math.random() < 0.15 * sDef) {
          log(room, `🕵️ O Serviço Secreto de ${cname(target)} DETECTOU e conteve a sabotagem de ${cname(p)}!`);
          bumpRel(p, target, -3);
        } else {
          const provs = ownProvinces(target).filter(pr => pr.infra > 0);
          if (provs.length) { const pr = provs[Math.floor(Math.random() * provs.length)]; pr.infra -= 1; log(room, `🧨 Sabotagem de ${cname(p)} destrói infraestrutura em ${pr.name} (${cname(target)})!`); }
          else { target.mil = Math.max(1, target.mil - 3); log(room, `🧨 Sabotagem de ${cname(p)} danifica o arsenal de ${cname(target)} (-3 militar)!`); }
          bumpRel(p, target, -5);
        }
      } else if (r < chance + Math.max(0.1, 0.3 - 0.05 * sAtk)) { p.aprov = Math.max(0, p.aprov - 5); target.aprov = Math.min(100, target.aprov + 2); log(room, `🚨 ${cname(p)} foi EXPOSTO sabotando ${cname(target)}!`); bumpRel(p, target, -10); }
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
      if (room.batalha && !room.batalha.fim) { err(p.conn, 'Já há uma batalha em andamento nesta sala.'); return; }
      if (p.pacts && p.pacts[target.id] > room.turn) { err(p.conn, 'Pacto de não-agressão vigente com essa nação.'); return; }
      p.ap -= 2;
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
      const shield = techLevel(target, 'interceptadores') > 0;
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
      if (msg.kind === 'eolica' && (p.rec.terras_raras || 0) < 5) { err(p.conn, '🌬️ Turbinas eólicas exigem 5 ⚙️ terras raras em estoque.'); return; }
      const need = CONCRETE_NEED[msg.kind] || 0;
      if (p.rec.concreto < need) { err(p.conn, `🧱 Precisa de ${need} de concreto — construa uma Fábrica de concreto primeiro.`); return; }
      let cCost = PROD_BUILDS[msg.kind];
      cCost = Math.ceil(cCost * (1 - 0.05 * techLevel(p, 'infra')));
      if (!spend(p, 1, cCost)) return;
      p.rec.concreto -= need;
      const diasObra = buildDays(cCost);
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
      const precisaAlvo = tipo === 'autorizar' || tipo === 'embargo' || tipo === 'condenar' || tipo === 'manter_paz' || tipo === 'bloqueio';
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
        else if (alvoId) { const tp = room.players.find(x => x.id === alvoId); room.un.votes[b.id] = tp ? relBetween(b, tp) < 50 : Math.random() < 0.5; }
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
    player.connected = false; player.conn = null; player.disconnectedAt = Date.now();
    log(room, `📴 ${player.name} perdeu a conexão (tem ${Math.round(ABANDON_MS / 60000)} min para voltar).`);
    if (room.hostId === player.id) { const next = room.players.find(p => p.connected); if (next) room.hostId = next.id; }
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
  conn.onMessage = text => {
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
  milicia:      { em:'🔰', nome:'Milícia',       hp:8,  atk:2, def:1, alc:1 },
};
const BT_COLS = 7, BT_LINHAS = 6;
const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

function btLog(b, msg) { b.log.unshift(msg); if (b.log.length > 40) b.log.length = 40; }

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
  const bonus = 1 + (p.mil || 0) * 0.02;
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
  const dano = Math.max(1, Math.round(u.atk * (0.85 + Math.random() * 0.4) - alvo.def * 0.4));
  alvo.hp -= dano;
  const morto = alvo.hp <= 0;
  if (morto) alvo.hp = 0;
  btLog(b, `${BT[u.tipo].em} ${BT[u.tipo].nome} atinge ${BT[alvo.tipo].em} ${BT[alvo.tipo].nome}: -${dano} HP` +
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
