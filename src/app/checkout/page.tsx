"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

import { useCartStore } from "../../store/cartStore";
import { useSession } from "../../lib/auth-client";

import styles from "./Checkout.module.css";

export default function CheckoutPage() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore(
    (state) => state.clearCart
  );

  const { data: session, isPending } = useSession();

  const user = session?.user;
  const isAuthenticated = !!session?.user;

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash on Delivery");

  const [error, setError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] =
    useState(false);

  const subtotal = items.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const deliveryFee =
    subtotal >= 1999 ? 0 : 99;

  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    if (items.length === 0) {
      setError(
        "Your shopping bag is empty."
      );
      return;
    }

    if (!address || !city || !pincode) {
      setError(
        "Please enter your complete delivery address."
      );
      return;
    }

    setIsPlacingOrder(true);

    try {
      const response = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            paymentMethod:
              paymentMethod ===
              "Cash on Delivery"
                ? "COD"
                : "ONLINE",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to place order"
        );
      }

      // The server has already cleared
      // the database cart.
      clearCart();

      // Save the returned order temporarily
      // for the current client session.
      // The Orders page will load the real
      // orders from the database.
      router.push("/orders");
      router.refresh();
    } catch (error) {
      console.error(
        "Failed to place order:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while placing your order."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isPending) {
    return (
      <main className={styles.emptyPage}>
        <ShoppingBag size={48} />

        <h1>Loading checkout...</h1>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className={styles.emptyPage}>
        <ShoppingBag size={48} />

        <h1>Sign in to checkout</h1>

        <p>
          Please sign in before placing
          your order.
        </p>

        <Link
          href="/login"
          className={styles.primaryButton}
        >
          Sign In
        </Link>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className={styles.emptyPage}>
        <ShoppingBag size={48} />

        <h1>Your bag is empty</h1>

        <p>
          Add some products before
          proceeding to checkout.
        </p>

        <Link
          href="/products"
          className={styles.primaryButton}
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <p>VastraAI</p>

          <h1>Checkout</h1>
        </div>

        <form
          onSubmit={handlePlaceOrder}
          className={styles.layout}
        >
          <div className={styles.left}>
            <section
              className={styles.section}
            >
              <div
                className={
                  styles.sectionTitle
                }
              >
                <MapPin size={20} />

                <h2>
                  Delivery Address
                </h2>
              </div>

              <div
                className={styles.formGrid}
              >
                <div
                  className={
                    styles.fullWidth
                  }
                >
                  <label htmlFor="address">
                    Address
                  </label>

                  <textarea
                    id="address"
                    value={address}
                    onChange={(event) =>
                      setAddress(
                        event.target.value
                      )
                    }
                    placeholder="House / Flat / Street"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="city">
                    City
                  </label>

                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(event) =>
                      setCity(
                        event.target.value
                      )
                    }
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="pincode">
                    Pincode
                  </label>

                  <input
                    id="pincode"
                    type="text"
                    inputMode="numeric"
                    value={pincode}
                    onChange={(event) =>
                      setPincode(
                        event.target.value
                      )
                    }
                    placeholder="Pincode"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </section>

            <section
              className={styles.section}
            >
              <div
                className={
                  styles.sectionTitle
                }
              >
                <CreditCard size={20} />

                <h2>
                  Payment Method
                </h2>
              </div>

              <label
                className={
                  styles.paymentOption
                }
              >
                <input
                  type="radio"
                  name="payment"
                  value="Cash on Delivery"
                  checked={
                    paymentMethod ===
                    "Cash on Delivery"
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                />

                <div>
                  <strong>
                    Cash on Delivery
                  </strong>

                  <span>
                    Pay when your order
                    arrives
                  </span>
                </div>
              </label>

              <label
                className={
                  styles.paymentOption
                }
              >
                <input
                  type="radio"
                  name="payment"
                  value="Online Payment"
                  checked={
                    paymentMethod ===
                    "Online Payment"
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                />

                <div>
                  <strong>
                    Online Payment
                  </strong>

                  <span>
                    Payment gateway will
                    be connected later
                  </span>
                </div>
              </label>
            </section>

            {error && (
              <p className={styles.error}>
                {error}
              </p>
            )}
          </div>

          <aside className={styles.summary}>
            <h2>Order Summary</h2>

            <div
              className={styles.products}
            >
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.size}-${item.color}`}
                  className={
                    styles.product
                  }
                >
                  <img
                    src={item.image}
                    alt={item.name}
                  />

                  <div>
                    <strong>
                      {item.name}
                    </strong>

                    <span>
                      Qty: {item.quantity}
                    </span>

                    {item.size && (
                      <span>
                        Size: {item.size}
                      </span>
                    )}
                  </div>

                  <strong>
                    ₹
                    {(
                      item.price *
                      item.quantity
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              ))}
            </div>

            <div
              className={styles.divider}
            />

            <div className={styles.row}>
              <span>Subtotal</span>

              <strong>
                ₹
                {subtotal.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div className={styles.row}>
              <span>Delivery</span>

              <strong>
                {deliveryFee === 0
                  ? "FREE"
                  : `₹${deliveryFee}`}
              </strong>
            </div>

            <div
              className={styles.divider}
            />

            <div
              className={styles.totalRow}
            >
              <span>Total</span>

              <strong>
                ₹
                {total.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <button
              type="submit"
              className={
                styles.placeOrder
              }
              disabled={isPlacingOrder}
            >
              {isPlacingOrder
                ? "Placing Order..."
                : "Place Order"}
            </button>
          </aside>
        </form>
      </div>
    </main>
  );
}