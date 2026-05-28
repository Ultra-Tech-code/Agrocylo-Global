"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useWallet } from "@/hooks/useWallet";
import type { CartState } from "@/types/cart";
import { useContextDebug } from "@/hooks/useContextDebug";
import {
  getActiveCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "@/services/cartService";

type CartContextType = {
  cart: CartState;
  cartLoading: boolean;
  cartError: string | null;

  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;

  itemCount: number;
  refreshCart: () => Promise<void>;

  setQuantityForProduct: (productId: string, quantity: number) => void;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

type CartStateSlice = Pick<
  CartContextType,
  "cart" | "cartLoading" | "cartError" | "drawerOpen" | "itemCount"
>;

type CartActionsSlice = Pick<
  CartContextType,
  | "setDrawerOpen"
  | "refreshCart"
  | "setQuantityForProduct"
  | "removeCartItem"
  | "clearCart"
>;

const CartContext = createContext<CartContextType | null>(null);
const CartStateContext = createContext<CartStateSlice | null>(null);
const CartActionsContext = createContext<CartActionsSlice | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { address, connected } = useWallet();

  const [cart, setCart] = useState<CartState>({ cart_id: null, groups: [] });
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const itemCount = useMemo(() => {
    return cart.groups.reduce((acc, group) => {
      return acc + group.items.reduce((sum, item) => sum + Number(item.quantity), 0);
    }, 0);
  }, [cart.groups]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const persisted = localStorage.getItem("cart.drawer.open");
    if (persisted != null) {
      setDrawerOpen(persisted === "1");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("cart.drawer.open", drawerOpen ? "1" : "0");
  }, [drawerOpen]);

  const refreshCart = useCallback(async () => {
    if (!address || !connected) return;
    setCartLoading(true);
    setCartError(null);
    try {
      const next = await getActiveCart(address);
      setCart(next);
    } catch (err) {
      setCartError(err instanceof Error ? err.message : "Failed to load cart.");
    } finally {
      setCartLoading(false);
    }
  }, [address, connected]);

  useEffect(() => {
    if (!connected || !address) return;
    void refreshCart();
  }, [connected, address, refreshCart]);

  const findItemByProductId = useCallback(
    (productId: string) => {
      for (const group of cart.groups) {
        const item = group.items.find((entry) => entry.product_id === productId);
        if (item) return { itemId: item.id, quantity: Number(item.quantity) };
      }
      return null;
    },
    [cart.groups],
  );

  const setQuantityForProduct = useCallback(
    (productId: string, quantity: number) => {
      if (!address || !connected) return;

      const nextQty = Math.max(0, Math.floor(quantity));
      if (nextQty === 0) {
        const existing = findItemByProductId(productId);
        if (!existing) return;

        void (async () => {
          try {
            if (timersRef.current[existing.itemId]) {
              clearTimeout(timersRef.current[existing.itemId]);
              delete timersRef.current[existing.itemId];
            }
            const updated = await removeCartItem(address, existing.itemId);
            setCart(updated);
          } catch (err) {
            setCartError(err instanceof Error ? err.message : "Failed to remove item.");
            void refreshCart();
          }
        })();
        return;
      }

      const existing = findItemByProductId(productId);
      if (!existing) {
        void (async () => {
          try {
            const updated = await addItemToCart(address, productId, nextQty);
            setCart(updated);
          } catch (err) {
            setCartError(err instanceof Error ? err.message : "Failed to add item.");
          }
        })();
        return;
      }

      setCart((prev) => ({
        ...prev,
        groups: prev.groups.map((group) => ({
          ...group,
          items: group.items.map((item) =>
            item.id === existing.itemId ? { ...item, quantity: String(nextQty) } : item,
          ),
        })),
      }));

      if (timersRef.current[existing.itemId]) {
        clearTimeout(timersRef.current[existing.itemId]);
      }

      timersRef.current[existing.itemId] = setTimeout(() => {
        void (async () => {
          try {
            const updated = await updateCartItemQuantity(address, existing.itemId, nextQty);
            setCart(updated);
          } catch (err) {
            setCartError(
              err instanceof Error ? err.message : "Failed to update cart item.",
            );
            void refreshCart();
          } finally {
            delete timersRef.current[existing.itemId];
          }
        })();
      }, 500);
    },
    [address, connected, findItemByProductId, refreshCart],
  );

  const removeCartItemFn = useCallback(
    async (itemId: string) => {
      if (!address) return;
      if (timersRef.current[itemId]) {
        clearTimeout(timersRef.current[itemId]);
        delete timersRef.current[itemId];
      }
      const updated = await removeCartItem(address, itemId);
      setCart(updated);
    },
    [address],
  );

  const clearCartFn = useCallback(async () => {
    if (!address) return;
    const updated = await clearCart(address);
    setCart(updated);
  }, [address]);

  const stateValue = useMemo<CartStateSlice>(
    () => ({
      cart,
      cartLoading,
      cartError,
      drawerOpen,
      itemCount,
    }),
    [cart, cartLoading, cartError, drawerOpen, itemCount],
  );

  const actionsValue = useMemo<CartActionsSlice>(
    () => ({
      setDrawerOpen,
      refreshCart,
      setQuantityForProduct,
      removeCartItem: removeCartItemFn,
      clearCart: clearCartFn,
    }),
    [refreshCart, setQuantityForProduct, removeCartItemFn, clearCartFn],
  );

  const contextValue = useMemo<CartContextType>(
    () => ({
      ...stateValue,
      ...actionsValue,
    }),
    [stateValue, actionsValue],
  );

  useContextDebug("cart-state", stateValue);

  return (
    <CartActionsContext.Provider value={actionsValue}>
      <CartStateContext.Provider value={stateValue}>
        <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
      </CartStateContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function useCartState() {
  const ctx = useContext(CartStateContext);
  if (!ctx) throw new Error("useCartState must be used within CartProvider");
  return ctx;
}

export function useCartActions() {
  const ctx = useContext(CartActionsContext);
  if (!ctx) throw new Error("useCartActions must be used within CartProvider");
  return ctx;
}

export function useCartSelector<T>(selector: (state: CartStateSlice) => T): T {
  const state = useCartState();
  return selector(state);
}
