"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useWishlistStore } from "../../store/wishlistStore";
import styles from "./Wishlist.module.css";

export default function WishlistPage() {
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(
    null
  );
  const [clearing, setClearing] = useState(false);

  const items = useWishlistStore(
    (state) => state.items
  );

  const setItems = useWishlistStore(
    (state) => state.setItems
  );

  const removeFromWishlist = useWishlistStore(
    (state) => state.removeFromWishlist
  );

  const clearWishlist = useWishlistStore(
    (state) => state.clearWishlist
  );

  // Load wishlist from PostgreSQL
  useEffect(() => {
    let cancelled = false;

    const loadWishlist = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/wishlist",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          if (!cancelled) {
            setItems([]);
          }
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load wishlist"
          );
        }

        const wishlistItems = (
          data.items ?? []
        ).map((item: any) => ({
          id: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          price: item.product.price,
          image: item.product.image,
        }));

        if (!cancelled) {
          setItems(wishlistItems);
        }
      } catch (error) {
        console.error(
          "Failed to load wishlist:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadWishlist();

    return () => {
      cancelled = true;
    };
  }, [setItems]);

  // Remove one item
  const handleRemove = async (id: string) => {
    setRemoving(id);

    try {
      const response = await fetch(
        "/api/wishlist",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to remove item"
        );
      }

      removeFromWishlist(id);
    } catch (error) {
      console.error(
        "Failed to remove wishlist item:",
        error
      );
    } finally {
      setRemoving(null);
    }
  };

  // Clear wishlist
  const handleClearWishlist = async () => {
    if (items.length === 0) {
      return;
    }

    setClearing(true);

    try {
      const response = await fetch(
        "/api/wishlist",
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to clear wishlist"
        );
      }

      clearWishlist();
    } catch (error) {
      console.error(
        "Failed to clear wishlist:",
        error
      );
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <Heart
            size={45}
            strokeWidth={1.3}
          />

          <h1>Loading Wishlist...</h1>

          <p>
            We're getting your saved products.
          </p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <Heart
            size={45}
            strokeWidth={1.3}
          />

          <h1>Your Wishlist is Empty</h1>

          <p>
            Save products you love and find them
            here whenever you're ready.
          </p>

          <Link
            href="/products"
            className={styles.shopButton}
          >
            Explore Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              SAVED FOR LATER
            </p>

            <h1>My Wishlist</h1>

            <p className={styles.count}>
              {items.length}{" "}
              {items.length === 1
                ? "product"
                : "products"}
            </p>
          </div>

          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClearWishlist}
            disabled={clearing}
          >
            {clearing
              ? "Clearing..."
              : "Clear Wishlist"}
          </button>
        </div>

        <div className={styles.grid}>
          {items.map((item) => (
            <article
              key={item.id}
              className={styles.card}
            >
              <Link
                href={`/products/${item.id}`}
                className={styles.imageLink}
              >
                <div
                  className={
                    styles.imageContainer
                  }
                >
                  <img
                    src={item.image}
                    alt={item.name}
                  />
                </div>
              </Link>

              <div className={styles.details}>
                <p className={styles.brand}>
                  {item.brand}
                </p>

                <h2>{item.name}</h2>

                <p className={styles.price}>
                  ₹{item.price}
                </p>

                <div className={styles.actions}>
                  <Link
                    href={`/products/${item.id}`}
                    className={styles.viewButton}
                  >
                    View Product
                  </Link>

                  <button
                    type="button"
                    className={
                      styles.removeButton
                    }
                    disabled={
                      removing === item.id
                    }
                    onClick={() =>
                      handleRemove(item.id)
                    }
                    aria-label={`Remove ${item.name} from wishlist`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}