import { describe, expect, it } from "vitest";
import { canAccessBooking } from "@/lib/services/access-control";

const active = { status: "ACTIVE" as const };

describe("access control helper", () => {
  it("allows customer to access own booking", () => {
    expect(
      canAccessBooking({ id: "customer-1", role: "CUSTOMER", ...active }, { customerId: "customer-1", cleanerId: null })
    ).toBe(true);
  });

  it("blocks customer from another customer booking", () => {
    expect(
      canAccessBooking({ id: "customer-2", role: "CUSTOMER", ...active }, { customerId: "customer-1", cleanerId: null })
    ).toBe(false);
  });

  it("allows cleaner to access assigned booking", () => {
    expect(
      canAccessBooking({ id: "cleaner-1", role: "CLEANER", ...active }, { customerId: "customer-1", cleanerId: "cleaner-1" })
    ).toBe(true);
  });

  it("blocks cleaner from unassigned booking", () => {
    expect(
      canAccessBooking({ id: "cleaner-1", role: "CLEANER", ...active }, { customerId: "customer-1", cleanerId: null })
    ).toBe(false);
  });

  it("allows admin to access all bookings", () => {
    expect(canAccessBooking({ id: "admin-1", role: "ADMIN", ...active }, { customerId: "customer-1", cleanerId: null })).toBe(true);
    expect(
      canAccessBooking({ id: "admin-1", role: "ADMIN", ...active }, { customerId: "customer-1", cleanerId: "cleaner-2" })
    ).toBe(true);
  });
});
