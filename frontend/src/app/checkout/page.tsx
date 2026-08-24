"use client";

import { useState } from "react";
import Link from "next/link";
import AddressForm, { AddressData } from "@/components/checkout/AddressForm";
import PaymentStep from "@/components/checkout/PaymentStep";
import { useCartStore, getCartTotal } from "@/store/cartStore";
import { getDeliveryDateRange } from "@/lib/delivery";
import Button from "@/components/ui/Button";

type Step = "address" | "payment" | "confirmation";

const STEPS: { id: Step; label: string }[] = [
  { id: "address", label: "Address" },
  { id: "payment", label: "Payment" },
  { id: "confirmation", label: "Confirmation" },
];

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<AddressData | null>(null);
  const [orderId, setOrderId] = useState("");
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const subtotal = getCartTotal(items);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;

  const handleAddressSubmit = (data: AddressData) => {
    setAddress(data);
    setStep("payment");
  };

  const handlePlaceOrder = () => {
    setOrderId(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
    setStep("confirmation");
  };

  const deliveryRange = address ? getDeliveryDateRange(address.pincode) : null;
  const currentIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            {idx > 0 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  idx < currentIdx || step === "confirmation"
                    ? "bg-indigo-600"
                    : "bg-gray-300"
                }`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx < currentIdx || step === "confirmation"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {idx + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  step === s.id ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        {step === "address" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Delivery Address
            </h2>
            <AddressForm onSubmit={handleAddressSubmit} />
          </div>
        )}

        {step === "payment" && deliveryRange && address && (
          <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">
                Estimated Delivery
              </h3>
              <p className="text-sm text-indigo-700">
                Delivering to{" "}
                <span className="font-medium">
                  {address.city} {address.pincode}
                </span>
              </p>
              <p className="text-sm text-indigo-700 font-medium">
                Arrives between {deliveryRange.minDate} – {deliveryRange.maxDate}
              </p>
            </div>

            {/* Order summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex justify-between"
                  >
                    <span className="text-gray-600">
                      {item.title} ({item.size}) × {item.quantity}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </div>

            <PaymentStep onPlaceOrder={handlePlaceOrder} />
          </div>
        )}

        {step === "confirmation" && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h2>
            <p className="text-gray-600 mb-1">
              Thank you, <span className="font-medium">{address?.fullName}</span>!
            </p>
            <p className="text-gray-600 mb-4">
              Your order ID is{" "}
              <span className="font-bold text-indigo-600">{orderId}</span>
            </p>

            <div className="bg-gray-50 p-4 rounded-lg text-left mb-6 max-w-sm mx-auto">
              <h3 className="font-semibold text-gray-900 mb-2">
                Delivery Details
              </h3>
              <p className="text-sm text-gray-600">
                {address?.addressLine1}
                {address?.addressLine2 ? `, ${address.addressLine2}` : ""}
              </p>
              <p className="text-sm text-gray-600">
                {address?.city}, {address?.state} {address?.pincode}
              </p>
              {deliveryRange && (
                <p className="text-sm text-indigo-600 font-medium mt-2">
                  Estimated arrival: {deliveryRange.minDate} –{" "}
                  {deliveryRange.maxDate}
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-left mb-6 max-w-sm mx-auto">
              <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
              <p className="text-sm text-gray-600">
                This is a demo order. No real payment was processed.
              </p>
            </div>

            <Link href="/" className="inline-block">
              <Button onClick={clearCart} size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}