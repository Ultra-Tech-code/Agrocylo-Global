import { z } from "zod";

const productCategories = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Tubers",
  "Livestock",
  "Other",
] as const;

const productCurrencies = ["STRK", "USDC"] as const;
const productUnits = ["kg", "bag", "crate", "piece", "litre", "dozen"] as const;

const walletAddressSchema = z
  .string()
  .trim()
  .min(1, "Wallet address is required.")
  .regex(/^[A-Za-z0-9]{8,}$/, "Invalid wallet address format.");

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  category: z.enum(productCategories, { message: "Select a category." }),
  pricePerUnit: z.coerce.number().positive("Price must be greater than 0."),
  currency: z.enum(productCurrencies),
  unit: z.enum(productUnits),
  stockQuantity: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : ""))
    .refine((value) => value === "" || Number(value) >= 0, {
      message: "Stock quantity must be 0 or more.",
    }),
  description: z.string().max(1000, "Description is too long.").optional(),
  location: z.string().trim().min(1, "Location is required."),
  deliveryWindow: z.string().trim().min(1, "Delivery window is required."),
  isAvailable: z.boolean(),
});

const barterItemSchema = z.object({
  product_name: z.string().trim().min(1, "Product name is required."),
  category: z.enum(productCategories),
  quantity: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, "Quantity must be greater than 0."),
  unit: z.enum(productUnits),
});

export const barterOfferSchema = z
  .object({
    recipientWallet: walletAddressSchema,
    offerItems: z.array(barterItemSchema).min(1, "Add at least one offer item."),
    requestItems: z
      .array(barterItemSchema)
      .min(1, "Add at least one requested item."),
    expiryHours: z.coerce.number().int().positive(),
    includeCollateral: z.boolean(),
    collateralAmount: z.string().optional(),
    collateralCurrency: z.enum(productCurrencies),
    notes: z.string().max(500, "Notes must be 500 characters or less."),
  })
  .superRefine((data, ctx) => {
    if (data.includeCollateral && (!data.collateralAmount || Number(data.collateralAmount) <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Collateral amount must be a positive number.",
        path: ["collateralAmount"],
      });
    }
  });

export const profileFormSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required."),
  bio: z.string().max(280, "Bio must be 280 characters or less."),
});

export const locationFormSchema = z.object({
  city: z.string().trim().min(1, "City is required."),
  country: z.string().trim().min(1, "Country is required."),
  isPublic: z.boolean(),
});

export const orderFormSchema = z.object({
  farmer: walletAddressSchema,
  amount: z.coerce.number().positive("Amount must be greater than 0."),
  deliveryDeadline: z.string().min(1, "Delivery deadline is required."),
  description: z.string().max(500, "Description is too long."),
});

export const searchFilterSchema = z.object({
  search: z.string().max(100, "Search query is too long."),
  category: z.union([z.literal("All"), z.enum(productCategories)]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type BarterOfferFormValues = z.infer<typeof barterOfferSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type LocationFormValues = z.infer<typeof locationFormSchema>;
export type OrderFormValues = z.infer<typeof orderFormSchema>;
export type SearchFilterValues = z.infer<typeof searchFilterSchema>;
