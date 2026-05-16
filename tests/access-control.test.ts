import { describe, expect, it } from "vitest";
import { canAccessBooking, canUpdateOwnProfile, canViewPrivateContact } from "@/lib/services/access-control";

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

  it("allows users to update only their own profile for their role", () => {
    expect(canUpdateOwnProfile({ id: "customer-1", role: "CUSTOMER", ...active }, "customer-1", "CUSTOMER")).toBe(true);
    expect(canUpdateOwnProfile({ id: "customer-1", role: "CUSTOMER", ...active }, "customer-2", "CUSTOMER")).toBe(false);
    expect(canUpdateOwnProfile({ id: "cleaner-1", role: "CLEANER", ...active }, "cleaner-1", "CLEANER")).toBe(true);
  });

  it("keeps customer and cleaner private contacts hidden from each other", () => {
    expect(
      canViewPrivateContact({ id: "customer-1", role: "CUSTOMER", ...active }, { id: "cleaner-1", role: "CLEANER" })
    ).toBe(false);
    expect(
      canViewPrivateContact({ id: "cleaner-1", role: "CLEANER", ...active }, { id: "customer-1", role: "CUSTOMER" })
    ).toBe(false);
    expect(canViewPrivateContact({ id: "admin-1", role: "ADMIN", ...active }, { id: "customer-1", role: "CUSTOMER" })).toBe(true);
  });
});
