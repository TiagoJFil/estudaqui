import base64
import json
from typing import List, Union
import fitz

from openai import AsyncOpenAI

from functions.prompts import SUGGESTED_ANSWER_SYSTEM_PROMPT


class OpenAiLLMProvider:
    def __init__(self):
        self.openai_client = AsyncOpenAI()

    

    async def analyze_exam_pages(self, pdf_path: str) -> List:
        doc = fitz.open(pdf_path)

        pdf_pages_b64 = []
        for page_number in range(len(doc)):
            page = doc.load_page(page_number)
            pix = page.get_pixmap(dpi=65)
            image = pix.tobytes("jpeg")
            b64_image = base64.b64encode(image).decode("utf-8")
            pdf_pages_b64.append(b64_image)

        # create chunks of 3 images
        image_chunks = [pdf_pages_b64[i:i + 3] for i in range(0, len(pdf_pages_b64), 3)]
        
        inputs = []
        for i, chunk in enumerate(image_chunks):
            input = [{"role": "user", "content": [{"type": "input_text", "text":SUGGESTED_ANSWER_SYSTEM_PROMPT}]}]
            for image_b64 in chunk:
                input[0]["content"].append({"type": "input_image", "image_url": f"data:image/jpeg;base64,{image_b64}"})
            inputs.append(input)

        responses = []
        for input in inputs:
            response = await self.openai_client.create(
                model="gpt-4o",
                input=input,
                temperature=0.2
            )

            json_text = response.output_text.strip()
            responses.append(json.loads(json_text))
        
        print(responses[2])

    async def get_suggested_answer(self, question: str, additional_information: Union[str, None]) -> str:
        user_content = f'Question: "{question}"'
        if additional_information:
            user_content += f' Additional Context:\n"{additional_information}"'

        response = await self.openai_client.responses.create(
            model="gpt-4o",
            input=[
                {"role": "system", "content": SUGGESTED_ANSWER_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2
        )
        return response.output_text.strip()
    

# main entry point for testing
if __name__ == "__main__":
    import asyncio

    async def main():
        provider = OpenAiLLMProvider()
        await provider.analyze_exam_pages("Matematica.pdf")

    asyncio.run(main())