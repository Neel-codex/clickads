#!/usr/bin/env python3
"""Generate brand PWA icons (no external deps) into public/icons.

Draws a dark rounded background with a blue diagonal gradient and a white
upward "signal" chevron. Produces icon-192, icon-512 and icon-maskable-512.
"""
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "icons")

# Brand colors (RGB)
BG = (10, 14, 26)
GRAD_A = (37, 99, 235)   # blue
GRAD_B = (99, 102, 241)  # indigo
WHITE = (255, 255, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def write_png(path, size, maskable=False):
    px = bytearray()
    pad = 0 if maskable else int(size * 0.12)  # safe area inset for non-maskable
    radius = size if maskable else int(size * 0.22)
    cx, cy = size / 2, size / 2

    # Chevron geometry (upward arrow / rising signal)
    arrow_w = size * 0.42
    arrow_h = size * 0.30
    thick = size * 0.10

    rows = []
    for y in range(size):
        row = bytearray([0])  # filter byte
        for x in range(size):
            # Rounded corners -> background color outside radius
            inside = True
            if not maskable:
                rx = min(x, size - 1 - x)
                ry = min(y, size - 1 - y)
                if rx < radius and ry < radius:
                    dx = radius - rx
                    dy = radius - ry
                    if dx * dx + dy * dy > radius * radius:
                        inside = False
            if not inside:
                r, g, b = BG
                row += bytes([r, g, b])
                continue

            # Diagonal gradient background
            t = (x + y) / (2 * size)
            r, g, b = lerp(GRAD_A, GRAD_B, t)
            # darken slightly toward center for depth
            r = int(r * 0.85 + BG[0] * 0.15)
            g = int(g * 0.85 + BG[1] * 0.15)
            b = int(b * 0.85 + BG[2] * 0.15)

            # Draw white upward chevron centered
            nx = x - cx
            ny = y - cy
            # Two strokes forming a "^"
            on = False
            for sign in (-1, 1):
                # line from bottom outer to top center
                # param along arrow width
                if -arrow_w / 2 <= nx <= arrow_w / 2:
                    # expected y on the chevron for this x (V shape pointing up)
                    expected = -arrow_h / 2 + (abs(nx) / (arrow_w / 2)) * arrow_h
                    if abs(ny - expected) <= thick / 2:
                        on = True
            if on:
                r, g, b = WHITE
            row += bytes([r, g, b])
        rows.append(bytes(row))

    raw = b"".join(rows)
    compressed = zlib.compress(raw, 9)

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8-bit RGB
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", path)


def main():
    os.makedirs(OUT, exist_ok=True)
    write_png(os.path.join(OUT, "icon-192.png"), 192)
    write_png(os.path.join(OUT, "icon-512.png"), 512)
    write_png(os.path.join(OUT, "icon-maskable-512.png"), 512, maskable=True)


if __name__ == "__main__":
    main()
