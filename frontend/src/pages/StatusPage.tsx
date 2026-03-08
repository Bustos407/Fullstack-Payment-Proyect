import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { reset } from '../store/checkoutSlice';

export const StatusPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const summary = useSelector((state: RootState) => state.checkout.summary);

  if (!summary) {
    return <p>No hay información de pago. Vuelve al inicio.</p>;
  }

  const isSuccess = summary.status === 'APPROVED';

  return (
    <section>
      <h2>Resultado del pago</h2>
      <div className={`card status-card status-card--${isSuccess ? 'success' : 'error'}`}>
        <p>{isSuccess ? 'Pago aprobado 🎉' : 'Pago rechazado'}</p>
        <p>Total: ${summary.totalAmount.toLocaleString()}</p>
        <p>ID transacción: {summary.paymentId}</p>
      </div>
      <div className="actions">
        <button
          type="button"
          className="primary"
          onClick={() => {
            dispatch(reset());
          }}
        >
          Volver a productos
        </button>
      </div>
    </section>
  );
};

