"""Trim the light fringe that image models leave around transparent cut-outs.

python3 tools/defringe.py assets/sprites/*.webp

Pixels at the edge that are both light and only partly opaque are the leftover background halo: they are made
transparent, and the alpha edge is pulled in by one pixel. Run once per sprite after registering it.
"""
import sys

from PIL import Image, ImageChops, ImageFilter


def defringe(path: str) -> None:
    im = Image.open(path).convert('RGBA')
    a = im.getchannel('A')
    lum = im.convert('L')
    # light, semi-transparent pixels near the edge: the halo
    edge = ImageChops.subtract(a.filter(ImageFilter.MaxFilter(5)), a.filter(ImageFilter.MinFilter(5)))
    halo = ImageChops.multiply(edge.point(lambda v: 255 if v > 30 else 0), lum.point(lambda v: 255 if v > 205 else 0))
    a = ImageChops.subtract(a, halo)
    a = a.filter(ImageFilter.MinFilter(3))           # pull the edge in by one pixel
    im.putalpha(a)
    im.save(path, 'WEBP', quality=88, method=6)


if __name__ == '__main__':
    for p in sys.argv[1:]:
        if p.endswith(('chest.webp', 'heart.webp')):
            continue
        defringe(p)
        print('defringed', p)
