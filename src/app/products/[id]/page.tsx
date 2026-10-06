"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductActions from "../../../components/ProductActions/ProductActions";
import styles from "./ProductDetails.module.css";

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  color: string;
  description: string;
  sizes: string[];
  colors: string[];
  stock: number;
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `/api/products/${id}`
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();

        setProduct(data);
      } catch (error) {
        console.error(error);
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p>Loading product...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <h1>Product Not Found</h1>

            <p>
              The product you're looking for
              doesn't exist.
            </p>

            <Link
              href="/products"
              className={styles.backButton}
            >
              Back to Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const discount = Math.round(
    ((product.originalPrice - product.price) /
      product.originalPrice) *
      100
  );

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.back}
          onClick={() => router.back()}
        >
          ← Back
        </button>

        <div className={styles.product}>
          <div className={styles.imageSection}>
            <img
              src={product.image}
              alt={product.name}
              className={styles.image}
            />
          </div>

          <div className={styles.details}>
            <p className={styles.brand}>
              {product.brand}
            </p>

            <h1>{product.name}</h1>

            <div className={styles.rating}>
              ★ {product.rating}{" "}
              <span>
                ({product.reviews} reviews)
              </span>
            </div>

            <div className={styles.priceRow}>
              <strong>
                ₹{product.price.toLocaleString("en-IN")} 
              </strong>

              <span>
                 ₹
                {product.originalPrice.toLocaleString(
                  "en-IN"
                )}
              </span>

              <em> {discount} % OFF</em>
            </div>

            <p className={styles.description}>
              {product.description}
            </p>

            <ProductActions
              id={product.id}
              name={product.name}
              brand={product.brand}
              price={product.price}
              image={product.image}
              sizes={product.sizes}
              colors={product.colors}
            />

        

            <div className={styles.info}>
              <div>
                <strong>Category : </strong>
                <span>{product.category}</span>
              </div>

              <div>
                <strong>Available Stock : </strong>
                <span>{product.stock} units</span>
              </div>

              <div>
                <strong>Color : </strong>
                <span>{product.color}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}