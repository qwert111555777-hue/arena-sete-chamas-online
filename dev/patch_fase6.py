#!/usr/bin/env python3
"""FASE 6: mapa satelite Leaflet (estilo MA3) + fallback p/ SVG.
So cliente (server.js intocado). Uso: python3 patch_fase6.py (a partir de /home/user/presidente-online)"""
import io, sys

IDX = 'public/index.html'
fails = []

def rep(buf, old, new, tag):
    if buf.count(old) != 1:
        fails.append(f'{tag}: achou {buf.count(old)}x')
        return buf
    print(f'  ok {tag}')
    return buf.replace(old, new)

h = io.open(IDX, encoding='utf-8').read()
print('== CLIENTE ==')

h = rep(h, "<title>Presidente Online — Simulador de Geopolítica</title>\n<style>",
           "<title>Presidente Online — Simulador de Geopolítica</title>\n<link rel=\"stylesheet\" href=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css\">\n<style>", 'L1 leaflet css')
h = rep(h, "<script>",
           "<script src=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.js\"></script>\n<script>", 'L2 leaflet js')
h = rep(h, "</style>",
"""  /* mapa satelite Leaflet (MA3) */
  #leafmap{position:absolute;inset:0;z-index:1;background:#0a1226;}
  body.leaf-on svg#map{visibility:hidden;}
  .lflag{width:30px;height:21px;}
  .lflag img{width:30px;height:21px;display:block;}
  .lcus{width:30px;height:21px;display:flex;align-items:center;justify-content:center;font-size:15px;}
  .lflag.sel{filter:drop-shadow(0 0 5px #ffd76a);}
  .leaflet-container{font-family:inherit;font-size:11px;}
  .leaflet-container .leaflet-control-attribution{background:rgba(10,18,38,.7);color:#8fa0c2;font-size:9px;}
  .leaflet-container .leaflet-control-attribution a{color:#8fa0c2;}
</style>""", 'L3 leaflet css2')
h = rep(h, '      <svg id="map" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice">',
           '      <div id="leafmap" class="hidden"></div>\n      <svg id="map" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice">', 'L4 leafmap div')
h = rep(h, "  });\n}\n\nfunction renderPanel(){",
"""  });
  syncLeaflet();
}

/* ---------- mapa satelite (Leaflet, estilo MA3) ---------- */
let leafMap = null, leafMarks = {};
function leafInit(){
  if (leafMap || typeof L === 'undefined' || !$('leafmap')) return;
  try {
    leafMap = L.map('leafmap', { minZoom: 2, maxZoom: 7, maxBounds: [[-85,-200],[85,200]], maxBoundsViscosity: 1, worldCopyJump: true, zoomControl: false }).setView([20, 0], 2);
    L.control.zoom({ position: 'bottomright' }).addTo(leafMap);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri, Maxar, Earthstar Geographics', maxZoom: 7 }).addTo(leafMap);
    $('leafmap').classList.remove('hidden');
    document.body.classList.add('leaf-on');
    window.__leaf = true;
  } catch(e){ leafMap = null; }
}
function syncLeaflet(){
  if (!leafMap){ leafInit(); if (!leafMap) return; }
  const seen = {};
  state.players.forEach(p => {
    if (!p.country) return;
    const c = cbid(p.country) || {};
    if (c.lat == null || c.lon == null) return;
    seen[p.id] = 1;
    const iso = isoOf(p.country);
    const sel = (p.id === selectedId) ? ' sel' : '';
    const dim = p.alive ? '' : ';opacity:.45';
    const html = iso
      ? '<div class="lflag' + sel + '" style="box-shadow:0 1px 4px rgba(0,0,0,.6)' + dim + '"><img src="flags/' + iso + '.svg" alt=""></div>'
      : '<div class="lflag lcus' + sel + '" style="background:' + PALETTE[(p.color||0)%60] + ';box-shadow:0 1px 4px rgba(0,0,0,.6)' + dim + '">' + (c.flag||p.customFlag||'🏳️') + '</div>';
    const ic = L.divIcon({ html: html, className: '', iconSize: [30,21], iconAnchor: [15,10] });
    if (leafMarks[p.id]){ leafMarks[p.id].setLatLng([c.lat, c.lon]); leafMarks[p.id].setIcon(ic); }
    else { leafMarks[p.id] = L.marker([c.lat, c.lon], { icon: ic }).addTo(leafMap); leafMarks[p.id].on('click', () => { selectedId = (selectedId===p.id?null:p.id); renderMap(); renderPanel(); }); }
  });
  Object.keys(leafMarks).forEach(id => { if (!seen[id]){ leafMap.removeLayer(leafMarks[id]); delete leafMarks[id]; } });
  if (leafMap._al) leafMap._al.forEach(l => leafMap.removeLayer(l));
  leafMap._al = [];
  const mm = me();
  if (mm && mm.country){
    const a = cbid(mm.country) || {};
    (mm.allies||[]).forEach(aid => {
      const al = state.players.find(p=>p.id===aid);
      const b = (al && al.country) ? (cbid(al.country)||{}) : {};
      if (a.lat != null && b.lat != null) leafMap._al.push(L.polyline([[a.lat,a.lon],[b.lat,b.lon]],{color:'#e8b93c',weight:2,dashArray:'6 5',opacity:.8}).addTo(leafMap));
    });
  }
}

function renderPanel(){""", 'L5 leaflet js')
h = rep(h, "document.addEventListener('wheel', e => {\n  if ($('scr-game').classList.contains('hidden')) return;",
           "document.addEventListener('wheel', e => {\n  if ($('scr-game').classList.contains('hidden')) return;\n  if (window.__leaf) return;", 'L6 guard wheel')
h = rep(h, "document.addEventListener('pointerdown', e => {\n  if ($('scr-game').classList.contains('hidden')) return;",
           "document.addEventListener('pointerdown', e => {\n  if ($('scr-game').classList.contains('hidden')) return;\n  if (window.__leaf) return;", 'L7 guard pan')

if fails:
    print('\nFALHAS:'); [print(' -', f) for f in fails]; sys.exit(1)
io.open(IDX, 'w', encoding='utf-8').write(h)
print('\nPATCH FASE6 OK (server.js intocado)')
