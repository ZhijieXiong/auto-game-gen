from pydantic import BaseModel, Field


class GameDemand(BaseModel):
    """Represents a structured specification for a browser-based game."""
    game_name: str = Field(description="The name of the game.")
    game_description: str = Field(description="A short overview of the game idea and objectives.")
    core_mechanics: list[str] = Field(
        description="The fundamental gameplay mechanics (e.g., collect items, avoid obstacles, shoot enemies)."
    )
    controls: list[str] = Field(
        description="Player input methods (e.g., arrow keys, WASD, mouse, touch)."
    )
    visual_style: str = Field(
        description="The intended art style (e.g., pixel art, cartoon, flat, geometric, minimalist)."
    )
    key_characters: list[str] = Field(
        description="Main characters or entities controlled by the player or appearing in the game."
    )
    ui_elements: list[str] = Field(
        description="User interface components (e.g., score, health bar, timer, pause button)."
    )
    victory_defeat_conditions: list[str] = Field(
        description="Conditions for winning or losing the game (e.g., survive 60 seconds, collect 10 coins, touch wall = defeat)."
    )
    visual_assets: list[str] = Field(
        description=(
            "A comprehensive list of all visual assets needed in the game. "
            "Each entry should mention what it is (character, object, background, UI), "
            "its states/directions (e.g., up/down/left/right, idle/moving), "
            "and the gameplay context it is used in."
        )
    )
   

class ImageMeta(BaseModel):
    """Represents the metadata of an image which contains one or more sprites."""
    image_name: str = Field(description="The name of the image.")
    num_sprites: int = Field(description="The number of sprites in the image.")
    num_rows: int = Field(description="The number of rows of sprites in the image.")
    num_cols: int = Field(description="The number of columns of sprites in the image.")
    basic_sprites_info: dict[str, list[int]] = Field(description="The information of the sprites in the image. The key is the name of the sprite, the value is the information of the sprite (x: the row index of the sprite, y: the column index of the sprite, width: the width of the sprite (pixel), height: the height of the sprite (pixel)).")
    sprites_description: dict[str, str] = Field(description="The description of the sprites in the image. The key is the name of the sprite, the value is the detailed description of the sprite.")
    

class GameCodeAndImagesMeta(BaseModel):
    """Represents the code and images metadata for a web-based game."""
    html_code: str = Field(description="The HTML source code of the game.")
    css_code: str = Field(description="The CSS styles used in the game.")
    js_code: str = Field(description="The JavaScript logic that powers the game.")
    images_meta: dict[str, ImageMeta] = Field(description="The metadata of the images used in the game. The key is the name of the image, the value is the metadata of the image (name: only image name, without file name suffix, description, width: the width of the image, unit is pixel, height: the height of the image, unit is pixel).")
    

