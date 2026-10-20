"""Erase a defibrillation pad that an image model drew in the wrong place, so the page can draw it in the right one.

python3 tools/erase_pad.py <sprite id> x0,y0,x1,y1 [x0,y0,x1,y1 ...]

Each box is in scene units (the frame of assets/sprites/sprites.json, as read off tools/sprite_grid.py). Inside it,
the pad (light, almost colourless pixels) and its outline are filled from the skin and shirt around them, by
normalised convolution at growing radii. The sprite is rewritten in place. Only PIL and numpy.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SPRITES = Path(__file__).resolve().parent.parent / 'assets' / 'sprites'
OUTLINE_PX = 9          # the pad's dark outline and soft edge, around the white face
RADII = (4, 8, 16, 32)  # fill from near neighbours first


def blur(a: np.ndarray, k: int) -> np.ndarray:
    return np.array(Image.fromarray(np.clip(a, 0, 255).astype('uint8')).filter(ImageFilter.BoxBlur(k))).astype(float)


def pad_mask(rgba: np.ndarray, box: tuple[int, int, int, int]) -> np.ndarray:
    rgb, a = rgba[..., :3], rgba[..., 3]
    lum, sat = rgb.mean(2), rgb.max(2) - rgb.min(2)
    white = (lum > 205) & (sat < 35) & (a > 200)
    inside = np.zeros_like(white)
    x0, y0, x1, y1 = box
    inside[y0:y1, x0:x1] = True
    grown = np.array(Image.fromarray(((white & inside) * 255).astype('uint8')).filter(ImageFilter.MaxFilter(OUTLINE_PX))) > 0
    return grown & inside


def fill(rgba: np.ndarray, mask: np.ndarray) -> np.ndarray:
    out = rgba.copy()
    keep = (~mask & (rgba[..., 3] > 200)).astype(float)
    todo = mask.copy()
    for k in RADII:
        w = blur(keep * 255, k) / 255
        sel = todo & (w > .1)
        for c in range(3):
            out[..., c] = np.where(sel, blur(out[..., c] * keep, k) / np.maximum(w, 1e-3), out[..., c])
        keep = np.maximum(keep, sel.astype(float))
        todo &= ~sel
    return out


def main(argv: list[str]) -> None:
    if len(argv) < 2:
        sys.exit(__doc__)
    sid, boxes = argv[0], argv[1:]
    meta = json.loads((SPRITES / 'sprites.json').read_text())[sid]
    path = SPRITES / meta['file']
    rgba = np.array(Image.open(path).convert('RGBA')).astype(float)
    sx, sy = rgba.shape[1] / meta['width'], rgba.shape[0] / meta['height']   # sprites may be drawn stretched
    for b in boxes:
        x0, y0, x1, y1 = (float(v) for v in b.split(','))
        px = (int((x0 - meta['x']) * sx), int((y0 - meta['y']) * sy),
              int((x1 - meta['x']) * sx), int((y1 - meta['y']) * sy))
        m = pad_mask(rgba, px)
        if m.sum() < 200:
            sys.exit(f'{sid}: no pad found in {b}')
        rgba = fill(rgba, m)
        print(f'{sid}: erased {int(m.sum())} px in {b}')
    Image.fromarray(np.clip(rgba, 0, 255).astype('uint8')).save(path, 'WEBP', quality=90, method=6)


if __name__ == '__main__':
    main(sys.argv[1:])
