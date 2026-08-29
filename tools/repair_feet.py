#!/usr/bin/env python3
"""Completa pés/sapatos dos sprites sem criar 'blocos' artificiais.

Mantém a arte aprovada e só reforça a parte inferior: sapatos/tênis/botas/patas
pequenos, conectados às pernas e com margem transparente segura.
"""
from pathlib import Path
import json
import math
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SHEET_DIR = ROOT / 'public/assets/spritesheets'
PORTRAIT_DIR = ROOT / 'public/assets/portraits'

CONFIG = {
    'albert':    dict(kind='shoe', shoe='#14181c', sole='#eee9df', sock='#e9e7df', ext=.040, w=.135, h=.045, minw=10, maxw=18, margin=18),
    'geovanna':  dict(kind='shoe', shoe='#ff58a4', sole='#fff4fb', sock='#fff5f7', ext=.038, w=.130, h=.042, minw=9,  maxw=16, margin=18),
    'romulo':    dict(kind='shoe', shoe='#151719', sole='#f0eee9', sock='#e8e3dc', ext=.038, w=.130, h=.042, minw=9,  maxw=16, margin=18),
    'arthur':    dict(kind='shoe', shoe='#101215', sole='#f4f4f1', sock='#eeeeea', ext=.038, w=.130, h=.042, minw=9,  maxw=16, margin=18),
    'guilherme': dict(kind='boot', shoe='#2b1b12', sole='#b97b42', sock='#252d3a', ext=.040, w=.132, h=.046, minw=9,  maxw=17, margin=18),
    'otavio':    dict(kind='boot', shoe='#3c2519', sole='#8f5d39', sock='#4b3429', ext=.040, w=.135, h=.048, minw=11, maxw=20, margin=18),
    'anielle':   dict(kind='boot', shoe='#172016', sole='#6aa56c', sock='#203522', ext=.038, w=.128, h=.045, minw=9,  maxw=16, margin=18),
    'lenda':     dict(kind='boot', shoe='#3b2115', sole='#d28a48', sock='#61351d', ext=.040, w=.135, h=.050, minw=12, maxw=23, margin=20),
    'vanjo':     dict(kind='shoe', shoe='#202833', sole='#cfd6de', sock='#313b45', ext=.036, w=.118, h=.043, minw=10, maxw=18, margin=18),
    'napoleao':  dict(kind='paw',  shoe='#fff0d0', sole='#8b5a36', sock='#fff0d0', ext=.030, w=.095, h=.048, minw=13, maxw=26, margin=18),
    'mito':      dict(kind='float', shoe='#884cff', sole='#ff73df', sock='#5b31b4', ext=.030, w=.105, h=.050, minw=10, maxw=19, margin=18),
}


def rgba(hex_color, a=255):
    h = hex_color.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0,2,4)) + (a,)


def bbox_alpha(img, th=18):
    arr = np.array(img.getchannel('A'))
    ys, xs = np.where(arr > th)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()+1), int(ys.max()+1)


def sample_color(frame, x, y, fallback):
    arr = np.array(frame)
    H, W = arr.shape[:2]
    xs = range(max(0, int(x)-3), min(W, int(x)+4))
    ys = range(max(0, int(y)-8), min(H, int(y)+3))
    vals=[]
    for yy in ys:
        for xx in xs:
            if arr[yy, xx, 3] > 30:
                vals.append(arr[yy, xx, :3])
    if not vals:
        return rgba(fallback, 170)
    mean = np.mean(vals, axis=0).astype(int)
    return (int(mean[0]), int(mean[1]), int(mean[2]), 185)


def foot_centers(frame, bbox):
    l,t,r,b = bbox
    W,H = frame.size
    arr = np.array(frame.getchannel('A'))
    bw, bh = r-l, b-t
    y0 = max(t, b - max(16, int(bh*.22)))
    mask = arr[y0:b, l:r] > 18
    ys, xs = np.where(mask)
    cx = (l+r)/2
    fallback = [cx - bw*.15, cx + bw*.15]
    if len(xs) < 8:
        return fallback
    absx = xs + l
    left = absx[absx < cx]
    right = absx[absx >= cx]
    out=[]
    for side, fb in ((left, fallback[0]), (right, fallback[1])):
        if len(side) < 4:
            out.append(fb)
        else:
            # Pega pixels mais baixos do lado, porque correspondem ao pé/perna.
            out.append(float(np.median(side)))
    if abs(out[1]-out[0]) < bw*.13:
        out = fallback
    return out


def aa_layer(size, scale=4):
    return Image.new('RGBA', (size[0]*scale, size[1]*scale), (0,0,0,0)), scale


def P(scale, *pts):
    return [(x*scale, y*scale) for x,y in pts]


def draw_natural_shoe(d, scale, cx, top, w, h, direction, cfg, leg_col, boot=False):
    cx*=scale; top*=scale; w*=scale; h*=scale
    direction = -1 if direction < 0 else 1
    shoe = rgba(cfg['shoe'], 246)
    sole = rgba(cfg['sole'], 232)
    outline = (8,7,7,190)
    highlight = (255,255,255,70)
    leg_col = tuple(leg_col[:3]) + (150,)

    # tornozelo/ponte, curto e atrás do sapato para ficar conectado.
    ankle_w = max(2*scale, w*.16)
    ankle_h = h*(1.10 if boot else .78)
    d.rounded_rectangle([cx-ankle_w, top-ankle_h, cx+ankle_w, top+h*.28], radius=max(1, int(h*.18)), fill=leg_col)

    if boot:
        d.rounded_rectangle([cx-w*.30, top-h*.78, cx+w*.20, top+h*.22], radius=max(2, int(h*.24)), fill=outline)
        d.rounded_rectangle([cx-w*.24, top-h*.68, cx+w*.16, top+h*.18], radius=max(2, int(h*.20)), fill=shoe)

    # tênis/sapato em perspectiva, bico para fora, sobrepondo o pé antigo.
    pts = [
        (cx - direction*w*.40, top + h*.22),
        (cx + direction*w*.30, top + h*.05),
        (cx + direction*w*.66, top + h*.28),
        (cx + direction*w*.72, top + h*.58),
        (cx + direction*w*.46, top + h*.78),
        (cx - direction*w*.45, top + h*.82),
        (cx - direction*w*.58, top + h*.54),
    ]
    d.polygon(pts, fill=outline)
    pts2=[(x, y+h*.03) for x,y in pts]
    d.polygon(pts2, fill=shoe)
    # sola fina, não um bloco.
    d.line([(cx-direction*w*.50, top+h*.82), (cx+direction*w*.52, top+h*.76)], fill=sole, width=max(1, int(h*.16)))
    d.line([(cx-direction*w*.06, top+h*.32), (cx+direction*w*.34, top+h*.22)], fill=highlight, width=max(1, int(h*.12)))


def draw_paw(d, scale, cx, top, w, h, cfg):
    cx*=scale; top*=scale; w*=scale; h*=scale
    outline=(96,59,35,170); fur=rgba(cfg['shoe'],230); pad=rgba(cfg['sole'],190)
    d.ellipse([cx-w*.46, top+h*.02, cx+w*.46, top+h*.82], fill=outline)
    d.ellipse([cx-w*.40, top+h*.06, cx+w*.40, top+h*.74], fill=fur)
    d.ellipse([cx-w*.15, top+h*.44, cx+w*.15, top+h*.63], fill=pad)
    for off in (-.25,.0,.25):
        d.ellipse([cx+w*off-w*.07, top+h*.22, cx+w*off+w*.07, top+h*.34], fill=pad)


def draw_float_tip(d, scale, cx, top, w, h, cfg):
    cx*=scale; top*=scale; w*=scale; h*=scale
    d.ellipse([cx-w*.42, top-h*.08, cx+w*.42, top+h*.72], fill=(45,22,95,155))
    d.ellipse([cx-w*.30, top+h*.02, cx+w*.30, top+h*.58], fill=rgba(cfg['shoe'],178))
    d.arc([cx-w*.62, top-h*.12, cx+w*.62, top+h*.82], 20, 160, fill=rgba(cfg['sole'],170), width=max(1, int(h*.16)))


def repair_frame(frame, name, row=0, col=0, portrait=False):
    cfg = CONFIG[name]
    bbox = bbox_alpha(frame)
    if not bbox:
        return frame
    l,t,r,b=bbox
    W,H=frame.size
    bw,bh=max(1,r-l),max(1,b-t)
    margin=int(cfg['margin'] * (.72 if portrait else 1))
    ext=max(3, int(bh*cfg['ext']*(.72 if portrait else 1)))
    target_bottom=min(H-margin, b+ext)
    if target_bottom <= b:
        target_bottom=min(H-8, b+3)
    # Tamanho proporcional e limitado; sapato pequeno, integrado.
    shoe_w=max(cfg['minw']*(.72 if portrait else 1), min(cfg['maxw']*(.78 if portrait else 1), bw*cfg['w']))
    shoe_h=max(5*(.72 if portrait else 1), min(14*(.82 if portrait else 1), bh*cfg['h']))
    top=target_bottom-shoe_h
    if top > b - shoe_h*.20:
        top = b - shoe_h*.35
        target_bottom = top + shoe_h
    centers=foot_centers(frame,bbox)
    # Pequeno passo nas animações, mas sem descolar.
    step = (1 if col % 2 else -1) * bw * (0.010 if row else 0.004)
    layer, scale=aa_layer(frame.size,4)
    d=ImageDraw.Draw(layer,'RGBA')

    if cfg['kind']=='float':
        draw_float_tip(d, scale, (l+r)/2, top, shoe_w, shoe_h*1.35, cfg)
    elif cfg['kind']=='paw':
        for i,sign in enumerate((-1,1)):
            cx=centers[i] + sign*step
            draw_paw(d, scale, cx, top + (1 if row==1 and i==1 else 0), shoe_w, shoe_h*1.15, cfg)
    else:
        for i,sign in enumerate((-1,1)):
            cx=centers[i] + sign*step
            leg_col=sample_color(frame,cx,b-8,cfg['sock'])
            draw_natural_shoe(d, scale, cx, top + (0.8 if row==1 and i==1 else 0), shoe_w, shoe_h, sign, cfg, leg_col, boot=cfg['kind']=='boot')

    layer=layer.resize(frame.size, Image.Resampling.LANCZOS)
    return Image.alpha_composite(frame, layer)


def actual_min_bottom(img, m):
    min_bottom=10**9
    for row in range(m['rows']):
        for col in range(m['cols']):
            fr=img.crop((col*m['frameW'], row*m['frameH'], (col+1)*m['frameW'], (row+1)*m['frameH']))
            bb=bbox_alpha(fr)
            if bb:
                min_bottom=min(min_bottom, m['frameH']-bb[3])
    return 18 if min_bottom==10**9 else int(min_bottom)


def repair_sheets():
    meta_path=SHEET_DIR/'meta.json'
    meta=json.loads(meta_path.read_text(encoding='utf-8'))
    result={}
    for name,m in meta.items():
        if name not in CONFIG: continue
        p=SHEET_DIR/f'{name}.webp'
        img=Image.open(p).convert('RGBA')
        out=Image.new('RGBA',img.size,(0,0,0,0))
        old_min=actual_min_bottom(img,m)
        for row in range(m['rows']):
            for col in range(m['cols']):
                box=(col*m['frameW'],row*m['frameH'],(col+1)*m['frameW'],(row+1)*m['frameH'])
                fixed=repair_frame(img.crop(box),name,row,col,False)
                out.alpha_composite(fixed,(box[0],box[1]))
        new_min=actual_min_bottom(out,m)
        m['pad']=max(8, min(22, new_min))
        out.save(p,'WEBP',quality=84,method=6)
        result[name]=(old_min,new_min,m['pad'])
    meta_path.write_text(json.dumps(meta,separators=(',',':'),ensure_ascii=False),encoding='utf-8')
    return result


def repair_portraits():
    res={}
    for p in sorted(PORTRAIT_DIR.glob('*.webp')):
        name=p.stem
        if name not in CONFIG: continue
        img=Image.open(p).convert('RGBA')
        fixed=repair_frame(img,name,0,0,True)
        fixed.save(p,'WEBP',quality=84,method=6)
        res[name]=p.stat().st_size
    return res

if __name__=='__main__':
    print('SPRITES', repair_sheets())
    print('PORTRAITS', repair_portraits())
