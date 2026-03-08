/**
 * Detects the card brand by the number (BIN).
 * Visa: starts with 4
 * Mastercard: 51-55 or 2221-2720
 * American Express: 34 or 37
 */
export type CardBrand = 'visa' | 'mastercard' | 'amex';

export function getCardBrand(cardNumber: string): CardBrand | null {
  const digits = cardNumber.replace(/\s/g, '');
  if (digits.length < 4) return null;

  const first = digits.slice(0, 1);
  const firstTwo = digits.slice(0, 2);
  const firstFour = digits.slice(0, 4);

  if (first === '4') return 'visa';

  if (firstTwo === '34' || firstTwo === '37') return 'amex';

  const two = parseInt(firstTwo, 10);
  const four = parseInt(firstFour, 10);
  if ((two >= 51 && two <= 55) || (four >= 2221 && four <= 2720)) return 'mastercard';

  return null;
}
