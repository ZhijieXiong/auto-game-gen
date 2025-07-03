import os
import sys
import http.server
import socketserver
import webbrowser
from pathlib import Path

def run_game(game_name: str, version: str, port: int = 8000):
    base_dir = Path(__file__).parent
    game_dir = base_dir / "games" / game_name / version
    index_file = game_dir / "index.html"

    if not index_file.exists():
        print(f"❌ 找不到文件: {index_file}")
        return

    os.chdir(base_dir)  # 切换到 GameGenV2 目录
    rel_path = index_file.relative_to(base_dir)
    url = f"http://localhost:{port}/{rel_path.as_posix()}"

    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"✅ 游戏服务器已启动: {url}")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 已手动终止服务器。")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("用法: python run_game.py <game_name> <version>")
        print("例如: python run_game.py Snake v1")
    else:
        run_game(sys.argv[1], sys.argv[2])
