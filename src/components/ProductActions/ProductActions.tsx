"use client";

import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useToastStore } from "../../store/toastStore";
import styles from "./ProductActions.module.css";

type ProductActionsProps = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  sizes: string[];
  colors: string[];
};

export default function ProductActions({
  id,
  name,
  brand,
  price,
  image,
  sizes,
  colors,
}: ProductActionsProps) {
  const showToast = useToastStore(
    (state) => state.showToast
  );

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const toggleWishlist = useWishlistStore(
    (state) => state.toggleWishlist
  );

  const isInWishlist = useWishlistStore(
    (state) => state.isInWishlist(id)
  );

  const [selectedSize, setSelectedSize] = useState(
    sizes[0]
  );

  const [selectedColor, setSelectedColor] = useState(
    colors[0]
  );

  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (isAdding) return;

    setIsAdding(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: id,
          quantity: 1,
          size: selectedSize,
          color: selectedColor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to add item to cart"
        );
      }

      // Keep the existing Zustand store in sync
      addToCart({
        id,
        name,
        brand,
        price,
        image,
        size: selectedSize,
        color: selectedColor,
      });

      showToast(`${name} added to your bag`);
    } catch (error) {
      console.error("Add to cart failed:", error);

      if (
        error instanceof Error &&
        error.message === "Unauthorized"
      ) {
        showToast("Please sign in to add items to your bag");
      } else {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to add item to cart"
        );
      }
    } finally {
      setIsAdding(false);
    }
  };

const handleWishlist = async () => {
  try {
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

  return (
    <div className={styles.container}>
      {/* Size */}
      <div className={styles.option}>
        <div className={styles.optionHeader}>
          <h3>Select Size</h3>

          <button type="button">
            Size Guide
          </button>
        </div>

        <div className={styles.sizes}>
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={
                selectedSize === size
                  ? styles.selected
                  : ""
              }
              onClick={() =>
                setSelectedSize(size)
              }
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className={styles.option}>
        <h3>Color</h3>

        <div className={styles.colors}>
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className={
                selectedColor === color
                  ? styles.selected
                  : ""
              }
              onClick={() =>
                setSelectedColor(color)
              }
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.addToBag}
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          <ShoppingBag size={19} />

          {isAdding
            ? "Adding..."
            : "Add to Bag"}
        </button>

        <button
          type="button"
          className={`${styles.wishlist} ${
            isInWishlist
              ? styles.wishlisted
              : ""
          }`}
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

          {isInWishlist
            ? "Wishlisted"
            : "Wishlist"}
        </button>
      </div>
    </div>
  );
}