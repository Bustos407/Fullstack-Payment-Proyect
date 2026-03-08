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

const store = configureStore({
  reducer: { checkout: checkoutReducer },
});

describe('App', () => {
  it('shows header with title Checkout', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
    expect(screen.getByText(/Checkout/)).toBeInTheDocument();
  });

  it('shows products page', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
    expect(screen.getByText(/Products/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay with credit card/i })).toBeInTheDocument();
  });
});
