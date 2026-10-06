"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import styles from "./Cart.module.css";

export default function CartPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(
    null
  );

  const items = useCartStore((state) => state.items);

  const setItems = useCartStore(
    (state) => state.setItems
  );

  const increaseQuantity = useCartStore(
    (state) => state.increaseQuantity
  );

  const decreaseQuantity = useCartStore(
    (state) => state.decreaseQuantity
  );

  const removeFromCart = useCartStore(
    (state) => state.removeFromCart
  );

  const clearCart = useCartStore(
    (state) => state.clearCart
  );

  useEffect(() => {
    const loadCart = async () => {
      try {
        const response = await fetch("/api/cart");

        if (!response.ok) {
          if (response.status === 401) {
            setItems([]);
            return;
          }

          throw new Error("Failed to load cart");
        }

        const data = await response.json();

        console.log("CART FROM DATABASE:", data.items);

        const cartItems = (data.items ?? []).map(
          (item: any) => ({
            id: item.product.id,
            name: item.product.name,
            brand: item.product.brand,
            price: item.product.price,
            image: item.product.image,
            quantity: item.quantity,
            size: item.size ?? undefined,
            color: item.color ?? undefined,
          })
        );

        setItems(cartItems);
      } catch (error) {
        console.error(
          "Failed to load cart:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [setItems]);

  const getItemKey = (
    id: string,
    size?: string,
    color?: string
  ) => {
    return `${id}-${size ?? ""}-${color ?? ""}`;
  };

  const handleIncrease = async (
    id: string,
    size?: string,
    color?: string
  ) => {
    const item = items.find(
      (item) =>
        item.id === id &&
        item.size === size &&
        item.color === color
    );

    if (!item) return;

    const key = getItemKey(id, size, color);

    setUpdating(key);

    try {
      const newQuantity = item.quantity + 1;

      const response = await fetch(
        "/api/cart/item",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: id,
            quantity: newQuantity,
            size: size ?? null,
            color: color ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update quantity"
        );
      }

      increaseQuantity(id, size, color);
    } catch (error) {
      console.error(
        "Failed to increase quantity:",
        error
      );
    } finally {
      setUpdating(null);
    }
  };

  const handleDecrease = async (
    id: string,
    size?: string,
    color?: string
  ) => {
    const item = items.find(
      (item) =>
        item.id === id &&
        item.size === size &&
        item.color === color
    );

    if (!item) return;

    const key = getItemKey(id, size, color);

    setUpdating(key);

    try {
      const newQuantity = item.quantity - 1;

      const response = await fetch(
        "/api/cart/item",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: id,
            quantity: newQuantity,
            size: size ?? null,
            color: color ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update quantity"
        );
      }

      decreaseQuantity(id, size, color);
    } catch (error) {
      console.error(
        "Failed to decrease quantity:",
        error
      );
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (
    id: string,
    size?: string,
    color?: string
  ) => {
    const key = getItemKey(id, size, color);

    setUpdating(key);

    try {
      const response = await fetch(
        "/api/cart/item",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: id,
            size: size ?? null,
            color: color ?? null,
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

      removeFromCart(id, size, color);
    } catch (error) {
      console.error(
        "Failed to remove item:",
        error
      );
    } finally {
      setUpdating(null);
    }
  };

  const handleClearCart = async () => {
    if (items.length === 0) return;

    setUpdating("clear");

    try {
      for (const item of items) {
        await fetch("/api/cart/item", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: item.id,
            size: item.size ?? null,
            color: item.color ?? null,
          }),
        });
      }

      clearCart();
    } catch (error) {
      console.error(
        "Failed to clear cart:",
        error
      );
    } finally {
      setUpdating(null);
    }
  };

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const deliveryFee =
    subtotal > 1999 || subtotal === 0
      ? 0
      : 99;

  const total = subtotal + deliveryFee;

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            🛍
          </div>

          <h1>Loading your bag...</h1>

          <p>
            We're getting your saved items.
          </p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            🛍
          </div>

          <h1>Your bag is empty</h1>

          <p>
            Discover something you love and add it
            to your bag.
          </p>

          <Link
            href="/products"
            className={styles.shopButton}
          >
            Continue Shopping
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
              VASTRAAI
            </p>

            <h1>Shopping Bag</h1>

            <p>
              {totalItems}{" "}
              {totalItems === 1
                ? "item"
                : "items"}
            </p>
          </div>

          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClearCart}
            disabled={updating === "clear"}
          >
            {updating === "clear"
              ? "Clearing..."
              : "Clear Bag"}
          </button>
        </div>

        <div className={styles.layout}>
          <section className={styles.items}>
            {items.map((item) => {
              const itemKey = getItemKey(
                item.id,
                item.size,
                item.color
              );

              const isUpdating =
                updating === itemKey;

              return (
                <article
                  key={itemKey}
                  className={styles.item}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.image}
                  />

                  <div className={styles.itemInfo}>
                    <p className={styles.brand}>
                      {item.brand}
                    </p>

                    <h2>{item.name}</h2>

                    <p className={styles.variant}>
                      Size: {item.size}
                    </p>

                    <p className={styles.variant}>
                      Color: {item.color}
                    </p>

                    <p className={styles.price}>
                      ₹{item.price}
                    </p>

                    <div
                      className={styles.controls}
                    >
                      <div
                        className={
                          styles.quantity
                        }
                      >
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleDecrease(
                              item.id,
                              item.size,
                              item.color
                            )
                          }
                        >
                          <Minus size={15} />
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleIncrease(
                              item.id,
                              item.size,
                              item.color
                            )
                          }
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className={styles.remove}
                        disabled={isUpdating}
                        onClick={() =>
                          handleRemove(
                            item.id,
                            item.size,
                            item.color
                          )
                        }
                      >
                        <Trash2 size={16} />
                        {isUpdating
                          ? "Updating..."
                          : "Remove"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className={styles.summary}>
            <h2>Order Summary</h2>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Delivery</span>
              <span>
                {deliveryFee === 0
                  ? "FREE"
                  : `₹${deliveryFee}`}
              </span>
            </div>

            <div className={styles.divider} />

            <div
              className={`${styles.summaryRow} ${styles.total}`}
            >
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            {subtotal < 1999 && (
              <p
                className={
                  styles.deliveryMessage
                }
              >
                Add ₹{1999 - subtotal} more for
                free delivery.
              </p>
            )}

            <Link
              href="/checkout"
              className={styles.checkoutButton}
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/products"
              className={styles.continue}
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}