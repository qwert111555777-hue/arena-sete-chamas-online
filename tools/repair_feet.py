#!/usr/bin/env python3
"""Repara pés/sapatos visíveis nos sprites já aprovados.

Os sprites originais tinham margem transparente, mas alguns pés/sapatos vieram
pequenos/incompletos na própria arte. Este reparo mantém rosto/roupa/corpo e
reforça a parte inferior de cada frame com sapatos/botas/patas completos.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SHEET_DIR = ROOT / 'public/assets/spritesheets'
PORTRAIT_DIR = ROOT / 'public/assets/portraits'

CONFIG = {
    'albert':    dict(kind='shoe', shoe='#111418', sole='#f3f0e6', sock='#f1f1eb', margin=10, spread=.18, w=.20, h=.060),
    'geovanna':  dict(kind='shoe', shoe='#ff4fa0', sole='#fff3fb', sock='#ffffff', margin=10, spread=.18, w=.18, h=.055),
    'romulo':    dict(kind='shoe', shoe='#151515', sole='#f2f2ee', sock='#f3f3ed', margin=10, spread=.16, w=.18, h=.055),
    'arthur':    dict(kind='shoe', shoe='#111111', sole='#ffffff', sock='#ffffff', margin=9,  spread=.17, w=.18, h=.055),
    'guilherme': dict(kind='boot', shoe='#2b1a11', sole='#c98a4a', sock='#233044', margin=10, spread=.15, w=.18, h=.060),
    'otavio':    dict(kind='boot', shoe='#3a2015', sole='#8b5632', sock='#513327', margin=10, spread=.17, w=.20, h=.065),
    'anielle':   dict(kind='boot', shoe='#172016', sole='#5fa36d', sock='#18331e', margin=10, spread=.16, w=.18, h=.058),
    'lenda':     dict(kind='boot', shoe='#3b1f10', sole='#e09045', sock='#6b3416', margin=12, spread=.18, w=.21, h=.065),
    'vanjo':     dict(kind='shoe', shoe='#1d2430', sole='#cfd7df', sock='#313842', margin=11, spread=.15, w=.17, h=.055),
    'napoleao':  dict(kind='paw',  shoe='#fff2d2', sole='#8b5a36', sock='#fff2d2', margin=10, spread=.18, w=.18, h=.065),
    # Mito não usa sapato: ele flutua. Reforçamos a ponta da forma astral para não parecer cortada.
    'mito':      dict(kind='float', shoe='#9a4cff', sole='#ff70df', sock='#5830b8', margin=11, spread=.00, w=.16, h=.065),
}


def hex_rgba(hex_color, alpha=255):
    h = hex_color.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (alpha,)


def alpha_bbox(img, threshold=18):
    arr = np.array(img.getchannel('A'))
    ys, xs = np.where(arr > threshold)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()+1), int(ys.max()+1)


def draw_shoe(draw, cx, top, w, h, toe_dir, cfg, boot=False):
    outline = (12, 10, 9, 230)
    shoe = hex_rgba(cfg['shoe'], 245)
    sole = hex_rgba(cfg['sole'], 245)
    hi = (255, 255, 255, 72)
    # Forma com bico virado para fora, mais completa que um círculo simples.
    pts = [
        (cx - toe_dir*w*.52, top + h*.05),
        (cx + toe_dir*w*.36, top - h*.02),
        (cx + toe_dir*w*.70, top + h*.38),
        (cx + toe_dir*w*.55, top + h*.80),
        (cx - toe_dir*w*.44, top + h*.88),
        (cx - toe_dir*w*.68, top + h*.50),
    ]
    draw.polygon(pts, fill=outline)
    inner = [(x, y + h*.03) for x, y in pts]
    draw.polygon(inner, fill=shoe)
    if boot:
        draw.rounded_rectangle([cx - w*.40, top - h*.72, cx + w*.18, top + h*.18], radius=max(2, int(h*.22)), fill=outline)
        draw.rounded_rectangle([cx - w*.34, top - h*.62, cx + w*.14, top + h*.22], radius=max(2, int(h*.18)), fill=shoe)
    # sola clara/contrastante para o pé aparecer completo.
    y = top + h*.82
    draw.line([(cx - toe_dir*w*.56, y), (cx + toe_dir*w*.54, y - h*.05)], fill=sole, width=max(1, int(h*.18)))
    draw.line([(cx - toe_dir*w*.18, top + h*.22), (cx + toe_dir*w*.22, top + h*.15)], fill=hi, width=max(1, int(h*.12)))


def draw_paw(draw, cx, top, w, h, cfg):
    outline = (93, 54, 32, 220)
    fur = hex_rgba(cfg['shoe'], 248)
    pad = hex_rgba(cfg['sole'], 225)
    draw.ellipse([cx-w*.58, top-h*.05, cx+w*.58, top+h*.95], fill=outline)
    draw.ellipse([cx-w*.50, top, cx+w*.50, top+h*.86], fill=fur)
    draw.ellipse([cx-w*.20, top+h*.45, cx+w*.20, top+h*.72], fill=pad)
    for off in (-.32, 0, .32):
        draw.ellipse([cx+w*off-w*.09, top+h*.18, cx+w*off+w*.09, top+h*.36], fill=pad)


def repair_frame(frame, name, row=0, col=0, portrait=False):
    cfg = CONFIG[name]
    bbox = alpha_bbox(frame)
    if not bbox:
        return frame, 0
    l, t, r, b = bbox
    W, H = frame.size
    bw, bh = max(1, r-l), max(1, b-t)
    margin = max(3 if portrait else 8, int(cfg['margin'] * (.72 if portrait else 1)))
    target_bottom = min(H - margin, b + max(5, int(bh * .055)))
    if target_bottom <= b + 2 and H - b > margin + 3:
        target_bottom = H - margin

    layer = Image.new('RGBA', frame.size, (0,0,0,0))
    d = ImageDraw.Draw(layer, 'RGBA')
    center = (l + r) / 2
    # Passo alternado nas linhas de corrida/ataque para o sapato acompanhar a animação.
    step = ((col % 2) * 2 - 1) * bw * (0.020 if row in (1,2,3) else 0.006)

    if cfg['kind'] == 'float':
        h = max(7, min(18, bh * cfg['h']))
        w = max(12, min(34, bw * cfg['w']))
        top = target_bottom - h
        # Ponta astral completa, não sapato.
        d.ellipse([center-w*.65, top-h*.20, center+w*.65, top+h*.92], fill=(38, 18, 82, 205))
        d.ellipse([center-w*.48, top, center+w*.48, top+h*.78], fill=hex_rgba(cfg['shoe'], 205))
        d.arc([center-w*.78, top-h*.25, center+w*.78, top+h*1.08], 20, 160, fill=hex_rgba(cfg['sole'], 190), width=max(1, int(h*.18)))
        out = Image.alpha_composite(frame, layer)
        return out, max(0, target_bottom - b)

    if cfg['kind'] == 'paw':
        h = max(8, min(20, bh * cfg['h']))
        w = max(12, min(34, bw * cfg['w']))
        top = target_bottom - h
        for sign in (-1, 1):
            cx = center + sign * bw * cfg['spread'] + sign * step
            draw_paw(d, cx, top + (2 if sign > 0 and row == 1 else 0), w, h, cfg)
        out = Image.alpha_composite(frame, layer)
        return out, max(0, target_bottom - b)

    h = max(6, min(16, bh * cfg['h']))
    w = max(10, min(32, bw * cfg['w']))
    top = target_bottom - h
    sock = hex_rgba(cfg['sock'], 155)
    # Conectores discretos para não parecer que o pé está solto.
    for sign in (-1, 1):
        cx = center + sign * bw * cfg['spread'] + sign * step
        ankle_w = max(4, w * .28)
        ankle_top = max(t, min(b - h*.35, top - h*.82))
        d.rounded_rectangle([cx-ankle_w, ankle_top, cx+ankle_w, top+h*.25], radius=max(1, int(h*.18)), fill=sock)
    draw_shoe(d, center - bw * cfg['spread'] - step, top, w, h, -1, cfg, boot=cfg['kind']=='boot')
    draw_shoe(d, center + bw * cfg['spread'] + step, top + (1 if row == 1 else 0), w, h, 1, cfg, boot=cfg['kind']=='boot')

    out = Image.alpha_composite(frame, layer)
    return out, max(0, target_bottom - b)


def repair_spritesheets():
    meta_path = SHEET_DIR / 'meta.json'
    meta = json.loads(meta_path.read_text(encoding='utf-8'))
    changed = {}
    for name, m in meta.items():
        if name not in CONFIG:
            continue
        p = SHEET_DIR / f'{name}.webp'
        img = Image.open(p).convert('RGBA')
        out = Image.new('RGBA', img.size, (0,0,0,0))
        max_extension = 0
        for row in range(m['rows']):
            for col in range(m['cols']):
                box = (col*m['frameW'], row*m['frameH'], (col+1)*m['frameW'], (row+1)*m['frameH'])
                fr = img.crop(box)
                fixed, ext = repair_frame(fr, name, row, col, portrait=False)
                max_extension = max(max_extension, ext)
                out.alpha_composite(fixed, (box[0], box[1]))
        # Pad agora reflete a nova margem inferior real, para o pé ficar ancorado corretamente no chão.
        cfg_margin = int(CONFIG[name]['margin'])
        m['pad'] = max(8, cfg_margin)
        out.save(p, 'WEBP', quality=82, method=6)
        changed[name] = max_extension
    meta_path.write_text(json.dumps(meta, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
    return changed


def repair_portraits():
    changed = {}
    for p in sorted(PORTRAIT_DIR.glob('*.webp')):
        name = p.stem
        if name not in CONFIG:
            continue
        img = Image.open(p).convert('RGBA')
        fixed, ext = repair_frame(img, name, 0, 0, portrait=True)
        fixed.save(p, 'WEBP', quality=84, method=6)
        changed[name] = ext
    return changed


if __name__ == '__main__':
    s = repair_spritesheets()
    p = repair_portraits()
    print('SPRITE_FEET_REPAIRED', s)
    print('PORTRAIT_FEET_REPAIRED', p)
