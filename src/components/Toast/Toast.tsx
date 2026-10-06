"use client";

import { CheckCircle, X } from "lucide-react";
import { useToastStore } from "../../store/toastStore";
import styles from "./Toast.module.css";

export default function Toast() {
  const message = useToastStore((state) => state.message);
  const visible = useToastStore((state) => state.visible);
  const hideToast = useToastStore((state) => state.hideToast);

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.toast}>
      <CheckCircle size={20} className={styles.icon} />

      <span>{message}</span>

      <button
        type="button"
        onClick={hideToast}
        className={styles.close}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}