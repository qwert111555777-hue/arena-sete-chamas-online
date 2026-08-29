from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import cv2
import numpy as np

AS = Path('public/assets')
OUT = AS/'sprites'
OUT.mkdir(parents=True, exist_ok=True)

# crop boxes: left, top, right, bottom. Tuned for approved concept images.
SPECS = [
    ('herois_2d_v9.png', 'albert',    (42,  80, 314, 718), 10),
    ('herois_2d_v9.png', 'geovanna',  (330, 170, 565, 720), 10),
    ('herois_2d_v9.png', 'romulo',    (610, 110, 845, 714), 10),
    ('herois_2d_v9.png', 'arthur',    (860, 105, 1095, 714), 10),
    ('herois_2d_v9.png', 'guilherme', (1118,105, 1350, 714), 10),
    ('viloes_formas_2d_v2.png', 'otavio',  (42, 110, 280, 720), 12),
    ('viloes_formas_2d_v2.png', 'anielle', (285, 175, 455, 690), 10),
    ('viloes_formas_2d_v2.png', 'mito',    (470,  28, 705, 700), 8),
    ('viloes_formas_2d_v2.png', 'lenda',   (710,  78, 1005, 724), 10),
    ('viloes_formas_2d_v2.png', 'vanjo',   (1095, 95, 1345, 724), 12),
    ('napoleao_boss_2d.png', 'napoleao',   (420,  35, 950, 650), 16),
]

def grabcut_cutout(src_path, box, margin):
    pil = Image.open(src_path).convert('RGB')
    crop = pil.crop(box)
    img = cv2.cvtColor(np.array(crop), cv2.COLOR_RGB2BGR)
    h, w = img.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    # mark a thin border as background and inside as probably foreground using rectangle
    rect = (margin, margin, max(1, w - margin*2), max(1, h - margin*2))
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 7, cv2.GC_INIT_WITH_RECT)
        alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype('uint8')
    except Exception:
        alpha = np.full((h,w),255,np.uint8)
    # soften edges
    alpha = cv2.medianBlur(alpha, 3)
    alpha = cv2.GaussianBlur(alpha, (3,3), 0)
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA)
    rgba[:,:,3] = alpha
    out = Image.fromarray(rgba)
    # trim transparent edges
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    return out

sprites=[]
for source, name, box, margin in SPECS:
    out = grabcut_cutout(AS/source, box, margin)
    out.save(OUT/f'{name}.png')
    sprites.append((name,out.copy()))
    print(name, out.size)

# Make contact sheet on checkerboard for inspection
thumb_h=210
thumbs=[]
for name,img in sprites:
    scale=thumb_h/img.height
    im=img.resize((int(img.width*scale), thumb_h), Image.Resampling.LANCZOS)
    thumbs.append((name, im))

w=sum(im.width+30 for _,im in thumbs)+20
h=thumb_h+70
sheet=Image.new('RGBA',(w,h),(20,12,26,255))
d=ImageDraw.Draw(sheet)
x=15
for name,im in thumbs:
    # checker bg
    bg=Image.new('RGBA',(im.width, im.height),(0,0,0,0))
    bd=ImageDraw.Draw(bg)
    tile=16
    for yy in range(0, im.height, tile):
        for xx in range(0, im.width, tile):
            col=(70,70,80,255) if (xx//tile+yy//tile)%2 else (120,120,130,255)
            bd.rectangle([xx,yy,xx+tile,yy+tile], fill=col)
    sheet.alpha_composite(bg,(x,10))
    sheet.alpha_composite(im,(x,10))
    d.text((x+im.width/2, thumb_h+20), name, anchor='ma', fill=(255,230,150,255))
    x += im.width+30
sheet.convert('RGB').save(AS/'sprites_contact_sheet.jpg', quality=92)
