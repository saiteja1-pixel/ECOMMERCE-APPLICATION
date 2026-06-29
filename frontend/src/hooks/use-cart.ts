import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cart-service";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export const CART_ITEMS_KEY = ["cart-items"] as const;
export const CART_COUNT_KEY = ["cart-count"] as const;

export function useCart() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // 1. Get cart items query
  const { data: cartItems = [], isLoading: isCartLoading } = useQuery({
    queryKey: CART_ITEMS_KEY,
    queryFn: () => cartService.getCartItems(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // 2. Get cart items count query
  const { data: cartCount = 0 } = useQuery({
    queryKey: CART_COUNT_KEY,
    queryFn: () => cartService.getCartCount(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });

  // 3. Add to Cart mutation
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, qty }: { productId: string; qty: number }) =>
      cartService.addToCart(productId, qty),
    onSuccess: () => {
      // Invalidate queries to trigger refresh
      queryClient.invalidateQueries({ queryKey: CART_ITEMS_KEY });
      queryClient.invalidateQueries({ queryKey: CART_COUNT_KEY });
      toast.success("Added to cart!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add item to cart.");
    },
  });

  // 4. Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.updateQuantity(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_ITEMS_KEY });
      queryClient.invalidateQueries({ queryKey: CART_COUNT_KEY });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update quantity.");
    },
  });

  // 5. Remove item mutation
  const removeFromCartMutation = useMutation({
    mutationFn: (productId: string) => cartService.removeFromCart(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_ITEMS_KEY });
      queryClient.invalidateQueries({ queryKey: CART_COUNT_KEY });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove item.");
    },
  });

  return {
    cartItems,
    cartCount: isAuthenticated ? cartCount : 0,
    isCartLoading,
    addToCart: addToCartMutation.mutateAsync,
    isAdding: addToCartMutation.isPending,
    updateQuantity: updateQuantityMutation.mutateAsync,
    removeFromCart: removeFromCartMutation.mutateAsync,
  };
}
