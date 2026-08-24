"use client";

import { useState } from "react";
import { Product, getFinalPrice } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import SizeSelector from "./SizeSelector";
import Button from "@/components/ui/Button";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeError, setShowSizeError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const addToCart = useCartStore((state) => state.addToCart);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  const finalPrice = getFinalPrice(product.base_price, product.discount_percent);
  const hasDiscount = product.discount_percent > 0;
  const images = product.image_urls ?? [];
  const primaryImage = images[selectedImageIndex] ?? images[0] ?? null;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }
    setShowSizeError(false);
    addToCart({
      productId: product.id,
      title: product.title,
      image_url: primaryImage,
      size: selectedSize,
      price: finalPrice,
      quantity: 1,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWishlistToggle = () => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-24 h-24"
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

        {images.length > 1 && (
          <div className="flex gap-2 mt-3">
            {images.map((url, index) => (
              <button
                key={url}
                onClick={() => setSelectedImageIndex(index)}
                className={`w-16 h-16 rounded border overflow-hidden transition-colors ${
                  index === selectedImageIndex
                    ? "border-indigo-600 ring-2 ring-indigo-200"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${product.title} view ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded">
            {product.category}
          </span>
          {product.brand && (
            <span className="text-sm text-gray-500">{product.brand}</span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>

        <div className="flex items-center gap-2 mb-4">
          {finalPrice > 0 ? (
            <>
              <span className="text-2xl font-bold text-gray-900">₹{finalPrice}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    ₹{product.base_price}
                  </span>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    {product.discount_percent}% OFF
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-lg font-medium text-gray-500">
              Price on request
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          <span className="font-medium">Color:</span> {product.color}
        </p>

        <SizeSelector
          sizes={product.sizes}
          selectedSize={selectedSize}
          onSelect={setSelectedSize}
        />

        {showSizeError && (
          <p className="text-sm text-red-600 mt-2">Please select a size</p>
        )}

        <div className="flex gap-4 mt-6">
          <Button onClick={handleAddToCart} size="lg" className="flex-1">
            {addedToCart ? "✓ Added to Cart" : "Add to Cart"}
          </Button>
          <Button
            onClick={handleWishlistToggle}
            variant={isInWishlist ? "danger" : "outline"}
            size="lg"
          >
            <svg
              className={`w-5 h-5 ${
                isInWishlist ? "text-white fill-white" : "text-indigo-600"
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
            {isInWishlist ? "Wishlisted" : "Wishlist"}
          </Button>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Description
          </h2>
          <p className="text-gray-700 leading-relaxed">{product.description}</p>
        </div>
      </div>
    </div>
  );
}