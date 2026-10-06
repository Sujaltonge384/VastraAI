"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  ScanSearch,
} from "lucide-react";

import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useSession } from "../../lib/auth-client";

import styles from "./Navbar.module.css";

export default function Navbar() {
  const items = useCartStore(
    (state) => state.items
  );

  const setWishlistItems = useWishlistStore(
    (state) => state.setItems
  );

  const wishlistItems = useWishlistStore(
    (state) => state.items
  );

  const cartCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const wishlistCount = wishlistItems.length;

  const { data: session, isPending } = useSession();

  const user = session?.user;
  const isAuthenticated = !!user;

  // Load wishlist from PostgreSQL
  // whenever the authenticated user changes.
  useEffect(() => {
    if (isPending) return;

    const loadWishlist = async () => {
      // Not logged in → clear client state
      if (!user) {
        setWishlistItems([]);
        return;
      }

      try {
        const response = await fetch(
          "/api/wishlist",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            setWishlistItems([]);
          }

          return;
        }

        const data = await response.json();

        const wishlistItems = (
          data.items ?? []
        ).map((item: any) => ({
          id: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          price: item.product.price,
          image: item.product.image,
        }));

        setWishlistItems(wishlistItems);
      } catch (error) {
        console.error(
          "Failed to load navbar wishlist:",
          error
        );
      }
    };

    loadWishlist();
  }, [
    user?.id,
    isPending,
    setWishlistItems,
  ]);

  const firstLetter =
    user?.name
      ?.trim()
      .charAt(0)
      .toUpperCase() || "U";

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        {/* LOGO */}
        <Link
          href="/"
          className={styles.logo}
        >
          VASTRA<span>AI</span>
        </Link>

        {/* MAIN NAVIGATION */}
        <nav className={styles.navLinks}>
          <Link href="/products?category=men">
            Men
          </Link>

          <Link href="/products?category=women">
            Women
          </Link>

          <Link href="/products?category=kids">
            Kids
          </Link>

          <Link href="/products?category=footwear">
            Footwear
          </Link>

          <Link href="/products?category=accessories">
            Accessories
          </Link>
        </nav>

        {/* ACTIONS */}
        <div className={styles.actions}>
          {/* NORMAL SEARCH */}
          <Link
            href="/search"
            className={styles.iconButton}
            aria-label="Search products"
            title="Search"
          >
            <Search size={20} />
          </Link>

          {/* AI VISUAL SEARCH */}
          <Link
            href="/visual-search"
            className={styles.iconButton}
            aria-label="AI Visual Search"
            title="Search by Image"
          >
            <ScanSearch size={20} />
          </Link>

          {/* WISHLIST */}
          <Link
            href="/wishlist"
            className={styles.navCountButton}
            aria-label={`Wishlist with ${wishlistCount} items`}
            title="Wishlist"
          >
            <Heart
              size={20}
              fill={
                wishlistCount > 0
                  ? "currentColor"
                  : "none"
              }
            />

            {wishlistCount > 0 && (
              <span className={styles.navCount}>
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* SHOPPING BAG */}
          <Link
            href="/cart"
            className={styles.cartButton}
            aria-label={`Shopping bag with ${cartCount} items`}
            title="Shopping Bag"
          >
            <ShoppingBag size={20} />

            {cartCount > 0 && (
              <span className={styles.cartCount}>
                {cartCount}
              </span>
            )}
          </Link>

          {/* ACCOUNT */}
          {isAuthenticated && user ? (
            <Link
              href="/account"
              className={styles.profileButton}
              aria-label={`Account for ${user.name}`}
              title={user.name}
            >
              {firstLetter}
            </Link>
          ) : (
            <Link
              href="/login"
              className={styles.iconButton}
              aria-label="Account"
              title="Login"
            >
              <User size={20} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}