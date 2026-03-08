import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { App } from './pages/App';
import './styles.css';

// In production, point API requests to the deployed backend (e.g. Elastic Beanstalk URL).
const apiBase = import.meta.env.VITE_API_URL;
if (apiBase) {
  axios.defaults.baseURL = apiBase;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);

