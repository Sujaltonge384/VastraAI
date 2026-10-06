"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Package,
  MapPin,
  LogOut,
  User,
  ShoppingBag,
} from "lucide-react";
import { signOut, useSession } from "../../lib/auth-client";
import { useWishlistStore } from "../../store/wishlistStore";
import styles from "./Account.module.css";

export default function AccountPage() {
  const router = useRouter();

  const { data: session, isPending } = useSession();

  const user = session?.user;
  const isAuthenticated = !!session?.user;

  const wishlistItems = useWishlistStore(
    (state) => state.items
  );

  if (isPending) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <main className={styles.loginRequired}>
        <User size={48} />

        <h1>Sign in to your account</h1>

        <p>
          Please sign in to view your account details.
        </p>

        <Link href="/login" className={styles.loginButton}>
          Sign In
        </Link>
      </main>
    );
  }

  const firstLetter =
    user.name.trim().charAt(0).toUpperCase();

  const handleLogout = async () => {
  await signOut();
  router.push("/");
  router.refresh();
};

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            {firstLetter}
          </div>

          <div>
            <p className={styles.welcome}>
              Welcome back
            </p>

            <h1>{user.name}</h1>

            <p className={styles.email}>
              {user.email}
            </p>
          </div>
        </div>

        <section className={styles.grid}>
          <Link
            href="/orders"
            className={styles.card}
          >
            <Package size={24} />

            <div>
              <h2>My Orders</h2>
              <p>Track and manage your orders</p>
            </div>
          </Link>

          <Link
            href="/wishlist"
            className={styles.card}
          >
            <Heart size={24} />

            <div>
              <h2>Wishlist</h2>
              <p>
                {wishlistItems.length} saved{" "}
                {wishlistItems.length === 1
                  ? "item"
                  : "items"}
              </p>
            </div>
          </Link>

          <Link
            href="/addresses"
            className={styles.card}
          >
            <MapPin size={24} />

            <div>
              <h2>My Addresses</h2>
              <p>Manage your delivery addresses</p>
            </div>
          </Link>

          <Link
            href="/cart"
            className={styles.card}
          >
            <ShoppingBag size={24} />

            <div>
              <h2>Shopping Bag</h2>
              <p>View items in your cart</p>
            </div>
          </Link>
        </section>

        <section className={styles.accountSection}>
          <h2>Account Information</h2>

          <div className={styles.infoRow}>
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
        </section>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </main>
  );
}