'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { CartItem, CartState } from '@/types';
import { DELIVERY_DEFAULTS } from '@/lib/constants';

// ── Actions ──
type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; variantId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; variantId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_COUPON'; payload: { code: string; discount: number } }
  | { type: 'REMOVE_COUPON' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

// ── Context Shape ──
interface CartContextType extends CartState {
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  getItemQuantity: (productId: string, variantId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ── Calculate totals ──
function calculateTotals(items: CartItem[], discount: number): Pick<CartState, 'subtotal' | 'deliveryFee' | 'total' | 'itemCount'> {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = subtotal >= DELIVERY_DEFAULTS.freeThreshold ? 0 : (items.length > 0 ? DELIVERY_DEFAULTS.charge : 0);
  const total = Math.max(0, subtotal + deliveryFee - discount);
  return { subtotal, deliveryFee, total, itemCount };
}

// ── Reducer ──
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (i) => i.productId === action.payload.productId && i.variantId === action.payload.variantId
      );
      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = state.items.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }
      return { ...state, items: newItems, ...calculateTotals(newItems, state.discount) };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(
        (i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
      );
      return { ...state, items: newItems, ...calculateTotals(newItems, state.discount) };
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        const newItems = state.items.filter(
          (i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
        );
        return { ...state, items: newItems, ...calculateTotals(newItems, state.discount) };
      }
      const newItems = state.items.map((item) =>
        item.productId === action.payload.productId && item.variantId === action.payload.variantId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return { ...state, items: newItems, ...calculateTotals(newItems, state.discount) };
    }

    case 'CLEAR_CART':
      return { items: [], subtotal: 0, deliveryFee: 0, discount: 0, total: 0, couponCode: null, itemCount: 0 };

    case 'APPLY_COUPON':
      return {
        ...state,
        couponCode: action.payload.code,
        discount: action.payload.discount,
        ...calculateTotals(state.items, action.payload.discount),
      };

    case 'REMOVE_COUPON':
      return {
        ...state,
        couponCode: null,
        discount: 0,
        ...calculateTotals(state.items, 0),
      };

    case 'LOAD_CART': {
      return { ...state, items: action.payload, ...calculateTotals(action.payload, state.discount) };
    }

    default:
      return state;
  }
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
  couponCode: null,
  itemCount: 0,
};

// ── Provider ──
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ksn-cart');
      if (saved) {
        const items: CartItem[] = JSON.parse(saved);
        if (Array.isArray(items) && items.length > 0) {
          dispatch({ type: 'LOAD_CART', payload: items });
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('ksn-cart', JSON.stringify(state.items));
    } catch {
      // Silently fail
    }
  }, [state.items]);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, []);

  const removeItem = useCallback((productId: string, variantId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, variantId } });
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, variantId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const applyCoupon = useCallback((code: string, discount: number) => {
    dispatch({ type: 'APPLY_COUPON', payload: { code, discount } });
  }, []);

  const removeCoupon = useCallback(() => {
    dispatch({ type: 'REMOVE_COUPON' });
  }, []);

  const getItemQuantity = useCallback(
    (productId: string, variantId: string) => {
      const item = state.items.find((i) => i.productId === productId && i.variantId === variantId);
      return item?.quantity ?? 0;
    },
    [state.items]
  );

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ── Hook ──
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
