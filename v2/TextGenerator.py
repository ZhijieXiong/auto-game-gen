import getpass
import os
import json
import re
from langchain.chat_models import init_chat_model
# from langchain_community.chat_models import ChatZhipu
from langchain_deepseek import ChatDeepSeek
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import SecretStr
import openai

from api_key_map import API_KEY_MAP
from prompts import system_prompt4demand_gen, system_prompt4code_and_images_meta_gen, type_to_str
from structured_output import GameDemand, GameCodeAndImagesMeta, ImageMeta

    
class TextGenerator:
    no_json_models = [
        "gpt-35-turbo@@2024-02-01",
        "anthropic.claude-3-5-sonnet-20240620-v1:0",
        "deepseek-reasoner",
        # "us.anthropic.claude-sonnet-4-20250514-v1:0"
    ]
    
    def __init__(self, platform: str, model_name: str, api_key_name: str, **kwargs):
        self.platform = platform
        self.model_name = model_name
        self.api_key_name = api_key_name
        self.kwargs = kwargs
        api_key = os.getenv(api_key_name)
        if api_key is None:
            api_key = getpass.getpass(f"Enter API key for {platform}: ")
        os.environ[API_KEY_MAP[platform]] = api_key
        if platform == "zhipuai":
            # self.model = ChatZhipu(model=model_name)
            pass
        elif platform == "deepseek":
            self.model = ChatDeepSeek(model=model_name, **kwargs)
        elif platform == "azure":
            model_name, api_version = model_name.split("@@")
            os.environ["AZURE_OPENAI_ENDPOINT"] = "https://us-west-us-3.openai.azure.com/"
            self.model = AzureChatOpenAI(azure_deployment=model_name, api_version=api_version, **kwargs)
        elif platform == "niya_aws":
            # 没有使用ChatOpenAI，因为它无法更改max_tokens限制，怀疑langchain提供的接口也有这个问题
            self.client = openai.OpenAI(
                # base_url="http://Bedroc-Proxy-imjVssw6RvYw-597425822.us-west-2.elb.amazonaws.com/api/v1",
                base_url="http://Bedroc-Proxy-JmRQvc4KWauU-2051322865.us-west-2.elb.amazonaws.com/api/v1",
                api_key=api_key
            )
            self.model_name = model_name
            self.max_tokens = kwargs.get('max_tokens', 4096)
            self.temperature = kwargs.get('temperature', 0.7)
        else:
            self.model = init_chat_model(model_name, model_provider=platform, **kwargs)

    def analyze_demands(self, prompt: str) -> GameDemand:
        json_str = "{\n"
        for field_name, field_info in GameDemand.model_fields.items():
            json_str += f"    \"{field_name}\": {type_to_str(field_info.annotation)},  \\\\ {field_info}\n"
        json_str += "}"
        system_prompt = f"""\n\nReturn your output **as a valid JSON object**, and nothing else. **Do not include explanation, markdown formatting, or extra commentary.**

The JSON structure should exactly match the following schema:

```json
{json_str}
"""
        print("=" * 50 + "system_prompt" + "=" * 50)
        print(system_prompt4demand_gen() + system_prompt)
        print("=" * 50 + "prompt" + "=" * 50)
        print(prompt)
        if self.platform == "niya_aws":
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt4demand_gen() + system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            response_content = response.choices[0].message.content
            if response_content is None:
                raise ValueError("Empty response from model")
            
            try:
                # Clean the response content - remove any leading/trailing whitespace and newlines
                cleaned_content = response_content.strip()
                # Remove markdown code block markers if present
                if cleaned_content.startswith('```json'):
                    cleaned_content = cleaned_content[7:]
                if cleaned_content.startswith('```'):
                    cleaned_content = cleaned_content[3:]
                if cleaned_content.endswith('```'):
                    cleaned_content = cleaned_content[:-3]
                cleaned_content = cleaned_content.strip()
                data = json.loads(cleaned_content)
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                print(f"Response content: {response_content[:500]}...")  # Print first 500 chars for debugging
                # Try to extract JSON using regex
                match = re.search(r"\{.*\}", response_content, re.DOTALL)
                if not match:
                    raise ValueError("No valid JSON found in model response.")
                json_str = match.group()
                try:
                    data = json.loads(json_str)
                except json.JSONDecodeError as e2:
                    print(f"Second JSON decode error: {e2}")
                    print(f"Extracted JSON string: {json_str[:500]}...")
                    # Try to fix common JSON issues
                    json_str = json_str.replace('\n', '\\n').replace('\r', '\\r')
                    data = json.loads(json_str)
            return GameDemand(**data)
        elif self.model_name in TextGenerator.no_json_models:
            messages = [SystemMessage(content=system_prompt4demand_gen() + system_prompt), HumanMessage(content=prompt)]
            response = self.model.invoke(messages)
            try:
                data = json.loads(str(response.content))
            except json.JSONDecodeError:
                match = re.search(r"\{.*\}", str(response.content), re.DOTALL)
                if not match:
                    raise ValueError("No valid JSON found in model response.")
                json_str = match.group()
                data = json.loads(json_str)
            return GameDemand(**data)
        else:
            messages = [SystemMessage(content=system_prompt4demand_gen()), HumanMessage(content=prompt)]
            return GameDemand(**self.model.with_structured_output(GameDemand).invoke(messages))
        
    def generate_code_and_images_meta(self, game_demand: GameDemand) -> GameCodeAndImagesMeta:
        prompt = f"""The game demands are as follows:"""
        for field_name, field_value in game_demand.model_dump().items():
            prompt += f"""
- {field_name}: {field_value}
"""
        image_meta_desc = "{\n"
        for field_name, field_info in ImageMeta.model_fields.items():
            image_meta_desc += f"    \"{field_name}\": {type_to_str(field_info.annotation)},  \\\\ {field_info}\n"
        image_meta_desc += "}"
        system_prompt = """\n\nReturn your output **as a valid JSON object**, and nothing else. **Do not include explanation, markdown formatting, or extra commentary.**

The JSON structure should exactly match the following schema:

```json
{
    "html_code": string,  // html code
    "css_code": string,  // css code
    "js_code": string,  // js code
    "images_meta": dict[string, ImageMeta]  // the metadata of the images
}

The structure of the `ImageMeta` object is as follows:\n\n
"""  + image_meta_desc
        print("=" * 50 + "system_prompt" + "=" * 50)
        print(system_prompt4code_and_images_meta_gen() + system_prompt)
        print("=" * 50 + "prompt" + "=" * 50)
        print(prompt)
        if self.platform == "niya_aws":
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt4code_and_images_meta_gen() + system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            response_content = response.choices[0].message.content
            if response_content is None:
                raise ValueError("Empty response from model")
            
            try:
                # Clean the response content - remove any leading/trailing whitespace and newlines
                cleaned_content = response_content.strip()
                # Remove markdown code block markers if present
                if cleaned_content.startswith('```json'):
                    cleaned_content = cleaned_content[7:]
                if cleaned_content.startswith('```'):
                    cleaned_content = cleaned_content[3:]
                if cleaned_content.endswith('```'):
                    cleaned_content = cleaned_content[:-3]
                cleaned_content = cleaned_content.strip()
                data = json.loads(cleaned_content)
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                print(f"Response content: {response_content[:500]}...")  # Print first 500 chars for debugging
                # Try to extract JSON using regex
                match = re.search(r"\{.*\}", response_content, re.DOTALL)
                if not match:
                    raise ValueError("No valid JSON found in model response.")
                json_str = match.group()
                try:
                    data = json.loads(json_str)
                except json.JSONDecodeError as e2:
                    print(f"Second JSON decode error: {e2}")
                    print(f"Extracted JSON string: {json_str[:500]}...")
                    # Try to fix common JSON issues
                    json_str = json_str.replace('\n', '\\n').replace('\r', '\\r')
                    data = json.loads(json_str)
            return GameCodeAndImagesMeta(**data)
        elif self.model_name in TextGenerator.no_json_models:
            messages = [SystemMessage(content=system_prompt4code_and_images_meta_gen() + system_prompt), HumanMessage(content=prompt)]
            response = self.model.invoke(messages)
            try:
                data = json.loads(str(response.content))
            except json.JSONDecodeError:
                match = re.search(r"\{.*\}", str(response.content), re.DOTALL)
                if not match:
                    raise ValueError("No valid JSON found in model response.")
                json_str = match.group()
                data = json.loads(json_str)
            return GameCodeAndImagesMeta(**data)
        else:
            messages = [SystemMessage(content=system_prompt4code_and_images_meta_gen()), HumanMessage(content=prompt)]
            return GameCodeAndImagesMeta(**self.model.with_structured_output(GameCodeAndImagesMeta).invoke(messages))
        