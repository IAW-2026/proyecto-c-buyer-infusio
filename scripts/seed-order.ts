import { db } from "../app/lib/prisma";

async function main() {
  const user = await db.user.findUnique({
    where: { email: "milivives@gmail.com" },
    select: { id: true, name: true },
  });

  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  console.log("Found user:", user);

  // Create a checked-out cart
  const cart = await db.cart.create({
    data: {
      userId: user.id,
      status: "CHECKED_OUT",
      items: {
        create: {
          productId: "prod-seed-001",
          productName: "Yerba Mate CBSe Energía 500g",
          productVariant: "500G",
          productImageUrl: null,
          priceAtTime: 2500,
          quantity: 2,
        },
      },
    },
  });

  // Create the purchase order
  const order = await db.purchaseOrder.create({
    data: {
      cartId: cart.id,
      userId: user.id,
      status: "CONFIRMED",
      shippingId: "SHIP-F3887B25",
      paymentUrl: "",
      userAddress: {
        street: "Sampay 1030",
        city: "Bahía Blanca",
        province: "Buenos Aires",
        postal_code: "8000",
        country: "Argentina",
        firstName: "Mili",
        lastName: "Vives",
      },
      packages: {
        create: {
          sellerId: "seller-seed-001",
          buyerId: user.id,
          amount: 5000,
          shippingCost: 1500,
          items: {
            create: {
              productId: "prod-seed-001",
              productName: "Yerba Mate CBSe Energía 500g",
              unitPrice: 2500,
              quantity: 2,
              subtotal: 5000,
            },
          },
        },
      },
    },
  });

  console.log("Created order:", order.id, "| shippingId:", order.shippingId);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect?.());
