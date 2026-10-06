import io
import json
import requests

from PIL import Image
from sentence_transformers import SentenceTransformer


API_URL = "http://localhost:3000/api/products?limit=1"


print("Loading CLIP model...")
model = SentenceTransformer("clip-ViT-B-32")

print("Getting a product from VastraAI...")

response = requests.get(
    API_URL,
    timeout=20,
)

response.raise_for_status()

data = response.json()
products = data.get("products", [])

if not products:
    raise RuntimeError("No products returned by VastraAI API.")

product = products[0]

product_id = product["id"]
product_name = product["name"]
image_url = product["image"]

print(f"Product: {product_name}")
print(f"Product ID: {product_id}")
print(f"Image: {image_url}")

print("Downloading product image...")

image_response = requests.get(
    image_url,
    timeout=30,
    headers={
        "User-Agent": "Mozilla/5.0"
    },
)

image_response.raise_for_status()

image = Image.open(
    io.BytesIO(image_response.content)
).convert("RGB")

print("Generating CLIP embedding...")

embedding = model.encode(
    image,
    normalize_embeddings=True,
)

embedding = embedding.tolist()

print(f"Embedding dimensions: {len(embedding)}")

if len(embedding) != 512:
    raise RuntimeError(
        f"Expected 512 dimensions, got {len(embedding)}"
    )

output = {
    "productId": product_id,
    "productName": product_name,
    "embedding": embedding,
}

with open(
    "scripts/test_embedding.json",
    "w",
    encoding="utf-8",
) as file:
    json.dump(output, file)

print("✅ 512-dimensional embedding generated.")
print("✅ Saved to scripts/test_embedding.json")