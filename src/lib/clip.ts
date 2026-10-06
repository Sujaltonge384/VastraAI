import {
  pipeline,
  RawImage,
} from "@huggingface/transformers";

let extractorPromise: Promise<any> | null = null;

export async function getImageExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "image-feature-extraction",
      "Xenova/clip-vit-base-patch32"
    );
  }

  return extractorPromise;
}

export async function generateImageEmbedding(
  input: string | Blob | RawImage
): Promise<number[]> {
  const extractor = await getImageExtractor();

  const image =
    typeof input === "string"
      ? await RawImage.read(input)
      : input instanceof RawImage
        ? input
        : await RawImage.fromBlob(input);

  const output = await extractor(image);

  const embedding = Array.from(
    output.data as Float32Array
  );

  if (embedding.length !== 512) {
    throw new Error(
      `Expected 512-dimensional embedding, got ${embedding.length}`
    );
  }

  return embedding;
}