import Link from "next/link";
import styles from "./Categories.module.css";

const categories = [
  {
    name: "Men",
    description: "Explore men's fashion",
    image: "/Categories/men.png",
    link: "/products?category=men",
  },
  {
    name: "Women",
    description: "Discover women's fashion",
    image: "/Categories/women.png",
    link: "/products?category=women",
  },
  {
    name: "Kids",
    description: "Style for every age",
    image: "/Categories/kids.png",
    link: "/products?category=kids",
  },
  {
    name: "Footwear",
    description: "Step into your style",
    image: "/Categories/footwear.png",
    link: "/products?category=footwear",
  },
  {
    name: "Accessories",
    description: "Complete your look",
    image: "/Categories/accessories.png",
    link: "/products?category=accessories",
  },
];

export default function Categories() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>EXPLORE VASTRAAI</p>
          <h2>Shop by Category</h2>
        </div>

        <p className={styles.description}>
          Discover styles curated for every mood, moment, and occasion.
        </p>
      </div>

      <div className={styles.grid}>
        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.link}
            className={styles.card}
          >
            <img
              src={category.image}
              alt={category.name}
            />

            <div className={styles.overlay} />

            <div className={styles.content}>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <span>Explore →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}