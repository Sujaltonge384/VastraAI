"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import styles from "./Addresses.module.css";

type Address = {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await fetch(
          "/api/addresses",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load addresses"
          );
        }

        const data = await response.json();

        setAddresses(data);
      } catch (error) {
        console.error(
          "Failed to load addresses:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddAddress = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/addresses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to save address"
        );
      }

      setAddresses((prev) => [
        data,
        ...prev,
      ]);

      setForm(emptyForm);
      setShowForm(false);
    } catch (error) {
      console.error(
        "Failed to save address:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);

    try {
      const response = await fetch(
        `/api/addresses?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete address"
        );
      }

      setAddresses((prev) =>
        prev.filter(
          (address) => address.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete address:",
        error
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link
          href="/account"
          className={styles.back}
        >
          <ArrowLeft size={18} />
          Back to Account
        </Link>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              ACCOUNT
            </p>

            <h1>My Addresses</h1>

            <p>
              Manage your delivery addresses.
            </p>
          </div>

          <button
            type="button"
            className={styles.addButton}
            onClick={() =>
              setShowForm(!showForm)
            }
          >
            <Plus size={18} />
            Add Address
          </button>
        </div>

        {showForm && (
          <form
            className={styles.form}
            onSubmit={handleAddAddress}
          >
            <h2>Add New Address</h2>

            <div className={styles.grid}>
              <input
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
              />

              <input
                name="phone"
                placeholder="Phone number"
                value={form.phone}
                onChange={handleChange}
              />

              <textarea
                name="address"
                placeholder="House no., street, area"
                value={form.address}
                onChange={handleChange}
              />

              <input
                name="city"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
              />

              <input
                name="state"
                placeholder="State"
                value={form.state}
                onChange={handleChange}
              />

              <input
                name="pincode"
                placeholder="Pincode"
                value={form.pincode}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() =>
                  setShowForm(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className={styles.saveButton}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Address"}
              </button>
            </div>
          </form>
        )}

        {loading && (
          <div className={styles.empty}>
            <h2>Loading addresses...</h2>
          </div>
        )}

        {!loading &&
          addresses.length === 0 &&
          !showForm && (
            <div className={styles.empty}>
              <MapPin size={42} />

              <h2>No addresses saved</h2>

              <p>
                Add an address to make checkout
                faster.
              </p>

              <button
                type="button"
                className={styles.emptyButton}
                onClick={() =>
                  setShowForm(true)
                }
              >
                <Plus size={17} />
                Add Your First Address
              </button>
            </div>
          )}

        {!loading &&
          addresses.length > 0 && (
            <div className={styles.addressList}>
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className={styles.addressCard}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.icon}>
                      <MapPin size={20} />
                    </div>

                    <button
                      type="button"
                      className={
                        styles.deleteButton
                      }
                      disabled={
                        deleting === address.id
                      }
                      onClick={() =>
                        handleDelete(
                          address.id
                        )
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <h2>{address.name}</h2>

                  <p>{address.phone}</p>

                  <p>{address.address}</p>

                  <p>
                    {address.city},{" "}
                    {address.state} -{" "}
                    {address.pincode}
                  </p>
                </article>
              ))}
            </div>
          )}
      </div>
    </main>
  );
}