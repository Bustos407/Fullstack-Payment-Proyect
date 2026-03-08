import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import { ProductPage } from './ProductPage';
import { checkoutReducer } from '../store/checkoutSlice';

jest.mock('../api/wompi', () => ({
  isWompiEnabled: jest.fn(() => false),
  getAcceptanceTokens: jest.fn(),
  tokenizeCard: jest.fn(),
}));
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockProducts = [
  { id: 1, name: 'Product A', description: 'Desc A', price: 20000, stock: 5 },
  { id: 2, name: 'Product B', description: 'Desc B', price: 50000, stock: 3 },
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

  it('shows products on load', async () => {
    renderWithStore();
    expect(await screen.findByText('Product A')).toBeInTheDocument();
    expect(await screen.findByText('Product B')).toBeInTheDocument();
    expect(screen.getByText(/Stock: 5/)).toBeInTheDocument();
  });

  it('shows Pay with credit card button', async () => {
    renderWithStore();
    expect(await screen.findByRole('button', { name: /Pay with credit card/i })).toBeInTheDocument();
  });

  it('selects product and dispatches when clicking Pay with credit card', async () => {
    const { store } = renderWithStore();
    await screen.findByText('Product A');
    fireEvent.click(screen.getByText('Product A'));
    fireEvent.click(screen.getByRole('button', { name: /Pay with credit card/i }));
    expect(store.getState().checkout.productSelection).toEqual({ productId: 1, units: 1 });
  });

  it('allows changing units', async () => {
    renderWithStore();
    await screen.findByText('Product A');
    const input = screen.getByRole('spinbutton', { name: /Units/i });
    fireEvent.change(input, { target: { value: '3' } });
    expect((input as HTMLInputElement).value).toBe('3');
  });
});
