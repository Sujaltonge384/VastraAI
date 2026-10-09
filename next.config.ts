import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep your existing configuration here.

  serverExternalPackages: [
    "@huggingface/transformers",
    "onnxruntime-node",
  ],
};

export default nextConfig;