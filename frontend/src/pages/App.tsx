import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { ProductPage } from './ProductPage';
import { PaymentInfoPage } from './PaymentInfoPage';
import { SummaryPage } from './SummaryPage';
import { StatusPage } from './StatusPage';

export const App: React.FC = () => {
  const step = useSelector((state: RootState) => state.checkout.step);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Checkout</h1>
        <div className="app-steps" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4} aria-label={`Paso ${step} de 4`}>
          {([1, 2, 3, 4] as const).map((s) => (
            <span key={s} className={`app-step-dot ${s === step ? 'active' : ''} ${s < step ? 'done' : ''}`} />
          ))}
        </div>
      </header>
      <main className="app-main">
        {step === 1 && <ProductPage />}
        {step === 2 && <PaymentInfoPage />}
        {step === 3 && <SummaryPage />}
        {step === 4 && <StatusPage />}
      </main>
    </div>
  );
};

