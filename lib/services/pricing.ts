export const BOOKING_FEE_RSD = 190;
export const CLEANER_PAYOUT_RATE = 0.78;

export type PricingServiceType = {
  code: string;
  hourlyRateRsd: number;
  minHours: number;
};

export type PricingAddOn = {
  code: string;
  priceRsd: number;
  quantity?: number;
};

export type PricingResult = {
  estimatedHours: number;
  basePriceRsd: number;
  addOnsTotalRsd: number;
  subtotalRsd: number;
  bookingFeeRsd: number;
  totalPriceRsd: number;
  cleanerPayoutRsd: number;
  platformRevenueRsd: number;
  requiresAdminConfirmation: boolean;
};

export function estimateDurationBySquareMeters(squareMeters: number) {
  if (!Number.isFinite(squareMeters) || squareMeters <= 0) {
    throw new Error("Square meters must be a positive number.");
  }

  if (squareMeters <= 45) return { hours: 3, requiresAdminConfirmation: false };
  if (squareMeters <= 70) return { hours: 4, requiresAdminConfirmation: false };
  if (squareMeters <= 95) return { hours: 5, requiresAdminConfirmation: false };
  if (squareMeters <= 120) return { hours: 6, requiresAdminConfirmation: false };

  return { hours: 7, requiresAdminConfirmation: true };
}

export function calculatePrice(params: {
  squareMeters: number;
  serviceType: PricingServiceType;
  addOns?: PricingAddOn[];
}) {
  const { hours, requiresAdminConfirmation } = estimateDurationBySquareMeters(params.squareMeters);
  const estimatedHours = Math.max(hours, params.serviceType.minHours);
  const basePriceRsd = estimatedHours * params.serviceType.hourlyRateRsd;
  const addOnsTotalRsd = (params.addOns ?? []).reduce((sum, addOn) => {
    return sum + addOn.priceRsd * Math.max(addOn.quantity ?? 1, 1);
  }, 0);
  const subtotalRsd = basePriceRsd + addOnsTotalRsd;
  const bookingFeeRsd = BOOKING_FEE_RSD;
  const totalPriceRsd = subtotalRsd + bookingFeeRsd;
  const cleanerPayoutRsd = Math.round(subtotalRsd * CLEANER_PAYOUT_RATE);
  const platformRevenueRsd = totalPriceRsd - cleanerPayoutRsd;

  return {
    estimatedHours,
    basePriceRsd,
    addOnsTotalRsd,
    subtotalRsd,
    bookingFeeRsd,
    totalPriceRsd,
    cleanerPayoutRsd,
    platformRevenueRsd,
    requiresAdminConfirmation
  } satisfies PricingResult;
}
