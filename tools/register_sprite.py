"""Register a generated sprite to its pose reference and write the web sprite.

python3 tools/register_sprite.py <id> '<SPRITE_META json from tools/pose-ref.html>' [like=<id> region=x0,y0,x1,y1] [anchor=bottom]

The image model keeps the reference's composition but drifts a few percent in size and position. This fits the
sprite's opaque bounding box onto the reference figure's bounding box, trims the sprite, saves it as WebP in
assets/sprites/<id>.webp, and records where it goes in scene units (Sketchbook projection, OX = OY = 0) in
assets/sprites/sprites.json, so the page draws it with one <image x y width height>.
With anchor=bottom (kneeling and standing people), the sprite keeps its own shape: one uniform scale, placed with its
knees or feet on the reference's floor line. With like=<id>, the sprite is aligned to an approved sprite of the same person instead (best overlap of the parts
that do not move, given as a region in fractions of the image), so swapping between them does not make the body jump.
Needs Pillow.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
GEN, REF, OUT = ROOT / 'assets/generated', ROOT / 'assets/generated/refs', ROOT / 'assets/sprites'


def bbox_alpha(img: Image.Image, cut: int = 40) -> tuple[int, int, int, int] | None:
    return img.getchannel('A').point(lambda v: 255 if v > cut else 0).getbbox()


def bbox_ink(img: Image.Image, cut: int = 245) -> tuple[int, int, int, int] | None:
    return img.convert('L').point(lambda v: 255 if v < cut else 0).getbbox()


def mask(img: Image.Image, region: tuple[float, ...], k: int) -> Image.Image:
    w, h = img.size
    m = img.getchannel('A').point(lambda v: 255 if v > 40 else 0).resize((w // k, h // k))
    box = (int(region[0] * w / k), int(region[1] * h / k), int(region[2] * w / k), int(region[3] * h / k))
    keep = Image.new('L', m.size, 0)
    keep.paste(m.crop(box), box[:2])
    return keep


def overlap(a: Image.Image, b: Image.Image) -> float:
    inter = ImageChops.multiply(a, b).histogram()[255]
    union = ImageChops.lighter(a, b).histogram()[255]
    return inter / union if union else 0.0


def align_to(gen: Image.Image, like: Image.Image, region: tuple[float, ...]) -> tuple[float, float, float, float]:
    """Best scale and shift (in gen pixels) that lays gen's still parts over like's: u_like = s * u_gen + dx."""
    k = 4
    target, best = mask(like, region, k), (0.0, 1.0, 0.0, 0.0)
    for s in (0.97, 0.98, 0.99, 1.0, 1.01, 1.02, 1.03):
        size = (round(gen.width * s), round(gen.height * s))
        moved = mask(gen.resize(size), region, k)
        for dy in range(-12, 13):
            for dx in range(-12, 13):
                shifted = Image.new('L', target.size, 0)
                shifted.paste(moved, (dx, dy))
                score = overlap(shifted.crop((0, 0) + target.size), target)
                if score > best[0]:
                    best = (score, s, dx * k, dy * k)
    return best


def main(sprite_id: str, meta_json: str, like_id: str | None = None, region: tuple[float, ...] | None = None,
         anchor: str = 'box') -> None:
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
    if anchor == 'bottom':
        # keep the sprite's own shape: one scale (the mean of the two fits), feet or knees on the reference's floor line
        k = (((rb[2] - rb[0]) / (gb[2] - gb[0])) * ((rb[3] - rb[1]) / (gb[3] - gb[1]))) ** .5
        w, h = (gb[2] - gb[0]) * k * ux, (gb[3] - gb[1]) * k * uy
        cx, bottom = meta['originX'] + (rb[0] + rb[2]) / 2 * ux, meta['originY'] + rb[3] * uy
        place = {'x': round(cx - w / 2, 3), 'y': round(bottom - h, 3), 'width': round(w, 3), 'height': round(h, 3)}
    stretch = ((rb[2] - rb[0]) / (gb[2] - gb[0])) / ((rb[3] - rb[1]) / (gb[3] - gb[1]))
    if like_id:
        book0 = json.loads((OUT / 'sprites.json').read_text())[like_id]
        like = Image.open(GEN / f'{like_id}.png').convert('RGBA')
        lb = bbox_alpha(like)
        score, s, dx, dy = align_to(gen, like, region or (0, 0, 1, 1))
        sx, sy = book0['width'] / (lb[2] - lb[0]), book0['height'] / (lb[3] - lb[1])
        place = {
            'x': round(book0['x'] + (s * gb[0] + dx - lb[0]) * sx, 3), 'y': round(book0['y'] + (s * gb[1] + dy - lb[1]) * sy, 3),
            'width': round(s * (gb[2] - gb[0]) * sx, 3), 'height': round(s * (gb[3] - gb[1]) * sy, 3),
        }
        print(f'{sprite_id}: aligned to {like_id}: overlap {score:.3f}, scale {s}, shift {dx},{dy} px')
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
    opts = dict(a.split('=', 1) for a in sys.argv[3:])
    reg = tuple(float(v) for v in opts['region'].split(',')) if 'region' in opts else None
    main(sys.argv[1], sys.argv[2], opts.get('like'), reg, opts.get('anchor', 'box'))
