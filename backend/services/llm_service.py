#backend/services/llm_service.py
import requests
import re
from fastapi import HTTPException
from config.settings import settings
from openai import OpenAI
# --- HELPER FUNCTION ---

client = OpenAI(api_key=settings.OPENAI_API_KEY)
def clean_llm_response(content: str) -> str:
    """
    Cleans the raw string from the LLM to ensure only valid Python code remains.
    """
    # 1. Remove common special tokens
    content = content.replace("<s>", "").replace("[BOT]", "").replace("[INST]", "").replace("</s>", "")
    
    # 2. Look for code inside Markdown blocks (```python ... ```)
    #    re.DOTALL allows the dot (.) to match newlines
    markdown_match = re.search(r"```(?:python)?\n(.*?)```", content, re.DOTALL)
    if markdown_match:
        content = markdown_match.group(1)
    
    # 3. Strip leading/trailing whitespace
    content = content.strip()
    
    # 4. Fallback: If the string still doesn't start with code (e.g. contains "Here is the code:"), 
    #    find the first occurrence of "import", "from", "def", or "result ="
    match = re.search(r"^(import|from|def|result\s*=)", content, re.MULTILINE)
    if match:
        start_index = match.start()
        content = content[start_index:]
        
    return content


def generate_code(prompt: str) -> str:
    # if you are using openrouter
    # url = "https://openrouter.ai/api/v1/chat/completions"
    
    # payload = {
    #     "model": "mistralai/mistral-7b-instruct:free",
    #     "messages": [
    #         {
    #             "role": "system",
    #             "content": (
                    # "You are a Python CADQuery expert. "
                    # "Return ONLY valid Python code. "
                    # "Assign the final CadQuery object to a variable named 'result'. "
                    # "Do NOT use markdown backticks. "
                    # "Do NOT write explanations or introductions."

                    # "RULES:"
                    # "1. twistExtrude() works ONLY on 2D shapes (circles, rects). "
                    # "2. NEVER use twistExtrude() on an object that is already 3D (extruded). "
                    # # --- NEW RULE HERE ---
                    # "3. For grids, use .rarray(xSpacing, ySpacing, xCount, yCount, center=True). "
                    # " Example: .rarray(20, 10, 5, 1) creates 5 items spaced 20mm apart in X. "
                    # " NEVER use 0 for count."                    
                    # "4. Do NOT stack .workplane() repeatedly. Use ONE operation to create all features."
                    # "5. Keep code concise. If you find yourself repeating lines, STOP."
                    # "6. ALWAYS start with 'cq.Workplane(\"XY\")'. NEVER use 'CQ()'."  

                    # "WARNINGS:"
                    # "1. Do NOT use the argument 'multitransform' in sweep(). It does not exist. "
                    # "2. To make spirals or twists, use 'twistExtrude(height, angle)' instead of complex sweeps. "
                    # "3. Ensure you only sweep 2D profiles along paths, not 3D solids. "
    #             )
    #         },
    #         {"role": "user", "content": prompt}
    #     ],
    #     "temperature": 0.05, # Lower temp to prevent "hallucinated" syntax errors
    #     "max_tokens": 800
    # }
    
    # headers = {"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}"}
    try:
        response=client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role":"system",
                    "content":(
                        "You are a Python CADQuery expert. "
                        "Return ONLY valid Python code. "
                        "Assign the final CadQuery object to a variable named 'result'. "
                        "Do NOT use markdown backticks. "
                        "Do NOT write explanations or introductions."

                        "RULES:"
                        "1. twistExtrude() works ONLY on 2D shapes (circles, rects). "
                        "2. NEVER use twistExtrude() on an object that is already 3D (extruded). "
                        "3. For grids, use .rarray(xSpacing, ySpacing, xCount, yCount, center=True). "
                        " Example: .rarray(20, 10, 5, 1) creates 5 items spaced 20mm apart in X. "
                        " NEVER use 0 for count."                    
                        "4. Do NOT stack .workplane() repeatedly. Use ONE operation to create all features."
                        "5. Keep code concise. If you find yourself repeating lines, STOP."
                        "6. ALWAYS start with 'cq.Workplane(\"XY\")'."  

                        "WARNINGS:"
                        "1. Do NOT use the argument 'multitransform' in sweep(). It does not exist. "
                        "2. To make spirals or twists, use 'twistExtrude(height, angle)' instead of complex sweeps. "
                        "3. Ensure you only sweep 2D profiles along paths, not 3D solids. "

                    )
                },
                {
                    "role":"user",
                    "content":prompt
                }
            ],
            temperature=0.1,
            max_tokens=1000,
            top_p=1.0
        )
        raw_content = response.choices[0].message.content

        # --- DEBUG LOGGING ---
        print(f"\n[DEBUG] RAW LLM RESPONSE:\n{raw_content!r}\n")

        # Use the Helper Function
        cleaned_code = clean_llm_response(raw_content)

        if not cleaned_code:
            raise ValueError("LLM returned empty code after cleaning.")

        return cleaned_code

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI API error: {str(e)}"
        )

    # try:
    #     r = requests.post(url, json=payload, headers=headers, timeout=30)
    #     r.raise_for_status()
    #     raw_content=r.json()["choices"][0]["message"]["content"]
    # except requests.RequestException as e:
    #     raise HTTPException(status_code=502, detail=f"LLM API error: {str(e)}")

    # print(f"\n[DEBUG] RAW LLM RESPONSE:\n{raw_content!r}\n")
    # cleaned_code = clean_llm_response(raw_content)

    # if not cleaned_code:
    #     raise HTTPException(status_code=500,detail=f"LLM returned empty. Raw was:{raw_content[:200]}")
    # try:
    #     raw_content = r.json()["choices"][0]["message"]["content"]
    # except (KeyError, IndexError, TypeError):
    #     raise HTTPException(status_code=502, detail="Invalid response from LLM")

    # # Call the helper function defined above
    # return cleaned_code
