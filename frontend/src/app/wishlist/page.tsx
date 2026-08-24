"use client";

import Link from "next/link";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function WishlistPage() {
  const wishlistItems = useWishlistStore((state) => state.items);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const addToCart = useCartStore((state) => state.addToCart);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-6xl mb-4">💖</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your wishlist is empty
        </h1>
        <p className="text-gray-600 mb-6">
          Save items you love here so you can find them easily later.
        </p>
        <Link href="/">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  const handleMoveToCart = (productId: number, title: string, image_url: string | null, price: number) => {
    addToCart({
      productId,
      title,
      image_url,
      size: "Default",
      price,
      quantity: 1,
    });
    setAddedIds((prev) => new Set(prev).add(productId));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Wishlist</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map((item) => (
          <div
            key={item.productId}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="aspect-square bg-gray-100 overflow-hidden">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
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
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {item.title}
              </h3>
              <p className="text-lg font-bold text-gray-900 mt-1">
                ₹{item.price}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    handleMoveToCart(
                      item.productId,
                      item.title,
                      item.image_url,
                      item.price
                    )
                  }
                >
                  {addedIds.has(item.productId) ? "✓ Added" : "Move to Cart"}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => removeFromWishlist(item.productId)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}