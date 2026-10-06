"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "../../components/ProductCard/ProductCard";
import { RotateCcw } from "lucide-react";
import styles from "./Products.module.css";

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function ProductsPageContent() {
  const searchParams = useSearchParams();

  const urlCategory = searchParams.get("category");

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [category, setCategory] = useState(
    urlCategory || "all"
  );

  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedSize, setSelectedSize] =
    useState("all");

  const [page, setPage] = useState(1);

  useEffect(() => {
    setCategory(urlCategory || "all");
    setPage(1);
  }, [urlCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", "24");

       if (category !== "all") {
  params.set("category", category);
}

        if (maxPrice < 5000) {
          params.set(
            "maxPrice",
            String(maxPrice)
          );
        }

        if (selectedSize !== "all") {
          params.set("size", selectedSize);
        }

        params.set("sort", sort);

        const response = await fetch(
          `/api/products?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch products"
          );
        }

        const data = await response.json();

        setProducts(data.products || []);
        setPagination(data.pagination || null);
      } catch (error) {
        console.error(
          "Product fetch error:",
          error
        );

        setError(
          "Unable to load products. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    page,
    category,
    maxPrice,
    selectedSize,
    sort,
  ]);

  const clearFilters = () => {
    setCategory("all");
    setMaxPrice(5000);
    setSelectedSize("all");
    setSort("featured");
    setPage(1);
  };

  const changeCategory = (
    newCategory: string
  ) => {
    setCategory(newCategory);
    setPage(1);
  };

  const changePrice = (
    price: number
  ) => {
    setMaxPrice(price);
    setPage(1);
  };

  const changeSize = (
    size: string
  ) => {
    setSelectedSize(size);
    setPage(1);
  };

  const changeSort = (
    value: string
  ) => {
    setSort(value);
    setPage(1);
  };

  if (loading && products.length === 0) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.top}>
            <div>
              <p className={styles.eyebrow}>
                VASTRAAI COLLECTION
              </p>

              <h1>
                {category === "all"
                  ? "All Products"
                  : category.charAt(0).toUpperCase() +
                    category.slice(1)}
              </h1>

              <p className={styles.count}>
                Loading products...
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.noResults}>
            <h3>
              Something went wrong
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>

        {/* TOP */}
        <div className={styles.top}>
          <div>
            <p className={styles.eyebrow}>
              VASTRAAI COLLECTION
            </p>

            <h1>
              {category === "all"
                ? "All Products"
                : category.charAt(0).toUpperCase() +
                  category.slice(1)}
            </h1>

            <p className={styles.count}>
              {pagination
                ? `${pagination.total} products`
                : `${products.length} products`}
            </p>
          </div>

          <select
            className={styles.sort}
            value={sort}
            onChange={(e) =>
              changeSort(e.target.value)
            }
          >
            <option value="featured">
              Sort by
            </option>

            <option value="price-low">
              Price: Low to High
            </option>

            <option value="price-high">
              Price: High to Low
            </option>

            <option value="rating">
              Customer Rating
            </option>
          </select>
        </div>

        <div className={styles.content}>

          {/* FILTERS */}
          <aside className={styles.filters}>
            <h3>Filters</h3>

            {/* CATEGORY */}
            <div className={styles.filterGroup}>
              <h4>Category</h4>

              {[
                "men",
                "women",
                "kids",
                "footwear",
                "accessories",
              ].map((item) => (
                <label key={item}>
                  <input
                    type="checkbox"
                    checked={
                      category === item
                    }
                    onChange={() =>
                      changeCategory(
                        category === item
                          ? "all"
                          : item
                      )
                    }
                  />

                  {item.charAt(0).toUpperCase() +
                    item.slice(1)}
                </label>
              ))}
            </div>

            {/* PRICE */}
            <div className={styles.filterGroup}>
              <h4>Price</h4>

              <label>
                <input
                  type="radio"
                  name="price"
                  checked={
                    maxPrice === 999
                  }
                  onChange={() =>
                    changePrice(999)
                  }
                />
                Under ₹1,000
              </label>

              <label>
                <input
                  type="radio"
                  name="price"
                  checked={
                    maxPrice === 2000
                  }
                  onChange={() =>
                    changePrice(2000)
                  }
                />
                ₹1,000 - ₹2,000
              </label>

              <label>
                <input
                  type="radio"
                  name="price"
                  checked={
                    maxPrice === 3000
                  }
                  onChange={() =>
                    changePrice(3000)
                  }
                />
                ₹2,000 - ₹3,000
              </label>

              <label>
                <input
                  type="radio"
                  name="price"
                  checked={
                    maxPrice === 5000
                  }
                  onChange={() =>
                    changePrice(5000)
                  }
                />
                Above ₹3,000
              </label>
            </div>

            {/* SIZE */}
            <div className={styles.filterGroup}>
              <h4>Size</h4>

              {["S", "M", "L", "XL"].map(
                (size) => (
                  <label key={size}>
                    <input
                      type="checkbox"
                      checked={
                        selectedSize ===
                        size
                      }
                      onChange={() =>
                        changeSize(
                          selectedSize ===
                            size
                            ? "all"
                            : size
                        )
                      }
                    />

                    {size}
                  </label>
                )
              )}
            </div>

            <button
              type="button"
              className={
                styles.clearFilters
              }
              onClick={
                clearFilters
              }
            >
              <RotateCcw size={15} />
              Clear All Filters
            </button>
          </aside>

          {/* PRODUCTS */}
          <div className={styles.grid}>
            {products.length > 0 ? (
              products.map(
                (product) => (
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
                )
              )
            ) : (
              <div
                className={
                  styles.noResults
                }
              >
                <h3>
                  No products found
                </h3>

                <p>
                  Try changing your
                  filters.
                </p>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PAGINATION */}
        {pagination && pagination.totalPages > 1 && (
  <div className={styles.pagination}>
    <button
      type="button"
      className={styles.paginationButton}
      disabled={page === 1 || loading}
      onClick={() => setPage((current) => current - 1)}
    >
      Previous
    </button>

    <span className={styles.paginationInfo}>
      Page {page} of {pagination.totalPages}
    </span>

    <button
      type="button"
      className={styles.paginationButton}
      disabled={
        page === pagination.totalPages || loading
      }
      onClick={() => setPage((current) => current + 1)}
    >
      Next
    </button>
  </div>
)}
      </section>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.noResults}>
              <h2>Loading products...</h2>
              <p>VastraAI is preparing your collection.</p>
            </div>
          </div>
        </main>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}