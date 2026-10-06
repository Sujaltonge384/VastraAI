"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Package,
  ShoppingBag,
} from "lucide-react";

import { useSession } from "../../lib/auth-client";
import { useOrderStore } from "../../store/orderStore";

import styles from "./Orders.module.css";

export default function OrdersPage() {
  const {
    data: session,
    isPending: sessionLoading,
  } = useSession();

  const orders = useOrderStore(
    (state) => state.orders
  );

  const setOrders = useOrderStore(
    (state) => state.setOrders
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const user = session?.user;
  const isAuthenticated =
    !!session?.user;

  useEffect(() => {
    if (sessionLoading) return;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        setError("");

        const response = await fetch(
          "/api/orders"
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load orders"
          );
        }

        const formattedOrders =
          data.map((order: any) => ({
            id: order.id,

            items: order.items.map(
              (item: any) => ({
                id: item.id,
                name: item.name,
                brand: item.brand,
                price: item.price,
                image: item.image,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
              })
            ),

            subtotal: order.subtotal,

            deliveryFee:
              order.deliveryFee,

            total: order.total,

            status:
              order.status === "PLACED"
                ? "Placed"
                : order.status ===
                    "PROCESSING"
                  ? "Processing"
                  : order.status ===
                      "SHIPPED"
                    ? "Shipped"
                    : order.status ===
                        "DELIVERED"
                      ? "Delivered"
                      : "Cancelled",

            paymentStatus:
              order.paymentStatus ===
              "PAID"
                ? "Paid"
                : order.paymentStatus ===
                    "FAILED"
                  ? "Failed"
                  : order.paymentStatus ===
                      "REFUNDED"
                    ? "Refunded"
                    : "Pending",

            paymentMethod:
              order.paymentMethod ===
              "COD"
                ? "Cash on Delivery"
                : "Online Payment",

            createdAt:
              order.createdAt,
          }));

        setOrders(formattedOrders);
      } catch (error) {
        console.error(
          "Failed to load orders:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load orders"
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [
    sessionLoading,
    isAuthenticated,
    setOrders,
  ]);

  if (sessionLoading || loading) {
    return (
      <main className={styles.emptyPage}>
        <Package size={48} />

        <h1>Loading orders...</h1>

        <p>
          Please wait while we load your
          orders.
        </p>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className={styles.emptyPage}>
        <Package size={48} />

        <h1>
          Sign in to view your orders
        </h1>

        <p>
          Your orders will appear here
          after you sign in.
        </p>

        <Link
          href="/login"
          className={
            styles.primaryButton
          }
        >
          Sign In
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.emptyPage}>
        <Package size={48} />

        <h1>
          Unable to load orders
        </h1>

        <p>{error}</p>

        <Link
          href="/products"
          className={
            styles.primaryButton
          }
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className={styles.emptyPage}>
        <ShoppingBag size={48} />

        <h1>No orders yet</h1>

        <p>
          You haven't placed any orders
          yet.
        </p>

        <Link
          href="/products"
          className={
            styles.primaryButton
          }
        >
          Start Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <div>
            <p
              className={
                styles.eyebrow
              }
            >
              Your Account
            </p>

            <h1>My Orders</h1>

            <p>
              Track and manage your
              VastraAI orders.
            </p>
          </div>

          <span
            className={
              styles.orderCount
            }
          >
            {orders.length}{" "}
            {orders.length === 1
              ? "Order"
              : "Orders"}
          </span>
        </div>

        <div className={styles.orders}>
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className={
                styles.orderLink
              }
            >
              <article
                className={
                  styles.orderCard
                }
              >
                <div
                  className={
                    styles.orderHeader
                  }
                >
                  <div>
                    <p
                      className={
                        styles.orderId
                      }
                    >
                      Order #{order.id}
                    </p>

                    <p
                      className={
                        styles.date
                      }
                    >
                      {new Date(
                        order.createdAt
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>

                  <div
                    className={`${
                      styles.status
                    } ${
                      order.status ===
                      "Delivered"
                        ? styles.delivered
                        : ""
                    }`}
                  >
                    {order.status}
                  </div>
                </div>

                <div
                  className={
                    styles.items
                  }
                >
                  {order.items.map(
                    (item) => (
                      <div
                        key={`${order.id}-${item.id}-${item.size}-${item.color}`}
                        className={
                          styles.item
                        }
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                        />

                        <div
                          className={
                            styles.itemInfo
                          }
                        >
                          <p
                            className={
                              styles.brand
                            }
                          >
                            {item.brand}
                          </p>

                          <h2>
                            {item.name}
                          </h2>

                          {item.size && (
                            <span>
                              Size:{" "}
                              {item.size}
                            </span>
                          )}

                          {item.color && (
                            <span>
                              Color:{" "}
                              {item.color}
                            </span>
                          )}

                          <span>
                            Quantity:{" "}
                            {item.quantity}
                          </span>
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
                    )
                  )}
                </div>

                <div
                  className={
                    styles.orderFooter
                  }
                >
                  <div>
                    <span>
                      Payment:{" "}
                      {
                        order.paymentStatus
                      }
                    </span>

                    <span>
                      {
                        order.paymentMethod
                      }
                    </span>
                  </div>

                  <div
                    className={
                      styles.total
                    }
                  >
                    Total: ₹
                    {order.total.toLocaleString(
                      "en-IN"
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}