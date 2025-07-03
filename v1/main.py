import os
import inspect
from time import sleep
from PIL import Image

from structured_output import *
from utils import *


frame = inspect.currentframe()
CURRENT_DIR = os.path.dirname(inspect.getfile(frame)) if frame else os.path.dirname(__file__)
GAMES_DIR = os.path.join(CURRENT_DIR, "games")


if __name__ == "__main__":
    # 读取配置文件
    config = load_config()
    # 游戏名字
    game_name = config['main_config']['game_name']
    # 是否为continue模式，即如果开发的游戏已有数据，则从已有数据（最新项目的最新版本）继续开发
    CFEG = config['main_config']['continue_from_existing_game']
    
    # 初始化generator
    text_generator = init_text_generator(config)
    image_generator = init_image_generator(config)
    
    # 获取并创建所需目录
    game_dir = os.path.join(GAMES_DIR, game_name)
    if not CFEG and os.path.exists(game_dir):
        existed_game_pre_dirs = list(filter(lambda x: x.startswith(game_name + "_pre"), os.listdir(GAMES_DIR)))
        num_pre_dirs = len(existed_game_pre_dirs)
        os.rename(game_dir, game_dir + f"_pre_{num_pre_dirs}")
        cur_game_ver_dir = os.path.join(game_dir, "v1")
        latest_version = 1
    elif not os.path.exists(game_dir):
        cur_game_ver_dir = os.path.join(game_dir, "v1")
        latest_version = 1
    else:
        existed_game_versions = list(map(lambda x: int(x[1:]), list(filter(lambda x: x[0] == "v", os.listdir(game_dir)))))
        latest_version = max(existed_game_versions)
        cur_game_ver_dir = os.path.join(game_dir, f"v{latest_version}")
    cur_assets_dir = os.path.join(cur_game_ver_dir, "assets")
    cur_imgs_meta_dir = os.path.join(cur_game_ver_dir, "assets", "images_meta")
    cur_imgs_dir = os.path.join(cur_game_ver_dir, "assets", "images")
    os.makedirs(cur_imgs_meta_dir, exist_ok=True)
    os.makedirs(cur_imgs_dir, exist_ok=True)
    
    # 生成游戏需求
    game_demand_path = os.path.join(cur_game_ver_dir, f"demand.json")
    game_demand = None
    if os.path.exists(game_demand_path):
        try:
            game_demand = load_game_demand(cur_game_ver_dir)
        except Exception as e:
            print(f"Error loading game demand from {game_demand_path}: {e}, regenerate game demand")
            game_demand = None
    if game_demand is None:
        print("Generating game demand ...")
        game_demand = text_generator.analyze_demands(config["main_config"]["game_demand"])
        save_game_demand(game_demand, cur_game_ver_dir)
        
    # 生成代码和图片元数据
    html_code_path = os.path.join(cur_game_ver_dir, "index.html")
    html_code = load_code(html_code_path)
    css_code_path = os.path.join(cur_game_ver_dir, "index.css")
    css_code = load_code(css_code_path)
    js_code_path = os.path.join(cur_game_ver_dir, "index.js")
    js_code = load_code(js_code_path)
    images_meta_path = os.path.join(cur_game_ver_dir, "images_meta.json")
    if html_code is None or css_code is None or js_code is None or not os.path.exists(images_meta_path):
        print("Generating code and images meta ...")
        game_code_and_images_meta = text_generator.generate_code_and_images_meta(game_demand)
        html_code = game_code_and_images_meta.html_code
        css_code = game_code_and_images_meta.css_code
        js_code = game_code_and_images_meta.js_code
        save_code(html_code, html_code_path)
        save_code(css_code, css_code_path)
        save_code(js_code, js_code_path)
        images_meta = game_code_and_images_meta.images_meta
        with open(os.path.join(cur_game_ver_dir, "images_meta.json"), "w", encoding="utf-8") as f:
            json.dump(images_meta, f, ensure_ascii=False, indent=2)
        save_images_meta(images_meta, cur_imgs_meta_dir)
    else:
        images_meta = load_images_meta(cur_imgs_meta_dir)

    for image_name, image_meta in images_meta.items():
        image_path = os.path.join(cur_imgs_dir, image_name + ".png")
        if not os.path.exists(image_path):
            print(f"generating {image_name} ...")
            image_generator.generate_image(image_name, image_meta, cur_imgs_dir, image_name, config["main_config"]["num_eahc_image"])
            if config["main_config"]["use_remove_background"]:
                first_image_path = os.path.join(cur_imgs_dir, f"{image_name}_1.png")
                image_before_remove_background = Image.open(first_image_path)
                image_before_remove_background.save(os.path.join(cur_imgs_dir, f"{image_name}_before_remove_background.png"))
                image = remove_background(first_image_path)  
            else:
                image = Image.open(os.path.join(cur_imgs_dir, f"{image_name}_1.png"))
            target_image_path = os.path.join(cur_imgs_dir, f"{image_name}.png")
            target_image = image.resize((int(image_meta["width"]), int(image_meta["height"])), Image.Resampling.NEAREST)
            target_image.save(target_image_path)
        sleep(5)
