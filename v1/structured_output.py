from pydantic import BaseModel, Field
from typing import List


class GameDemand(BaseModel):
    """Represents a structured specification for a browser-based game."""

    game_name: str = Field(description="The name of the game.")
    game_description: str = Field(description="A short overview of the game idea and objectives.")
    core_mechanics: List[str] = Field(
        description="The fundamental gameplay mechanics (e.g., collect items, avoid obstacles, shoot enemies)."
    )
    controls: List[str] = Field(
        description="Player input methods (e.g., arrow keys, WASD, mouse, touch)."
    )
    visual_style: str = Field(
        description="The intended art style (e.g., pixel art, cartoon, flat, geometric, minimalist)."
    )
    key_characters: List[str] = Field(
        description="Main characters or entities controlled by the player or appearing in the game."
    )
    ui_elements: List[str] = Field(
        description="User interface components (e.g., score, health bar, timer, pause button)."
    )
    victory_defeat_conditions: List[str] = Field(
        description="Conditions for winning or losing the game (e.g., survive 60 seconds, collect 10 coins, touch wall = defeat)."
    )
    visual_assets: List[str] = Field(
        description=(
            "A comprehensive list of all visual assets needed in the game. "
            "Each entry should mention what it is (character, object, background, UI), "
            "its states/directions (e.g., up/down/left/right, idle/moving), "
            "and the gameplay context it is used in."
        )
    )

    

class GameCodeAndImagesMeta(BaseModel):
    """Represents the code and images metadata for a web-based game."""
    html_code: str = Field(description="The HTML source code of the game.")
    css_code: str = Field(description="The CSS styles used in the game.")
    js_code: str = Field(description="The JavaScript logic that powers the game.")
    images_meta: dict[str, dict[str, str | int]] = Field(description="The metadata of the images used in the game. The key is the name of the image, the value is the metadata of the image (name: only image name, without file name suffix, description, width: the width of the image, unit is pixel, height: the height of the image, unit is pixel).")
    
