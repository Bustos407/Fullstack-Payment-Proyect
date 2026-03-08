/** Tarifas usadas en el cálculo del total (deben coincidir con el frontend). */
export const BASE_FEE = 2000;
export const DELIVERY_FEE = 5000;

export function calculateTotal(subtotal: number): number {
  return subtotal + BASE_FEE + DELIVERY_FEE;
}
