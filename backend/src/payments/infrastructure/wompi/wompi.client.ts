import { createHash } from 'crypto';

const WOMPI_STATUS_APPROVED = 'APPROVED';
const WOMPI_STATUS_DECLINED = 'DECLINED';
const WOMPI_STATUS_VOIDED = 'VOIDED';
const WOMPI_STATUS_ERROR = 'ERROR';

export interface WompiCreateTransactionParams {
  reference: string;
  amountInCents: number;
  customerEmail: string;
  acceptanceToken: string;
  acceptPersonalAuth: string;
  cardToken: string;
  installments?: number;
}

export interface WompiTransactionResponse {
  data?: {
    id: string;
    status: string;
    status_message?: string;
  };
}

export type WompiFinalStatus = 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';

export interface IWompiClient {
  createTransaction(params: WompiCreateTransactionParams): Promise<WompiTransactionResponse>;
  getTransaction(id: string): Promise<WompiTransactionResponse>;
  isFinalStatus(status: string): boolean;
}

export class WompiClient implements IWompiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly privateKey: string,
    private readonly integritySecret: string,
  ) {}

  private getSignature(reference: string, amountInCents: number): string {
    const str = `${reference}${amountInCents}COP${this.integritySecret}`;
    return createHash('sha256').update(str, 'utf8').digest('hex');
  }

  async createTransaction(params: WompiCreateTransactionParams): Promise<WompiTransactionResponse> {
    const signature = this.getSignature(params.reference, params.amountInCents);
    const body = {
      acceptance_token: params.acceptanceToken,
      accept_personal_auth: params.acceptPersonalAuth,
      amount_in_cents: params.amountInCents,
      currency: 'COP',
      customer_email: params.customerEmail,
      reference: params.reference,
      signature,
      payment_method: {
        type: 'CARD',
        token: params.cardToken,
        installments: params.installments ?? 1,
      },
    };

    const res = await fetch(`${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Wompi createTransaction failed: ${res.status} ${text}`);
    }

    return res.json() as Promise<WompiTransactionResponse>;
  }

  async getTransaction(id: string): Promise<WompiTransactionResponse> {
    const res = await fetch(`${this.baseUrl}/transactions/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Wompi getTransaction failed: ${res.status} ${text}`);
    }

    return res.json() as Promise<WompiTransactionResponse>;
  }

  isFinalStatus(status: string): boolean {
    return [WOMPI_STATUS_APPROVED, WOMPI_STATUS_DECLINED, WOMPI_STATUS_VOIDED, WOMPI_STATUS_ERROR].includes(status);
  }
}
