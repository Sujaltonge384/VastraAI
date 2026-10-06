import Link from "next/link";
import {
  ArrowRight,
  ScanSearch,
  Sparkles,
  Shirt,
  Heart,
} from "lucide-react";

import styles from "./VisualSearchPromo.module.css";

export default function VisualSearchPromo() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* BACKGROUND DECOR */}
        <div className={styles.glowOne} />
        <div className={styles.glowTwo} />
        <div className={styles.glowThree} />

        {/* LEFT */}
        <div className={styles.content}>
          <div className={styles.aiBadge}>
            <span className={styles.badgeIcon}>
              <Sparkles size={15} />
            </span>

            <span>VASTRAAI AI</span>
          </div>

          <h2>
            See something
            <br />
            <span>you love?</span>
          </h2>

          <div className={styles.highlight}>
            Find it instantly.
          </div>

          <p className={styles.description}>
            Upload any fashion image and let VastraAI
            discover visually similar products from
            your collection.
          </p>

          {/* FEATURES */}
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <ScanSearch size={17} />
              </div>

              <div>
                <strong>AI Powered</strong>
                <span>Visual Search</span>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Shirt size={17} />
              </div>

              <div>
                <strong>Similar Styles</strong>
                <span>From your catalog</span>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Sparkles size={17} />
              </div>

              <div>
                <strong>Smart Results</strong>
                <span>Fast & accurate</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/visual-search"
            className={styles.button}
          >
            <span className={styles.buttonIcon}>
              <ScanSearch size={18} />
            </span>

            <span>Search by Image</span>

            <ArrowRight size={18} />
          </Link>
        </div>

        {/* RIGHT VISUAL */}
        <div className={styles.visual}>
          <div className={styles.visualOrb} />

          {/* MAIN IMAGE FRAME */}
          <div className={styles.mainFrame}>
            <div className={styles.fakeFashionImage}>
              <div className={styles.fashionGlow} />

              <div className={styles.fashionShapeOne} />
              <div className={styles.fashionShapeTwo} />
              <div className={styles.fashionShapeThree} />

              <div className={styles.scanCorners}>
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className={styles.scanCenter}>
                <ScanSearch size={28} />
              </div>

              <div className={styles.imageLabel}>
                <span>STYLE DETECTED</span>
                <strong>98% MATCH</strong>
              </div>
            </div>
          </div>

          {/* SIMILAR PRODUCTS CARD */}
          <div className={styles.productsCard}>
            <div className={styles.productsHeader}>
              <div>
                <small>AI MATCHES</small>
                <h3>Similar Products</h3>
              </div>

              <span>View all</span>
            </div>

            <div className={styles.productGrid}>
              <div className={`${styles.product} ${styles.productOne}`}>
                <div className={styles.productShape} />
                <Heart size={14} />
                <span>₹1,299</span>
              </div>

              <div className={`${styles.product} ${styles.productTwo}`}>
                <div className={styles.productShape} />
                <Heart size={14} />
                <span>₹1,499</span>
              </div>

              <div className={`${styles.product} ${styles.productThree}`}>
                <div className={styles.productShape} />
                <Heart size={14} />
                <span>₹1,199</span>
              </div>
            </div>
          </div>

          {/* FLOATING TAGS */}
          <div className={styles.floatingTag}>
            <span className={styles.statusDot} />
            AI Visual Search
          </div>

          <div className={styles.floatingStyle}>
            <Sparkles size={13} />
            Style Match
          </div>
        </div>
      </div>
    </section>
  );
}