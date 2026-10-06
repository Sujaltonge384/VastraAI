"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";

import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useToastStore } from "../../store/toastStore";

import styles from "./ProductCard.module.css";

type ProductCardProps = {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
};

export default function ProductCard({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  rating,
}: ProductCardProps) {
  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const showToast = useToastStore(
    (state) => state.showToast
  );

  const toggleWishlist = useWishlistStore(
    (state) => state.toggleWishlist
  );

  const isInWishlist = useWishlistStore(
    (state) => state.isInWishlist(id)
  );

  const handleAddToCart = async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: id,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to add item to cart"
        );
      }

      // Keep Zustand in sync
      addToCart({
        id,
        name,
        brand,
        price,
        image,
      });

      showToast(`${name} added to your bag`);
    } catch (error) {
      console.error("Add to cart failed:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to add item to cart"
      );
    }
  };

  const handleWishlist = async () => {
    try {
      // REMOVE FROM WISHLIST
      if (isInWishlist) {
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
              "Unable to remove from wishlist"
          );
        }

        toggleWishlist({
          id,
          name,
          brand,
          price,
          image,
        });

        showToast(
          `${name} removed from wishlist`
        );

        return;
      }

      // ADD TO WISHLIST
      const response = await fetch(
        "/api/wishlist",
        {
          method: "POST",
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
            "Unable to add to wishlist"
        );
      }

      toggleWishlist({
        id,
        name,
        brand,
        price,
        image,
      });

      showToast(
        `${name} added to wishlist`
      );
    } catch (error) {
      console.error(
        "Wishlist update failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to update wishlist"
      );
    }
  };

  const discount =
    originalPrice && originalPrice > price
      ? Math.round(
          ((originalPrice - price) /
            originalPrice) *
            100
        )
      : null;

  return (
    <article className={styles.card}>
      <div className={styles.imageContainer}>
        <Link
          href={`/products/${id}`}
          className={styles.imageLink}
        >
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* Wishlist */}
        <button
          type="button"
          className={`${styles.wishlist} ${
            isInWishlist
              ? styles.wishlisted
              : ""
          }`}
          aria-label={
            isInWishlist
              ? `Remove ${name} from wishlist`
              : `Add ${name} to wishlist`
          }
          onClick={handleWishlist}
        >
          <Heart
            size={19}
            fill={
              isInWishlist
                ? "currentColor"
                : "none"
            }
          />
        </button>

        {/* Add to Bag */}
        <button
          type="button"
          className={styles.quickAdd}
          onClick={handleAddToCart}
        >
          <ShoppingBag size={17} />
          Add to Bag
        </button>
      </div>

      <div className={styles.details}>
        <p className={styles.brand}>
          {brand}
        </p>

        <h3 className={styles.name}>
          {name}
        </h3>

        {rating !== undefined && (
          <div className={styles.rating}>
            ★ {rating}
          </div>
        )}

        <div className={styles.priceRow}>
          <span className={styles.price}>
            ₹{price}
          </span>

          {originalPrice &&
            originalPrice > price && (
              <span
                className={
                  styles.originalPrice
                }
              >
                ₹{originalPrice}
              </span>
            )}

          {discount !== null && (
            <span
              className={styles.discount}
            >
              {discount}% OFF
            </span>
          )}
        </div>
      </div>
    </article>
  );
}