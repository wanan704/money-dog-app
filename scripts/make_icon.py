# 生成 PWA 图标：紫色圆角底 + 白色狗爪印（呼应"小狗钱钱"）
from PIL import Image, ImageDraw

BG = (83, 74, 183)   # #534AB7
FG = (255, 255, 255)


def make(size, path, rounded=True):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = int(size * 0.22) if rounded else 0
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG)

    cx, cy = size / 2, size / 2
    s = size / 512  # 以 512 为基准缩放

    # 主掌垫（椭圆）
    d.ellipse([cx - 90 * s, cy - 10 * s, cx + 90 * s, cy + 120 * s], fill=FG)
    # 四个脚趾（圆）
    toes = [(-120, -80), (-45, -130), (45, -130), (120, -80)]
    r = 42 * s
    for tx, ty in toes:
        d.ellipse([cx + tx * s - r, cy + ty * s - r, cx + tx * s + r, cy + ty * s + r], fill=FG)

    img.save(path)
    print("saved", path)


make(512, "public/icons/icon-512.png", rounded=False)  # maskable 用满版
make(192, "public/icons/icon-192.png", rounded=True)
