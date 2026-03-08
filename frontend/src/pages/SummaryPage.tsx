import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setSummary } from '../store/checkoutSlice';
import { tokenizeCard } from '../api/wompi';
import { BASE_FEE, DELIVERY_FEE, calculateCheckoutTotal } from '../constants/fees';

interface Product {
  id: number;
  name: string;
  price: number;
}

export const SummaryPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const checkout = useSelector((state: RootState) => state.checkout);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkout.productSelection) return;
    axios
      .get<Product[]>(`/api/products`)
      .then((res) => {
        const found = res.data.find((p) => p.id === checkout.productSelection?.productId);
        if (found) setProduct(found);
      })
      .catch(() => setError('No se pudo cargar el producto'));
  }, [checkout.productSelection]);

  if (!checkout.productSelection || !checkout.cardInfo || !checkout.deliveryInfo) {
    return <p>Falta información del checkout. Vuelve al inicio.</p>;
  }

  const units = checkout.productSelection.units;
  const price = product ? product.price : 0;
  const subtotal = price * units;
  const total = calculateCheckoutTotal(subtotal);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!checkout.wompiAcceptance || !checkout.cardInfo) {
        setError('Faltan tokens de aceptación. Acepta los términos y vuelve a intentar.');
        setLoading(false);
        return;
      }
      const [expMonth, expYear] = checkout.cardInfo.cardExp.split('/').map((s) => s.trim());
      const cardToken = await tokenizeCard({
        number: checkout.cardInfo.cardNumber,
        cvc: checkout.cardInfo.cardCvv,
        exp_month: expMonth || '01',
        exp_year: expYear || '28',
        card_holder: checkout.cardInfo.cardHolderName,
      });
      const response = await axios.post('/api/payments', {
        productId: checkout.productSelection!.productId,
        units,
        cardToken,
        acceptanceToken: checkout.wompiAcceptance.acceptanceToken,
        acceptPersonalAuth: checkout.wompiAcceptance.acceptPersonalAuth,
        installments: 1,
        customerName: checkout.deliveryInfo!.customerName,
        customerEmail: checkout.deliveryInfo!.customerEmail,
        deliveryAddress: checkout.deliveryInfo!.deliveryAddress,
      });
      const payment = response.data;

      dispatch(
        setSummary({
          paymentId: payment.id,
          status: payment.status,
          totalAmount: total,
        }),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo procesar el pago';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Resumen de pago</h2>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <p>Producto: {product?.name ?? 'Cargando...'}</p>
        <p>Unidades: {units}</p>
        <p>Subtotal: ${subtotal.toLocaleString()}</p>
        <p>Base fee: ${BASE_FEE.toLocaleString()}</p>
        <p>Envío: ${DELIVERY_FEE.toLocaleString()}</p>
        <p className="price">Total: ${total.toLocaleString()}</p>
      </div>

      <div className="card">
        <h3>Entrega</h3>
        <p>{checkout.deliveryInfo.customerName}</p>
        <p>{checkout.deliveryInfo.customerEmail}</p>
        <p>{checkout.deliveryInfo.deliveryAddress}</p>
      </div>

      <div className="actions">
        <button type="button" className="primary" onClick={handleConfirm} disabled={loading}>
          {loading ? 'Procesando...' : 'Confirmar pago'}
        </button>
      </div>
    </section>
  );
};

