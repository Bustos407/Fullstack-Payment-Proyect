/**
 * Client for Wompi API (tokenization and acceptance tokens).
 * Docs: https://docs.wompi.co/docs/colombia/inicio-rapido/
 */

const getBaseUrl = () => import.meta.env.VITE_WOMPI_BASE_URL || 'https://api-sandbox.co.uat.wompi.dev/v1';
/** Sandbox public key from the challenge. Override with VITE_WOMPI_PUBLIC_KEY if needed. */
const getPublicKey = () => import.meta.env.VITE_WOMPI_PUBLIC_KEY || 'pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7';

export interface AcceptanceTokens {
  acceptanceToken: string;
  acceptPersonalAuth: string;
  termsPermalink: string;
  personalDataPermalink: string;
}

export interface MerchantResponse {
  data: {
    presigned_acceptance: {
      acceptance_token: string;
      permalink: string;
      type: string;
    };
    presigned_personal_data_auth: {
      acceptance_token: string;
      permalink: string;
      type: string;
    };
  };
}

export function isWompiEnabled(): boolean {
  return Boolean(getPublicKey());
}

/** Gets acceptance tokens for the merchant (GET /merchants/:public_key). */
export async function getAcceptanceTokens(): Promise<AcceptanceTokens> {
  const baseUrl = getBaseUrl();
  const publicKey = getPublicKey();
  if (!publicKey) throw new Error('VITE_WOMPI_PUBLIC_KEY no configurada');

  const res = await fetch(`${baseUrl}/merchants/${publicKey}`);
  if (!res.ok) throw new Error(`Wompi merchants: ${res.status}`);
  const json: MerchantResponse = await res.json();

  return {
    acceptanceToken: json.data.presigned_acceptance.acceptance_token,
    acceptPersonalAuth: json.data.presigned_personal_data_auth.acceptance_token,
    termsPermalink: json.data.presigned_acceptance.permalink,
    personalDataPermalink: json.data.presigned_personal_data_auth.permalink,
  };
}

export interface CardTokenRequest {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}

/** Tokenizes a card (POST /tokens/cards). Public key goes in Authorization. */
export async function tokenizeCard(card: CardTokenRequest): Promise<string> {
  const baseUrl = getBaseUrl();
  const publicKey = getPublicKey();
  if (!publicKey) throw new Error('VITE_WOMPI_PUBLIC_KEY is not configured');

  const res = await fetch(`${baseUrl}/tokens/cards`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${publicKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: card.number.replace(/\s/g, ''),
      cvc: card.cvc,
      exp_month: card.exp_month.padStart(2, '0'),
      exp_year: card.exp_year.length === 2 ? card.exp_year : card.exp_year.slice(-2),
      card_holder: card.card_holder,
    }),
  });

  if (!res.ok) {
    const status = res.status;
    let raw: unknown = null;
    try {
      raw = await res.json();
    } catch {
      raw = await res.text();
    }

    // Detailed log only to console for debugging, not for the end user
    // eslint-disable-next-line no-console
    console.error('Wompi tokenize error', status, raw);

    if (status === 422) {
      throw new Error('Card data is not valid. Please check number, expiration date and CVV.');
    }

    throw new Error('We could not tokenize the card. Please try again or use another test card.');
  }

  const json = await res.json();
  const token = json?.data?.id;
  if (!token) throw new Error('Wompi did not return a token');
  return token;
}
