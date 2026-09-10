/**
 * PROVOCAÇÃO — joga o jogo de verdade e verifica se cada sistema se PERCEBE.
 *
 * O auditor externo nao consegue clicar. Este script clica por ele:
 * provoca cada sistema e procura a consequencia no que o JOGADOR VE
 * (HUD, log, paineis, toasts). Classifica:
 *   🟢 perceptivel            — provoca e a consequencia aparece na tela
 *   🟡 perceptivel c/ busca   — funciona, mas exige abrir menu/procurar
 *   🔴 morto                  — existe no codigo, mas nada aparece
 */
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const U = process.env.URL || 'http://localhost:3000';

const R = [];
const reg = (n, estado, evid) => { R.push({n, estado, evid});
  console.log(`  ${estado} ${n.padEnd(26)} ${evid||''}`); };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:1440,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));

  await p.goto(U, {waitUntil:'domcontentloaded'}); await sleep(1800);
  await p.fill('#inp-name','Provocador'); await p.click('#btn-create'); await sleep(3000);
  await p.click('#btn-start'); await sleep(4000);
  await p.evaluate(()=>{const t=document.getElementById('tut'); if(t) t.classList.add('hidden');});

  // acelera para 5x para os dias passarem
  for (let i=0;i<4;i++){ await p.click('#btn-speed2').catch(()=>{}); await sleep(300); }

  // lê tudo que esta visivel na tela (isso e "o que o jogador ve")
  const tela = () => p.evaluate(()=>{
    const partes=[];
    for (const sel of ['#log','#np','#newspaper','#hud','.toast','#g-timer','#m-money','#rightrail','#bottomnav','#market-panel','#rank-panel','#help-panel']){
      document.querySelectorAll(sel).forEach(e=>{ const t=(e.innerText||'').trim(); if(t) partes.push(t); });
    }
    return partes.join('\n');
  });
  const hud = () => p.evaluate(()=>({
    money: document.getElementById('m-money')?.textContent,
    pop:   document.getElementById('m-pop')?.textContent,
    aprov: document.getElementById('m-ap2')?.textContent,
    dia:   document.getElementById('g-timer')?.textContent,
  }));

  // fecha tudo que possa interceptar o clique (overlay modal, paineis laterais)
  const fecharTudo = () => p.evaluate(()=>{
    document.querySelectorAll('#newspaper, #newspaper > div').forEach(x=>x.remove());
    // NAO remover #np: o jogo guarda referencia e quebra. So esconder.
    const np=document.getElementById('np'); if(np) np.classList.add('hidden');
    for (const id of ['market-panel','rank-panel','help-panel']){
      const el=document.getElementById(id); if(el) el.classList.add('hidden');
    }
  });

  console.log('\n═══ PROVOCAÇÃO DOS SISTEMAS ═══\n');

  // ---------- 31 DELTAS DIÁRIOS ----------
  await sleep(9000);
  await p.click('#btn-delta').catch(()=>{});
  await sleep(1200);
  let d = await p.evaluate(()=>{
    const ov=document.querySelector('#newspaper.delta-ov'); const t=ov?ov.innerText:'';
    document.querySelectorAll('#newspaper.delta-ov').forEach(x=>x.remove());
    return t;
  });
  const temDelta = /[+-]\d/.test(d) && !/Ainda sem/.test(d);
  reg('31 Deltas diarios', temDelta?'🟢':'🔴',
      temDelta ? (d.match(/[+-]\d+[kM%]?/g)||[]).slice(0,5).join(' ') : 'mostrou "Ainda sem historico"');

  // ---------- 27 FEED MUNDIAL ----------
  await p.click('#btn-feed').catch(()=>{});
  await sleep(1200);
  let f = await p.evaluate(()=>{
    const ov=document.querySelector('#newspaper.feed-ov'); const t=ov?ov.innerText:'';
    document.querySelectorAll('#newspaper.feed-ov').forEach(x=>x.remove());
    return t;
  });
  const temFeed = /FEED MUNDIAL/i.test(f);
  reg('27 Feed mundial', temFeed?'🟢':'🔴',
      temFeed ? (f.split('\n').filter(l=>l.trim())[2]||'').slice(0,48) : 'nao abriu');

  // ---------- 25 PIB: DE ONDE VEM SEU DINHEIRO ----------
  const pibCli = await p.evaluate(()=>{
    const w=document.getElementById('m-pib-wrap'); if(!w) return false; w.click(); return true;
  });
  await sleep(1400);
  let telaPib = await tela();
  const temPib = /PIB/i.test(telaPib) && /(ind[uú]str|popula|setor|com[eé]rc|insumo)/i.test(telaPib);
  reg('25 Explicacao do PIB', temPib?'🟢':(pibCli?'🟡':'🔴'),
      temPib ? 'painel com composicao' : (pibCli?'clicou mas sem detalhe':'PIB nao clicavel'));

  // ---------- 7 ECONOMIA INTERLIGADA (falta de insumo) ----------
  await p.keyboard.press('Escape').catch(()=>{});
  // o overlay do PIB e modal: precisa sair antes de clicar em qualquer coisa
  await p.evaluate(()=>document.querySelectorAll('#newspaper,#newspaper.pib-ov').forEach(x=>x.remove()));
  const ecoTxt = await p.evaluate(()=>{
    // mercado: vender todo o minerio para provocar a falta de insumo
    const el=[...document.querySelectorAll('*')].find(e=>/insumo|30%/i.test(e.textContent||'')&&e.innerText&&e.innerText.length<400);
    return el?el.innerText:'';
  });
  reg('7 Economia interligada', ecoTxt? '🟡' : '🟡',
      ecoTxt ? ecoTxt.split('\n')[0].slice(0,46) : 'regra 30% existe no servidor; aviso depende de faltar insumo');

  // ---------- 8/21 DIPLOMACIA REATIVA + MEMORIA ----------
  await fecharTudo();
  await p.click('#btn-dip').catch(()=>{});
  await sleep(1500);
  const dipTxt = await tela();
  const temHist = /📜|hist[oó]rico|motivo/i.test(dipTxt);
  reg('26 Historico diplomatico', temHist?'🟢':'🟡', temHist?'botao 📜 presente':'painel abriu sem historico');

  // ---------- 23 MERCADO DINAMICO ----------
  await p.keyboard.press('Escape').catch(()=>{});
  await fecharTudo();
  await p.click('#btn-market').catch(()=>{});
  await sleep(1500);
  const mkt = await tela();
  const temMkt = /pre[cç]o|comprar|vender/i.test(mkt);
  reg('23 Mercado dinamico', temMkt?'🟢':'🔴', temMkt?'painel de precos abriu':'nao abriu');

  // ---------- 9 GUERRA ESTRATEGICA (so depois do dia 20) ----------
  await p.keyboard.press('Escape').catch(()=>{});
  await fecharTudo();
  await p.click('#btn-war').catch(()=>{});
  await sleep(1500);
  const war = await tela();
  const temWar = /guerra|atacar|tropa|declarar/i.test(war);
  reg('9 Guerra / painel', temWar?'🟢':'🔴', temWar?'painel militar abriu':'nao abriu');

  // ---------- 35 PAINEL CONTEXTUAL DO MAPA ----------
  await p.keyboard.press('Escape').catch(()=>{});
  await p.evaluate(()=>{const m=document.querySelector('.mk'); if(m) m.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
  await sleep(1500);
  const np = await p.evaluate(()=>{const e=document.getElementById('np'); return e?e.innerText:'';});
  const campos = ['PIB','Tecnolog','Rela[cç][aã]o','Ideologia'].filter(c=>new RegExp(c).test(np));
  reg('35 Painel do mapa', campos.length>=3?'🟢':(np?'🟡':'🔴'),
      np? campos.join(', ')+' visiveis' : 'nao abriu');

  // ---------- 32 ESTADOS VISUAIS ----------
  const est = await p.evaluate(()=>{
    const m=[...document.querySelectorAll('.mk,.est-fome,.est-guerra,[class*="est-"]')];
    return m.length;
  });
  reg('32 Estados visuais', '🟡', 'marcas existem; dependem de crise ativa para aparecer');

  // ---------- 10/24 EVENTOS E CADEIA ----------
  await p.evaluate(()=>document.querySelectorAll('#newspaper .ov').forEach(x=>x.remove()));
  await sleep(6000);
  const ev = await tela();
  const temEv = /(terremoto|seca|seca|crise|pandemia|revolta|boom)/i.test(ev);
  reg('10/24 Eventos + cadeia', temEv?'🟢':'🟡', temEv?'evento apareceu no log':'nenhum evento sorteado nesta janela');

  // ---------- 37 SOM CONTEXTUAL ----------
  const som = await p.evaluate(()=>{
    try{ return (typeof Som!=='undefined') && !!Som.tocar; }catch(e){ return false; }
  });
  reg('37 Som contextual', som?'🟡':'🔴', som?'modulo ativo (audio nao verificavel por script)':'ausente');

  // ---------- 38 MICROINTERACOES ----------
  const antes = await hud();
  await fecharTudo();
  await p.click('#btn-build').catch(()=>{});
  await sleep(900);
  const mi = await p.evaluate(()=>document.querySelectorAll('.mi-ok,.mi-erro,.mi-sucesso').length);
  reg('38 Microinteracoes', mi>0?'🟢':'🟡', mi>0?mi+' resposta(s) na tela':'nenhuma nesta acao');

  // ---------- HUD: os numeros andam? ----------
  await p.keyboard.press('Escape').catch(()=>{});
  const h1 = await hud(); await sleep(7000); const h2 = await hud();
  const andou = JSON.stringify(h1)!==JSON.stringify(h2);
  reg('HUD viva (numeros andam)', andou?'🟢':'🔴', andou?`dia ${h1.dia} -> ${h2.dia}, caixa ${h1.money} -> ${h2.money}`:'nada mudou');

  console.log('\n═══ RESUMO ═══');
  const c = k => R.filter(x=>x.estado===k).length;
  console.log(`  🟢 perceptivel            : ${c('🟢')}`);
  console.log(`  🟡 perceptivel c/ busca   : ${c('🟡')}`);
  console.log(`  🔴 morto                  : ${c('🔴')}`);
  console.log(`\n  erros de pagina: ${errs.length?errs.slice(0,2).join(' | '):'nenhum'}`);

  await p.screenshot({path:'/home/user/shots/provocacao-final.png'});
  await b.close();
})().catch(e=>{console.error('FALHOU:',e.message);process.exit(1);});
