import axios from "axios";
import { AdminProduct, Product, ProductUpdatePayload } from "./types";

const api = axios.create({
  // Set via NEXT_PUBLIC_API_URL in frontend/.env.local (local dev) and in the
  // Vercel environment variables (production). No hardcoded fallback — a
  // missing env var should fail loudly, not silently hit localhost.
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export async function getProducts(): Promise<Product[]> {
  const response = await api.get<Product[]>("/products");
  return response.data;
}

export async function getProductById(id: string): Promise<Product> {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

/* ---------- Admin review dashboard (Day 5) ---------- */

export async function getAdminProducts(
  status: "pending_review" | "approved" | "all" = "pending_review",
  search?: string
): Promise<AdminProduct[]> {
  const response = await api.get<AdminProduct[]>("/admin/products", {
    params: { status, search: search || undefined },
  });
  // Defensive: guarantee image_urls is always a string[] (the backend stores
  // it comma-separated; older/unguarded responses may return the raw string).
  return response.data.map((p) => ({
    ...p,
    image_urls: Array.isArray(p.image_urls)
      ? p.image_urls
      : p.image_urls
        ? String(p.image_urls).split(",").map((u) => u.trim()).filter(Boolean)
        : [],
  }));
}

export async function updateProduct(
  id: number,
  patch: ProductUpdatePayload
): Promise<AdminProduct> {
  const response = await api.patch<AdminProduct>(`/admin/products/${id}`, patch);
  return response.data;
}

export async function approveProduct(
  id: number,
  basePrice?: number
): Promise<AdminProduct> {
  const response = await api.patch<AdminProduct>(
    `/admin/products/${id}/approve`,
    basePrice != null ? { base_price: basePrice } : undefined
  );
  return response.data;
}

export async function rejectProduct(id: number): Promise<{ message: string; id: number }> {
  const response = await api.delete(`/admin/products/${id}`);
  return response.data;
}

export interface UploadVideoResponse {
  message: string;
  status: string;
  file_id: string;
  note?: string;
}

export async function uploadProductVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadVideoResponse> {
  const form = new FormData();
  form.append("file", file);
  const response = await api.post<UploadVideoResponse>(
    "/admin/products/upload-video",
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    }
  );
  return response.data;
}