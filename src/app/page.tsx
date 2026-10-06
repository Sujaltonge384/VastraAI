import Hero from "../components/Hero/Hero";
import Categories from "../components/Categories/Categories";
import VisualSearchPromo from "../components/VisualSearchPromo/VisualSearchPromo";
import FeaturedProducts from "../components/FeaturedProducts/FeaturedProducts";

export default function Home() {
  return (
    <main>
      <Hero />

      <Categories />

      <VisualSearchPromo />

      <FeaturedProducts />
    </main>
  );
}