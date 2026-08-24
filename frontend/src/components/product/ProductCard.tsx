"use client";

import Link from "next/link";
import { Product, getFinalPrice } from "@/lib/types";
import { useWishlistStore } from "@/store/wishlistStore";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  const finalPrice = getFinalPrice(product.base_price, product.discount_percent);
  const hasDiscount = product.discount_percent > 0;
  const primaryImage = product.image_urls?.[0] ?? null;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        productId: product.id,
        title: product.title,
        image_url: primaryImage,
        price: finalPrice,
      });
    }
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
    >
      <div className="relative">
        <div className="aspect-square bg-gray-100 overflow-hidden">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </div>
          )}
        </div>
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:scale-110 transition-transform"
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            className={`w-5 h-5 ${
              isInWishlist ? "text-red-500 fill-red-500" : "text-gray-400"
            }`}
            fill={isInWishlist ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {product.discount_percent}% OFF
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            {product.category}
          </span>
          {product.brand && (
            <span className="text-xs text-gray-500">{product.brand}</span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
        <div className="mt-2 flex items-center gap-2">
          {finalPrice > 0 ? (
            <>
              <span className="text-lg font-bold text-gray-900">₹{finalPrice}</span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.base_price}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-medium text-gray-500">
              Price on request
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}