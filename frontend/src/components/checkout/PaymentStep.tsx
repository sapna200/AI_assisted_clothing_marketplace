"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface PaymentStepProps {
  onPlaceOrder: () => void;
}

type PaymentMethod = "card" | "upi" | "cod";

export default function PaymentStep({ onPlaceOrder }: PaymentStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const handlePlaceOrder = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPlaceOrder();
    }, 2000);
  };

  const methods: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: "card", label: "Credit/Debit Card", icon: "💳" },
    { id: "upi", label: "UPI", icon: "📱" },
    { id: "cod", label: "Cash on Delivery", icon: "💵" },
  ];

  const inputClass =
    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Select Payment Method
        </h3>
        <div className="space-y-3">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 border rounded-lg transition-colors ${
                selectedMethod === method.id
                  ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-gray-300 hover:border-indigo-300"
              }`}
            >
              <span className="text-2xl">{method.icon}</span>
              <span className="font-medium text-gray-800">{method.label}</span>
              {selectedMethod === method.id && (
                <span className="ml-auto text-indigo-600">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedMethod === "card" && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700">
            Card Details (for demo only, not processed)
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className={inputClass}
              placeholder="1234 5678 9012 3456"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className={inputClass}
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className={inputClass}
                placeholder="123"
                maxLength={3}
              />
            </div>
          </div>
        </div>
      )}

      {selectedMethod === "upi" && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            You'll be redirected to your UPI app to complete the payment
            (simulated in this demo).
          </p>
        </div>
      )}

      {selectedMethod === "cod" && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Pay with cash when your order arrives at your doorstep.
          </p>
        </div>
      )}

      <Button
        onClick={handlePlaceOrder}
        size="lg"
        fullWidth
        disabled={processing}
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          "Place Order"
        )}
      </Button>
    </div>
  );
}