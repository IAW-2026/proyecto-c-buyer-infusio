/**
 * Service layer for all inter-app communication.
 * Each function maps to a contract defined in 03-apis.md.
 *
 * Env vars already include the service prefix:
 *   SELLER_API_URL   = http://host/api/seller
 *   SHIPPING_API_URL = http://host/api/shipping
 *   PAYMENTS_API_URL = http://host/api/payments
 *
 * Pass the Clerk JWT `token` when calling from a server action or API route:
 *   const { getToken } = await auth();
 *   const token = await getToken();
 */

const SELLER_API_URL = process.env.SELLER_API_URL!;
const SELLER_APP_KEY = process.env.SELLER_APP_KEY!;
const SHIPPING_API_URL = process.env.SHIPPING_API_URL!;
const SHIPPING_APP_KEY = process.env.SHIPPING_APP_KEY!;
const PAYMENTS_API_URL = process.env.PAYMENTS_API_URL!;

// ─── Shared ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options?: RequestInit,
  token?: string
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[${res.status}] ${url} — ${body}`);
  }

  return res.json() as Promise<T>;
}

// All Seller App calls authenticate with the static SELLER_APP_KEY,
// not with the user's Clerk JWT.
async function sellerFetch<T>(url: string, options?: RequestInit): Promise<T> {
  return apiFetch<T>(url, {
    ...options,
    headers: { Authorization: `Bearer ${SELLER_APP_KEY}`, ...options?.headers },
  });
}

// ─── Seller App types ─────────────────────────────────────────────────────────

export interface SellerProduct {
  id: string;
  sellerId: string;
  name: string;
  description?: string;
  categories: string[];
  price: number;
  stock: number;
  imageUrl?: string | null;
  location?: string;
  unit?: string;
  isLimitedEdition?: boolean;
  badge?: string;
  availableUntil?: string | null;
  colors?: string[];
  specs?: {
    materials?: string;
    capacity?: string;
    dimensions?: {
      height?: string;
      diameter?: string;
      length?: string;
      width?: string;
      weight?: string;
    };
    care?: string;
  };
}

export interface CartItemPayload {
  product_id: string;
  product_name: string;
  product_variant: string | null;
  product_image_url: string | null;
  price_at_time: number;
  quantity: number;
  subtotal: number;
}

export interface SellerPurchaseOrder {
  purchase_order_id: string;
  user_id: string;
  shopping_cart_id: string;
  // Seller App returns lowercase — normalizeOrder() uppercases it before use
  status: "PENDING" | "PAYMENT_CONFIRMED" | "PREPARING" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  created_at: string;
  shipping_id: string | null;
  payment_id: string | null;
  payment_url: string;
  shipping_cost: number;
  currency: string;
  // Seller App returns a concatenated string e.g. "Av. Corrientes 1234, Buenos Aires, Buenos Aires"
  address: string;
  cart_items: Array<{
    id: string;
    cart_id: string;
    product_id: string;
    product_name: string;
    product_variant: string | null;
    product_image_url: string | null;
    price_at_time: number;
    quantity: number;
  }>;
}

export interface PaymentUrlResponse {
  payment_order_id: string;
  checkout_url: string;
}

// ─── Shipping App types ───────────────────────────────────────────────────────

export interface ShippingCostResponse {
  shipping_cost: number;
  currency: string;
}

export type ShipmentStatusValue =
  | "CONFIRMED"
  | "PREPARING"
  | "IN_TRANSIT"
  | "ARRIVED_CITY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "WITH_ISSUE";

export interface ShipmentTrackingResponse {
  shipping_id: string;
  status: ShipmentStatusValue;
  last_update: string;
  current_city: string;
}

export interface CreateShipmentRequest {
  order_id: string;
  buyer_id: string;
  origin_address: { address: string; postal_code: string };
  destination_address: { address: string; postal_code: string };
}

export interface CreateShipmentResponse {
  shipping_id: string;
  status: "pending";
}

// ─── Payments App types ───────────────────────────────────────────────────────

export interface PaymentChargeResponse {
  payment_order_id: string;
  checkout_url: string;
}

export type PaymentStatusValue = "pending" | "accepted" | "cancelled";

export interface PaymentStatusResponse {
  status: PaymentStatusValue;
}

export interface OpenDisputeResponse {
  dispute_id: string;
}

export type DisputeStatusValue = "open" | "resolved";

export interface DisputeStatusResponse {
  status: DisputeStatusValue;
}

// ─── Seller App ───────────────────────────────────────────────────────────────

// Seller App returns status in lowercase — normalize to uppercase to match our enums.
function normalizeOrder(order: SellerPurchaseOrder): SellerPurchaseOrder {
  return { ...order, status: order.status.toUpperCase() as SellerPurchaseOrder["status"] };
}

export async function getProducts(): Promise<SellerProduct[]> {
  const data = await sellerFetch<{ products: SellerProduct[] }>(
    `${SELLER_API_URL}/products`,
    { next: { revalidate: 60 } }
  );
  return data.products;
}

export async function getProductById(id: string): Promise<SellerProduct> {
  const data = await sellerFetch<{ product: SellerProduct }>(
    `${SELLER_API_URL}/products/${id}`,
    { next: { revalidate: 60 } }
  );
  return data.product;
}

export async function createPurchaseOrder(
  userId: string,
  cartId: string,
  address: Record<string, string | undefined>,
  cartItems: CartItemPayload[]
): Promise<SellerPurchaseOrder> {
  const order = await sellerFetch<SellerPurchaseOrder>(
    `${SELLER_API_URL}/purchase_order`,
    {
      method: "POST",
      body: JSON.stringify({ user_id: userId, shopping_cart_id: cartId, address, cart_items: cartItems }),
      cache: "no-store",
    }
  );
  return normalizeOrder(order);
}

export async function getOrdersByUser(userId: string): Promise<SellerPurchaseOrder[]> {
  const data = await sellerFetch<{ orders: SellerPurchaseOrder[] }>(
    `${SELLER_API_URL}/purchase_orders?user_id=${encodeURIComponent(userId)}`,
    { cache: "no-store" }
  );
  return data.orders.map(normalizeOrder);
}

export async function getOrderById(orderId: string): Promise<SellerPurchaseOrder> {
  const order = await sellerFetch<SellerPurchaseOrder>(
    `${SELLER_API_URL}/purchase_orders/${orderId}`,
    { cache: "no-store" }
  );
  return normalizeOrder(order);
}


// ─── Shipping App ─────────────────────────────────────────────────────────────

export async function getShippingCost(
  originPostalCode: string,
  destinationPostalCode: string,
  token?: string
): Promise<ShippingCostResponse> {
  return apiFetch<ShippingCostResponse>(
    `${SHIPPING_API_URL}/cost`,
    {
      method: "POST",
      body: JSON.stringify({
        origin_postal_code: originPostalCode,
        destination_postal_code: destinationPostalCode,
      }),
      cache: "no-store",
    },
    token
  );
}

export async function getShipmentTracking(
  shippingId: string
): Promise<ShipmentTrackingResponse> {
  return apiFetch<ShipmentTrackingResponse>(
    `${SHIPPING_API_URL}/${shippingId}`,
    { cache: "no-store", headers: { Authorization: `Bearer ${SHIPPING_APP_KEY}` } }
  );
}

export async function createShipment(
  data: CreateShipmentRequest,
  token?: string
): Promise<CreateShipmentResponse> {
  return apiFetch<CreateShipmentResponse>(
    `${SHIPPING_API_URL}`,
    {
      method: "POST",
      body: JSON.stringify(data),
      cache: "no-store",
    },
    token
  );
}

// ─── Payments App ─────────────────────────────────────────────────────────────

export async function getPaymentStatus(
  paymentOrderId: string,
  token?: string
): Promise<PaymentStatusResponse> {
  return apiFetch<PaymentStatusResponse>(
    `${PAYMENTS_API_URL}/status/${paymentOrderId}`,
    { cache: "no-store" },
    token
  );
}

export async function openDispute(
  userId: string,
  paymentOrderId: string,
  token?: string
): Promise<OpenDisputeResponse> {
  return apiFetch<OpenDisputeResponse>(
    `${PAYMENTS_API_URL}/dispute`,
    {
      method: "POST",
      body: JSON.stringify({ user_id: userId, payment_order_id: paymentOrderId }),
      cache: "no-store",
    },
    token
  );
}

export async function getDisputeStatus(
  disputeId: string,
  token?: string
): Promise<DisputeStatusResponse> {
  return apiFetch<DisputeStatusResponse>(
    `${PAYMENTS_API_URL}/dispute/${disputeId}`,
    { cache: "no-store" },
    token
  );
}
