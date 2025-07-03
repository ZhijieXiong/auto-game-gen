# GameGen v1 - AI-Powered Game Generator

GameGen v1 是一个基于AI的自动化游戏生成器，能够根据简单的需求描述自动生成完整的网页游戏，包括HTML、CSS、JavaScript代码和游戏所需的图片资源。

## 功能特性

- 🤖 **AI驱动**: 使用大语言模型自动分析游戏需求并生成代码
- 🎨 **自动图片生成**: 根据游戏需求自动生成所需的图片资源
- 🔄 **版本管理**: 支持多版本游戏开发，自动备份历史版本
- 🌐 **即开即玩**: 生成的游戏可直接在浏览器中运行
- 📁 **结构化输出**: 生成完整的游戏文件结构

## 项目结构

```
GameGen/v1/
├── main.py              # 主程序入口
├── run_game.py          # 游戏运行脚本
├── config.yaml          # 配置文件
├── utils.py             # 工具函数
├── structured_output.py # 数据结构定义
├── TextGenerator.py     # 文本生成器
├── ImageGenerator.py    # 图片生成器
└── games/               # 生成的游戏目录
    ├── Snake/
    │   └── v1/
    │       ├── index.html
    │       ├── index.css
    │       ├── index.js
    │       ├── demand.json
    │       ├── images_meta.json
    │       └── assets/
    │           ├── images/
    │           └── images_meta/
    └── Tetris/
        └── v1/
            └── ...
```

## 环境要求

### Python依赖

项目提供了两个requirements文件：

1. **完整依赖** (requirements.txt): 包含niya1环境中的所有包
   ```bash
   pip install -r requirements.txt
   ```

2. **最小依赖** (requirements-minimal.txt): 只包含核心功能所需的包
   ```bash
   pip install -r requirements-minimal.txt
   ```

或者手动安装核心依赖：
```bash
pip install pydantic pillow pyyaml openai langchain boto3 requests pillow
```

### API密钥配置
在运行前，需要配置以下API密钥（根据config.yaml中的设置）：

1. **文本生成模型** (默认: niya_aws)
   ```bash
   export NIYA_AWS_ACCESS_KEY_ID="your_api_key"
   ```

2. **图片生成模型** (默认: azure)
   ```bash
   export AZURE_OPENAI_API_KEY="your_api_key"
   ```

## 配置说明

编辑 `config.yaml` 文件来配置游戏生成参数：

```yaml
main_config:
  game_name: "YourGameName"           # 游戏名称
  game_demand: "帮我做个俄罗斯方块游戏"  # 游戏需求描述
  continue_from_existing_game: true   # 是否从现有游戏继续开发
  num_eahc_image: 2                   # 每个图片生成的版本数
  use_remove_background: false        # 是否自动去除图片背景

llm_configs:
  text_model:
    platform: "niya_aws"              # 文本生成平台
    model_name: "us.anthropic.claude-sonnet-4-20250514-v1:0"
    temperature: 0.8
    max_tokens: 20000
  image_model:
    platform: "azure"                 # 图片生成平台
    model_name: "gpt-image-1@@2025-04-01-preview"
```

## 使用方法

### 1. 开发新游戏

```bash
# 运行主程序生成游戏
python main.py
```

程序会自动：
1. 分析游戏需求并生成结构化描述
2. 生成HTML、CSS、JavaScript代码
3. 生成游戏所需的图片资源
4. 保存所有文件到 `games/{game_name}/v1/` 目录

### 2. 运行游戏

```bash
# 启动游戏服务器
python run_game.py <game_name> <version>

# 例如运行Snake游戏v1版本
python run_game.py Snake v1
```

游戏将在浏览器中自动打开，默认端口为8000。

### 3. 继续开发现有游戏

设置 `config.yaml` 中的 `continue_from_existing_game: true`，程序会：
- 从最新版本继续开发
- 保留现有的代码和资源
- 只生成缺失的部分

## 游戏开发流程

### 1. 需求分析
程序首先分析你的游戏需求描述，生成结构化的游戏规格，包括：
- 游戏名称和描述
- 核心游戏机制
- 控制方式
- 视觉风格
- 主要角色
- UI元素
- 胜利/失败条件
- 所需视觉资源

### 2. 代码生成
基于分析结果，AI生成：
- **HTML**: 游戏页面结构
- **CSS**: 游戏样式和动画
- **JavaScript**: 游戏逻辑和交互

### 3. 图片生成
为游戏生成所需的图片资源：
- 角色精灵
- 背景图片
- UI元素
- 游戏道具

### 4. 资源优化
- 自动调整图片尺寸
- 可选的背景去除功能
- 图片格式优化

## 故障排除

### 常见问题

1. **API密钥错误**
   - 检查环境变量是否正确设置
   - 确认API密钥有效且有足够配额

2. **图片生成失败**
   - 检查网络连接
   - 确认图片生成API可用
   - 调整图片生成参数

3. **游戏无法运行**
   - 确认所有文件都已生成
   - 检查浏览器控制台错误
   - 验证文件路径正确

## 版本管理

程序自动管理游戏版本：
- 新游戏创建为 `v1`
- 继续开发时创建新版本（`v2`, `v3`等）
- 旧版本自动备份为 `{game_name}_pre_{n}`
