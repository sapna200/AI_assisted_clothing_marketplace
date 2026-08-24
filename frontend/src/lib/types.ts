export interface Product {
  id: number;
  title: string;
  description: string;
  brand: string | null;
  category: string;
  color: string;
  sizes: string;        // comma-separated, e.g. "S,M,L,XL"
  base_price: number | null;   // null on AI drafts awaiting price confirmation
  discount_percent: number;
  image_urls: string[]; // list of display image URLs (first is primary)
  status: string;
  created_at: string;
}

export interface PricedProduct extends Product {
  final_price: number;   // computed: base_price - discount
}

export function getFinalPrice(
  basePrice: number | null,
  discountPercent: number
): number {
  // AI drafts awaiting owner review can have no price yet.
  if (basePrice == null) return 0;
  return Math.round(basePrice - (basePrice * discountPercent) / 100);
}

// Keep in sync with CATEGORIES in backend/app/services/ai_product_generator.py
export const CATEGORY_OPTIONS = [
  "T-Shirts",
  "Shirts",
  "Jeans",
  "Trousers",
  "Jackets",
  "Dresses",
  "Sweaters",
  "Activewear",
  "Kurta",
  "Kurti",
  "Saree",
  "Ethnic Wear",
  "Co-ord Sets",
  "Jewellery",
  "Accessories",
  "Other",
] as const;

// Draft row as returned by /admin/products — adds the AI suggestion fields
// that ProductOut exposes but the public storefront type doesn't need.
export interface AdminProduct extends Product {
  owner_id: number | null;
  video_url: string | null;
  suggested_price_min: number | null;
  suggested_price_max: number | null;
  detected_tag_price: number | null;
}

// Partial edit payload accepted by PATCH /admin/products/{id}
export interface ProductUpdatePayload {
  title?: string;
  description?: string;
  brand?: string | null;
  category?: string;
  color?: string;
  sizes?: string;
  base_price?: number | null;
  discount_percent?: number;
  image_urls?: string[];
}