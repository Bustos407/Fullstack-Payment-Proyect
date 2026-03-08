import React from 'react';
import { render, screen } from '@testing-library/react';
import axios from 'axios';

jest.mock('../api/wompi', () => ({
  isWompiEnabled: jest.fn(() => false),
  getAcceptanceTokens: jest.fn(() => Promise.resolve(null)),
  tokenizeCard: jest.fn(),
}));
jest.mock('axios');
(axios.get as jest.Mock).mockResolvedValue({ data: [] });
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { App } from './App';
import { checkoutReducer } from '../store/checkoutSlice';

const renderWithStore = (step = 1) => {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: { checkout: { step } },
  });
  return render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
};

describe('App', () => {
  it('muestra header con título', () => {
    renderWithStore();
    expect(screen.getByText(/Checkout/)).toBeInTheDocument();
  });

  it('muestra indicador de pasos con progressbar', () => {
    renderWithStore(3);
    const progressbar = screen.getByRole('progressbar', { name: /Paso 3 de 4/ });
    expect(progressbar).toBeInTheDocument();
  });

  it('en paso 1 muestra ProductPage', () => {
    renderWithStore(1);
    expect(screen.getByText(/Elige tu producto/)).toBeInTheDocument();
  });
});
