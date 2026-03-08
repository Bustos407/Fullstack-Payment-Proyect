import {
  checkoutReducer,
  setStep,
  setProductSelection,
  setCardAndDeliveryInfo,
  setSummary,
  reset,
  type CheckoutState,
  type ProductSelection,
  type CardInfo,
  type DeliveryInfo,
  type PaymentSummary,
} from './checkoutSlice';

describe('checkoutSlice', () => {
  beforeEach(() => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const initialState: CheckoutState = { step: 1 };

  it('should have step 1 by default', () => {
    const state = checkoutReducer(undefined, { type: 'unknown' });
    expect(state.step).toBe(1);
    expect(state.productSelection).toBeUndefined();
  });

  it('setStep updates the step', () => {
    const state = checkoutReducer(initialState, setStep(3));
    expect(state.step).toBe(3);
  });

  it('setProductSelection saves selection and moves to step 2', () => {
    const selection: ProductSelection = { productId: 1, units: 2 };
    const state = checkoutReducer(initialState, setProductSelection(selection));
    expect(state.step).toBe(2);
    expect(state.productSelection).toEqual(selection);
  });

  it('setCardAndDeliveryInfo saves data and moves to step 3', () => {
    const cardInfo: CardInfo = {
      cardHolderName: 'John',
      cardNumber: '4111111111111111',
      cardExp: '12/25',
      cardCvv: '123',
    };
    const deliveryInfo: DeliveryInfo = {
      customerName: 'John Doe',
      customerEmail: 'john@test.com',
      deliveryAddress: '123 Main St',
    };
    const state = checkoutReducer(
      { ...initialState, productSelection: { productId: 1, units: 1 } },
      setCardAndDeliveryInfo({ cardInfo, deliveryInfo }),
    );
    expect(state.step).toBe(3);
    expect(state.cardInfo).toEqual(cardInfo);
    expect(state.deliveryInfo).toEqual(deliveryInfo);
  });

  it('does not persist cardInfo in localStorage (security)', () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    const cardInfo: CardInfo = {
      cardHolderName: 'John',
      cardNumber: '4111111111111111',
      cardExp: '12/25',
      cardCvv: '123',
    };
    const deliveryInfo: DeliveryInfo = {
      customerName: 'John Doe',
      customerEmail: 'john@test.com',
      deliveryAddress: '123 Main St',
    };
    checkoutReducer(
      { ...initialState, productSelection: { productId: 1, units: 1 } },
      setCardAndDeliveryInfo({ cardInfo, deliveryInfo }),
    );
    const lastCall = setItemSpy.mock.calls[setItemSpy.mock.calls.length - 1];
    const stored = JSON.parse(lastCall[1]);
    expect(stored.cardInfo).toBeUndefined();
    expect(stored.deliveryInfo).toEqual(deliveryInfo);
  });

  it('setSummary saves summary and moves to step 4', () => {
    const summary: PaymentSummary = {
      paymentId: 'uuid-1',
      status: 'APPROVED',
      totalAmount: 25000,
    };
    const state = checkoutReducer(initialState, setSummary(summary));
    expect(state.step).toBe(4);
    expect(state.summary).toEqual(summary);
  });

  it('reset clears the whole state', () => {
    const stateWithData: CheckoutState = {
      step: 3,
      productSelection: { productId: 1, units: 2 },
      cardInfo: { cardHolderName: 'A', cardNumber: '1', cardExp: '01/26', cardCvv: '1' },
      deliveryInfo: { customerName: 'A', customerEmail: 'a@b.com', deliveryAddress: 'Calle' },
    };
    const state = checkoutReducer(stateWithData, reset());
    expect(state.step).toBe(1);
    expect(state.productSelection).toBeUndefined();
    expect(state.cardInfo).toBeUndefined();
    expect(state.deliveryInfo).toBeUndefined();
    expect(state.summary).toBeUndefined();
  });
});
