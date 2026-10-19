"""Make the pushed-down compression frame from an arms-up frame.

python3 tools/make_push_frame.py <up id> <down id> <depth px> '<polygon json, image px>' <shoulder y> <hands y>

A push in CPR: the hands stay on the chest and the shoulders drop over them. Inside the polygon (her head, back and
arms), rows above the shoulders move down by the full depth, rows between the shoulders and the hands are compressed
toward the hands, and the hands do not move. Nothing under her is cleared, so his shirt and hands never leave holes;
only the top band above her head and back is cleared, which lies over background.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
GEN, OUT = ROOT / 'assets/generated', ROOT / 'assets/sprites'


def main(up_id: str, down_id: str, depth: int, poly: list[tuple[int, int]], y_sh: int, y_hands: int) -> None:
    book = json.loads((OUT / 'sprites.json').read_text())
    src = Image.open(GEN / f'{up_id}c.png').convert('RGBA')
    w, h = src.size
    mask = Image.new('L', src.size, 0)
    ImageDraw.Draw(mask).polygon([tuple(p) for p in poly], fill=255)
    region = Image.new('RGBA', src.size, (0, 0, 0, 0)); region.paste(src, (0, 0), mask)
    # destination quad <- source quad (PIL MESH: corners upper-left, lower-left, lower-right, upper-right)
    quad = lambda y0, y1: (0, y0, 0, y1, w, y1, w, y0)
    mesh = [((0, 0, w, y_sh + depth), quad(-depth, y_sh)),
            ((0, y_sh + depth, w, y_hands), quad(y_sh, y_hands)),
            ((0, y_hands, w, h), quad(y_hands, h))]
    pushed = region.transform(src.size, Image.MESH, mesh, Image.BICUBIC)
    base = src.copy()
    top = Image.new('L', src.size, 0); top.paste(mask.crop((0, 0, w, y_sh)), (0, 0))
    base.paste(Image.new('RGBA', src.size, (0, 0, 0, 0)), (0, 0), top)   # clear only where her head and back were
    base.alpha_composite(pushed)
    base.save(GEN / f'{down_id}c.png')
    box = src.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()   # the same crop as the up frame
    base.crop(box).save(OUT / f'{down_id}.webp', 'WEBP', quality=88, method=6)
    book[down_id] = {**book[up_id], 'file': f'{down_id}.webp', 'from': f'{up_id}c, shoulders pushed down {depth}px over fixed hands, in code'}
    (OUT / 'sprites.json').write_text(json.dumps(book, indent=2) + '\n')
    print(f'{down_id}: from {up_id}, shoulders down {depth}px, hands fixed at y {y_hands}, crop {box}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]), json.loads(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]))
