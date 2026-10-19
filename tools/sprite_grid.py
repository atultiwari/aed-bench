"""Draw a sprite at its scene placement with a labelled scene-unit grid, to read anchor positions off it.

python3 tools/sprite_grid.py <id> [x0 y0 x1 y1]   (optional scene-unit window to zoom into)
Writes _shots/grid/<id>.png. Grid every 5 units, labels every 10.
"""
import json
import sys

from PIL import Image, ImageDraw

book = json.load(open('assets/sprites/sprites.json'))


def main(sid: str, win: list[float] | None) -> None:
    b = book[sid]
    x0, y0, x1, y1 = win or (b['x'], b['y'], b['x'] + b['width'], b['y'] + b['height'])
    k = min(1400 / (x1 - x0), 1000 / (y1 - y0))
    im = Image.open('assets/sprites/' + b['file']).convert('RGBA')
    im = im.resize((round(b['width'] * k), round(b['height'] * k)))
    W, H = round((x1 - x0) * k), round((y1 - y0) * k)
    can = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    can.alpha_composite(im, (round((b['x'] - x0) * k), round((b['y'] - y0) * k))) if b['x'] >= x0 and b['y'] >= y0 else can.paste(im, (round((b['x'] - x0) * k), round((b['y'] - y0) * k)), im)
    d = ImageDraw.Draw(can)
    import math
    for gx in range(math.ceil(x0 / 5) * 5, int(x1) + 1, 5):
        X = (gx - x0) * k
        d.line([(X, 0), (X, H)], fill=(220, 0, 0, 255) if gx % 10 == 0 else (255, 170, 170, 255), width=1)
        if gx % 10 == 0: d.text((X + 2, 2), str(gx), fill=(200, 0, 0, 255))
    for gy in range(math.ceil(y0 / 5) * 5, int(y1) + 1, 5):
        Y = (gy - y0) * k
        d.line([(0, Y), (W, Y)], fill=(0, 0, 220, 255) if gy % 10 == 0 else (170, 170, 255, 255), width=1)
        if gy % 10 == 0: d.text((2, Y + 2), str(gy), fill=(0, 0, 200, 255))
    can.convert('RGB').save(f'_shots/grid/{sid}.png')
    print(sid, (x0, y0, x1, y1), 'scale', round(k, 2))


if __name__ == '__main__':
    main(sys.argv[1], [float(v) for v in sys.argv[2:6]] if len(sys.argv) > 5 else None)
