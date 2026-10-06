import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const products = [
  {
    name: "Oversized Cotton Shirt",
    brand: "Vastra Studio",
    price: 1299,
    originalPrice: 1999,
    image: "/products/shirt-1.jpg",
    category: "men",
    color: "black",
    description:
      "A relaxed oversized cotton shirt designed for everyday comfort and effortless style.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: ["Black", "White", "Beige"],
    rating: 4.5,
    reviews: 128,
    stock: 100,
  },
  {
    name: "Relaxed Fit Denim",
    brand: "Urban Thread",
    price: 1799,
    originalPrice: 2499,
    image: "/products/denim-1.jpg",
    category: "men",
    color: "blue",
    description:
      "Relaxed-fit denim designed with a modern silhouette and comfortable everyday construction.",
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Blue", "Black"],
    rating: 4.3,
    reviews: 94,
    stock: 100,
  },
  {
    name: "Minimal Summer Dress",
    brand: "Élan",
    price: 1499,
    originalPrice: 2299,
    image: "/products/dress-1.jpg",
    category: "women",
    color: "white",
    description:
      "A lightweight summer dress combining a clean silhouette with an effortless contemporary look.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Blue", "Pink"],
    rating: 4.7,
    reviews: 156,
    stock: 100,
  },
  {
    name: "Classic Sneakers",
    brand: "Street Form",
    price: 2199,
    originalPrice: 2999,
    image: "/products/shoes-1.jpg",
    category: "footwear",
    color: "white",
    description:
      "Clean everyday sneakers designed for versatile styling and all-day comfort.",
    sizes: ["6", "7", "8", "9", "10", "11"],
    colors: ["White", "Black"],
    rating: 4.4,
    reviews: 203,
    stock: 100,
  },
  {
    name: "Essential Oversized Tee",
    brand: "Vastra Studio",
    price: 899,
    originalPrice: 1299,
    image: "/products/shirt-1.jpg",
    category: "men",
    color: "white",
    description:
      "A comfortable oversized everyday tee with a clean minimal silhouette.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Black", "Grey"],
    rating: 4.2,
    reviews: 86,
    stock: 100,
  },
  {
    name: "Premium Denim Jacket",
    brand: "Urban Thread",
    price: 2499,
    originalPrice: 3499,
    image: "/products/denim-1.jpg",
    category: "men",
    color: "blue",
    description:
      "A premium denim jacket designed for versatile everyday layering.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Blue", "Black"],
    rating: 4.6,
    reviews: 112,
    stock: 100,
  },
  {
    name: "Everyday Casual Dress",
    brand: "Élan",
    price: 1699,
    originalPrice: 2399,
    image: "/products/dress-1.jpg",
    category: "women",
    color: "pink",
    description:
      "An everyday casual dress with a comfortable silhouette and contemporary style.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Pink", "White", "Blue"],
    rating: 4.4,
    reviews: 91,
    stock: 100,
  },
  {
    name: "Urban Running Shoes",
    brand: "Street Form",
    price: 2399,
    originalPrice: 3199,
    image: "/products/shoes-1.jpg",
    category: "footwear",
    color: "black",
    description:
      "Lightweight running shoes designed for everyday movement and urban styling.",
    sizes: ["6", "7", "8", "9", "10", "11"],
    colors: ["Black", "White"],
    rating: 4.5,
    reviews: 174,
    stock: 100,
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: {
        name: product.name,
      },
      update: product,
      create: product,
    });
  }

  console.log("Products seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });