"""Give the patient the same hair in every sprite: the salt-and-pepper grey of P1 (and the cast sheet).

python3 tools/match_hair.py [--preview out.png] P2 P3 A2@281,632 ...

`ID@x,y` starts the search near pixel (x, y) when the lowest-left dark blob is something else (a shoe).

The models drew his hair anywhere from grey to navy-black. For each sprite this finds his head (the lowest-left
dark blob: he lies with his head at the lower left), floods the hair from there, and maps its tones onto P1's:
same mean colour, same spread, so the strands keep their texture. The outline is left alone (the mask is shrunk
by a few pixels before recolouring). Only PIL and numpy.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SPRITES = Path(__file__).resolve().parent.parent / 'assets' / 'sprites'
REFERENCE = 'P1'
OPEN_PX = 7       # removes thin outlines before flooding, so the flood stays inside the hair
KEEP_EDGE_PX = 5  # the hair outline is not recoloured
MAX_GAIN = 1.5    # flat, near-black hair is not stretched into blocky compression noise


def hair_mask(rgba, near=None):
    """Boolean mask of the patient's hair, or None when no head is found."""
    a = rgba[..., 3]
    rgb = rgba[..., :3]
    h, w = a.shape
    lum, sat = rgb.mean(2), rgb.max(2) - rgb.min(2)
    dark = ((lum < 150) & (sat < 45) & (a > 200)).astype('uint8') * 255
    opened = Image.fromarray(dark).filter(ImageFilter.MinFilter(OPEN_PX)).filter(ImageFilter.MaxFilter(OPEN_PX))
    ys, xs = np.nonzero(np.array(opened))
    if not len(ys):
        return None
    if near:
        pick = np.argmin((xs - near[0]) ** 2 + (ys - near[1]) ** 2)
    else:
        pick = np.argmax(ys / h - xs / w)
    seed = (int(xs[pick]), int(ys[pick]))
    flood = opened.convert('L')
    ImageDraw.floodfill(flood, seed, 128)
    blob = Image.fromarray((np.array(flood) == 128).astype('uint8') * 255)
    inner = blob.filter(ImageFilter.MinFilter(2 * KEEP_EDGE_PX + 1))
    return np.array(inner) > 0


def tone_stats(rgba, mask):
    px = rgba[..., :3][mask]
    lum = px.mean(1)
    return px.mean(0), lum.std()


def recolour(rgba, mask, ref_mean, ref_std):
    out = rgba.copy()
    px = rgba[..., :3][mask]
    lum = px.mean(1)
    gain = min(ref_std / max(lum.std(), 1e-3), MAX_GAIN)
    new = ref_mean[None, :] + ((lum - lum.mean()) * gain)[:, None]
    out[..., :3][mask] = np.clip(new, 0, 255)
    return out


def main(argv):
    preview = None
    if argv[:1] == ['--preview']:
        preview, argv = argv[1], argv[2:]
    if not argv:
        sys.exit(__doc__)
    ref = np.array(Image.open(SPRITES / f'{REFERENCE}.webp').convert('RGBA')).astype(float)
    ref_mask = hair_mask(ref)
    if ref_mask is None:
        sys.exit(f'no hair found in {REFERENCE}')
    ref_mean, ref_std = tone_stats(ref, ref_mask)
    tiles = []
    for arg in argv:
        sid, _, at = arg.partition('@')
        near = tuple(int(v) for v in at.split(',')) if at else None
        path = SPRITES / f'{sid}.webp'
        rgba = np.array(Image.open(path).convert('RGBA')).astype(float)
        mask = hair_mask(rgba, near)
        if mask is None or mask.sum() < 2000:
            print(f'{sid}: no head found, skipped')
            continue
        out = Image.fromarray(recolour(rgba, mask, ref_mean, ref_std).astype('uint8'))
        ys, xs = np.nonzero(mask)
        print(f'{sid}: {mask.sum()} hair px around ({int(xs.mean())}, {int(ys.mean())})')
        if preview:
            cx, cy = int(xs.mean()), int(ys.mean())
            tile = out.crop((cx - 170, cy - 130, cx + 170, cy + 130))
            bg = Image.new('RGBA', tile.size, 'white')
            bg.alpha_composite(tile)
            tiles.append(bg.convert('RGB'))
        else:
            out.save(path, 'WEBP', quality=90, method=6)
    if preview and tiles:
        sheet = Image.new('RGB', (340 * 8, 260 * ((len(tiles) + 7) // 8)), 'white')
        for k, t in enumerate(tiles):
            sheet.paste(t, ((k % 8) * 340, (k // 8) * 260))
        sheet.save(preview)


if __name__ == '__main__':
    main(sys.argv[1:])
