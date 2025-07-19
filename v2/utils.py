import json
import os
import yaml

from structured_output import GameDemand, ImageMeta
from TextGenerator import TextGenerator
from ImageGenerator import ImageGenerator


def save_game_demand(demand: GameDemand, save_dir: str):
    with open(os.path.join(save_dir, "demand.json"), "w", encoding="utf-8") as f:
        json.dump(demand.model_dump(), f, ensure_ascii=False, indent=2)
        

def save_images_meta(images_meta: dict[str, ImageMeta], save_dir: str):
    for image_name, image_meta in images_meta.items():
        image_name = image_name.replace(".png", "").replace(".jpg", "").replace(".jpeg", "")
        save_image_meta(image_name, image_meta, save_dir)


def save_image_meta(image_name: str, image_meta: ImageMeta, save_dir: str):
    with open(os.path.join(save_dir, image_name + ".json"), "w", encoding="utf-8") as f:
        json.dump(image_meta.model_dump(), f, ensure_ascii=False, indent=2)
        

def load_game_demand(save_dir: str) -> GameDemand:
    with open(os.path.join(save_dir, "demand.json"), "r", encoding="utf-8") as f:
        data = json.load(f)
    return GameDemand(**data)


def load_config() -> dict:
    """读取config.yaml配置文件"""
    config_path = os.path.join(os.path.dirname(__file__), 'config.yaml')
    with open(config_path, 'r', encoding='utf-8') as file:
        config = yaml.safe_load(file)
    return config


def save_code(code: str, save_path: str):
    with open(save_path, "w", encoding="utf-8") as f:
        f.write(code)


def load_code(save_path: str) -> str | None:
    code = None
    if os.path.exists(save_path):
        with open(save_path, "r", encoding="utf-8") as f:
            code = f.read()
    return code


def load_images_meta(save_dir: str) -> dict[str, ImageMeta]:
    images_meta = {}
    for file in os.listdir(save_dir):
        if file.endswith(".json"):
            with open(os.path.join(save_dir, file), "r", encoding="utf-8") as f:
                images_meta[file[:-5]] = ImageMeta(**json.load(f))
    return images_meta


def init_text_generator(config: dict) -> TextGenerator:
    llm_configs = config['llm_configs']
    text_model_config = llm_configs['text_model']
    platform = text_model_config['platform']
    model_name = text_model_config['model_name']
    api_key_name = config["llm_platforms"][platform]["env_key"]
    text_model_params = {
        'temperature': text_model_config['temperature'],
        'max_tokens': text_model_config['max_tokens'],
        'top_p': text_model_config['top_p']
    }
    return TextGenerator(platform, model_name, api_key_name, **text_model_params)


def init_image_generator(config: dict) -> ImageGenerator:
    llm_configs = config['llm_configs']
    image_model_config = llm_configs['image_model']
    platform = image_model_config['platform']
    model_name = image_model_config['model_name']
    api_key_name = config["llm_platforms"][platform]["env_key"]
    image_model_params = {
    }
    return ImageGenerator(platform, model_name, api_key_name, **image_model_params)
