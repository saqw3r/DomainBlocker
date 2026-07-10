#!/usr/bin/env python3
"""
Generate No Pass extension icons in neon-cyberpunk style
Requires: pip install cairosvg
"""

import os

# SVG template for the icon
SVG_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#1a0a1a"/>
      <stop offset="100%" style="stop-color:#0a0a0a"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="{blur}" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="{size}" height="{size}" fill="url(#bg)"/>
  
  <!-- Octagon with neon red glow -->
  <polygon points="{points}"
           fill="#0f0000"
           stroke="#ff0040"
           stroke-width="{stroke}"
           filter="url(#glow)"/>
  
  <!-- X mark -->
  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"
        stroke="#ff0040"
        stroke-width="{x_stroke}"
        stroke-linecap="round"
        filter="url(#glow)"/>
  <line x1="{x2}" y1="{y1}" x2="{x1}" y2="{y2}"
        stroke="#ff0040"
        stroke-width="{x_stroke}"
        stroke-linecap="round"
        filter="url(#glow)"/>
</svg>"""


def generate_svg(size):
    """Generate SVG for given size"""
    center = size / 2
    radius = size * 0.38

    # Calculate octagon points
    points = []
    for i in range(8):
        angle = (i * 45 - 22.5) * 3.14159 / 180
        x = center + radius * 1.2 * (0.9 if i % 2 == 0 else 1) * (
            1
            if i in [0, 4]
            else (-1 if i in [2, 6] else (0.7 if i in [1, 7] else -0.7))
        )
        y = center + radius * 1.2 * (0.9 if i % 2 == 0 else 1) * (
            0 if i in [0, 4] else (0.7 if i in [1, 2] else (-0.7 if i in [6, 7] else 0))
        )

    # Simplified octagon points calculation
    offset = size * 0.3
    size_inner = size * 0.7
    points = [
        f"{offset},0",
        f"{size_inner},0",
        f"{size},{offset}",
        f"{size},{size_inner}",
        f"{size_inner},{size}",
        f"{offset},{size}",
        f"0,{size_inner}",
        f"0,{offset}",
    ]

    x_size = size * 0.25
    x1 = center - x_size
    y1 = center - x_size
    x2 = center + x_size
    y2 = center + x_size

    svg = SVG_TEMPLATE.format(
        size=size,
        points=" ".join(points),
        stroke=max(2, int(size * 0.06)),
        blur=max(1, size * 0.03),
        x1=x1,
        y1=y1,
        x2=x2,
        y2=y2,
        x_stroke=max(2, int(size * 0.08)),
    )

    return svg


def main():
    sizes = [16, 32, 48, 128]
    output_dir = "assets/icons"

    os.makedirs(output_dir, exist_ok=True)

    for size in sizes:
        svg_content = generate_svg(size)
        filename = f"icon{size}.svg"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, "w") as f:
            f.write(svg_content)

        print(f"✅ Created {filename}")

    print("\n📦 SVG icons generated!")
    print("🎨 To convert to PNG, use an SVG converter or online tool:")
    print("   https://cloudconvert.com/svg-to-png")
    print("\nOr install Inkscape/ImageMagick:")
    print("   inkscape icon128.svg --export-filename=icon128.png")


if __name__ == "__main__":
    main()
