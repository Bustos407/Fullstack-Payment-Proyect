import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import { ProductPage } from './ProductPage';
import { checkoutReducer } from '../store/checkoutSlice';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockProducts = [
  { id: 1, name: 'Producto A', description: 'Desc A', price: 20000, stock: 5 },
  { id: 2, name: 'Producto B', description: 'Desc B', price: 50000, stock: 3 },
];

const renderWithStore = () => {
  const store = configureStore({
    reducer: { checkout: checkoutReducer },
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    ),
  };
};

describe('ProductPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: mockProducts });
  });

  it('muestra productos al cargar', async () => {
    renderWithStore();
    expect(await screen.findByText('Producto A')).toBeInTheDocument();
    expect(await screen.findByText('Producto B')).toBeInTheDocument();
    expect(screen.getByText(/Stock: 5/)).toBeInTheDocument();
  });

  it('muestra botón Pagar con tarjeta', async () => {
    renderWithStore();
    expect(await screen.findByRole('button', { name: /Pagar con tarjeta/ })).toBeInTheDocument();
  });

  it('selecciona producto y despacha al hacer clic en Pagar', async () => {
    const { store } = renderWithStore();
    await screen.findByText('Producto A');
    fireEvent.click(screen.getByText('Producto A'));
    fireEvent.click(screen.getByRole('button', { name: /Pagar con tarjeta/ }));
    expect(store.getState().checkout.productSelection).toEqual({ productId: 1, units: 1 });
  });

  it('permite cambiar unidades', async () => {
    renderWithStore();
    await screen.findByText('Producto A');
    const input = screen.getByRole('spinbutton', { name: /Unidades/i });
    fireEvent.change(input, { target: { value: '3' } });
    expect((input as HTMLInputElement).value).toBe('3');
  });
});
