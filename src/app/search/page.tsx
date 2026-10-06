"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "../../components/ProductCard/ProductCard";
import styles from "./Search.module.css";

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
};
function SearchPageContent() {
  const searchParams = useSearchParams();

  const initialQuery =
    searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] =
    useState(initialQuery);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searchedQuery, setSearchedQuery] =
    useState(initialQuery);

  useEffect(() => {
    setSearchQuery(initialQuery);

    if (initialQuery.trim()) {
      performSearch(initialQuery);
    } else {
      loadAllProducts();
    }
  }, [initialQuery]);

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/products?limit=20"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load products"
        );
      }

      const data = await response.json();

      setProducts(data.products || []);
    } catch (error) {
      console.error(
        "Failed to load products:",
        error
      );

      setProducts([]);
      setError(
        "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (
    query: string
  ) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setSearchedQuery("");
      await loadAllProducts();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/ai/search",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            query: trimmedQuery,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "AI search failed"
        );
      }

      setProducts(data.products || []);
      setSearchedQuery(trimmedQuery);
    } catch (error) {
      console.error(
        "AI search failed:",
        error
      );

      setProducts([]);

      setError(
        "Unable to search products."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (
    event: FormEvent
  ) => {
    event.preventDefault();

    performSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchedQuery("");
    setError("");
    loadAllProducts();
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              VastraAI Search
            </p>

            <h1>Find Your Style</h1>

            <p>
              Search naturally using
              products, colors, prices,
              categories and sizes.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={styles.searchBox}
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder='Try "black shirt under ₹1500"'
            aria-label="Search products"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
            >
              ×
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Searching..."
              : "Search"}
          </button>
        </form>

        <div
          className={
            styles.resultsHeader
          }
        >
          <p>
            {loading
              ? "Searching..."
              : searchedQuery
              ? `${products.length} ${
                  products.length === 1
                    ? "product"
                    : "products"
                } found`
              : `${products.length} products`}
          </p>
        </div>

        {error ? (
          <div
            className={
              styles.noResults
            }
          >
            <h2>{error}</h2>

            <button
              type="button"
              onClick={() =>
                performSearch(
                  searchQuery
                )
              }
            >
              Try Again
            </button>
          </div>
        ) : products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
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
        ) : !loading ? (
          <div
            className={
              styles.noResults
            }
          >
            <h2>
              No products found
            </h2>

            <p>
              Try something like
              "men's black shirts under
              ₹1500".
            </p>

            <button
              type="button"
              onClick={handleClear}
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div
            className={
              styles.noResults
            }
          >
            <h2>Searching...</h2>

            <p>
              VastraAI is finding products
              for you.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.noResults}>
              <h2>Loading search...</h2>
              <p>VastraAI is preparing your results.</p>
            </div>
          </div>
        </main>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}