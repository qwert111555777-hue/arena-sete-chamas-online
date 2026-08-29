#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
try:
    from PIL import Image, ImageChops, ImageStat
    import numpy as np
except Exception as exc:
    print(f"ERR Pillow/numpy indisponível para verificação visual: {exc}")
    sys.exit(1)

failures = 0

def ok(cond, msg):
    global failures
    if cond:
        print(f"OK  {msg}")
    else:
        failures += 1
        print(f"ERR {msg}")

# Verifica corte real dos frames animados: bordas e pés têm margem.
meta_path = ROOT / 'public/assets/spritesheets/meta.json'
meta = json.loads(meta_path.read_text(encoding='utf-8'))
for name, m in sorted(meta.items()):
    img = Image.open(ROOT / 'public/assets/spritesheets' / f'{name}.webp').convert('RGBA')
    min_margin = 10**9
    min_bottom = 10**9
    bad_frames = []
    for row in range(m['rows']):
        for col in range(m['cols']):
            fr = img.crop((col*m['frameW'], row*m['frameH'], (col+1)*m['frameW'], (row+1)*m['frameH']))
            a = np.array(fr.getchannel('A'))
            ys, xs = np.where(a > 18)
            if len(xs) == 0:
                bad_frames.append((row, col, 'vazio'))
                continue
            left, top, right, bottom = int(xs.min()), int(ys.min()), int(xs.max()+1), int(ys.max()+1)
            margin = min(left, top, m['frameW']-right, m['frameH']-bottom)
            bottom_margin = m['frameH'] - bottom
            min_margin = min(min_margin, margin)
            min_bottom = min(min_bottom, bottom_margin)
            if margin < 14 or bottom_margin < 16:
                bad_frames.append((row, col, (left, top, right, bottom), margin, bottom_margin))
    ok(not bad_frames, f'{name}: frames sem corte nos pés/bordas (margem mínima {min_margin}px, pé {min_bottom}px)')

# Verifica que cenários não são a mesma imagem e são realistas/compactos por dimensão/tamanho.
stage_files = [
    'stage1_lama_esgoto.jpg',
    'stage2_ifs_mito.jpg',
    'stage3_terreiro_lenda.jpg',
    'stage4_supermercado_vanjo.jpg',
    'stage5_reino_comidas.jpg',
]
stage_imgs = []
for f in stage_files:
    p = ROOT / 'public/assets/stages' / f
    im = Image.open(p).convert('RGB')
    ok(im.size == (1152, 648), f'{f}: dimensão otimizada 1152x648')
    ok(p.stat().st_size < 260*1024, f'{f}: tamanho leve ({round(p.stat().st_size/1024)} KB)')
    stage_imgs.append((f, im.resize((64,36), Image.Resampling.BILINEAR)))
for i in range(len(stage_imgs)):
    for j in range(i+1, len(stage_imgs)):
        name_a, a = stage_imgs[i]
        name_b, b = stage_imgs[j]
        diff = ImageChops.difference(a, b)
        mean = sum(ImageStat.Stat(diff).mean) / 3
        ok(mean > 8, f'{name_a} diferente de {name_b} (diferença média {mean:.1f})')

if failures:
    print(f"\nVERIFY_VISUAL_FAIL: {failures} erro(s)")
    sys.exit(1)
print('\nVERIFY_VISUAL_OK')
