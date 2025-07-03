from PIL import Image

# 原图路径
input_path = '/Users/dream/myProjects/cursor/demo/phaser/GameGenV2/games/Snake/v1/assets/images/snake-body.png'

# 目标输出路径
output_path = input_path

# 目标尺寸
target_width = 20
target_height = 20

# 打开原始图片
image = Image.open(input_path)

# 使用 NEAREST（最近邻）插值下采样，保持像素风格
resized_image = image.resize((target_width, target_height), Image.Resampling.NEAREST)

# 保存图片
resized_image.save(output_path)

print(f"✅ Image resized and saved to {output_path}")
