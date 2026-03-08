/**
 * Tarifas de checkout. Deben coincidir con el backend para que el total sea correcto.
 */
export const BASE_FEE = 2000;
export const DELIVERY_FEE = 5000;

export function calculateCheckoutTotal(subtotal: number): number {
  return subtotal + BASE_FEE + DELIVERY_FEE;
}
