"use client";

import { useEffect, useState } from "react";
import ProductCard from "../ProductCard/ProductCard";
import styles from "./FeaturedProducts.module.css";

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(
          "/api/products"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch products"
          );
        }

        const data = await response.json();

          setProducts((data.products || []).slice(0, 4));      } catch (error) {
        console.error(
          "Failed to load featured products:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            CURATED FOR YOU
          </p>

          <h2>Featured Pieces</h2>
        </div>

        <button className={styles.viewAll}>
          View All →
        </button>
      </div>

      {loading ? (
        <p>Loading featured products...</p>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard
              id={product.id}
              key={product.id}
              name={product.name}
              brand={product.brand}
              price={product.price}
              originalPrice={
                product.originalPrice
              }
              image={product.image}
              rating={product.rating}
            />
          ))}
        </div>
      )}
    </section>
  );
}