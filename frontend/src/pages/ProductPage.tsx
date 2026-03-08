import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  ProductSelection,
  setProductSelection,
  setCardAndDeliveryInfo,
  setSummary,
  reset,
  CardInfo,
  DeliveryInfo,
} from '../store/checkoutSlice';
import { isWompiEnabled, getAcceptanceTokens, tokenizeCard, type AcceptanceTokens } from '../api/wompi';
import { getCardBrand } from '../utils/cardBrand';
import { CardBrandLogo } from '../components/CardBrandLogo';
import { BASE_FEE, DELIVERY_FEE, calculateCheckoutTotal } from '../constants/fees';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export const ProductPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const checkout = useSelector((state: RootState) => state.checkout);

  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<ProductSelection>({ productId: 0, units: 1 });
  const [showCardModal, setShowCardModal] = useState(false);
  const [showSummaryBackdrop, setShowSummaryBackdrop] = useState(false);

  const [cardInfo, setCardInfo] = useState<CardInfo>({
    cardHolderName: '',
    cardNumber: '',
    cardExp: '',
    cardCvv: '',
  });
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    customerName: '',
    customerEmail: '',
    deliveryAddress: '',
  });
  const [acceptance, setAcceptance] = useState<AcceptanceTokens | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPersonal, setAcceptPersonal] = useState(false);
  const [summaryProduct, setSummaryProduct] = useState<Product | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCvv, setShowCvv] = useState(false);

  useEffect(() => {
    axios
      .get<Product[]>('/api/products')
      .then((res) => setProducts(res.data))
      .catch(() => {});
  }, []);

  const wompiEnabled = isWompiEnabled();
  const cardBrand = getCardBrand(cardInfo.cardNumber);

  useEffect(() => {
    if (!wompiEnabled || !showCardModal) return;
    getAcceptanceTokens()
      .then(setAcceptance)
      .catch(() => setAcceptance(null));
  }, [wompiEnabled, showCardModal]);

  useEffect(() => {
    if (!showSummaryBackdrop || !checkout.productSelection) return;
    axios
      .get<Product[]>('/api/products')
      .then((res) => {
        const found = res.data.find((p) => p.id === checkout.productSelection?.productId);
        if (found) setSummaryProduct(found);
      })
      .catch(() => {});
  }, [showSummaryBackdrop, checkout.productSelection?.productId]);

  // Evitar scroll del contenido de fondo cuando hay modal o backdrop abiertos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { classList } = document.body;
    if (showCardModal || showSummaryBackdrop) {
      classList.add('no-scroll');
    } else {
      classList.remove('no-scroll');
    }
    return () => {
      classList.remove('no-scroll');
    };
  }, [showCardModal, showSummaryBackdrop]);

  const handlePayWithCard = () => {
    if (!selected.productId || selected.units <= 0) return;
    dispatch(setProductSelection(selected));
    setShowCardModal(true);
  };

  const handleCardModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wompiAcceptance =
      wompiEnabled && acceptance && acceptTerms && acceptPersonal
        ? { acceptanceToken: acceptance.acceptanceToken, acceptPersonalAuth: acceptance.acceptPersonalAuth }
        : undefined;
    dispatch(setCardAndDeliveryInfo({ cardInfo, deliveryInfo, wompiAcceptance }));
    setShowCardModal(false);
    setShowSummaryBackdrop(true);
    setPaymentError(null);
  };

  const handleCloseCardModal = () => setShowCardModal(false);

  const handleConfirmPayment = async () => {
    if (!checkout.wompiAcceptance || !checkout.cardInfo || !checkout.productSelection || !checkout.deliveryInfo) {
      setPaymentError('Missing data. Close and complete card and delivery details again.');
      return;
    }
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const [expMonth, expYear] = checkout.cardInfo.cardExp.split('/').map((s) => s.trim());
      const cardToken = await tokenizeCard({
        number: checkout.cardInfo.cardNumber,
        cvc: checkout.cardInfo.cardCvv,
        exp_month: expMonth || '01',
        exp_year: expYear || '28',
        card_holder: checkout.cardInfo.cardHolderName,
      });
      const response = await axios.post('/api/payments', {
        productId: checkout.productSelection.productId,
        units: checkout.productSelection.units,
        cardToken,
        acceptanceToken: checkout.wompiAcceptance.acceptanceToken,
        acceptPersonalAuth: checkout.wompiAcceptance.acceptPersonalAuth,
        installments: 1,
        customerName: checkout.deliveryInfo.customerName,
        customerEmail: checkout.deliveryInfo.customerEmail,
        deliveryAddress: checkout.deliveryInfo.deliveryAddress,
      });
      const payment = response.data;
      const units = checkout.productSelection.units;
      const price = summaryProduct ? Number(summaryProduct.price) : 0;
      const subtotal = price * units;
      const total = calculateCheckoutTotal(subtotal);
      dispatch(setSummary({ paymentId: payment.id, status: payment.status, totalAmount: total }));
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        const data: any = err.response.data;
        const backendMessage = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;

        if (status === 400 && backendMessage) {
          setPaymentError(`We could not complete the payment for the following reason: ${backendMessage}`);
        } else if (backendMessage) {
          setPaymentError(`We could not process the payment: ${backendMessage}`);
        } else {
          setPaymentError(`We could not process the payment (status code ${status}).`);
        }
      } else {
        const message = err instanceof Error ? err.message : 'We could not process the payment';
        setPaymentError(message);
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleBackToCard = () => {
    setShowSummaryBackdrop(false);
    setShowCardModal(true);
    setPaymentError(null);
  };

  const handleExitAfterError = () => {
    setShowSummaryBackdrop(false);
    setShowCardModal(false);
    setPaymentError(null);
    dispatch(reset());
    axios
      .get<Product[]>('/api/products')
      .then((res) => setProducts(res.data))
      .catch(() => {});
  };

  const handleBackToProducts = () => {
    dispatch(reset());
    setShowSummaryBackdrop(false);
    setSummaryProduct(null);
    setPaymentError(null);
    axios.get<Product[]>('/api/products').then((res) => setProducts(res.data)).catch(() => {});
  };

  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    const formatted = groups ? groups.join(' ') : '';
    setCardInfo((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleCardExpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setCardInfo((prev) => ({ ...prev, cardExp: formatted }));
  };

  const handleCardCvvChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setCardInfo((prev) => ({ ...prev, cardCvv: digits }));
  };

  const units = checkout.productSelection?.units ?? 0;
  const price = summaryProduct ? Number(summaryProduct.price) : 0;
  const subtotal = price * units;
  const total = calculateCheckoutTotal(subtotal);
  const showResult = Boolean(checkout.summary);

  return (
    <>
      <section>
        <h2>Products</h2>
        <p className="text-muted">Select a product, choose units and pay with credit card.</p>
        <div className="card-list">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              className={`card ${selected.productId === product.id ? 'card--selected' : ''}`}
              onClick={() => setSelected((prev) => ({ ...prev, productId: product.id }))}
            >
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p className="price">${Number(product.price).toLocaleString()}</p>
              <p className="stock">Stock: {product.stock}</p>
            </button>
          ))}
        </div>
        <div className="form-row">
          <label htmlFor="units">
            Units
            <input
              id="units"
              type="number"
              min={1}
              value={selected.units}
              onChange={(e) => setSelected((prev) => ({ ...prev, units: Number(e.target.value) }))}
            />
          </label>
        </div>
        <div className="actions">
          <button
            type="button"
            className="primary"
            onClick={handlePayWithCard}
            disabled={!selected.productId || selected.units <= 0}
          >
            Pay with credit card
          </button>
        </div>
      </section>

      {/* Modal: Credit Card + Delivery */}
      {showCardModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal">
            <h2 id="modal-title">Card and delivery details</h2>
            <form onSubmit={handleCardModalSubmit} className="form-grid">
              <div className="card">
                <h3>Credit card</h3>
                <label>
                  Cardholder name
                  <input
                    type="text"
                    value={cardInfo.cardHolderName}
                    onChange={(e) => setCardInfo((p) => ({ ...p, cardHolderName: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Card number
                  <div className="input-with-logo">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={19}
                      value={cardInfo.cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      required
                    />
                    {cardBrand && <CardBrandLogo brand={cardBrand} />}
                  </div>
                </label>
                <div className="form-row-inline">
                  <label>
                    Expiration (MM/YY)
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={cardInfo.cardExp}
                      onChange={(e) => handleCardExpChange(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    CVV
                    <div className="input-with-toggle">
                      <input
                        type={showCvv ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={4}
                        value={cardInfo.cardCvv}
                        onChange={(e) => handleCardCvvChange(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-visibility"
                        onClick={() => setShowCvv((prev) => !prev)}
                        aria-label={showCvv ? 'Hide CVV' : 'Show CVV'}
                      >
                        {showCvv ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>
                </div>
              </div>
              <div className="card">
                <h3>Delivery details</h3>
                <label>
                  Full name
                  <input
                    type="text"
                    value={deliveryInfo.customerName}
                    onChange={(e) => setDeliveryInfo((p) => ({ ...p, customerName: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={deliveryInfo.customerEmail}
                    onChange={(e) => setDeliveryInfo((p) => ({ ...p, customerEmail: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Delivery address
                  <input
                    type="text"
                    value={deliveryInfo.deliveryAddress}
                    onChange={(e) => setDeliveryInfo((p) => ({ ...p, deliveryAddress: e.target.value }))}
                    required
                  />
                </label>
              </div>
              {wompiEnabled && (
                <div className="card">
                  <h3>Terms acceptance (Wompi)</h3>
                  {!acceptance ? (
                    <p className="text-muted">Loading terms...</p>
                  ) : (
                  <>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} required />
                    I have read and accept the{' '}
                    <a href={acceptance.termsPermalink} target="_blank" rel="noopener noreferrer">
                      Terms and conditions
                    </a>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={acceptPersonal} onChange={(e) => setAcceptPersonal(e.target.checked)} required={wompiEnabled} />
                    I have read and accept the{' '}
                    <a href={acceptance.personalDataPermalink} target="_blank" rel="noopener noreferrer">
                      Personal data authorization
                    </a>
                  </label>
                  </>
                  )}
                </div>
              )}
              <div className="actions">
                <button type="button" className="secondary" onClick={handleCloseCardModal}>
                  Close
                </button>
                <button type="submit" className="primary" disabled={wompiEnabled && (!acceptance || !acceptTerms || !acceptPersonal)}>
                  Continue to summary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backdrop: Summary + Payment button, then Result + back to products */}
      {showSummaryBackdrop && (
        <div className="backdrop-overlay" role="dialog" aria-modal="true" aria-labelledby="backdrop-title">
          <div className="backdrop-content">
            {!showResult ? (
              <>
                <h2 id="backdrop-title">Payment summary</h2>
                {paymentError && <p className="error">{paymentError}</p>}
                <div className="card">
                  <p>Product: {summaryProduct?.name ?? 'Loading...'}</p>
                  <p>Units: {units}</p>
                  <p>Product amount: ${subtotal.toLocaleString()}</p>
                  <p>Base fee: ${BASE_FEE.toLocaleString()}</p>
                  <p>Delivery Fee: ${DELIVERY_FEE.toLocaleString()}</p>
                  <p className="price">Total: ${total.toLocaleString()}</p>
                </div>
                <div className="actions">
                  <button type="button" className="secondary" onClick={handleBackToCard} disabled={paymentLoading}>
                    Back to details
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={paymentError ? handleExitAfterError : handleConfirmPayment}
                    disabled={paymentLoading}
                  >
                    {paymentError ? 'Exit' : paymentLoading ? 'Processing...' : 'Payment'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="backdrop-title">Payment result</h2>
                <div className={`card status-card status-card--${checkout.summary!.status === 'APPROVED' ? 'success' : 'error'}`}>
                  <p>{checkout.summary!.status === 'APPROVED' ? 'Payment approved' : 'Payment rejected'}</p>
                  <p>Total: ${checkout.summary!.totalAmount.toLocaleString()}</p>
                  <p>Transaction ID: {checkout.summary!.paymentId}</p>
                </div>
                <div className="actions">
                  <button type="button" className="primary" onClick={handleBackToProducts}>
                    Back to products
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
