"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AISearchBar() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    try {
      setLoading(true);

      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI search failed");
      }

      const filters = data.filters || {};

      const params = new URLSearchParams();

      if (filters.search) {
        params.set("search", filters.search);
      }

      if (filters.category) {
        params.set("category", filters.category);
      }

      if (filters.maxPrice) {
        params.set("maxPrice", String(filters.maxPrice));
      }

      if (filters.size) {
        params.set("size", filters.size);
      }

      if (filters.sort) {
        params.set("sort", filters.sort);
      }

      router.push(`/products?${params.toString()}`);
    } catch (error) {
      console.error("AI search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Try "black shirts under ₹1500"...'
        disabled={loading}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}