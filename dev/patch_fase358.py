# -*- coding: utf-8 -*-
"""
FASE 358 — Tutorial interativo (onboarding estilo MA3, arte 100% original CSS/emoji).
Fecha o unico gap real restante vs MA3 (gap #9 do estudo: "tutorial").

Regras do handover respeitadas:
  - assert count==1 em toda substituicao
  - NENHUM JS dentro de string literal (conteudo e dado, handlers via DOM)
  - nao mexe em logica de jogo, so cliente (server intocado)
  - skin papel/ouro/teal igual ao resto da UI MA3
"""
import io, sys

H = '/home/user/presidente-online/public/index.html'
h = io.open(H, encoding='utf-8').read()
orig = h


def trocar(antigo, novo, nome):
    global h
    n = h.count(antigo)
    if n != 1:
        print('ERRO: ancora %s encontrada %dx (esperado 1)' % (nome, n))
        sys.exit(1)
    h = h.replace(antigo, novo)
    print('  ok: %s' % nome)


# ---------------------------------------------------------------- 1. CSS
CSS = """  #tut{position:fixed;inset:0;background:rgba(8,12,24,.78);z-index:60;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;}
  #tut.hidden{display:none;}
  .tut-card{position:relative;width:min(440px,94vw);max-height:88vh;overflow-y:auto;background:linear-gradient(180deg,#fbf3de,#eddcb4);border:3px solid #c9a227;border-radius:14px;padding:20px 22px;box-shadow:0 18px 48px rgba(0,0,0,.65);color:#2b2416;font-family:inherit;}
  .tut-card h2{margin:8px 0 8px;font-size:17px;color:#8a6a1f;}
  .tut-card p{margin:0 0 14px;font-size:13px;line-height:1.8;color:#2b2416;}
  .tut-emoji{font-size:38px;line-height:1;}
  .tut-steps{display:flex;gap:6px;margin-bottom:14px;}
  .tut-steps i{flex:1;height:5px;border-radius:3px;background:#d9c79a;}
  .tut-steps i.on{background:#1f7a78;}
  .tut-nav{display:flex;gap:8px;justify-content:space-between;}
  .tut-btn{flex:1;padding:9px 12px;cursor:pointer;border:2px solid #c9a227;background:#fff8e6;color:#2b2416;border-radius:9px;font-weight:700;font-size:12.5px;font-family:inherit;}
  .tut-btn.primary{background:#1f7a78;border-color:#1f7a78;color:#fff;}
  .tut-btn:disabled{opacity:.4;cursor:default;}
  .tut-skip{display:flex;align-items:center;gap:7px;margin-top:12px;font-size:11.5px;color:#6b5a33;cursor:pointer;-webkit-user-select:none;user-select:none;}
  .tut-open-btn{margin-top:10px;padding:7px 12px;cursor:pointer;border:2px solid #c9a227;background:#fff8e6;color:#2b2416;border-radius:8px;font-weight:700;font-size:12px;font-family:inherit;}
"""
trocar('  .minrow{display:flex;align-items:center;gap:10px;background:#fff8e6;',
       CSS + '  .minrow{display:flex;align-items:center;gap:10px;background:#fff8e6;',
       'CSS tutorial')

# ------------------------------------------------------- 2. HTML do overlay
TUT_HTML = """
      <div id="tut" class="hidden">
        <div class="tut-card">
          <button class="px" id="tut-x" title="Fechar">✕</button>
          <div class="tut-steps" id="tut-dots"></div>
          <div class="tut-emoji" id="tut-emoji">🎯</div>
          <h2 id="tut-title">—</h2>
          <p id="tut-text">—</p>
          <div class="tut-nav">
            <button class="tut-btn" id="tut-prev">◀ Voltar</button>
            <button class="tut-btn primary" id="tut-next">Avançar ▶</button>
          </div>
          <label class="tut-skip"><input type="checkbox" id="tut-never"> não mostrar novamente</label>
        </div>
      </div>
"""
trocar("""          📰 Jornal: tudo que acontece · 🔔 seus avisos.
        </div>
      </div>""",
       """          📰 Jornal: tudo que acontece · 🔔 seus avisos.<br>
          <button class="tut-open-btn" id="tut-open">📖 Abrir tutorial passo a passo</button>
        </div>
      </div>""" + TUT_HTML,
       'HTML tutorial')

# ------------------------------------------------------------- 3. JS
TUT_JS = """/* ===== FASE 358 — TUTORIAL INTERATIVO (cliente only) ===== */
const TUT_KEY = 'po_tut_v1';
const TUT_STEPS = [
  ['🎯', 'Seu objetivo',
   'Você é o <b>presidente</b> de uma nação. Gerencie <b>dinheiro, comida, população, economia e força militar</b>, mantendo a <b>aprovação</b> alta.<br>O jogo é <b>infinito</b>: a cada 60 dias você conquista um <b>MARCO 🏆</b> e continua.'],
  ['⚡', 'Ações e tempo',
   'Você tem <b>4 ações por dia</b>. Cada dia vale <b>3 segundos</b>.<br>Use <b>⏸️</b> para pausar e <b>⏱️</b> para acelerar até <b>5x</b>.<br>Ações ficam nos botões <b>🏗️ 🧪 ⚔️ 🤝 🕵️ ☢️ 🇺🇳</b> na barra de baixo.'],
  ['🏗️', 'Construir e setores',
   'Em <b>🏗️ Construir</b> você ergue prédios (minas, fazendas, quartéis...).<br>Em <b>🏛️ Governo</b> você investe nos <b>7 setores sociais</b> — Educação, Saúde, Cultura, Esportes, Habitação, Justiça, Turismo — do <b>Nv 1 ao 5</b> (1⚡ + $150 cada).'],
  ['⚔️', 'Guerra, ONU e espionagem',
   '<b>Declare guerra antes de atacar.</b> Sem autorização da <b>ONU 🇺🇳</b>, as outras nações se voltam contra você.<br>Precisa de votos? Aprovar sai mais barato que enfrentar o mundo — e você pode <b>💰 comprar apoio ($200)</b> para virar metade dos contrários.'],
  ['🏆', 'Crises e vitórias',
   'Aprovação em <b>0% = reforma</b> (perde metade do caixa). <b>Crises</b> pedem decisão com custo visível — escolha, não azar.<br><b>Vitórias:</b> militar (180 nações), religiosa, ideológica e a <b>SUPREMA</b> (as três).']
];
let tutIdx = 0;
function tutRender(){
  const st = TUT_STEPS[tutIdx];
  $('tut-emoji').textContent = st[0];
  $('tut-title').textContent = st[1];
  $('tut-text').innerHTML = st[2];
  $('tut-dots').innerHTML = TUT_STEPS.map((_,i)=>'<i class="'+(i===tutIdx?'on':'')+(i<tutIdx?' on':'')+'"></i>').join('');
  $('tut-prev').disabled = (tutIdx === 0);
  $('tut-next').textContent = (tutIdx === TUT_STEPS.length-1) ? 'Começar a jogar ✓' : 'Avançar ▶';
}
function abrirTutorial(){
  tutIdx = 0; tutRender();
  $('tut').classList.remove('hidden');
}
function fecharTutorial(){
  $('tut').classList.add('hidden');
  if ($('tut-never').checked) { try { localStorage.setItem(TUT_KEY,'1'); } catch(e){} }
}
function tutAutoOnce(){
  let visto = '0';
  try { visto = localStorage.getItem(TUT_KEY) || '0'; } catch(e){}
  if (visto !== '1') abrirTutorial();
}
$('tut-next').onclick = () => {
  if (tutIdx < TUT_STEPS.length-1) { tutIdx++; tutRender(); }
  else fecharTutorial();
};
$('tut-prev').onclick = () => { if (tutIdx > 0) { tutIdx--; tutRender(); } };
$('tut-x').onclick = fecharTutorial;
$('tut').onclick = e => { if (e.target === $('tut')) fecharTutorial(); };
document.addEventListener('keydown', e => {
  if ($('tut').classList.contains('hidden')) return;
  if (e.key === 'Escape') fecharTutorial();
  if (e.key === 'ArrowRight') $('tut-next').click();
  if (e.key === 'ArrowLeft') $('tut-prev').click();
});
$('btn-help').onclick = () => {"""
trocar("$('btn-help').onclick = () => {", TUT_JS, 'JS tutorial')

# -------------------------------- 4. gancho: abrir 1x ao entrar no jogo
trocar("  else { showScreen('scr-game'); renderGame(); updateDayHUD(); renderOverlay(); renderMarket(); renderSuprema(); }",
       "  else { showScreen('scr-game'); renderGame(); updateDayHUD(); renderOverlay(); renderMarket(); renderSuprema(); if (window.tutAutoOnce) tutAutoOnce(); }",
       'gancho auto-once')

# ------------------------------- 5. botao dentro do help-panel
trocar("""$('ov-btn').onclick = () => {""",
       """$('tut-open').onclick = () => { $('help-panel').classList.add('hidden'); $('btn-help').classList.remove('active'); abrirTutorial(); };
$('ov-btn').onclick = () => {""",
       'botao abrir tutorial')

if h == orig:
    print('NADA MUDOU — abortando')
    sys.exit(1)
io.open(H, 'w', encoding='utf-8').write(h)
print('\nFASE 358 aplicada. Rodar node-check duplo.')
