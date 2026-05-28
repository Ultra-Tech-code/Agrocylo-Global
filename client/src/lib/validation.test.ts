import { describe, expect, it } from "vitest";
import {
  orderFormSchema,
  productFormSchema,
  barterOfferSchema,
  searchFilterSchema,
} from "@/lib/validation";

const VALID_WALLET = `G${"A".repeat(55)}`;

describe("validation schemas", () => {
  it("rejects invalid product payload", () => {
    const result = productFormSchema.safeParse({
      name: "",
      category: "Vegetables",
      pricePerUnit: 0,
      currency: "STRK",
      unit: "kg",
      stockQuantity: "",
      description: "",
      location: "",
      deliveryWindow: "",
      isAvailable: true,
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid order payload", () => {
    const result = orderFormSchema.safeParse({
      farmer: VALID_WALLET,
      amount: 10,
      deliveryDeadline: "2027-01-01T10:00",
      description: "Test order",
    });

    expect(result.success).toBe(true);
  });

  it("requires collateral amount when collateral is enabled", () => {
    const result = barterOfferSchema.safeParse({
      recipientWallet: VALID_WALLET,
      offerItems: [{ product_name: "Tomato", category: "Vegetables", quantity: "3", unit: "kg" }],
      requestItems: [{ product_name: "Corn", category: "Grains", quantity: "2", unit: "kg" }],
      expiryHours: 24,
      includeCollateral: true,
      collateralAmount: "",
      collateralCurrency: "STRK",
      notes: "",
    });

    expect(result.success).toBe(false);
  });

  it("validates search filter shape", () => {
    const result = searchFilterSchema.safeParse({
      search: "tomato",
      category: "All",
    });

    expect(result.success).toBe(true);
  });
});
