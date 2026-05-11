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
const SHIPPING_API_URL = process.env.SHIPPING_API_URL!;
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
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface CreatePurchaseOrderResponse {
  purchase_order_id: string;
  shipping_cost: number;
  currency: string;
  checkout_url: string;
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
  | "pending"
  | "prepared"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "incident";

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

export async function getProducts(token?: string): Promise<SellerProduct[]> {
  const data = await apiFetch<{ products: SellerProduct[] }>(
    `${SELLER_API_URL}/products`,
    { next: { revalidate: 60 } },
    token
  );
  return data.products;
}

export async function getProductById(
  id: string,
  token?: string
): Promise<SellerProduct> {
  const data = await apiFetch<{ product: SellerProduct }>(
    `${SELLER_API_URL}/product/${id}`,
    { next: { revalidate: 60 } },
    token
  );
  return data.product;
}

export async function createPurchaseOrder(
  userId: string,
  address: Record<string, string | undefined>,
  items: OrderItem[],
  token?: string
): Promise<CreatePurchaseOrderResponse> {
  return apiFetch<CreatePurchaseOrderResponse>(
    `${SELLER_API_URL}/purchase_order`,
    {
      method: "POST",
      body: JSON.stringify({ user_id: userId, address, items }),
      cache: "no-store",
    },
    token
  );
}

// Returns the Mercado Pago checkout URL for a confirmed purchase order
export async function getPaymentUrl(
  purchaseOrderId: string,
  token?: string
): Promise<PaymentUrlResponse> {
  return apiFetch<PaymentUrlResponse>(
    `${SELLER_API_URL}/orders/${purchaseOrderId}/payment-url`,
    { cache: "no-store" },
    token
  );
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
  shippingId: string,
  token?: string
): Promise<ShipmentTrackingResponse> {
  return apiFetch<ShipmentTrackingResponse>(
    `${SHIPPING_API_URL}/${shippingId}`,
    { cache: "no-store" },
    token
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
