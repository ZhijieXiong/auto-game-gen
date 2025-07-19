import os
import numpy as np
from PIL import Image
from collections import deque


def extract_sprite_manual_cleanup(image_path, tolerance=10, crop=True):
    """
    手动清理的精灵提取方法。
    
    这个方法会智能地去除背景，同时保护精灵内部的颜色。
    
    参数:
    - image_path: 图片路径
    - tolerance: 容差（像素色差阈值），默认为10
    - crop: 是否裁剪到精灵边界，默认为True

    返回:
    - 返回一个去除背景的 PIL.Image 对象（RGBA 模式）
    """
    img = Image.open(image_path).convert("RGBA")
    img_array = np.array(img)
    height, width = img_array.shape[:2]
    
    # 获取边缘背景色
    edge_colors = []
    for i in range(width):
        edge_colors.append(tuple(img_array[0, i][:3]))
        edge_colors.append(tuple(img_array[height-1, i][:3]))
    for i in range(height):
        edge_colors.append(tuple(img_array[i, 0][:3]))
        edge_colors.append(tuple(img_array[i, width-1][:3]))
    
    bg_color = tuple(sum(edge_colors[i][j] for i in range(len(edge_colors))) // len(edge_colors) for j in range(3))
    
    # 创建掩码来标记背景区域
    bg_mask = np.zeros((height, width), dtype=bool)
    
    # 从边缘开始填充背景区域（使用迭代避免递归深度限制）
    def flood_fill_edge_only_iterative(start_x, start_y, target_color, tolerance):
        stack = [(start_x, start_y)]
        
        while stack:
            x, y = stack.pop()
            
            if x < 0 or x >= width or y < 0 or y >= height:
                continue
            if bg_mask[y, x]:
                continue
            
            current_color = img_array[y, x][:3]
            if not all(abs(current_color[i] - target_color[i]) <= tolerance for i in range(3)):
                continue
            
            bg_mask[y, x] = True
            
            # 添加相邻像素到栈中
            stack.append((x+1, y))
            stack.append((x-1, y))
            stack.append((x, y+1))
            stack.append((x, y-1))
    
    # 从图片边缘开始填充背景
    for i in range(width):
        flood_fill_edge_only_iterative(i, 0, bg_color, tolerance)
        flood_fill_edge_only_iterative(i, height-1, bg_color, tolerance)
    for i in range(height):
        flood_fill_edge_only_iterative(0, i, bg_color, tolerance)
        flood_fill_edge_only_iterative(width-1, i, bg_color, tolerance)
    
    # 将背景区域设置为透明
    img_array[bg_mask, 3] = 0
    
    result_img = Image.fromarray(img_array, 'RGBA')
    
    if crop:
        result_img = _crop_to_sprite(result_img)
    
    return result_img


def extract_sprite_simple_fallback(image_path, tolerance=10, crop=True):
    """
    简单的备用精灵提取方法，确保至少有一个方法能工作。
    
    这个方法只去除边缘的背景色，保护精灵内部。
    
    参数:
    - image_path: 图片路径
    - tolerance: 容差（像素色差阈值），默认为10
    - crop: 是否裁剪到精灵边界，默认为True

    返回:
    - 返回一个去除背景的 PIL.Image 对象（RGBA 模式）
    """
    img = Image.open(image_path).convert("RGBA")
    img_array = np.array(img)
    height, width = img_array.shape[:2]
    
    # 获取背景色（只使用四个角）
    corners = [
        img_array[0, 0][:3],           # 左上
        img_array[0, width-1][:3],     # 右上
        img_array[height-1, 0][:3],    # 左下
        img_array[height-1, width-1][:3]  # 右下
    ]
    bg_color = tuple(sum(corners[i][j] for i in range(4)) // 4 for j in range(3))
    
    # 创建背景掩码
    bg_mask = np.zeros((height, width), dtype=bool)
    
    # 使用迭代的洪水填充，只从边缘开始
    def flood_fill_simple(start_x, start_y, target_color, tolerance):
        stack = [(start_x, start_y)]
        
        while stack:
            x, y = stack.pop()
            
            if x < 0 or x >= width or y < 0 or y >= height:
                continue
            if bg_mask[y, x]:
                continue
            
            current_color = img_array[y, x][:3]
            if not all(abs(current_color[i] - target_color[i]) <= tolerance for i in range(3)):
                continue
            
            bg_mask[y, x] = True
            
            # 添加相邻像素到栈中
            stack.append((x+1, y))
            stack.append((x-1, y))
            stack.append((x, y+1))
            stack.append((x, y-1))
    
    # 只从边缘开始填充背景
    for i in range(width):
        flood_fill_simple(i, 0, bg_color, tolerance)
        flood_fill_simple(i, height-1, bg_color, tolerance)
    for i in range(height):
        flood_fill_simple(0, i, bg_color, tolerance)
        flood_fill_simple(width-1, i, bg_color, tolerance)
    
    # 将背景区域设置为透明
    img_array[bg_mask, 3] = 0
    
    result_img = Image.fromarray(img_array, 'RGBA')
    
    if crop:
        result_img = _crop_to_sprite(result_img)
    
    return result_img


def _crop_to_sprite(img):
    """裁剪图片到精灵边界"""
    # 获取非透明像素的边界
    datas = img.getdata()
    width, height = img.size
    
    min_x, min_y = width, height
    max_x, max_y = 0, 0
    
    for y in range(height):
        for x in range(width):
            pixel = datas[y * width + x]
            if pixel[3] > 0:  # 非透明像素
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    
    # 如果找到了非透明像素，则裁剪
    if min_x < max_x and min_y < max_y:
        return img.crop((min_x, min_y, max_x + 1, max_y + 1))
    
    return img


def batch_extract_sprites(input_dir, output_dir, tolerance=10, crop=True):
    """
    批量提取精灵图片。

    参数:
    - input_dir: 输入目录路径
    - output_dir: 输出目录路径
    - tolerance: 容差（像素色差阈值），默认为10
    - crop: 是否裁剪到精灵边界，默认为True
    """
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    # 支持的图片格式
    supported_formats = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff'}
    
    for filename in os.listdir(input_dir):
        if any(filename.lower().endswith(fmt) for fmt in supported_formats):
            input_path = os.path.join(input_dir, filename)
            output_filename = os.path.splitext(filename)[0] + '.png'
            output_path = os.path.join(output_dir, output_filename)
            
            try:
                # 先尝试手动清理方法
                sprite = extract_sprite_manual_cleanup(input_path, tolerance, crop)
                sprite.save(output_path, 'PNG')
                print(f"成功提取: {filename} -> {output_filename}")
            except Exception as e:
                print(f"手动清理失败 {filename}: {str(e)}")
                try:
                    # 备用方法
                    sprite = extract_sprite_simple_fallback(input_path, tolerance, crop)
                    sprite.save(output_path, 'PNG')
                    print(f"备用方法成功: {filename} -> {output_filename}")
                except Exception as e2:
                    print(f"所有方法都失败 {filename}: {str(e2)}")
        

def extract_sprites(image_path: str, output_dir: str, num_sprites: int, rows: int, cols: int) -> int:
    """
    改进版精灵提取器：使用智能背景去除方法检测精灵
    :param image_path: 精灵图路径
    :param output_dir: 输出目录
    :param num_sprites: 精灵数量
    :param rows: 行数
    :param cols: 列数
    """
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取输入图片的文件名（不含路径和后缀）
    image_name = os.path.splitext(os.path.basename(image_path))[0]
    
    # 首先使用智能背景去除方法处理整个图片
    cleaned_img = extract_sprite_manual_cleanup(image_path, tolerance=15, crop=False)
    
    # 将图像转换为numpy数组进行处理
    img_array = np.array(cleaned_img)
    width, height = cleaned_img.size
    
    # 创建背景掩码（透明像素）
    if img_array.shape[2] == 4:
        bg_mask = img_array[:, :, 3] < 128
    else:
        # 如果没有alpha通道，使用RGB模式
        bg_mask = np.zeros((height, width), dtype=bool)
    
    # 创建一个标记数组，记录哪些像素已处理
    visited = np.zeros_like(bg_mask, dtype=bool)
    
    # 找到所有非背景像素的位置
    non_bg = np.argwhere(~bg_mask)
    
    # 如果没有找到非背景像素，直接返回
    if len(non_bg) == 0:
        print("警告: 未找到任何非背景像素")
        return 0
    
    # 用于存储检测到的精灵
    sprites = []
    
    # 使用BFS（广度优先搜索）检测连通区域
    def bfs(start_y, start_x):
        """使用BFS查找连通区域"""
        queue = deque([(start_y, start_x)])
        min_y, min_x = height, width
        max_y, max_x = 0, 0
        
        while queue:
            y, x = queue.popleft()
            
            # 更新边界
            min_y = min(min_y, y)
            max_y = max(max_y, y)
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            
            # 检查四个方向的邻居
            for dy, dx in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                ny, nx = y + dy, x + dx
                
                # 检查是否在边界内且未访问过且非背景
                if (0 <= ny < height and 0 <= nx < width and 
                    not visited[ny, nx] and not bg_mask[ny, nx]):
                    visited[ny, nx] = True
                    queue.append((ny, nx))
        
        return min_x, min_y, max_x + 1, max_y + 1
    
    # 检测所有连通区域
    for y, x in non_bg:
        if not visited[y, x]:
            visited[y, x] = True
            bbox = bfs(y, x)
            
            # 过滤掉太小的区域（可能是噪声）
            sprite_width = bbox[2] - bbox[0]
            sprite_height = bbox[3] - bbox[1]
            if sprite_width > 20 and sprite_height > 20:  # 增加最小尺寸阈值
                sprites.append(bbox)
            
            # 如果已经找到足够数量的精灵，停止搜索
            if len(sprites) >= num_sprites:
                break
    
    # 按x坐标排序（从左到右），确保正确的顺序
    sprites.sort(key=lambda b: b[0])  # 按min_x排序
    
    # 将精灵分配到网格
    row_height = height // rows
    col_width = width // cols
    
    # 用于跟踪已使用的网格位置
    used_positions = set()
    
    for idx, (min_x, min_y, max_x, max_y) in enumerate(sprites):
        # 计算行索引
        row_idx = min(min_y // row_height, rows - 1)
        
        # 计算列索引
        col_idx = min(min_x // col_width, cols - 1)
        
        # 如果位置已被使用，寻找下一个可用位置
        position = (row_idx, col_idx)
        while position in used_positions:
            # 尝试下一个位置
            if col_idx + 1 < cols:
                col_idx += 1
            elif row_idx + 1 < rows:
                row_idx += 1
                col_idx = 0
            else:
                # 如果所有位置都被占用，使用索引作为后缀
                break
            position = (row_idx, col_idx)
        
        used_positions.add(position)
        
        # 提取精灵
        sprite_img = cleaned_img.crop((min_x, min_y, max_x, max_y))
        
        # 保存精灵，使用新的命名格式
        sprite_name = f"{image_name}_{row_idx}_{col_idx}.png"
        sprite_path = os.path.join(output_dir, sprite_name)
        sprite_img.save(sprite_path)
        print(f"已保存精灵 ({row_idx}, {col_idx}) 到 {sprite_path}")
        print(f"  精灵尺寸: {sprite_img.size}")
        print(f"  精灵边界: ({min_x}, {min_y}) -> ({max_x}, {max_y})")
        
        # 如果已经保存了足够数量的精灵，停止处理
        if idx + 1 >= num_sprites:
            break
    
    # 检查找到的精灵数量
    return len(sprites)


# 使用示例
if __name__ == "__main__":
    # input_path = "/Users/dream/myProjects/cursor/niya/projects/GameGen/v2/games/Snake/v1/assets/images/snake-head-down_1.png"
    # output_path = "/Users/dream/myProjects/cursor/niya/projects/GameGen/v2/snake-head-down.png"
    # tolerance = 10
    
    # # 尝试两种方法
    # methods = [
    #     ('manual_cleanup', '手动清理方法'),
    #     ('simple_fallback', '简单备用方法')
    # ]
    
    # success_count = 0
    
    # for method, description in methods:
    #     try:
    #         print(f"\n尝试{description}...")
    #         if method == 'manual_cleanup':
    #             sprite = extract_sprite_manual_cleanup(input_path, tolerance)
    #         elif method == 'simple_fallback':
    #             sprite = extract_sprite_simple_fallback(input_path, tolerance)
            
    #         if sprite is not None:
    #             output_file = output_path.replace('.png', f'_{method}.png')
    #             sprite.save(output_file, 'PNG')
    #             print(f"✅ {description}成功: {output_file}")
    #             success_count += 1
    #         else:
    #             print(f"❌ {description}失败")
                
    #     except Exception as e:
    #         print(f"❌ {description}失败: {str(e)}")
    
    # print(f"\n完成！成功执行了 {success_count} 个方法。")
    # if success_count == 0:
    #     print("所有方法都失败了，请检查图片路径和格式。") 
        
    # 输入参数
    input_image = "/Users/dream/myProjects/cursor/niya/projects/GameGen/v2/games/Snake/v1/assets/images/background_1.png"  # 精灵图路径
    output_directory = "/Users/dream/myProjects/cursor/niya/projects/GameGen/v2/games/Snake/v1/assets/images"  # 输出目录
    total_sprites = 9  # 精灵总数
    grid_rows = 3  # 行数
    grid_cols = 3  # 列数
    
    extract_sprites(input_image, output_directory, total_sprites, grid_rows, grid_cols)