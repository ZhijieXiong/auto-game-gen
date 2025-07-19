import os
import getpass
import base64
import requests
from PIL import Image
from io import BytesIO
from openai import OpenAI
from zhipuai import ZhipuAI

from api_key_map import API_KEY_MAP
from structured_output import ImageMeta
from prompts import generate_text2image_prompt



def decode_and_save_image(b64_data: str, save_path: str):
    image = Image.open(BytesIO(base64.b64decode(b64_data)))
    image.save(save_path)


def save_all_images_from_response(response_data: dict, save_dir: str, file_name: str):
    for idx, item in enumerate(response_data['data']):
        b64_img = item['b64_json']
        filename = os.path.join(save_dir, f"{file_name}_{idx}.png")
        decode_and_save_image(b64_img, filename)


class ImageGenerator:
    def __init__(self, platform: str, model_name: str, api_key_name: str, **kwargs):
        self.platform = platform
        self.model_name = model_name
        self.api_key_name = api_key_name
        self.kwargs = kwargs
        api_key = os.getenv(api_key_name)
        if api_key is None:
            api_key = getpass.getpass(f"Enter API key for {platform}: ")
        os.environ[API_KEY_MAP[platform]] = api_key
        if platform == "openai":
            self.model = OpenAI() 
        elif platform == "azure":
            model_name, api_version = model_name.split("@@")
            self.api_key = api_key
            self.deployment = model_name
            self.api_version = api_version
            self.endpoint = "https://us-west-us-3.openai.azure.com/"   #us-azure
        elif platform == "zhipuai":
            self.model = ZhipuAI(api_key=api_key)
            
    def generate_image(self, image_name: str, image_meta: ImageMeta, save_dir: str, num_images):
        prompt = generate_text2image_prompt(image_meta)
        print("=" * 50 + "text2image prompt" + "=" * 50)
        print(prompt)
        if self.platform == "openai":
            self.openai_generate_image(prompt, os.path.join(save_dir, f"{image_name}.png"), num_images)
        elif self.platform == "zhipuai":
            self.zhipuai_generate_image(prompt, os.path.join(save_dir, f"{image_name}.png"), num_images)
        elif self.platform == "azure":
            self.azure_generate_image(prompt, save_dir, image_name, num_images)
            
    def openai_generate_image(self, prompt: str, save_path: str, num_images):
        response = self.model.images.generate(
            model=self.model_name,
            prompt=prompt,
            size='1024x1024',
            n=num_images
        )

        for i, data in enumerate(response.data):
            if data.b64_json:
                image_bytes = base64.b64decode(data.b64_json)
                current_save_path = save_path.replace(".png", f"_{i+1}.png") if num_images > 1 else save_path
                with open(current_save_path, "wb") as f:
                    f.write(image_bytes)
            
    def zhipuai_generate_image(self, prompt: str, save_path: str, num_images):
        response = self.model.images.generations(
            model=self.model_name,
            prompt=prompt,
            size='1024x1024',
            n=num_images
        )
        
        for i, data in enumerate(response.data):
            if data.url:
                img_response = requests.get(data.url)
                if img_response.status_code == 200:
                    current_save_path = save_path.replace(".png", f"_{i+1}.png") if num_images > 1 else save_path
                    with open(current_save_path, 'wb') as f:
                        f.write(img_response.content)
                
    def azure_generate_image(self, prompt: str, save_dir: str, file_name: str, num_images):
        base_path = f'openai/deployments/{self.deployment}/images'
        params = f'?api-version={self.api_version}'
        generation_url = f"{self.endpoint}{base_path}/generations{params}"
        generation_body = {
            "prompt": prompt,
            "n": num_images,  # 生成数量
            "size": "1024x1024",
            "quality": "medium",
            "output_format": "png"
        }
        generation_response = requests.post(
            generation_url,
            headers={
                'Api-Key': self.api_key,
                'Content-Type': 'application/json',
            },
            json=generation_body
        ).json()
        for idx, item in enumerate(generation_response['data']):
            b64_img = item['b64_json']
            filename = os.path.join(save_dir, f"{file_name}_{idx+1}.png")
            decode_and_save_image(b64_img, filename)

    
# 蛇头像素块详细描述
# 基本规格

# 尺寸：20×20像素的正方形
# 主色调：深绿色（#228B22，森林绿）
# 风格：像素艺术风格，边缘清晰锐利

# 视觉特征

# 基础形状：圆润的方形轮廓，像素化的蛇头造型
# 主体颜色：深绿色填充整个20×20像素区域
# 高光效果：白色半透明高光覆盖在中心区域（约16×16像素区域）
# 立体感：具有轻微的3D立体效果，顶部和左侧稍亮

# 四个方向的蛇头布局要求
# 生成一张图片，包含以下四个蛇头：

# 向右的蛇头（默认方向）

# 蛇头朝向画面右侧
# 可见蛇嘴或头部轮廓指向右方


# 向左的蛇头

# 蛇头朝向画面左侧
# 蛇嘴或头部轮廓指向左方


# 向上的蛇头

# 蛇头朝向画面上方
# 蛇嘴或头部轮廓指向上方


# 向下的蛇头

# 蛇头朝向画面下方
# 蛇嘴或头部轮廓指向下方



# 图片布局建议

# 总尺寸：80×80像素（2×2网格布局）
# 排列方式：
# [向上蛇头]  [向右蛇头]
# [向左蛇头]  [向下蛇头]

# 背景：透明背景，便于游戏中使用
# 间隔：四个蛇头之间无间隔，紧密排列

# 像素艺术特点

# 边缘锐利：不使用抗锯齿，保持像素艺术的硬边缘
# 色彩扁平：使用纯色填充，避免过多渐变
# 对比鲜明：深绿色主体与白色高光形成明显对比
# 简约设计：保持简洁的造型，符合经典贪吃蛇游戏风格

# 文生图提示词建议
# "pixel art snake head sprites, 20x20 pixels each, four directions (up, down, left, right), dark forest green color (#228B22), white highlight, retro game style, sharp edges, no anti-aliasing, transparent background, 2x2 grid layout, classic arcade game aesthetic"

# 我要做一个贪吃蛇，你要在一个图片里面生成这四个素材，一致性要强，透明像素隔开，透明png格式，我们是一个2d平面的贪吃蛇游戏，设计图片的时候考虑在游戏上的显示效果，考虑适配性