"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle,
  Package,
} from "lucide-react";

import { useSession } from "../../../lib/auth-client";

import styles from "./OrderDetails.module.css";

type OrderItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
};

type Order = {
  id: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status:
    | "PLACED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  paymentStatus:
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "REFUNDED";
  paymentMethod:
    | "COD"
    | "ONLINE";
  createdAt: string;
};

export default function OrderDetailsPage() {
  const params = useParams();

  const orderId = String(params.id);

  const {
    data: session,
    isPending: sessionLoading,
  } = useSession();

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (sessionLoading) return;

    if (!session?.user) {
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        setError("");

        const response = await fetch(
          `/api/orders/${orderId}`
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load order"
          );
        }

        setOrder(data);
      } catch (error) {
        console.error(
          "Failed to load order:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load order"
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [
    orderId,
    session,
    sessionLoading,
  ]);

  if (
    sessionLoading ||
    loading
  ) {
    return (
      <main className={styles.emptyPage}>
        <Package size={48} />

        <h1>
          Loading order...
        </h1>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className={styles.emptyPage}>
        <Package size={48} />

        <h1>
          Sign in to view this order
        </h1>

        <p>
          Please sign in to access your
          order details.
        </p>

        <Link
          href="/login"
          className={styles.button}
        >
          Sign In
        </Link>
      </main>
    );
  }

  if (!order || error) {
    return (
      <main className={styles.emptyPage}>
        <Package size={48} />

        <h1>Order not found</h1>

        <p>
          {error ||
            "We couldn't find this order."}
        </p>

        <Link
          href="/orders"
          className={styles.button}
        >
          Back to Orders
        </Link>
      </main>
    );
  }

  const paymentMethod =
    order.paymentMethod === "COD"
      ? "Cash on Delivery"
      : "Online Payment";

  const paymentStatus =
    order.paymentStatus === "PAID"
      ? "Paid"
      : order.paymentStatus ===
          "FAILED"
        ? "Failed"
        : order.paymentStatus ===
            "REFUNDED"
          ? "Refunded"
          : "Pending";

  const orderStatus =
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
            : "Cancelled";

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link
          href="/orders"
          className={styles.back}
        >
          ← Back to Orders
        </Link>

        <div className={styles.header}>
          <div>
            <p
              className={
                styles.eyebrow
              }
            >
              Order Details
            </p>

            <h1>#{order.id}</h1>

            <p
              className={styles.date}
            >
              Placed on{" "}
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
            className={styles.status}
          >
            <CheckCircle size={18} />

            {orderStatus}
          </div>
        </div>

        <section
          className={styles.section}
        >
          <h2>Items Ordered</h2>

          <div className={styles.items}>
            {order.items.map(
              (item) => (
                <div
                  key={`${item.id}-${item.size}-${item.color}`}
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
                    <p>
                      {item.brand}
                    </p>

                    <h3>
                      {item.name}
                    </h3>

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
        </section>

        <div
          className={
            styles.bottomGrid
          }
        >
          <section
            className={styles.section}
          >
            <h2>
              Payment Information
            </h2>

            <div
              className={
                styles.infoRow
              }
            >
              <span>Method</span>

              <strong>
                {paymentMethod}
              </strong>
            </div>

            <div
              className={
                styles.infoRow
              }
            >
              <span>Status</span>

              <strong>
                {paymentStatus}
              </strong>
            </div>
          </section>

          <section
            className={styles.section}
          >
            <h2>
              Order Summary
            </h2>

            <div
              className={
                styles.infoRow
              }
            >
              <span>Subtotal</span>

              <strong>
                ₹
                {order.subtotal.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div
              className={
                styles.infoRow
              }
            >
              <span>Delivery</span>

              <strong>
                {order.deliveryFee ===
                0
                  ? "FREE"
                  : `₹${order.deliveryFee}`}
              </strong>
            </div>

            <div
              className={`${styles.infoRow} ${styles.total}`}
            >
              <span>Total</span>

              <strong>
                ₹
                {order.total.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}