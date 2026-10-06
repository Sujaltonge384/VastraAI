"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Search, Upload, X } from "lucide-react";

import ProductCard from "../../components/ProductCard/ProductCard";
import styles from "./VisualSearch.module.css";

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviews?: number;
  similarity?: number;
};

export default function VisualSearchPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const selectFile = (selectedFile: File | null) => {
    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setPreview(objectUrl);
    setProducts([]);
    setError("");
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    selectFile(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);

    selectFile(event.dataTransfer.files?.[0] ?? null);
  };

  const clearImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview("");
    setProducts([]);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const searchSimilarProducts = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setProducts([]);

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        "/api/ai/visual-search",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Visual search failed."
        );
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error("Visual search error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to perform visual search."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>
          VASTRAAI AI
        </p>

        <h1>Visual Search</h1>

        <p className={styles.subtitle}>
          Upload a fashion image and discover products
          with a similar visual style.
        </p>
      </section>

      <section className={styles.searchSection}>
        {!preview ? (
          <div
            className={`${styles.dropzone} ${
              dragging ? styles.dragging : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => {
              setDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className={styles.uploadIcon}>
              <ImagePlus size={32} />
            </div>

            <h2>Find similar fashion</h2>

            <p>
              Drag & drop an image here or click to upload
            </p>

            <span>
              JPG, PNG or WEBP · Maximum 5 MB
            </span>

            <button
              type="button"
              className={styles.uploadButton}
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <Upload size={18} />
              Choose Image
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <div>
                <p className={styles.previewLabel}>
                  SELECTED IMAGE
                </p>

                <h2>
                  {file?.name}
                </h2>
              </div>

              <button
                type="button"
                className={styles.clearButton}
                onClick={clearImage}
                aria-label="Remove image"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.previewImageWrap}>
              <img
                src={preview}
                alt="Selected fashion"
                className={styles.previewImage}
              />
            </div>

            <button
              type="button"
              className={styles.searchButton}
              onClick={searchSimilarProducts}
              disabled={loading}
            >
              <Search size={19} />

              {loading
                ? "Finding similar products..."
                : "Find Similar Products"}
            </button>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
      </section>

      {loading && (
        <section className={styles.loadingSection}>
          <div className={styles.loader} />

          <h2>Analyzing your image</h2>

          <p>
            VastraAI is comparing your image with
            products in the catalog.
          </p>
        </section>
      )}

      {!loading && products.length > 0 && (
        <section className={styles.results}>
          <div className={styles.resultsHeader}>
            <div>
              <p className={styles.eyebrow}>
                AI MATCHES
              </p>

              <h2>
                Similar Products
              </h2>

              <p>
                {products.length} visually similar
                products found
              </p>
            </div>

            <Link
              href="/products"
              className={styles.browseLink}
            >
              Browse all products
            </Link>
          </div>

          <div className={styles.grid}>
            {products.map((product) => (
              <div
                key={product.id}
                className={styles.resultItem}
              >
                <div className={styles.matchBadge}>
                  {Math.round(
                    (product.similarity ?? 0) * 100
                  )}
                  % match
                </div>

                <ProductCard
                  id={product.id}
                  name={product.name}
                  brand={product.brand}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.image}
                  rating={product.rating}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading &&
        file &&
        products.length === 0 &&
        !error && (
          <section className={styles.noResults}>
            <h2>No similar products found</h2>

            <p>
              Try uploading another fashion image with
              clearer clothing details.
            </p>
          </section>
        )}
    </main>
  );
}