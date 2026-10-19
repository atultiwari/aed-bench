"""Cut one person's layer out of a two-person generated image and align it to the approved patient sprite.

python3 tools/extract_layer.py <combined id> <out id> '<SPRITE_META json>' [like=P1] [whole=1]

For poses where a rescuer touches the patient, both are generated together (the model gets contact and overlap right),
then only the rescuer is kept:
  1. map the generated image onto its reference frame (bounding boxes of the drawing),
  2. align it in scene space to the approved patient sprite by the patient's legs (they never move between poses),
  3. keep the pixels inside the mask of what the viewer sees of the rescuer (refs/<id>-mask.png, from
     tools/pose-ref.html?mask=1), grown a little to absorb the model's drift,
  4. trim, save assets/sprites/<out id>.webp and record its scene placement in assets/sprites/sprites.json.
The page draws the patient sprite first and this layer over it.
With whole=1 (the default now), nothing is cut: the whole two-person image becomes the station's people layer and
replaces the patient sprite, aligned to it by the legs so he does not move between stations. Cutting a person out by
a skeleton mask proved fragile: the model moves people a few centimetres, and the mask then cuts heads and hands.
Needs Pillow.
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
GEN, REF, OUT = ROOT / 'assets/generated', ROOT / 'assets/generated/refs', ROOT / 'assets/sprites'
C, S = math.cos(math.pi / 6), 0.5
# the patient's legs, hips to heels (world cm): the part used to align every combined image to the patient sprite
LEGS = [(x, y, z) for x in (86, 114) for y in (20, 104) for z in (0, 14)]


def project(p: tuple[float, float, float]) -> tuple[float, float]:
    """The Sketchbook projection (VIEW 0, OX = OY = 0)."""
    x, y, z = p
    return ((x - y) * C, (x + y) * S - z)


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    return img.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()


def ink_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    return img.convert('L').point(lambda v: 255 if v < 245 else 0).getbbox()


def scene_mask(img: Image.Image, place: dict, box: tuple[float, float, float, float], k: float) -> Image.Image:
    """The image's opaque pixels, drawn at its scene placement, cropped to a scene box, k px per unit."""
    canvas = Image.new('L', (round((box[2] - box[0]) * k), round((box[3] - box[1]) * k)), 0)
    size = (max(1, round(place['width'] * k)), max(1, round(place['height'] * k)))
    m = img.getchannel('A').point(lambda v: 255 if v > 40 else 0).resize(size)
    canvas.paste(m, (round((place['x'] - box[0]) * k), round((place['y'] - box[1]) * k)), m)
    return canvas


def iou(a: Image.Image, b: Image.Image) -> float:
    inter = ImageChops.multiply(a, b).histogram()[255]
    union = ImageChops.lighter(a, b).histogram()[255]
    return inter / union if union else 0.0


def main(src_id: str, out_id: str, meta_json: str, like_id: str = 'P1', whole: bool = True) -> None:
    meta = json.loads(meta_json)
    gen = Image.open(GEN / f'{src_id}.png').convert('RGBA')
    ref = Image.open(REF / f'{src_id}.png').convert('RGBA')
    mask_ref = Image.open(REF / f'{src_id}-mask.png').convert('L')
    gb, rb = alpha_bbox(gen), ink_bbox(ref)
    ux, uy = meta['width'] / ref.width, meta['height'] / ref.height
    sx, sy = (rb[2] - rb[0]) / (gb[2] - gb[0]), (rb[3] - rb[1]) / (gb[3] - gb[1])
    # 1. the whole generated image in scene units
    place = {'x': meta['originX'] + (rb[0] - gb[0] * sx) * ux, 'y': meta['originY'] + (rb[1] - gb[1] * sy) * uy,
             'width': gen.width * sx * ux, 'height': gen.height * sy * uy}
    # 2. align to the patient sprite by the legs, in scene space
    book = json.loads((OUT / 'sprites.json').read_text())
    like = book[like_id]
    like_img = Image.open(OUT / like['file']).convert('RGBA')
    pts = [project(p) for p in LEGS]
    box = (min(p[0] for p in pts) - 8, min(p[1] for p in pts) - 8, max(p[0] for p in pts) + 8, max(p[1] for p in pts) + 8)
    k = 4.0
    target = scene_mask(like_img, like, box, k)
    best = (iou(scene_mask(gen, place, box, k), target), 1.0, 0.0, 0.0)
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    def search(scales, shifts, base):
        nonlocal best
        for s in scales:
            for dy in shifts:
                for dx in shifts:
                    p = {'x': cx + (place['x'] - cx) * s + dx + base[0], 'y': cy + (place['y'] - cy) * s + dy + base[1],
                         'width': place['width'] * s, 'height': place['height'] * s}
                    score = iou(scene_mask(gen, p, box, k), target)
                    if score > best[0]:
                        best = (score, s, dx + base[0], dy + base[1])
    # coarse, then fine around the best
    search([0.92, 0.95, 0.98, 1.0, 1.02, 1.05, 1.08], [float(d) for d in range(-20, 21, 2)], (0.0, 0.0))
    s0, b0 = best[1], (best[2], best[3])
    search([s0 - .01, s0, s0 + .01], [d * 0.5 for d in range(-4, 5)], b0)
    score, s, dx, dy = best
    place = {'x': cx + (place['x'] - cx) * s + dx, 'y': cy + (place['y'] - cy) * s + dy,
             'width': place['width'] * s, 'height': place['height'] * s}
    print(f'{out_id}: legs aligned to {like_id}: overlap {score:.3f}, scale {s}, shift {dx},{dy} units')
    # 3. the rescuer's visible pixels: the reference mask carried into generated-image pixels, grown a little
    # PIL's affine maps each output (generated) pixel to the input (reference) pixel it reads
    affine = (sx, 0, rb[0] - gb[0] * sx, 0, sy, rb[1] - gb[1] * sy)
    m = mask_ref.point(lambda v: 255 if v < 128 else 0).transform(gen.size, Image.AFFINE, affine, fill=0)
    m = m.filter(ImageFilter.MaxFilter(11))
    layer = gen.copy()
    if not whole:
        layer.putalpha(ImageChops.multiply(gen.getchannel('A'), m))
    lb = alpha_bbox(layer)
    # 4. trim and record
    sprite = layer.crop(lb)
    fx, fy = place['width'] / gen.width, place['height'] / gen.height
    entry = {'file': f'{out_id}.webp', 'frame': 'fit', ('replaces' if whole else 'over'): like_id, 'from': src_id,
             'x': round(place['x'] + lb[0] * fx, 3), 'y': round(place['y'] + lb[1] * fy, 3),
             'width': round(sprite.width * fx, 3), 'height': round(sprite.height * fy, 3),
             'px': [sprite.width, sprite.height], 'legsOverlap': round(score, 3)}
    sprite.save(OUT / f'{out_id}.webp', 'WEBP', quality=88, method=6)
    book[out_id] = entry
    (OUT / 'sprites.json').write_text(json.dumps(book, indent=2) + '\n')
    print(f'{out_id}: {entry}')


if __name__ == '__main__':
    opts = dict(a.split('=', 1) for a in sys.argv[4:])
    main(sys.argv[1], sys.argv[2], sys.argv[3], opts.get('like', 'P1'), opts.get('whole', '1') == '1')
