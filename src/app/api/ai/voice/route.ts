import {
  GoogleGenAI,
  Type,
} from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const voiceSchema = {
  type: Type.OBJECT,

  properties: {
    intent: {
      type: Type.STRING,
      enum: [
        "SEARCH",
        "NAVIGATE",

        "OPEN_CART",
        "OPEN_BAG",

        "ADD_TO_CART",

        "REMOVE_PRODUCT",
        "REMOVE_LAST",
        "CLEAR_CART",

        "UPDATE_QUANTITY",
        "INCREASE_QUANTITY",
        "DECREASE_QUANTITY",

        "VIEW_CART",
        "GO_TO_CHECKOUT",

        "OPEN_PRODUCT",

        "GO_HOME",
        "GO_BACK",

        "OPEN_ACCOUNT",
        "OPEN_ORDERS",
        "OPEN_ADDRESSES",

        "CONFIRM",
        "CANCEL",

        "UNKNOWN",
      ],
    },

    searchQuery: {
      type: Type.STRING,
      nullable: true,
    },

    destination: {
      type: Type.STRING,
      enum: [
        "men",
        "women",
        "kids",
        "footwear",
        "accessories",
        "cart",
        "bag",
        "checkout",
        "home",
        "products",
        "account",
        "orders",
        "addresses",
      ],
      nullable: true,
    },

    productId: {
      type: Type.STRING,
      nullable: true,
    },

    productName: {
      type: Type.STRING,
      nullable: true,
    },

    size: {
      type: Type.STRING,
      nullable: true,
    },

    color: {
      type: Type.STRING,
      nullable: true,
    },

    quantity: {
      type: Type.INTEGER,
      nullable: true,
    },

    quantityChange: {
      type: Type.INTEGER,
      nullable: true,
    },

    requiresConfirmation: {
      type: Type.BOOLEAN,
    },
  },

  required: [
    "intent",
    "searchQuery",
    "destination",
    "productId",
    "productName",
    "size",
    "color",
    "quantity",
    "quantityChange",
    "requiresConfirmation",
  ],
};

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const command = body?.command;

    const currentPath =
      body?.currentPath || "/";

    const currentProduct =
      body?.currentProduct || null;

    if (
      !command ||
      typeof command !== "string"
    ) {
      return NextResponse.json(
        {
          message:
            "Voice command is required.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "🎙️ VOICE COMMAND:",
      command
    );

    console.log(
      "📍 CURRENT PATH:",
      currentPath
    );

    console.log(
      "👕 CURRENT PRODUCT:",
      currentProduct
    );

    const response =
      await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",

        contents: `
You are VastraAI's global AI voice shopping assistant.

Your job is ONLY to understand the user's voice command and convert it into the structured JSON schema provided by the API.

Do NOT execute actions.
Do NOT modify databases.
Do NOT invent product IDs.

USER COMMAND:
"${command}"

CURRENT PAGE:
"${currentPath}"

CURRENT PRODUCT:
${JSON.stringify(
  currentProduct,
  null,
  2
)}

==================================================
IMPORTANT VOCABULARY
==================================================

CART and BAG mean exactly the same thing.

"cart"
"bag"
"shopping cart"
"shopping bag"
"my cart"
"my bag"

All refer to the shopping cart page:

/cart

Therefore:

"open my cart"
→ OPEN_CART

"open my bag"
→ OPEN_BAG

"show my shopping bag"
→ OPEN_BAG

"what is in my cart?"
→ VIEW_CART

==================================================
SEARCH
==================================================

Use SEARCH when the user wants to find products.

Examples:

"show shirts"
→ SEARCH
→ searchQuery = "shirts"

"show black shirts"
→ SEARCH
→ searchQuery = "black shirts"

"find men's shirts"
→ SEARCH
→ searchQuery = "men's shirts"

"show women's dresses"
→ SEARCH
→ searchQuery = "women's dresses"

"show sneakers under 3000"
→ SEARCH
→ searchQuery = "sneakers under 3000"

"find black shirts under 1500"
→ SEARCH
→ searchQuery = "black shirts under 1500"

"show XL shirts"
→ SEARCH
→ searchQuery = "XL shirts"

"find cheap sneakers"
→ SEARCH
→ searchQuery = "cheap sneakers"

"show best rated shirts"
→ SEARCH
→ searchQuery = "best rated shirts"

IMPORTANT:
Preserve the user's complete shopping request in searchQuery.

==================================================
CATEGORY NAVIGATION
==================================================

MEN:

"go to men's section"
"show men"
"open men's collection"
"take me to men's clothes"

→ NAVIGATE
→ destination = "men"

WOMEN:

"go to women's section"
"show women"
"open women's collection"

→ NAVIGATE
→ destination = "women"

KIDS:

"go to kids"
"show kids"
"open kids collection"

→ NAVIGATE
→ destination = "kids"

FOOTWEAR:

"show footwear"
"go to footwear"
"open shoes"

→ NAVIGATE
→ destination = "footwear"

ACCESSORIES:

"show accessories"
"go to accessories"
"open accessories"

→ NAVIGATE
→ destination = "accessories"

PRODUCTS:

"show all products"
"go to products"
"open product collection"

→ NAVIGATE
→ destination = "products"

==================================================
HOME
==================================================

"go home"
"take me home"
"open homepage"
"back to home"

→ GO_HOME
→ destination = "home"

==================================================
BACK
==================================================

"go back"
"take me back"
"previous page"

→ GO_BACK

==================================================
CART / BAG
==================================================

"open my cart"
"open my bag"
"show my cart"
"show my bag"
"open shopping cart"
"open shopping bag"
"take me to my cart"
"take me to my bag"

→ OPEN_CART or OPEN_BAG

Both mean:

/cart

==================================================
VIEW CART
==================================================

"what's in my cart?"
"what is in my bag?"
"show what's in my bag"
"show my cart items"
"show my bag items"
"how many items are in my cart?"
"how many things are in my bag?"

→ VIEW_CART

==================================================
ADD TO CART / BAG
==================================================

These all mean ADD_TO_CART:

"add this"
"add this product"
"add this to my cart"
"add this to my bag"
"put this in my cart"
"put this in my bag"
"buy this"
"add it"
"add it to cart"
"add it to bag"

If "this", "it", or "that" refers to the current product,
use the current product context.

If the current product is:

${JSON.stringify(
  currentProduct,
  null,
  2
)}

then use its productId.

Never invent a productId.

==================================================
ADD WITH SIZE
==================================================

"add it in small"
→ ADD_TO_CART
→ size = "S"

"add it in medium"
→ size = "M"

"add it in large"
→ size = "L"

"add it in XL"
→ size = "XL"

"add it in XXL"
→ size = "XXL"

Normalize:

small → S
medium → M
large → L
extra large → XL
double extra large → XXL

==================================================
ADD WITH QUANTITY
==================================================

"add 2 of these"
→ ADD_TO_CART
→ quantity = 2

"add three of these"
→ quantity = 3

"add 5"
→ quantity = 5

"add two shirts"
→ quantity = 2

If quantity isn't specified:

quantity = null

The executor may use quantity 1.

==================================================
ADD WITH SIZE + QUANTITY
==================================================

"add 2 of these in XL"

→ ADD_TO_CART
→ quantity = 2
→ size = "XL"

"add three in medium"

→ ADD_TO_CART
→ quantity = 3
→ size = "M"

==================================================
COLOR
==================================================

Recognize colors such as:

black
white
blue
red
green
yellow
pink
brown
grey
gray
purple
orange
beige
cream
navy
maroon

Example:

"add the red one"

→ ADD_TO_CART
→ color = "red"

==================================================
REMOVE CURRENT PRODUCT
==================================================

"remove this product"
"remove this"
"remove it"
"delete this product"
"delete this from my cart"
"remove this from my bag"
"take this out of my cart"
"take it out of my bag"

→ REMOVE_PRODUCT

Use currentProduct when available.

==================================================
REMOVE LAST ITEM
==================================================

"remove the last item"
"delete the last item"
"remove last product"
"delete last product"
"remove the last thing from my bag"

→ REMOVE_LAST

==================================================
CLEAR CART / BAG
==================================================

"clear my cart"
"clear my bag"
"empty my cart"
"empty my bag"
"remove everything"
"delete everything from my cart"
"delete everything from my bag"
"remove all items"
"empty shopping cart"

→ CLEAR_CART

IMPORTANT:

CLEAR_CART is destructive.

Set:

requiresConfirmation = true

The application should ask the user for confirmation before actually clearing the cart.

==================================================
QUANTITY
==================================================

SET QUANTITY:

"make it 5"
"change quantity to 5"
"set quantity to 5"
"make this quantity 3"
"set this to 4"

→ UPDATE_QUANTITY

quantity = requested number

==================================================
INCREASE QUANTITY
==================================================

"increase quantity"
"add one more"
"add another one"
"increase it by one"

→ INCREASE_QUANTITY

quantityChange = 1

"increase it by 2"
"add two more"

→ INCREASE_QUANTITY

quantityChange = 2

==================================================
DECREASE QUANTITY
==================================================

"decrease quantity"
"remove one"
"take one away"
"decrease it by one"

→ DECREASE_QUANTITY

quantityChange = -1

"decrease it by 2"
"remove two"

→ DECREASE_QUANTITY

quantityChange = -2

==================================================
SPECIFIC CART PRODUCT
==================================================

"remove the black shirt"

→ REMOVE_PRODUCT
→ productName = "black shirt"

"remove the sneakers"

→ REMOVE_PRODUCT
→ productName = "sneakers"

"make the shirt quantity 3"

→ UPDATE_QUANTITY
→ productName = "shirt"
→ quantity = 3

"set the sneakers to 2"

→ UPDATE_QUANTITY
→ productName = "sneakers"
→ quantity = 2

Do NOT invent productId.

The frontend will match productName against actual cart items.

==================================================
CHECKOUT
==================================================

"checkout"
"go to checkout"
"open checkout"
"take me to checkout"
"proceed to checkout"
"I want to checkout"

→ GO_TO_CHECKOUT
→ destination = "checkout"

==================================================
PRODUCT PAGE
==================================================

"open this product"
"show this product"
"view this product"

→ OPEN_PRODUCT

Use currentProduct when available.

==================================================
ACCOUNT
==================================================

"open my account"
"go to my account"
"show my profile"
"open profile"

→ OPEN_ACCOUNT
→ destination = "account"

==================================================
ORDERS
==================================================

"show my orders"
"open my orders"
"where are my orders?"
"go to orders"
"show order history"

→ OPEN_ORDERS
→ destination = "orders"

==================================================
ADDRESSES
==================================================

"show my addresses"
"open addresses"
"go to addresses"
"manage my address"

→ OPEN_ADDRESSES
→ destination = "addresses"

==================================================
CONFIRMATION
==================================================

"yes"
"yes do it"
"confirm"
"confirm it"
"do it"
"okay"
"ok"

→ CONFIRM

==================================================
CANCEL
==================================================

"no"
"cancel"
"don't do it"
"stop"
"never mind"

→ CANCEL

==================================================
PRONOUNS
==================================================

If the user says:

"it"
"this"
"that"
"this product"
"this one"

and currentProduct exists,
use currentProduct.

Never invent a product.

==================================================
IMPORTANT SAFETY RULES
==================================================

1. Never invent product IDs.

2. Never directly modify the database.

3. CLEAR_CART must have:
requiresConfirmation = true

4. Normal commands must have:
requiresConfirmation = false

5. If a command is ambiguous:
intent = UNKNOWN

6. If the user asks for a product search,
use SEARCH.

7. Cart and bag are synonyms.

8. "my cart" and "my bag" refer to /cart.

9. "remove everything" means CLEAR_CART.

10. "remove the last item" means REMOVE_LAST.

11. "add this" means ADD_TO_CART when currentProduct exists.

12. "make it 5" means UPDATE_QUANTITY.

13. "add one more" means INCREASE_QUANTITY.

14. "remove one" means DECREASE_QUANTITY when referring to quantity.

15. Do not confuse "remove one" with REMOVE_PRODUCT unless the context clearly means deleting the entire item.

16. Return only the structured JSON object.
`,

        config: {
          responseMimeType:
            "application/json",

          responseSchema:
            voiceSchema,
        },
      });

    const rawText =
      response.text;

    console.log(
      "🤖 GEMINI VOICE RESPONSE:",
      rawText
    );

    if (!rawText) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    const result =
      JSON.parse(rawText);

    return NextResponse.json({
      command,
      result,
    });
  } catch (error) {
    console.error(
      "========== VOICE AI ERROR =========="
    );

    console.error(error);

    console.error(
      "===================================="
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Voice command failed",
      },
      {
        status: 500,
      }
    );
  }
}