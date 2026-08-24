export interface DeliveryEstimate {
  minDays: number;
  maxDays: number;
}

export function getEstimatedDelivery(pincode: string): DeliveryEstimate {
  // Simple heuristic: metro cities (starting with common metro pincode prefixes)
  // get faster delivery (3-5 days), others get standard (5-8 days)
  const metroPrefixes = ["11", "40", "56", "60", "70", "80", "90"];
  const firstTwo = pincode.substring(0, 2);

  if (metroPrefixes.includes(firstTwo)) {
    return { minDays: 3, maxDays: 5 };
  }
  return { minDays: 5, maxDays: 8 };
}

export function formatDeliveryDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function getDeliveryDateRange(pincode: string): {
  minDate: string;
  maxDate: string;
} {
  const { minDays, maxDays } = getEstimatedDelivery(pincode);
  return {
    minDate: formatDeliveryDate(minDays),
    maxDate: formatDeliveryDate(maxDays),
  };
}