"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useToastStore } from "../store/toastStore";
import { useWishlistStore } from "../store/wishlistStore";

type VoiceCommand = {
  intent: string;
  searchQuery?: string | null;
  destination?: string | null;
  productId?: string | null;
  productName?: string | null;
  size?: string | null;
  color?: string | null;
  quantity?: number | null;
  quantityChange?: number | null;
  requiresConfirmation?: boolean;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  sizes?: string[];
  colors?: string[];
  stock?: number;
};

type CartItem = {
  id: string;
  name: string;
  brand?: string;
  price: number;
  image?: string;
  quantity: number;
  size?: string;
  color?: string;
};

type WishlistItem = {
  id: string;
  name: string;
  brand?: string;
  price: number;
  image?: string;
};

type SpeechRecognitionType = any;

export default function VoiceShopping() {
  const router = useRouter();
  const pathname = usePathname();

  const setItems = useCartStore((state) => state.setItems);
  const showToast = useToastStore((state) => state.showToast);
  const addWishlistItemToStore = useWishlistStore((state) => state.addToWishlist);
  const removeWishlistItemFromStore = useWishlistStore((state) => state.removeFromWishlist);
  const clearWishlistStore = useWishlistStore((state) => state.clearWishlist);

  const [listening, setListening] = useState(false);

  const [message, setMessage] = useState(
    'Say a command like "open my bag"'
  );
  const [currentProduct, setCurrentProduct] =
    useState<Product | null>(null);

  const [wishlistItems, setWishlistItems] =
    useState<WishlistItem[]>([]);

  const [pendingConfirmation, setPendingConfirmation] =
    useState<string | null>(null);

  const recognitionRef =
    useRef<SpeechRecognitionType | null>(null);

  const commandProcessedRef = useRef(false);  

  /*
   * -------------------------------------------------------
   * CURRENT PRODUCT
   * -------------------------------------------------------
   */

  useEffect(() => {
    const loadCurrentProduct = async () => {
      if (!pathname.startsWith("/products/")) {
        setCurrentProduct(null);
        return;
      }

      const id = pathname.split("/").filter(Boolean).pop();

      if (!id) return;

      try {
        const response = await fetch(`/api/products/${id}`);

        if (!response.ok) {
          setCurrentProduct(null);
          return;
        }

        const data = await response.json();

        setCurrentProduct(data.product ?? data);
      } catch (error) {
        console.error(
          "Failed to load current product:",
          error
        );

        setCurrentProduct(null);
      }
    };

    loadCurrentProduct();
  }, [pathname]);

  useEffect(() => {
    loadWishlist().catch(() => {
      // Wishlist is optional on public pages; errors are handled when a command uses it.
    });
  }, []);

  /*
   * -------------------------------------------------------
   * VOICE RESPONSE
   * -------------------------------------------------------
   */

  const speak = (_text: string) => {
    // Voice responses disabled. The microphone still executes commands.
  };

  /*
   * -------------------------------------------------------
   * CART LOADING
   * -------------------------------------------------------
   */

  const loadCart = async (): Promise<CartItem[]> => {
    const response = await fetch("/api/cart", {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Please login first to use your shopping bag."
        );
      }

      throw new Error("Unable to load your bag.");
    }

    const data = await response.json();

    const items: CartItem[] = (data.items ?? []).map(
      (item: any) => ({
        id: item.product.id,
        name: item.product.name,
        brand: item.product.brand,
        price: item.product.price,
        image: item.product.image,
        quantity: item.quantity,
        size: item.size ?? undefined,
        color: item.color ?? undefined,
      })
    );

    setItems(items as any);

    return items;
  };

  /*
   * -------------------------------------------------------
   * ADD TO CART
   * -------------------------------------------------------
   */

  const addToCart = async (
    product: Product,
    quantity = 1,
    size?: string | null,
    color?: string | null
  ) => {
    const selectedSize =
      size || product.sizes?.[0] || null;

    const selectedColor =
      color || product.colors?.[0] || null;

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: product.id,
        quantity,
        size: selectedSize,
        color: selectedColor,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || "Unable to add product to bag."
      );
    }

    await loadCart();

    return {
      size: selectedSize,
      color: selectedColor,
    };
  };

  /*
   * -------------------------------------------------------
   * PRODUCT RESOLUTION
   * -------------------------------------------------------
   */

  const normalizeComparableText = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097f\u0900-\u097f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const resolveProductByName = async (
    productName?: string | null
  ): Promise<Product | null> => {
    const name = productName?.trim();
    if (!name) return currentProduct;

    const response = await fetch(
      `/api/products?search=${encodeURIComponent(name)}&limit=25&page=1`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Unable to find that product.");
    }

    const data = await response.json();
    const products: Product[] = Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data)
        ? data
        : [];

    if (products.length === 0) {
      return null;
    }

    const wanted = normalizeComparableText(name);

    const exact = products.find(
      (product) =>
        normalizeComparableText(product.name) === wanted
    );

    return exact ?? products[0];
  };

  const extractSize = (text: string) => {
    const match = text.match(
      /\bsize\s*(xxl|xl|xs|2xl|3xl|xxs|l|m|s)\b/i
    );

    return match ? match[1].toUpperCase() : null;
  };

  const stripVoiceFiller = (text: string) =>
    text
      .replace(/\bto\s+(?:my\s+)?(?:bag|cart|shopping bag|shopping cart)\b/gi, "")
      .replace(/\b(?:into|in|on)\s+(?:my\s+)?(?:bag|cart|shopping bag|shopping cart)\b/gi, "")
      .replace(/\bfrom\s+(?:my\s+)?(?:bag|cart|shopping bag|shopping cart)\b/gi, "")
      .replace(/\bfrom\s+(?:my\s+)?wishlist\b/gi, "")
      .replace(/\bin\s+(?:my\s+)?wishlist\b/gi, "")
      .replace(/\b(?:please|kindly)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  /*
   * -------------------------------------------------------
   * CHECKOUT DOM CONTROLS
   * -------------------------------------------------------
   */

  const clickMatchingElement = (
    selector: string,
    matcher: (text: string, element: Element) => boolean
  ) => {
    if (typeof document === "undefined") return false;

    const elements = Array.from(document.querySelectorAll(selector));

    for (const element of elements) {
      const text = (element.textContent || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      if (matcher(text, element)) {
        (element as HTMLElement).click();
        return true;
      }
    }

    return false;
  };

  const selectCheckoutPayment = (
    method: "COD" | "ONLINE"
  ) => {
    if (typeof document === "undefined") return false;

    const wanted = method === "COD"
      ? /(cash on delivery|cod|cash on deliver|कैश ऑन डिलीवरी|कैश डिलीवरी|रोख|रोखी)/i
      : /(online payment|online|upi|card|नेट बैंकिंग|ऑनलाइन पेमेंट|ऑनलाइन)/i;

    const labels = Array.from(document.querySelectorAll("label"));
    for (const label of labels) {
      const text = (label.textContent || "").trim();
      if (!wanted.test(text)) continue;

      const input = label.querySelector(
        'input[type="radio"], input[type="checkbox"]'
      ) as HTMLInputElement | null;

      if (input) {
        input.click();
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ PAYMENT METHOD SELECTED:", method);
        return true;
      }

      (label as HTMLElement).click();
      console.log("✅ PAYMENT METHOD LABEL CLICKED:", method);
      return true;
    }

    const radios = Array.from(
      document.querySelectorAll('input[type="radio"]')
    ) as HTMLInputElement[];

    for (const radio of radios) {
      const parentText =
        `${radio.value || ""} ${radio.name || ""} ${radio.parentElement?.textContent || ""}`;

      if (wanted.test(parentText)) {
        radio.click();
        radio.dispatchEvent(new Event("input", { bubbles: true }));
        radio.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ PAYMENT RADIO SELECTED:", method);
        return true;
      }
    }

    return false;
  };

  const placeCheckoutOrder = () => {
    if (typeof document === "undefined") return false;

    const buttons = Array.from(
      document.querySelectorAll("button, input[type=submit]")
    );

    const button = buttons.find((element) => {
      const text =
        element instanceof HTMLInputElement
          ? element.value
          : element.textContent || "";

      return /place order|place my order|confirm order|order now|ऑर्डर करें|ऑर्डर करा/i.test(
        text.trim()
      );
    }) as HTMLElement | undefined;

    if (!button) {
      console.error("❌ PLACE ORDER BUTTON NOT FOUND");
      return false;
    }

    if ((button as HTMLButtonElement).disabled) {
      console.error(
        "❌ PLACE ORDER BUTTON IS DISABLED. Complete required checkout fields first."
      );
      return false;
    }

    button.click();
    console.log("✅ PLACE ORDER BUTTON CLICKED");
    return true;
  };

  /*
   * -------------------------------------------------------
   * FIND CART ITEM
   * -------------------------------------------------------
   */

  const findCartItem = (
    items: CartItem[],
    command: VoiceCommand
  ) => {
    if (command.productId) {
      return items.find(
        (item) => item.id === command.productId
      );
    }

    if (currentProduct) {
      const currentMatches = items.filter(
        (item) => item.id === currentProduct.id
      );

      if (currentMatches.length === 1) {
        return currentMatches[0];
      }

      if (currentMatches.length > 1) {
        if (command.size || command.color) {
          return currentMatches.find(
            (item) =>
              (!command.size ||
                item.size === command.size) &&
              (!command.color ||
                item.color === command.color)
          );
        }

        return undefined;
      }
    }

    if (command.productName) {
      const search = command.productName
        .toLowerCase()
        .trim();

      const matches = items.filter((item) =>
        item.name.toLowerCase().includes(search)
      );

      if (matches.length === 1) {
        return matches[0];
      }

      if (matches.length > 1) {
        return undefined;
      }
    }

    return undefined;
  };

  /*
   * -------------------------------------------------------
   * REMOVE CART ITEM
   * -------------------------------------------------------
   */

  const removeCartItem = async (
    item: CartItem
  ) => {
    const response = await fetch("/api/cart/item", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: item.id,
        size: item.size ?? null,
        color: item.color ?? null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || "Unable to remove item."
      );
    }

    await loadCart();
  };

  /*
   * -------------------------------------------------------
   * UPDATE QUANTITY
   * -------------------------------------------------------
   */

  const updateQuantity = async (
    item: CartItem,
    quantity: number
  ) => {
    if (quantity <= 0) {
      await removeCartItem(item);
      return;
    }

    const response = await fetch("/api/cart/item", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: item.id,
        quantity,
        size: item.size ?? null,
        color: item.color ?? null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || "Unable to update quantity."
      );
    }

    await loadCart();
  };

  /*
   * -------------------------------------------------------
   * CLEAR CART
   * -------------------------------------------------------
   */

  const clearCart = async () => {
    const items = await loadCart();

    if (items.length === 0) {
      setItems([] as any);
      console.log("ℹ️ Cart is already empty.");
      return;
    }

    for (const item of items) {
      const response = await fetch("/api/cart/item", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: item.id,
          size: item.size ?? null,
          color: item.color ?? null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to remove ${item.name} from your bag.`
        );
      }
    }

    // Clear the client store immediately after every server delete succeeds.
    setItems([] as any);

    // Verify the server is actually empty.
    const verifyResponse = await fetch("/api/cart", {
      cache: "no-store",
    });

    if (!verifyResponse.ok) {
      throw new Error("Cart was updated but could not be verified.");
    }

    const verifyData = await verifyResponse.json();
    const remaining = Array.isArray(verifyData?.items)
      ? verifyData.items.length
      : 0;

    if (remaining > 0) {
      throw new Error("Some cart items could not be removed.");
    }

    setItems([] as any);
    console.log("✅ CART CLEARED SUCCESSFULLY");
  };

  /*
   * -------------------------------------------------------
   * WISHLIST
   * -------------------------------------------------------
   */

  const wishlistRequest = async (
    method: "GET" | "POST" | "DELETE",
    body?: Record<string, unknown>
  ) => {
    const makeRequest = (url: string) =>
      fetch(url, {
        method,
        headers:
          method === "GET"
            ? undefined
            : { "Content-Type": "application/json" },
        body:
          method === "GET"
            ? undefined
            : JSON.stringify(body ?? {}),
        cache: method === "GET" ? "no-store" : undefined,
      });

    let response = await makeRequest("/api/wishlist");

    // Some builds expose item operations at /api/wishlist/item.
    if (
      method !== "GET" &&
      (response.status === 404 || response.status === 405)
    ) {
      response = await makeRequest("/api/wishlist/item");
    }

    return response;
  };

  const loadWishlist = async (): Promise<WishlistItem[]> => {
    const response = await wishlistRequest("GET");
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Please login first to use your wishlist.");
      }

      throw new Error(
        data?.message || "Unable to load your wishlist."
      );
    }

    const rawItems =
      data?.items ??
      data?.wishlist?.items ??
      data?.wishlist ??
      [];

    const items: WishlistItem[] = (Array.isArray(rawItems) ? rawItems : []).map(
      (item: any) => {
        const product = item?.product ?? item;

        return {
          id: product?.id ?? item?.productId ?? item?.id,
          name: product?.name ?? item?.name ?? "",
          brand: product?.brand ?? item?.brand,
          price: Number(product?.price ?? item?.price ?? 0),
          image: product?.image ?? item?.image,
        };
      }
    ).filter((item: WishlistItem) => Boolean(item.id));

    setWishlistItems(items);
    return items;
  };

  const addToWishlist = async (product: Product) => {
    const response = await wishlistRequest("POST", {
      productId: product.id,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.message || "Unable to add the product to your wishlist."
      );
    }

    await loadWishlist();

    // Keep the same shared wishlist state used by product cards and buttons.
    addWishlistItemToStore({
      id: product.id,
      name: product.name,
      brand: product.brand ?? "",
      price: product.price,
      image: product.image ?? "",
    });

    // Reuse the global top-right toast shown by regular wishlist buttons.
    showToast(`${product.name} added to wishlist`);
    console.log("✅ ADDED TO WISHLIST:", product.name);
  };

  const findWishlistItem = (command: VoiceCommand) => {
    if (command.productId) {
      return wishlistItems.find(
        (item) => item.id === command.productId
      );
    }

    if (currentProduct) {
      const currentMatch = wishlistItems.find(
        (item) => item.id === currentProduct.id
      );

      if (currentMatch) return currentMatch;
    }

    if (command.productName) {
      const search = command.productName.toLowerCase().trim();
      const matches = wishlistItems.filter((item) =>
        item.name.toLowerCase().includes(search)
      );

      if (matches.length === 1) return matches[0];
    }

    return undefined;
  };

  const removeWishlistItem = async (item: WishlistItem) => {
    const response = await wishlistRequest("DELETE", {
      productId: item.id,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.message || "Unable to remove the wishlist item."
      );
    }

    await loadWishlist();
    removeWishlistItemFromStore(item.id);
    showToast(`${item.name} removed from wishlist`);
    console.log("✅ REMOVED FROM WISHLIST:", item.name);
  };

  const clearWishlist = async () => {
    const items = await loadWishlist();

    if (items.length === 0) {
      setWishlistItems([]);
      console.log("ℹ️ Wishlist is already empty.");
      return;
    }

    for (const item of items) {
      const response = await wishlistRequest("DELETE", {
        productId: item.id,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to remove ${item.name} from your wishlist.`
        );
      }
    }

    setWishlistItems([]);

    const verify = await loadWishlist();

    if (verify.length > 0) {
      throw new Error("Some wishlist items could not be removed.");
    }

    setWishlistItems([]);
    clearWishlistStore();
    showToast("Wishlist cleared");
    console.log("✅ WISHLIST CLEARED SUCCESSFULLY");
  };

  /*
   * -------------------------------------------------------
   * NAVIGATION
   * -------------------------------------------------------
   */

  const navigateTo = (
    destination?: string | null
  ) => {
    switch (destination) {
      case "men":
        router.push("/products?category=men");
        speak("Opening men's collection.");
        break;

      case "women":
        router.push("/products?category=women");
        speak("Opening women's collection.");
        break;

      case "kids":
        router.push("/products?category=kids");
        speak("Opening kids collection.");
        break;

      case "footwear":
        router.push("/products?category=footwear");
        speak("Opening footwear.");
        break;

      case "accessories":
        router.push("/products?category=accessories");
        speak("Opening accessories.");
        break;

      case "products":
        router.push("/products");
        speak("Opening all products.");
        break;

      case "cart":
      case "bag":
        router.push("/cart");
        speak("Opening your bag.");
        break;

      case "checkout":
        router.push("/checkout");
        speak("Opening checkout.");
        break;

      case "account":
        router.push("/account");
        speak("Opening your account.");
        break;

      case "orders":
        router.push("/orders");
        speak("Opening your orders.");
        break;

      case "addresses":
        router.push("/addresses");
        speak("Opening your addresses.");
        break;

      case "wishlist":
      case "favorites":
      case "favourites":
        router.push("/wishlist");
        speak("Opening your wishlist.");
        break;

      case "home":
        router.push("/");
        speak("Taking you home.");
        break;

      default:
        speak("I couldn't find that page.");
    }
  };

  /*
   * -------------------------------------------------------
   * EXECUTE COMMAND
   * -------------------------------------------------------
   */

  const executeCommand = async (
    command: VoiceCommand
  ) => {
    try {
      if (!command || !command.intent) {
        console.error("❌ executeCommand received invalid command:", command);
        return;
      }

      const intent = String(command.intent)
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

      console.log("🧠 executeCommand ->", intent, command);
      /*
       * CONFIRM
       */

      if (intent === "CONFIRM") {
        // Clear actions are intentionally immediate; no confirmation is required.
        return;
      }

      if (intent === "CANCEL") {
        return;
      }

      /*
       * SEARCH
       */

      if (intent === "SEARCH") {
        if (!command.searchQuery) {
          speak("What would you like me to search for?");
          return;
        }

        router.push(
          `/search?q=${encodeURIComponent(
            command.searchQuery
          )}`
        );

        speak(
          `Searching for ${command.searchQuery}.`
        );

        return;
      }

      /*
       * NAVIGATION
       */

      if (intent === "NAVIGATE") {
        navigateTo(command.destination);
        return;
      }

      /*
       * HOME
       */

      if (intent === "GO_HOME") {
        router.push("/");
        speak("Taking you home.");
        return;
      }

      /*
       * BACK
       */

      if (intent === "GO_BACK") {
        router.back();
        speak("Going back.");
        return;
      }

      /*
       * CART / BAG
       */

      if (
        intent === "OPEN_CART" ||
        intent === "OPEN_BAG" ||
        intent === "VIEW_CART"
      ) {
        router.push("/cart");
        speak("Opening your bag.");
        return;
      }

      /*
       * CHECKOUT
       */

      if (intent === "GO_TO_CHECKOUT") {
        router.push("/checkout");
        speak("Opening checkout.");
        return;
      }

      /*
       * ADD CURRENT PRODUCT
       */

      if (intent === "ADD_TO_CART") {
        let product = currentProduct;

        if (command.productId) {
          const response = await fetch(
            `/api/products/${command.productId}`,
            { cache: "no-store" }
          );

          if (response.ok) {
            const data = await response.json();
            product = data.product ?? data;
          }
        }

        if (!product && command.productName) {
          product = await resolveProductByName(command.productName);
        }

        if (!product) {
          throw new Error(
            `I could not find ${command.productName || "that product"}.`
          );
        }

        const result = await addToCart(
          product,
          Math.max(1, Number(command.quantity ?? 1)),
          command.size,
          command.color
        );

        console.log(
          "✅ PRODUCT ADDED TO CART:",
          product.name,
          "qty:",
          command.quantity ?? 1,
          "size:",
          result.size
        );

        // Match the exact global top-right notification used by Add to Bag.
        showToast(`${product.name} added to your bag`);

        return;
      }

      /*
       * REMOVE LAST ITEM
       */

      if (intent === "REMOVE_LAST") {
        const items = await loadCart();

        if (items.length === 0) {
          speak("Your bag is empty.");
          return;
        }

        const item = items[items.length - 1];

        await removeCartItem(item);

        speak(
          `${item.name} has been removed from your bag.`
        );

        return;
      }

      /*
       * REMOVE PRODUCT
       */

      if (intent === "REMOVE_PRODUCT") {
        const items = await loadCart();

        if (items.length === 0) {
          console.log("ℹ️ CART IS EMPTY");
          return;
        }

        const item = findCartItem(items, command);

        if (!item) {
          throw new Error(
            `I could not find ${command.productName || "that product"} in your bag.`
          );
        }

        const amount = Number(command.quantity ?? 0);

        if (amount > 0 && amount < item.quantity) {
          await updateQuantity(item, item.quantity - amount);
          console.log(
            "✅ CART QUANTITY REDUCED:",
            item.name,
            item.quantity - amount
          );
        } else {
          await removeCartItem(item);
          console.log("✅ CART ITEM REMOVED:", item.name);
        }

        return;
      }

      /*
       * CLEAR CART
       */

      if (intent === "CLEAR_CART") {
        await clearCart();
        return;
      }

      /*
       * WISHLIST
       */

      if (
        intent === "OPEN_WISHLIST" ||
        intent === "VIEW_WISHLIST" ||
        intent === "OPEN_FAVORITES" ||
        intent === "VIEW_FAVORITES"
      ) {
        router.push("/wishlist");
        return;
      }

      if (intent === "CLEAR_WISHLIST" || intent === "REMOVE_ALL_WISHLIST") {
        await clearWishlist();
        return;
      }

      if (intent === "ADD_TO_WISHLIST") {
        let product = currentProduct;

        if (!product && command.productId) {
          const response = await fetch(
            `/api/products/${command.productId}`
          );

          if (response.ok) {
            const data = await response.json();
            product = data.product ?? data;
          }
        }

        if (!product && command.productName) {
          product = await resolveProductByName(command.productName);
        }

        if (!product) {
          throw new Error(
            `I could not find ${command.productName || "that product"} to add to your wishlist.`
          );
        }

        await addToWishlist(product);
        return;
      }

      if (
        intent === "REMOVE_FROM_WISHLIST" ||
        intent === "REMOVE_WISHLIST_ITEM"
      ) {
        await loadWishlist();
        const item = findWishlistItem(command);

        if (!item) {
          throw new Error(
            "I could not find that item in your wishlist."
          );
        }

        await removeWishlistItem(item);
        return;
      }

      /*
       * SET QUANTITY
       */

      if (
        intent === "UPDATE_QUANTITY"
      ) {
        if (
          command.quantity === null ||
          command.quantity === undefined
        ) {
          speak(
            "Tell me the quantity you want."
          );
          return;
        }

        const items = await loadCart();

        if (items.length === 0) {
          speak("Your bag is empty.");
          return;
        }

        const item = findCartItem(
          items,
          command
        );

        if (!item) {
          speak(
            "Please tell me which product you want to change."
          );
          return;
        }

        await updateQuantity(
          item,
          command.quantity
        );

        speak(
          `${item.name} quantity is now ${command.quantity}.`
        );

        return;
      }

      /*
       * INCREASE QUANTITY
       */

      if (
        intent ===
        "INCREASE_QUANTITY"
      ) {
        const items = await loadCart();

        if (items.length === 0) {
          speak("Your bag is empty.");
          return;
        }

        const item = findCartItem(
          items,
          command
        );

        if (!item) {
          speak(
            "Please tell me which product you want to increase."
          );
          return;
        }

        const change =
          command.quantityChange ?? 1;

        const newQuantity =
          item.quantity + Math.abs(change);

        await updateQuantity(
          item,
          newQuantity
        );

        speak(
          `${item.name} quantity is now ${newQuantity}.`
        );

        return;
      }

      /*
       * DECREASE QUANTITY
       */

      if (
        intent ===
        "DECREASE_QUANTITY"
      ) {
        const items = await loadCart();

        if (items.length === 0) {
          speak("Your bag is empty.");
          return;
        }

        const item = findCartItem(
          items,
          command
        );

        if (!item) {
          speak(
            "Please tell me which product you want to decrease."
          );
          return;
        }

        const change =
          command.quantityChange ?? 1;

        const newQuantity =
          item.quantity - Math.abs(change);

        await updateQuantity(
          item,
          newQuantity
        );

        if (newQuantity <= 0) {
          speak(
            `${item.name} has been removed from your bag.`
          );
        } else {
          speak(
            `${item.name} quantity is now ${newQuantity}.`
          );
        }

        return;
      }

      /*
       * CHECKOUT CONTROLS
       */

      if (
        intent === "SELECT_COD" ||
        intent === "PAY_COD" ||
        intent === "CASH_ON_DELIVERY"
      ) {
        if (pathname !== "/checkout") {
          router.push("/checkout");
          return;
        }

        if (!selectCheckoutPayment("COD")) {
          throw new Error("Cash on Delivery option was not found on checkout.");
        }
        return;
      }

      if (
        intent === "SELECT_ONLINE_PAYMENT" ||
        intent === "ONLINE_PAYMENT" ||
        intent === "PAY_ONLINE"
      ) {
        if (pathname !== "/checkout") {
          router.push("/checkout");
          return;
        }

        if (!selectCheckoutPayment("ONLINE")) {
          throw new Error("Online payment option was not found on checkout.");
        }
        return;
      }

      if (
        intent === "PLACE_ORDER" ||
        intent === "CONFIRM_ORDER" ||
        intent === "ORDER_NOW"
      ) {
        if (pathname !== "/checkout") {
          router.push("/checkout");
          return;
        }

        if (!placeCheckoutOrder()) {
          throw new Error(
            "Place Order is unavailable. Make sure the required delivery details are filled in."
          );
        }
        return;
      }

      /*
       * OPEN PRODUCT
       */

      if (
        intent === "OPEN_PRODUCT"
      ) {
        if (command.productId) {
          router.push(
            `/products/${command.productId}`
          );

          speak("Opening the product.");
          return;
        }

        if (currentProduct) {
          speak(
            "You're already viewing this product."
          );
          return;
        }

        speak(
          "Tell me the product name you want to open."
        );

        return;
      }

      /*
       * ACCOUNT
       */

      if (
        intent === "OPEN_ACCOUNT"
      ) {
        router.push("/account");
        speak("Opening your account.");
        return;
      }

      /*
       * ORDERS
       */

      if (
        intent === "OPEN_ORDERS"
      ) {
        router.push("/orders");
        speak("Opening your orders.");
        return;
      }

      /*
       * ADDRESSES
       */

      if (
        intent === "OPEN_ADDRESSES"
      ) {
        router.push("/addresses");
        speak("Opening your addresses.");
        return;
      }

      /*
       * UNKNOWN
       */

      speak(
        "I didn't understand that command. Try saying open my bag, add this product, clear my bag, or go to checkout."
      );
    } catch (error: any) {
      console.error(
        "Voice command error:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Sorry, I couldn't complete that command.";

      // Voice actions should provide visible feedback just like button actions.
      showToast(errorMessage);
      speak(errorMessage);
    }
  };

  /*
   * -------------------------------------------------------
   * SEND VOICE TO GEMINI
   * -------------------------------------------------------
   */

  const normalizeVoiceText = (text: string) =>
    text
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/\s+/g, " ")
      .trim();

  const handleSimpleVoiceCommand = async (transcript: string) => {
    const command = normalizeVoiceText(transcript);

    console.log("⚡ NORMALIZED VOICE COMMAND:", command);

    // VISUAL / IMAGE SEARCH
    if (
      command === "open visual search" ||
      command === "open image search" ||
      command === "search by image" ||
      command === "open search image" ||
      command === "open search img"
    ) {
      console.log("✅ LOCAL COMMAND: OPEN VISUAL SEARCH");
      router.push("/visual-search");
      return true;
    }

    // CONFIRM pending action
    if (
      pendingConfirmation &&
      /^(yes|yeah|yep|confirm|confirmed|do it|clear it|clear everything)$/.test(command)
    ) {
      console.log("✅ LOCAL COMMAND: CONFIRM");
      await executeCommand({ intent: "CONFIRM" });
      return true;
    }

    // CANCEL pending action
    if (
      /^(no|nope|cancel|cancel it|never mind|stop)$/.test(command)
    ) {
      console.log("✅ LOCAL COMMAND: CANCEL");
      await executeCommand({ intent: "CANCEL" });
      return true;
    }

    // WISHLIST / FAVORITES - OPEN
    if (
      /(wishlist|wish list|favorites?|favourites?|saved items?|liked items?|pasand|pasandida|pasand ki cheeze|pasant|आवडते|आवडत्या|पसंद|पसंदीदा)/.test(command) &&
      /(open|show|view|go to|take me to|browse|देखो|दिखाओ|खोलो|उघडा|दाखवा|पहा|माझे|मेरे)/.test(command)
    ) {
      console.log("✅ LOCAL COMMAND: OPEN WISHLIST");
      router.push("/wishlist");
      return true;
    }

    // WISHLIST / FAVORITES - CLEAR ALL
    if (
      /(clear|empty|remove all|delete all|remove everything|saaf|saaf karo|khaali|खाली|साफ|साफ करो|हटा दो|सगळे काढा|रिकामी करा|साफ करा)/.test(command) &&
      /(wishlist|wish list|favorites?|favourites?|saved items?|liked items?|pasand|pasandida|आवडते|आवडत्या|पसंद|पसंदीदा)/.test(command)
    ) {
      console.log("✅ LOCAL COMMAND: CLEAR WISHLIST");
      await executeCommand({ intent: "CLEAR_WISHLIST" });
      return true;
    }

    // WISHLIST - REMOVE ONE ITEM
    if (
      /(remove|delete|unlike|unfavorite|हटाओ|हटा दो|काढा|काढून टाका)/.test(command) &&
      /(wishlist|wish list|favorites?|favourites?|saved items?|liked items?|pasand|pasandida|आवडते|आवडत्या|पसंद|पसंदीदा)/.test(command)
    ) {
      console.log("✅ LOCAL COMMAND: REMOVE WISHLIST ITEM");
      const commandWithoutWishlist = command
        .replace(/.*?\b(remove|delete|unlike|unfavorite)\b/i, "")
        .replace(/\b(from|in|my)\b/gi, "")
        .replace(/(wishlist|wish list|favorites?|favourites?|saved items?|liked items?|pasand|pasandida|आवडते|आवडत्या|पसंद|पसंदीदा)/g, "")
        .trim();
      await executeCommand({
        intent: "REMOVE_FROM_WISHLIST",
        productName: commandWithoutWishlist || undefined,
      });
      return true;
    }

    // CLEAR BAG / CART - IMMEDIATE
    if (
      /(clear|empty|remove all|delete all|remove everything|saaf|saaf karo|khaali|खाली|साफ|साफ करो|हटा दो|सगळे काढा|रिकामी करा|साफ करा)/.test(command) &&
      /(bag|cart|shopping bag|shopping cart|card|बैग|कार्ट|टोपली|पिशवी|बॅग|कार्ट)/.test(command)
    ) {
      console.log("✅ LOCAL COMMAND: CLEAR CART");
      await executeCommand({ intent: "CLEAR_CART" });
      return true;
    }

    // BAG / CART
    if (
      /\b(open|show|view|go to|take me to|देखो|दिखाओ|खोलो|उघडा|दाखवा|पहा)\b.*\b(my )?(shopping )?(bag|cart)\b/.test(command) ||
      /(मेरा|मेरी|माझा|माझी).*(बैग|कार्ट|पिशवी|बॅग)/.test(command) ||
      command.includes("what's in my bag") ||
      command.includes("what is in my bag") ||
      command.includes("what's in my cart") ||
      command.includes("what is in my cart") ||
      /\b(मेरा|मेरी)\s*(बैग|कार्ट)\b/.test(command) ||
      /\b(माझा|माझी)\s*(बॅग|कार्ट|पिशवी)\b/.test(command) ||
      command === "bag" ||
      command === "cart" ||
      command === "shopping bag" ||
      command === "shopping cart"
    ) {
      console.log("✅ LOCAL COMMAND: OPEN BAG/CART");
      router.push("/cart");
      return true;
    }

    // CHECKOUT
    if (
      command === "checkout" ||
      command === "check out" ||
      /(go|take me|open|show|view|proceed to|goto|go to)\b.*\b(checkout|check out)\b/.test(command) ||
      /(चेकआउट|checkout).*(खोलो|दिखाओ|जाओ|open|show|go)/.test(command) ||
      /(चेकआउट|checkout).*(उघडा|दाखवा|जा|उघड|पहा)/.test(command) ||
      /(खरेदी|ऑर्डर).*(पूर्ण|complete|करा|कर)/.test(command)
    ) {
      console.log("✅ LOCAL COMMAND: CHECKOUT");
      router.push("/checkout");
      return true;
    }

    // HOME
    if (
      command === "home" ||
      command === "go home" ||
      command === "go to home" ||
      command === "open home" ||
      command === "show home" ||
      command === "take me home" ||
      command === "go to homepage" ||
      command === "open homepage" ||
      command === "show homepage" ||
      command === "go to home page" ||
      command === "open home page" ||
      command === "show home page" ||
      /^(घर|मुख्य पृष्ठ|मुखपृष्ठ|होम|हॅम|घरी)$/.test(command) ||
      /(घर|मुख्य पृष्ठ|होम).*(जाओ|खोलो|दिखाओ|ले चलो)/.test(command) ||
      /(घरी|मुखपृष्ठ|होम).*(जा|उघड|दाखव|पहा|घेऊन जा)/.test(command)
    ) {
      console.log("✅ LOCAL COMMAND: HOME");
      router.push("/");
      return true;
    }

    // BACK
    if (
      command === "back" ||
      command === "go back" ||
      command === "take me back" ||
      /^(वापस|परत|मागे|पीछे)$/.test(command) ||
      /(वापस|मागे|परत).*(जाओ|जा|चलो|ने)$/.test(command)
    ) {
      console.log("✅ LOCAL COMMAND: BACK");
      router.back();
      return true;
    }

    // ALL PRODUCTS
    if (
      command === "products" ||
      command === "show products" ||
      command === "open products" ||
      command === "go to products" ||
      command === "view products" ||
      command === "show all products"
    ) {
      console.log("✅ LOCAL COMMAND: PRODUCTS");
      router.push("/products");
      return true;
    }

    // CATEGORIES
    const categories: Array<[string, string[]]> = [
      ["men", ["men", "men's", "mens", "male", "पुरुष", "आदमी", "मर्द"]],
      ["women", ["women", "women's", "womens", "ladies", "female", "महिला", "स्त्रिया", "औरत"]],
      ["kids", ["kids", "children", "child", "boys", "girls", "बच्चे", "बच्चों", "मुलं", "मुलांचे"]],
      ["footwear", ["footwear", "shoes", "shoe", "sneakers", "sandals", "जूते", "जूता", "बूट", "पादत्राणे"]],
      ["accessories", ["accessories", "accessory", "bags", "watches", "jewelry", "jewellery", "सामान", "अॅक्सेसरीज", "दागिने"]],
    ];

    for (const [category, aliases] of categories) {
      const categoryPattern = aliases.join("|");
      const categoryRegex = new RegExp(
        `\\b(go to|open|show|view|browse|take me to)\\b.*\\b(${categoryPattern})\\b`
      );

      if (categoryRegex.test(command) || command === category) {
        console.log(`✅ LOCAL COMMAND: CATEGORY -> ${category}`);
        router.push(`/products?category=${category}`);
        return true;
      }
    }

    // ACCOUNT
    if (/\b(open|show|view|go to)\b.*\b(account|profile)\b/.test(command)) {
      console.log("✅ LOCAL COMMAND: ACCOUNT");
      router.push("/account");
      return true;
    }

    // ORDERS
    if (/\b(open|show|view|go to)\b.*\b(orders|order history)\b/.test(command)) {
      console.log("✅ LOCAL COMMAND: ORDERS");
      router.push("/orders");
      return true;
    }

    // ADDRESSES
    if (/\b(open|show|view|go to)\b.*\b(address|addresses|saved address|saved addresses)\b/.test(command)) {
      console.log("✅ LOCAL COMMAND: ADDRESSES");
      router.push("/addresses");
      return true;
    }

    // ADD PRODUCT BY NAME / QUANTITY / SIZE
    const addMatch = command.match(
      /^(?:add|put|include|buy|add to bag|add to cart|बैग में डालो|कार्ट में डालो|बॅगमध्ये टाका|कार्टमध्ये टाका)\s+(.+)$/i
    );

    if (addMatch?.[1] && !/(wishlist|wish list|favorite|favourite|saved items?|liked items?)/i.test(addMatch[1])) {
      const raw = stripVoiceFiller(addMatch[1]);
      const size = extractSize(raw);
      const quantityMatch = raw.match(/\b(\d+)\b/);
      const quantity = quantityMatch ? Number(quantityMatch[1]) : 1;

      const productName = raw
        .replace(/\bsize\s*(xxl|xl|xs|2xl|3xl|xxs|l|m|s)\b/i, "")
        .replace(/\b\d+\b/, "")
        .replace(/\b(?:please|kindly)\b/gi, "")
        .trim();

      if (productName) {
        console.log("✅ LOCAL COMMAND: ADD PRODUCT", {
          productName,
          quantity,
          size,
        });

        await executeCommand({
          intent: "ADD_TO_CART",
          productName,
          quantity,
          size,
        });
        return true;
      }
    }

    // REMOVE / REDUCE PRODUCT BY NAME / QUANTITY / SIZE FROM CART
    const removeMatch = command.match(
      /^(?:remove|delete|take out|remove from bag|remove from cart|हटाओ|हटा दो|बैग से निकालो|कार्ट से निकालो|काढा|काढून टाका)\s+(.+)$/i
    );

    if (removeMatch?.[1]) {
      const raw = stripVoiceFiller(removeMatch[1]);
      const size = extractSize(raw);
      const quantityMatch = raw.match(/\b(\d+)\b/);
      const quantity = quantityMatch ? Number(quantityMatch[1]) : null;

      const productName = raw
        .replace(/\bsize\s*(xxl|xl|xs|2xl|3xl|xxs|l|m|s)\b/i, "")
        .replace(/\b\d+\b/, "")
        .trim();

      if (productName && !/^(all|everything)$/.test(productName)) {
        console.log("✅ LOCAL COMMAND: REMOVE PRODUCT", {
          productName,
          quantity,
          size,
        });

        await executeCommand({
          intent: "REMOVE_PRODUCT",
          productName,
          quantity,
          size,
        });
        return true;
      }
    }

    // SET / UPDATE CART QUANTITY BY PRODUCT NAME
    const quantityMatch = command.match(
      /^(?:set|change|update|make)\s+(?:the\s+)?quantity(?:\s+of)?\s+(.+?)\s+(?:to|as)\s+(\d+)$/i
    );

    if (quantityMatch) {
      const productName = stripVoiceFiller(quantityMatch[1]);
      const quantity = Number(quantityMatch[2]);

      await executeCommand({
        intent: "UPDATE_QUANTITY",
        productName,
        quantity,
      });
      return true;
    }

    // CHECKOUT PAGE PAYMENT / ORDER COMMANDS
    if (
      /\b(select|choose|use|pay with|payment with|pay by)\b.*\b(cash on delivery|cod|cash|कैश ऑन डिलीवरी|ऑनलाइन पेमेंट|online payment|online|upi|card)\b/i.test(command) ||
      /\b(cod|cash on delivery|कैश ऑन डिलीवरी|cash delivery|रोख|रोखी)\b/.test(command)
    ) {
      if (/cod|cash on delivery|cash|कैश ऑन डिलीवरी|cash delivery|रोख|रोखी/i.test(command)) {
        await executeCommand({ intent: "SELECT_COD" });
      } else {
        await executeCommand({ intent: "SELECT_ONLINE_PAYMENT" });
      }
      return true;
    }

    if (
      /\b(select|choose|use|pay with|payment with)\b.*\b(online payment|online|upi|card|ऑनलाइन पेमेंट|ऑनलाइन)/i.test(command) ||
      /\b(online payment|upi|card|ऑनलाइन पेमेंट|ऑनलाइन)\b/.test(command)
    ) {
      await executeCommand({ intent: "SELECT_ONLINE_PAYMENT" });
      return true;
    }

    if (
      /^(?:place order|place my order|place an order|confirm order|confirm my order|order now|buy now|ऑर्डर करो|ऑर्डर करें|ऑर्डर करा|ऑर्डर प्लेस करो)$/i.test(command)
    ) {
      await executeCommand({ intent: "PLACE_ORDER" });
      return true;
    }

    // SEARCH ONLY ON AN EXPLICIT "SHOW ME ..." REQUEST.
    const showMeMatch = command.match(
      /^(?:show me|show me some|show me a|show me the|search|search this||मुझे\s+(?:दिखाओ|दिखा दो)|मला\s+(?:दाखवा|दाखव)|मुझे\s+दिखाओ|मला\s+दाखवा)\s+(.+)$/i
    );

    if (showMeMatch?.[1]) {
      const query = showMeMatch[1].trim();
      if (query) {
        console.log("✅ LOCAL COMMAND: SEARCH ->", query);
        router.push(`/search?q=${encodeURIComponent(query)}`);
        return true;
      }
    }

    return false;
  };

  const processVoice = async (transcript: string) => {
    const normalized = normalizeVoiceText(transcript);

    console.log("🎙️ PROCESSING VOICE COMMAND:", transcript);
    console.log("📍 CURRENT PATH:", pathname);
    console.log("👕 CURRENT PRODUCT:", currentProduct?.name ?? null);

    // Obvious commands bypass Gemini completely.
    if (await handleSimpleVoiceCommand(normalized)) {
      setMessage("");
      return;
    }

    // Context-aware commands go to Gemini.
    try {
      setMessage(`Processing: "${transcript}"`);

      const response = await fetch("/api/ai/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: transcript,
          currentProduct: currentProduct
            ? {
                id: currentProduct.id,
                name: currentProduct.name,
                brand: currentProduct.brand,
              }
            : null,
        }),
      });

      const data = await response.json();

      console.log("📦 VOICE API RESPONSE:", data);

      if (!response.ok) {
        throw new Error(data?.message || "Voice command failed.");
      }

      // Support all response shapes currently used by the voice API.
      // Preferred shape: { result: { intent: ... } }
      // Also accept:      { command: { intent: ... } }
      // and nested legacy variants.
      const candidates = [
        data?.result,
        data?.command,
        data?.data?.result,
        data?.data?.command,
      ];

      const rawCommand =
        candidates.find(
          (candidate: any) =>
            candidate &&
            typeof candidate === "object" &&
            !Array.isArray(candidate) &&
            typeof candidate.intent === "string"
        ) ?? null;

      if (!rawCommand) {
        console.error("❌ Invalid Gemini voice response:", data);
        throw new Error("Gemini did not return a valid command.");
      }

      const safeCommand: VoiceCommand = {
        ...rawCommand,
        intent: String(rawCommand.intent)
          .trim()
          .toUpperCase()
          .replace(/[\s-]+/g, "_"),
        destination: rawCommand.destination
          ? String(rawCommand.destination)
              .trim()
              .toLowerCase()
              .replace(/[\s-]+/g, "_")
          : rawCommand.destination,
      };

      console.log("🤖 GEMINI STRUCTURED COMMAND:", safeCommand);
      console.log("🚀 EXECUTING INTENT:", safeCommand.intent);

      const explicitShowMeSearch = /^(?:show me|show me some|show me a|show me the|मुझे\s+(?:दिखाओ|दिखा दो)|मला\s+(?:दाखवा|दाखव))\s+/i.test(normalized);

      if (safeCommand.intent === "SEARCH" && !explicitShowMeSearch) {
        console.log("⛔ SEARCH BLOCKED: search is only activated by an explicit 'show me ...' request.");
        return;
      }

      await executeCommand(safeCommand);
      setMessage("");
    } catch (error: any) {
      console.error("❌ Voice processing error:", error);
      setMessage(error?.message || "Voice command failed.");
    }

    
  };

/*
   * -------------------------------------------------------
   * START LISTENING
   * -------------------------------------------------------
   */

const startListening = () => {
  if (typeof window === "undefined") return;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error(
      "❌ Speech Recognition is not supported in this browser."
    );
    setMessage("Voice recognition is not supported in this browser.");
    return;
  }

  // Stop any previous recognition session.
  if (recognitionRef.current) {
    try {
      recognitionRef.current.abort();
    } catch {}

    recognitionRef.current = null;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  commandProcessedRef.current = false;
  recognitionRef.current = recognition;

  recognition.onstart = () => {
    console.log("🎤 VOICE LISTENING STARTED");
    setListening(true);
    setMessage("Listening...");
  };

  recognition.onresult = async (event: any) => {
    const result = event.results[event.resultIndex];

    if (!result) return;

    const transcript =
      result[0]?.transcript?.trim() || "";

    if (!transcript) return;

    console.log(
      "🎙️ SPEECH RESULT:",
      transcript,
      "FINAL:",
      result.isFinal
    );

    // Show the live transcript while the user is speaking.
    if (!result.isFinal) {
      setMessage(transcript);
      return;
    }

    if (commandProcessedRef.current) {
      console.log(
        "⚠️ Duplicate voice command ignored:",
        transcript
      );
      return;
    }

    commandProcessedRef.current = true;

    console.log(
      "✅ FINAL VOICE COMMAND:",
      transcript
    );

    // Show what Chrome actually recognized.
    setMessage(`Heard: "${transcript}"`);
    setListening(false);

    // Do NOT call recognition.stop() here.
    // Chrome finishes naturally because continuous=false.
    try {
      await processVoice(transcript);
      setMessage("");
    } catch (error) {
      console.error(
        "❌ COMMAND EXECUTION ERROR:",
        error
      );
      setMessage("Command failed. Check the console.");
    }
  };

  recognition.onerror = (event: any) => {
    const errorCode = event?.error || "unknown";

    console.log(
      "🎤 SPEECH RECOGNITION EVENT:",
      errorCode
    );

    // Aborted is normally caused by ending/cancelling the
    // recognition session. It is not a fatal app error.
    if (errorCode === "aborted") {
      console.log(
        "ℹ️ Speech recognition was aborted."
      );
      return;
    }

    setListening(false);

    switch (errorCode) {
      case "not-allowed":
      case "service-not-allowed":
        console.error(
          "🎤 Microphone permission was denied."
        );
        setMessage(
          "Microphone permission denied. Allow microphone access in Chrome."
        );
        break;

      case "audio-capture":
        console.error(
          "🎤 No microphone was found or the microphone is unavailable."
        );
        setMessage(
          "Microphone unavailable. Check your microphone."
        );
        break;

      case "no-speech":
        console.log(
          "ℹ️ Chrome did not detect speech."
        );
        setMessage(
          "No speech detected. Click the mic and try again."
        );
        break;

      case "network":
        console.error(
          "🌐 Speech recognition network error."
        );
        setMessage(
          "Speech recognition network error. Check your internet connection."
        );
        break;

      default:
        console.error(
          "❌ Unknown speech recognition error:",
          errorCode,
          event
        );
        setMessage(
          "Voice recognition failed. Please try again."
        );
    }
  };

  recognition.onend = () => {
    console.log(
      "🎤 VOICE LISTENING ENDED"
    );

    setListening(false);

    if (recognitionRef.current === recognition) {
      recognitionRef.current = null;
    }
  };

  try {
    console.log(
      "🎤 STARTING MICROPHONE..."
    );

    recognition.start();
  } catch (error) {
    console.error(
      "❌ FAILED TO START SPEECH RECOGNITION:",
      error
    );

    setListening(false);

    if (recognitionRef.current === recognition) {
      recognitionRef.current = null;
    }

    setMessage(
      "Could not start the microphone. Please try again."
    );
  }
};

useEffect(() => {
  const handleHeroVoice = () => {
    if (listening) return;

    startListening();
  };

  window.addEventListener(
    "vastrai:start-voice",
    handleHeroVoice
  );

  return () => {
    window.removeEventListener(
      "vastrai:start-voice",
      handleHeroVoice
    );
  };
}, [listening]);

/*
 * -------------------------------------------------------
 * STOP LISTENING
 * -------------------------------------------------------
 */

const stopListening = () => {
  const recognition = recognitionRef.current;

  if (recognition) {
    try {
      recognition.abort();
    } catch {}
  }

  recognitionRef.current = null;
  commandProcessedRef.current = true;

  setListening(false);
  setMessage("Voice assistant stopped.");
};

  /*
   * -------------------------------------------------------
   * UI
   * -------------------------------------------------------
   */

  return (
    <div
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "10px",
      }}
    >
      {message && (
        <div
          style={{
            maxWidth: "300px",
            padding: "12px 16px",
            borderRadius: "14px",
            background: "rgba(20,20,20,0.94)",
            color: "#fff",
            fontSize: "13px",
            lineHeight: "1.4",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          {message}
        </div>
      )}

      <button
  type="button"
  onClick={
    listening
      ? stopListening
      : startListening
  }
  aria-label={
    listening
      ? "Stop voice assistant"
      : "Start voice assistant"
  }
  style={{
    width: "64px",
    height: "64px",

    borderRadius: "50%",

    border: listening
      ? "1px solid rgba(255,255,255,0.55)"
      : "1px solid rgba(232,78,104,0.22)",

    cursor: "pointer",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    background: listening
      ? "linear-gradient(145deg, #d93f5b, #ef6575)"
      : "linear-gradient(145deg, #ffffff, #fff4f1)",

    color: listening
      ? "#ffffff"
      : "#e84e68",

    boxShadow: listening
      ? "0 14px 34px rgba(232,78,104,0.30)"
      : "0 12px 30px rgba(37,27,23,0.14)",

    transition:
      "transform 220ms ease, box-shadow 220ms ease, background 220ms ease",

    outline: "none",
  }}

  onMouseEnter={(event) => {
    event.currentTarget.style.transform =
      "translateY(-3px) scale(1.03)";
  }}

  onMouseLeave={(event) => {
    event.currentTarget.style.transform =
      "translateY(0) scale(1)";
  }}
>
  {listening ? (
    <MicOff size={25} strokeWidth={2} />
  ) : (
    <Mic size={25} strokeWidth={2} />
  )}
</button>
    </div>
  );
}
