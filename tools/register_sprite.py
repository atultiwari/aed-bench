"""Register a generated sprite to its pose reference and write the web sprite.

python3 tools/register_sprite.py <id> '<SPRITE_META json from tools/pose-ref.html>'

The image model keeps the reference's composition but drifts a few percent in size and position. This fits the
sprite's opaque bounding box onto the reference figure's bounding box, trims the sprite, saves it as WebP in
assets/sprites/<id>.webp, and records where it goes in scene units (Sketchbook projection, OX = OY = 0) in
assets/sprites/sprites.json, so the page draws it with one <image x y width height>.
Needs Pillow.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
GEN, REF, OUT = ROOT / 'assets/generated', ROOT / 'assets/generated/refs', ROOT / 'assets/sprites'


def bbox_alpha(img: Image.Image, cut: int = 40) -> tuple[int, int, int, int] | None:
    return img.getchannel('A').point(lambda v: 255 if v > cut else 0).getbbox()


def bbox_ink(img: Image.Image, cut: int = 245) -> tuple[int, int, int, int] | None:
    return img.convert('L').point(lambda v: 255 if v < cut else 0).getbbox()


def main(sprite_id: str, meta_json: str) -> None:
    meta = json.loads(meta_json)
    gen = Image.open(GEN / f'{sprite_id}.png').convert('RGBA')
    ref = Image.open(REF / f'{sprite_id}.png').convert('RGBA')
    gb, rb = bbox_alpha(gen), bbox_ink(ref)
    if not gb or not rb:
        sys.exit(f'{sprite_id}: empty sprite or reference')
    # the reference picture spans the whole frame: pixels -> scene units
    ux, uy = meta['width'] / ref.width, meta['height'] / ref.height
    place = {
        'x': round(meta['originX'] + rb[0] * ux, 3), 'y': round(meta['originY'] + rb[1] * uy, 3),
        'width': round((rb[2] - rb[0]) * ux, 3), 'height': round((rb[3] - rb[1]) * uy, 3),
    }
    stretch = ((rb[2] - rb[0]) / (gb[2] - gb[0])) / ((rb[3] - rb[1]) / (gb[3] - gb[1]))
    OUT.mkdir(parents=True, exist_ok=True)
    sprite = gen.crop(gb)
    sprite.save(OUT / f'{sprite_id}.webp', 'WEBP', quality=88, method=6)
    book = OUT / 'sprites.json'
    data = json.loads(book.read_text()) if book.exists() else {}
    data[sprite_id] = {'file': f'{sprite_id}.webp', 'frame': meta['frame'], **place,
                       'px': [sprite.width, sprite.height], 'stretch': round(stretch, 4)}
    book.write_text(json.dumps(data, indent=2) + '\n')
    kb = (OUT / f'{sprite_id}.webp').stat().st_size // 1024
    print(f'{sprite_id}: placed at {place}, stretch {stretch:.3f} (1 = same shape), {sprite.width}x{sprite.height} px, {kb} KB')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
