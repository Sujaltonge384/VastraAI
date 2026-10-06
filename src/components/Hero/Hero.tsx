"use client";

import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>

      <div className={styles.overlay} />

      <div className={styles.content}>

        <p className={styles.eyebrow}>
          THE FUTURE OF FASHION SHOPPING
        </p>

        <h1>
          Fashion
          <br />
          <span>Understood.</span>
        </h1>

        <p className={styles.description}>
          Discover fashion through AI-powered search, voice shopping,
          and visual discovery.
        </p>

        <div className={styles.buttons}>

          <Link href="/products" className={styles.primaryButton}>
            Shop Collection
            <ArrowRight size={18} />
          </Link>

          <button
  type="button"
  className={styles.voiceButton}
  onClick={() => {
    window.dispatchEvent(
      new Event("vastrai:start-voice")
    );
  }}
>
  <Mic size={18} />
  Shop by Voice
</button>

        </div>

      </div>

    </section>
  );
}