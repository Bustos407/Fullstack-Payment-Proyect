import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { StatusPage } from './StatusPage';
import { checkoutReducer } from '../store/checkoutSlice';

const renderWithStore = (initialCheckout = {}) => {
  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
    },
    preloadedState: {
      checkout: {
        step: 4,
        summary: {
          paymentId: 'pay-123',
          status: 'APPROVED',
          totalAmount: 25000,
        },
        ...initialCheckout,
      },
    },
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <StatusPage />
      </Provider>,
    ),
  };
};

describe('StatusPage', () => {
  it('muestra mensaje cuando no hay summary', () => {
    const store = configureStore({
      reducer: { checkout: checkoutReducer },
      preloadedState: {
        checkout: { step: 4, summary: undefined },
      },
    });
    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>,
    );
    expect(screen.getByText(/No hay información de pago/)).toBeInTheDocument();
  });

  it('muestra resultado aprobado y total cuando status es APPROVED', () => {
    renderWithStore();
    expect(screen.getByText(/Pago aprobado/)).toBeInTheDocument();
    expect(screen.getByText(/25.000/)).toBeInTheDocument();
    expect(screen.getByText(/pay-123/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volver a productos/ })).toBeInTheDocument();
  });

  it('muestra resultado rechazado cuando status es REJECTED', () => {
    const store = configureStore({
      reducer: { checkout: checkoutReducer },
      preloadedState: {
        checkout: {
          step: 4,
          summary: {
            paymentId: 'pay-456',
            status: 'REJECTED',
            totalAmount: 10000,
          },
        },
      },
    });
    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>,
    );
    expect(screen.getByText(/Pago rechazado/)).toBeInTheDocument();
    expect(screen.getByText(/10.000/)).toBeInTheDocument();
  });

  it('al hacer clic en Volver a productos despacha reset', () => {
    const { store } = renderWithStore();
    const button = screen.getByRole('button', { name: /Volver a productos/ });
    fireEvent.click(button);
    expect(store.getState().checkout.step).toBe(1);
    expect(store.getState().checkout.summary).toBeUndefined();
  });
});
