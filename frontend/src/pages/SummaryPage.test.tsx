import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import { SummaryPage } from './SummaryPage';
import { checkoutReducer } from '../store/checkoutSlice';

jest.mock('../api/wompi', () => ({
  tokenizeCard: jest.fn(() => Promise.resolve('tok_xxx')),
}));
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const checkoutState = {
  step: 3,
  productSelection: { productId: 1, units: 2 },
  cardInfo: {
    cardHolderName: 'Juan',
    cardNumber: '4111111111111111',
    cardExp: '12/25',
    cardCvv: '123',
  },
  deliveryInfo: {
    customerName: 'Juan Pérez',
    customerEmail: 'juan@test.com',
    deliveryAddress: 'Calle 123',
  },
  wompiAcceptance: {
    acceptanceToken: 'accept_xxx',
    acceptPersonalAuth: 'auth_xxx',
  },
};

const renderWithStore = () => {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: { checkout: checkoutState },
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <SummaryPage />
      </Provider>,
    ),
  };
};

describe('SummaryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: [{ id: 1, name: 'Producto Test', price: 20000 }],
    });
  });

  it('muestra resumen cuando hay datos', async () => {
    renderWithStore();
    expect(await screen.findByText(/Resumen de pago/)).toBeInTheDocument();
    expect(await screen.findByText(/Producto Test/)).toBeInTheDocument();
    expect(screen.getByText(/Unidades: 2/)).toBeInTheDocument();
  });

  it('muestra subtotal, base fee, delivery y total', async () => {
    renderWithStore();
    await screen.findByText(/Producto Test/);
    expect(screen.getByText(/40.000/)).toBeInTheDocument();
    expect(screen.getByText(/2.000/)).toBeInTheDocument();
    expect(screen.getByText(/5.000/)).toBeInTheDocument();
  });

  it('al confirmar llama API y despacha summary', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { id: 'pay-1', status: 'APPROVED', totalAmount: 47000 },
    });
    const { store } = renderWithStore();
    await screen.findByText(/Producto Test/);
    fireEvent.click(screen.getByRole('button', { name: /Confirmar pago/ }));
    await waitFor(() => {
      expect(store.getState().checkout.summary?.paymentId).toBe('pay-1');
    });
  });
});
