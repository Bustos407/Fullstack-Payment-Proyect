import React from 'react';
import { ProductPage } from './ProductPage';

export const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Checkout</h1>
      </header>
      <main className="app-main">
        <ProductPage />
      </main>
    </div>
  );
};
