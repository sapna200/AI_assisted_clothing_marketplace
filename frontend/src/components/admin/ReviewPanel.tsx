"use client";

import { useMemo, useState } from "react";
import {
  AdminProduct,
  CATEGORY_OPTIONS,
  ProductUpdatePayload,
} from "@/lib/types";
import { approveProduct, rejectProduct, updateProduct } from "@/lib/api";
import Button from "@/components/ui/Button";

const SIZE_SUGGESTIONS = [
  "XS", "S", "M", "L", "XL", "XXL",
  "28", "30", "32", "34", "36", "38", "40",
];

interface ReviewPanelProps {
  product: AdminProduct;
  onChanged: () => void;
  onToast: (message: string, type: "success" | "error") => void;
}

export default function ReviewPanel({
  product,
  onChanged,
  onToast,
}: ReviewPanelProps) {
  const initial = useMemo(
    () => ({
      title: product.title,
      description: product.description,
      brand: product.brand ?? "",
      category: product.category,
      color: product.color,
      sizes: product.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      images: [...product.image_urls],
      discount: String(product.discount_percent ?? 0),
      // Smart prefill: tag price -> suggested min -> blank.
      sellingPrice:
        product.detected_tag_price?.toString() ??
        product.suggested_price_min?.toString() ??
        "",
    }),
    [product]
  );

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [brand, setBrand] = useState(initial.brand);
  const [category, setCategory] = useState(initial.category);
  const [color, setColor] = useState(initial.color);
  const [sizes, setSizes] = useState<string[]>(initial.sizes);
  const [sizeInput, setSizeInput] = useState("");
  const [images, setImages] = useState<string[]>(initial.images);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [sellingPrice, setSellingPrice] = useState(initial.sellingPrice);
  const [discount, setDiscount] = useState(initial.discount);

  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    title !== initial.title ||
    description !== initial.description ||
    brand !== initial.brand ||
    category !== initial.category ||
    color !== initial.color ||
    sizes.join(",") !== initial.sizes.join(",") ||
    images.join("|") !== initial.images.join("|") ||
    sellingPrice !== initial.sellingPrice ||
    discount !== initial.discount;

  const buildPatch = (): ProductUpdatePayload => {
    const patch: ProductUpdatePayload = {};
    if (title !== initial.title) patch.title = title;
    if (description !== initial.description) patch.description = description;
    if (brand !== initial.brand) patch.brand = brand || null;
    if (category !== initial.category) patch.category = category;
    if (color !== initial.color) patch.color = color;
    if (sizes.join(",") !== initial.sizes.join(","))
      patch.sizes = sizes.join(",");
    if (images.join("|") !== initial.images.join("|"))
      patch.image_urls = images;
    if (discount !== initial.discount)
      patch.discount_percent = Math.max(
        0,
        Math.min(90, parseInt(discount || "0", 10) || 0)
      );
    if (sellingPrice !== initial.sellingPrice)
      patch.base_price = sellingPrice === "" ? null : Number(sellingPrice);
    return patch;
  };

  const errDetail = (err: unknown, fallback: string): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.response?.data?.detail;
    return detail != null ? String(detail) : fallback;
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await updateProduct(product.id, buildPatch());
      onToast("Changes saved ✓", "success");
      onChanged(); // refetch so the panel re-bases its original snapshot
    } catch (err) {
      setError(errDetail(err, "Failed to save changes"));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    const priceNum = sellingPrice === "" ? null : Number(sellingPrice);
    const ok = window.confirm(
      `Publish "${title}" at ₹${priceNum ?? "(no price)"}?\nIt will appear on the storefront immediately.${
        dirty ? "\n\nYour unsaved edits (sizes, images, etc.) will be saved too." : ""
      }`
    );
    if (!ok) return;
    setError("");
    setApproving(true);
    try {
      // Auto-save any unsaved panel edits FIRST so removed images / added
      // custom sizes are included in what gets published.
      if (dirty) {
        await updateProduct(product.id, buildPatch());
      }
      await approveProduct(
        product.id,
        priceNum != null && !Number.isNaN(priceNum) ? priceNum : undefined
      );
      onToast("Published! It is live on the storefront 🎉", "success");
      onChanged();
    } catch (err) {
      setError(errDetail(err, "Failed to approve"));
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(`Reject and permanently delete "${title}"?`)) return;
    setError("");
    setRejecting(true);
    try {
      await rejectProduct(product.id);
      onToast("Draft rejected and deleted", "success");
      onChanged();
    } catch (err) {
      setError(errDetail(err, "Failed to reject draft"));
    } finally {
      setRejecting(false);
    }
  };

  const toggleSize = (size: string) =>
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );

  const addCustomSize = () => {
    const value = sizeInput.trim();
    if (value && !sizes.includes(value)) setSizes([...sizes, value]);
    setSizeInput("");
  };

  const makePrimary = (url: string) =>
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);

  const removeImage = (url: string) =>
    setImages((prev) => prev.filter((u) => u !== url));

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (url && !images.includes(url)) setImages([...images, url]);
    setImageUrlInput("");
  };

  const chipClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm border transition-colors ${
      active
        ? "bg-indigo-600 text-white border-indigo-600"
        : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
    }`;

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6 space-y-6">
      {/* Image manager */}
      <div>
        <span className={labelClass}>
          Images (click one to make it primary · first shows on storefront)
        </span>
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={url} className="relative">
              <button onClick={() => makePrimary(url)} title="Make primary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`image ${i + 1}`}
                  className={`w-20 h-20 object-cover rounded border-2 ${
                    i === 0
                      ? "border-indigo-600 ring-2 ring-indigo-200"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-indigo-600 text-white text-[10px] text-center rounded-b">
                  primary
                </span>
              )}
              <button
                onClick={() => removeImage(url)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none"
                title="Remove image"
              >
                ×
              </button>
            </div>
          ))}
          <input
            type="text"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addImageUrl()}
            placeholder="＋ paste image URL, press Enter"
            className="w-56 px-2 py-2 text-sm border border-dashed border-gray-300 rounded"
          />
        </div>
        <a
          href={product.video_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-sm text-indigo-600 hover:underline"
        >
          Open source video ↗
        </a>
      </div>

      {/* Text fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Brand (leave blank if none)</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Color</label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Discount %</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={90}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className={`${inputClass} pr-8`}
            />
            <span className="absolute right-3 top-2.5 text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Sizes chip editor */}
      <div>
        <span className={labelClass}>Available sizes (click to toggle)</span>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...SIZE_SUGGESTIONS, ...sizes])].map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={chipClass(sizes.includes(size))}
            >
              {size}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomSize()}
            placeholder="custom size…"
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg w-36"
          />
          <Button size="sm" variant="secondary" onClick={addCustomSize}>
            Add size
          </Button>
        </div>
      </div>

      {/* Price block — three visually distinct inputs */}
      <div>
        <span className={labelClass}>Pricing</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Tag price (AI read)
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {product.detected_tag_price != null
                ? `₹${product.detected_tag_price}`
                : "—"}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Suggested range (AI)
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {product.suggested_price_min != null &&
              product.suggested_price_max != null
                ? `₹${product.suggested_price_min} – ₹${product.suggested_price_max}`
                : "—"}
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <label className="text-xs font-medium text-indigo-700 mb-1 block">
              Your selling price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₹</span>
              <input
                type="number"
                min={0}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="set a price"
                className="w-full pl-7 pr-2 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-gray-50 pt-3 pb-1 border-t border-gray-200">
        {dirty && (
          <p className="text-xs text-amber-600 mb-2">
            ● You have unsaved changes — Approve &amp; Publish will save them
            automatically.
          </p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approving}
            className="!bg-green-600 hover:!bg-green-700 focus:!ring-green-500"
          >
            {approving ? "Approving…" : "Approve & Publish"}
          </Button>
          <Button
            onClick={handleReject}
            disabled={rejecting}
            variant="danger"
            className="ml-auto"
          >
            {rejecting ? "Rejecting…" : "Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}