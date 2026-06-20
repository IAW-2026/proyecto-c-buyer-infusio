import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/lib/prisma";
import { createPurchaseOrder, CartItemPayload } from "@/app/lib/services/externalApis";

interface AddressBody {
  email?: string;
  firstName?: string;
  lastName?: string;
  street: string;
  apartment?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  note?: string;
  [key: string]: string | undefined;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { address: AddressBody; sellerId: string | null };
  const { address, sellerId } = body;

  if (!address?.street || !address?.city || !address?.province || !address?.postalCode) {
    return NextResponse.json({ error: "Complete shipping address is required" }, { status: 400 });
  }

  const cart = await db.cart.findFirst({
    where: { userId, status: "NOT_CHECKED_OUT" },
    include: { items: true },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Separate items for the selected vendor from the rest
  const vendorItems = cart.items.filter((i) => i.sellerId === sellerId);
  const otherItems  = cart.items.filter((i) => i.sellerId !== sellerId);

  if (vendorItems.length === 0) {
    return NextResponse.json({ error: "No items found for this vendor" }, { status: 400 });
  }

  // If there are no other vendors' items, checkout the main cart directly (no split needed).
  // If there are other vendors' items, split into a CHECKOUT_PENDING sub-cart.
  let checkoutCartId = cart.id;
  let splitDone = false;

  if (otherItems.length > 0) {
    // Create the sub-cart and move vendor items into it
    const subCart = await db.cart.create({ data: { userId, status: "CHECKOUT_PENDING" } });
    checkoutCartId = subCart.id;

    await db.cartItem.createMany({
      data: vendorItems.map((item) => ({
        cartId: subCart.id,
        productId: item.productId,
        sellerId: item.sellerId,
        productName: item.productName,
        productVariant: item.productVariant,
        productImageUrl: item.productImageUrl,
        priceAtTime: item.priceAtTime,
        quantity: item.quantity,
      })),
    });

    await db.cartItem.deleteMany({
      where: { id: { in: vendorItems.map((i) => i.id) } },
    });

    splitDone = true;
  }

  const cartItems: CartItemPayload[] = vendorItems.map((item) => ({
    product_id: item.productId,
    product_name: item.productName,
    product_variant: item.productVariant ?? null,
    product_image_url: item.productImageUrl ?? null,
    price_at_time: Number(item.priceAtTime),
    quantity: item.quantity,
    subtotal: Number(item.priceAtTime) * item.quantity,
  }));

  const { postalCode, id: _id, ...rest } = address as AddressBody & { id?: string };
  const sellerAddress: Record<string, string | undefined> = { ...rest, postal_code: postalCode };

  console.log("[checkout] sending to seller:", JSON.stringify({ user_id: userId, shopping_cart_id: checkoutCartId, cart_items: cartItems, address: sellerAddress }, null, 2));

  try {
    const order = await createPurchaseOrder(userId, checkoutCartId, sellerAddress, cartItems);

    return NextResponse.json({
      purchase_order_id: order.purchase_order_id,
      shipping_cost: order.shipping_cost,
      currency: order.currency,
      payment_url: order.payment_url,
      cartId: checkoutCartId,
    });
  } catch (err) {
    // Seller API failed — reverse the split so items aren't lost
    if (splitDone) {
      await db.cartItem.createMany({
        data: vendorItems.map((item) => ({
          cartId: cart.id,
          productId: item.productId,
          sellerId: item.sellerId,
          productName: item.productName,
          productVariant: item.productVariant,
          productImageUrl: item.productImageUrl,
          priceAtTime: item.priceAtTime,
          quantity: item.quantity,
        })),
      });
      await db.cart.delete({ where: { id: checkoutCartId } });
    }
    console.error("createPurchaseOrder failed:", err);
    return NextResponse.json({ error: "Error al crear el pedido con el vendedor" }, { status: 502 });
  }
}
