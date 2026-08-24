"use client";

import Link from "next/link";
import { useCartStore, getCartTotal } from "@/store/cartStore";
import Button from "@/components/ui/Button";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const subtotal = getCartTotal(items);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your cart is empty
        </h1>
        <p className="text-gray-600 mb-6">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link href="/">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                    🛍️
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">Size: {item.size}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  ₹{item.price}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.size, item.quantity - 1)
                  }
                  className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  −
                </button>
                <span className="w-10 text-center font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.size, item.quantity + 1)
                  }
                  className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>

              <div className="text-right">
                <p className="font-bold text-gray-900">
                  ₹{item.price * item.quantity}
                </p>
                <button
                  onClick={() => removeFromCart(item.productId, item.size)}
                  className="text-sm text-red-600 hover:text-red-700 mt-1"
                >
                  <svg
                    className="w-5 h-5 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {shipping === 0 ? "FREE" : `₹${shipping}`}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-gray-500">
                Free shipping on orders above ₹999
              </p>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
          <Link href="/checkout" className="block mt-6">
            <Button size="lg" fullWidth>
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}