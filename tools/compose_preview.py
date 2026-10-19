"""Compose registered sprites in scene space, back to front, to check how they fit together.

python3 tools/compose_preview.py out.png P1 A1 ...   (first = drawn first, i.e. furthest back)
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SPR = ROOT / 'assets/sprites'


def main(out: str, ids: list[str], px_per_unit: float = 6.0) -> None:
    book = json.loads((SPR / 'sprites.json').read_text())
    boxes = [book[i] for i in ids]
    x0 = min(b['x'] for b in boxes) - 10; y0 = min(b['y'] for b in boxes) - 10
    x1 = max(b['x'] + b['width'] for b in boxes) + 10; y1 = max(b['y'] + b['height'] for b in boxes) + 10
    canvas = Image.new('RGBA', (int((x1 - x0) * px_per_unit), int((y1 - y0) * px_per_unit)), (242, 239, 231, 255))
    for i, b in zip(ids, boxes):
        im = Image.open(SPR / b['file']).convert('RGBA')
        size = (max(1, round(b['width'] * px_per_unit)), max(1, round(b['height'] * px_per_unit)))
        canvas.alpha_composite(im.resize(size, Image.LANCZOS), (round((b['x'] - x0) * px_per_unit), round((b['y'] - y0) * px_per_unit)))
    canvas.convert('RGB').save(out)
    print(out, canvas.size)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
