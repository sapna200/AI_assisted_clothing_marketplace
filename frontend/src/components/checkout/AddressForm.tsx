"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export interface AddressData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

interface AddressFormProps {
  onSubmit: (address: AddressData) => void;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export default function AddressForm({ onSubmit }: AddressFormProps) {
  const [form, setForm] = useState<AddressData>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field as user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (!form.addressLine1.trim()) {
      newErrors.addressLine1 = "Address line 1 is required";
    }

    if (!form.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!form.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!form.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  const inputClass = (hasError?: string) =>
    `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
      hasError ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            className={inputClass(errors.fullName)}
            placeholder="John Doe"
          />
          {errors.fullName && (
            <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={inputClass(errors.phone)}
            placeholder="9876543210"
          />
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 *
        </label>
        <input
          type="text"
          name="addressLine1"
          value={form.addressLine1}
          onChange={handleChange}
          className={inputClass(errors.addressLine1)}
          placeholder="House no, Street, Area"
        />
        {errors.addressLine1 && (
          <p className="text-sm text-red-600 mt-1">{errors.addressLine1}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2 (Optional)
        </label>
        <input
          type="text"
          name="addressLine2"
          value={form.addressLine2}
          onChange={handleChange}
          className={inputClass()}
          placeholder="Landmark, Building"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            className={inputClass(errors.city)}
            placeholder="Mumbai"
          />
          {errors.city && (
            <p className="text-sm text-red-600 mt-1">{errors.city}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            type="text"
            name="state"
            value={form.state}
            onChange={handleChange}
            className={inputClass(errors.state)}
            placeholder="Maharashtra"
          />
          {errors.state && (
            <p className="text-sm text-red-600 mt-1">{errors.state}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pincode *
          </label>
          <input
            type="text"
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
            className={inputClass(errors.pincode)}
            placeholder="400001"
            maxLength={6}
          />
          {errors.pincode && (
            <p className="text-sm text-red-600 mt-1">{errors.pincode}</p>
          )}
        </div>
      </div>

      <Button type="submit" size="lg" fullWidth>
        Continue to Payment
      </Button>
    </form>
  );
}