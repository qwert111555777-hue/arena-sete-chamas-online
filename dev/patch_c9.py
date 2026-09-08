# C9: reescreve a linha "Sua produção por dia" de forma generica (140 predios).
# Line-based, SEM regex (regex com ^$ + DOTALL ja destruiu o index.html 2x!).
import io, sys
C='/home/user/presidente-online/public/index.html'
lines=io.open(C,encoding='utf-8').read().split('\n')
idx=[i for i,l in enumerate(lines) if 'Sua produção por turno' in l]
if len(idx)!=1:
    print(f'C9 FALHOU: {len(idx)} linhas com o marcador'); sys.exit(1)
lines[idx[0]]="""  { const pd_up = m.upgrades || {}, pd_dep = m.depositos || [];
    const pd_um = k => 1 + 0.5*(pd_up[k]||0);
    let pdCom = 4+infra*3, pdMin = 2+Math.round(m.eco*0.8), pdEne = 3+infra*2, pdCon = 1, pdMad = 0, pdTer = 0, pdUra = 0, pdBor = 0, pdMny = 0;
    for (const k in bd){ const n = bd[k]||0; if (!n) continue; const o = BUILD_OUT[k]; if (!o) continue;
      if (o.money) pdMny += n*o.money*pd_um(k);
      else if (o.res==='comida') pdCom += n*o.qtd*pd_um(k); else if (o.res==='minerio') pdMin += n*o.qtd*pd_um(k);
      else if (o.res==='energia') pdEne += n*o.qtd*pd_um(k); else if (o.res==='concreto') pdCon += n*o.qtd*pd_um(k);
      else if (o.res==='madeira') pdMad += n*o.qtd*pd_um(k); else if (o.res==='terras_raras') pdTer += n*o.qtd*pd_um(k);
      else if (o.res==='uranio') pdUra += n*o.qtd*pd_um(k); else if (o.res==='borracha') pdBor += n*o.qtd*pd_um(k); }
    if (pd_dep.includes('petroleo')) pdEne += 2; if (pd_dep.includes('minerio')) pdMin += 2; if (pd_dep.includes('madeira')) pdMad += 3;
    if (pd_dep.includes('comida')) pdCom += 3; if (pd_dep.includes('terras_raras')) pdTer += 1; if (pd_dep.includes('uranio')) pdUra += 1;
    const pd_d1 = v => Math.round(v/7*10)/10;
    info.textContent='Sua produção por dia: 🌾+'+pd_d1(pdCom)+' · ⛏️+'+pd_d1(pdMin)+' · ⚡+'+pd_d1(pdEne)+' · 🧱+'+pd_d1(pdCon)+' · 🪵+'+pd_d1(pdMad)+' · ⚙️+'+pd_d1(pdTer)+' · ☢️+'+pd_d1(pdUra)+' · 🌳+'+pd_d1(pdBor)+' · 💰+$'+pd_d1(pdMny)+' — 4 prédios consomem 1⚡ (sem energia = apagão: produção pela metade)'; }"""
io.open(C,'w',encoding='utf-8').write('\n'.join(lines))
print('C9 OK (linha %d reescrita)' % (idx[0]+1))
