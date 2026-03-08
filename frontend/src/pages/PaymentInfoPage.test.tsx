import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PaymentInfoPage } from './PaymentInfoPage';
import { checkoutReducer } from '../store/checkoutSlice';

const mockAcceptance = {
  acceptanceToken: 'accept_xxx',
  acceptPersonalAuth: 'auth_xxx',
  termsPermalink: 'https://terms.example.com',
  personalDataPermalink: 'https://privacy.example.com',
};
jest.mock('../api/wompi', () => ({
  isWompiEnabled: jest.fn(() => true),
  getAcceptanceTokens: jest.fn(() => Promise.resolve(mockAcceptance)),
  tokenizeCard: jest.fn(),
}));

const renderWithStore = () => {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
    preloadedState: {
      checkout: {
        step: 2,
        productSelection: { productId: 1, units: 2 },
      },
    },
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <PaymentInfoPage />
      </Provider>,
    ),
  };
};

describe('PaymentInfoPage', () => {
  it('muestra formulario de tarjeta y entrega', () => {
    renderWithStore();
    expect(screen.getByText(/Datos de tarjeta y entrega/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del titular/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Número de tarjeta/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo electrónico/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dirección de entrega/)).toBeInTheDocument();
  });

  it('al enviar despacha cardInfo y deliveryInfo', async () => {
    const { store } = renderWithStore();
    await screen.findByText(/Aceptación de términos/);
    fireEvent.change(screen.getByLabelText(/Nombre del titular/), { target: { value: 'Juan Pérez' } });
    fireEvent.change(screen.getByLabelText(/Número de tarjeta/), { target: { value: '4111111111111111' } });
    fireEvent.change(screen.getByLabelText(/Expiración/), { target: { value: '12/25' } });
    fireEvent.change(screen.getByLabelText(/CVV/), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Juan Pérez' } });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByLabelText(/Dirección de entrega/), { target: { value: 'Calle 123' } });
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(store.getState().checkout.cardInfo?.cardHolderName).toBe('Juan Pérez');
    expect(store.getState().checkout.deliveryInfo?.customerEmail).toBe('juan@test.com');
  });
});
