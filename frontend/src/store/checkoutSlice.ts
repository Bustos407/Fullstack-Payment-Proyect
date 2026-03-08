import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export type Step = 1 | 2 | 3 | 4;

export interface ProductSelection {
  productId: number;
  units: number;
}

export interface CardInfo {
  cardHolderName: string;
  cardNumber: string;
  cardExp: string;
  cardCvv: string;
}

export interface DeliveryInfo {
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
}

export interface PaymentSummary {
  paymentId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  totalAmount: number;
}

export interface WompiAcceptance {
  acceptanceToken: string;
  acceptPersonalAuth: string;
}

export interface CheckoutState {
  step: Step;
  productSelection?: ProductSelection;
  cardInfo?: CardInfo;
  deliveryInfo?: DeliveryInfo;
  wompiAcceptance?: WompiAcceptance;
  summary?: PaymentSummary;
}

const STORAGE_KEY = 'wompi_checkout_state';

/** Estado seguro para persistir: nunca guardar datos de tarjeta (PCI). */
type PersistedCheckoutState = Omit<CheckoutState, 'cardInfo'>;

const loadInitialState = (): CheckoutState => {
  if (typeof window === 'undefined') {
    return { step: 1 };
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { step: 1 };
    const parsed = JSON.parse(stored) as PersistedCheckoutState;
    // cardInfo nunca se persiste; si estábamos en paso 3, volver a 2 para reingresar tarjeta
    if (parsed.step === 3) {
      parsed.step = 2;
    }
    return parsed as CheckoutState;
  } catch {
    return { step: 1 };
  }
};

const persistState = (state: CheckoutState) => {
  if (typeof window === 'undefined') return;
  const safe: PersistedCheckoutState = {
    step: state.step,
    productSelection: state.productSelection,
    deliveryInfo: state.deliveryInfo,
    wompiAcceptance: state.wompiAcceptance,
    summary: state.summary,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
};

const initialState: CheckoutState = loadInitialState();

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<Step>) {
      state.step = action.payload;
      persistState(state);
    },
    setProductSelection(state, action: PayloadAction<ProductSelection>) {
      state.productSelection = action.payload;
      state.step = 2;
      persistState(state);
    },
    setCardAndDeliveryInfo(
      state,
      action: PayloadAction<{
        cardInfo: CardInfo;
        deliveryInfo: DeliveryInfo;
        wompiAcceptance?: WompiAcceptance;
      }>,
    ) {
      state.cardInfo = action.payload.cardInfo;
      state.deliveryInfo = action.payload.deliveryInfo;
      if (action.payload.wompiAcceptance) state.wompiAcceptance = action.payload.wompiAcceptance;
      state.step = 3;
      persistState(state);
    },
    setSummary(state, action: PayloadAction<PaymentSummary>) {
      state.summary = action.payload;
      state.step = 4;
      persistState(state);
    },
    reset(state) {
      state.step = 1;
      state.productSelection = undefined;
      state.cardInfo = undefined;
      state.deliveryInfo = undefined;
      state.wompiAcceptance = undefined;
      state.summary = undefined;
      persistState(state);
    },
  },
});

export const { setStep, setProductSelection, setCardAndDeliveryInfo, setSummary, reset } = checkoutSlice.actions;
export const checkoutReducer = checkoutSlice.reducer;

