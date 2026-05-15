import { describe, expect, it } from "vitest";
import { BOOKING_FEE_RSD, calculatePrice, estimateDurationBySquareMeters } from "@/lib/services/pricing";

const regular = {
  code: "regular",
  hourlyRateRsd: 1100,
  minHours: 3
};

describe("pricing engine", () => {
  it("calculates duration by square meter band", () => {
    expect(estimateDurationBySquareMeters(45)).toEqual({ hours: 3, requiresAdminConfirmation: false });
    expect(estimateDurationBySquareMeters(46)).toEqual({ hours: 4, requiresAdminConfirmation: false });
    expect(estimateDurationBySquareMeters(71)).toEqual({ hours: 5, requiresAdminConfirmation: false });
    expect(estimateDurationBySquareMeters(120)).toEqual({ hours: 6, requiresAdminConfirmation: false });
  });

  it("adds add-ons into subtotal", () => {
    const price = calculatePrice({
      squareMeters: 44,
      serviceType: regular,
      addOns: [
        { code: "oven", priceRsd: 800, quantity: 1 },
        { code: "ironing", priceRsd: 700, quantity: 2 }
      ]
    });

    expect(price.basePriceRsd).toBe(3300);
    expect(price.addOnsTotalRsd).toBe(2200);
    expect(price.subtotalRsd).toBe(5500);
  });

  it("adds the fixed booking fee", () => {
    const price = calculatePrice({ squareMeters: 45, serviceType: regular });
    expect(price.bookingFeeRsd).toBe(BOOKING_FEE_RSD);
    expect(price.totalPriceRsd).toBe(3300 + BOOKING_FEE_RSD);
  });

  it("calculates cleaner payout from subtotal excluding booking fee", () => {
    const price = calculatePrice({ squareMeters: 70, serviceType: regular });
    expect(price.subtotalRsd).toBe(4400);
    expect(price.cleanerPayoutRsd).toBe(3432);
    expect(price.platformRevenueRsd).toBe(price.totalPriceRsd - 3432);
  });

  it("marks over 120 m2 for admin confirmation", () => {
    const price = calculatePrice({ squareMeters: 121, serviceType: regular });
    expect(price.requiresAdminConfirmation).toBe(true);
    expect(price.estimatedHours).toBe(7);
  });
});
