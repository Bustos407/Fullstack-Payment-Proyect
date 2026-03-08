import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { ProductSelection, setProductSelection } from '../store/checkoutSlice';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export const ProductPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<ProductSelection>({ productId: 0, units: 1 });

  useEffect(() => {
    axios
      .get<Product[]>('/api/products')
      .then((res) => setProducts(res.data))
      .catch(() => {
        // eslint-disable-next-line no-console
        console.error('Error cargando productos');
      });
  }, []);

  const handleContinue = () => {
    if (!selected.productId || selected.units <= 0) return;
    dispatch(setProductSelection(selected));
  };

  return (
    <section>
      <h2>Elige tu producto</h2>
      <div className="card-list">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            className={`card ${selected.productId === product.id ? 'card--selected' : ''}`}
            onClick={() => setSelected((prev) => ({ ...prev, productId: product.id }))}
          >
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p className="price">${Number(product.price).toLocaleString()}</p>
            <p className="stock">Stock: {product.stock}</p>
          </button>
        ))}
      </div>

      <div className="form-row">
        <label htmlFor="units">
          Unidades
          <input
            id="units"
            type="number"
            min={1}
            value={selected.units}
            onChange={(e) => setSelected((prev) => ({ ...prev, units: Number(e.target.value) }))}
          />
        </label>
      </div>

      <div className="actions">
        <button type="button" className="primary" onClick={handleContinue} disabled={!selected.productId}>
          Pagar con tarjeta
        </button>
      </div>
    </section>
  );
};

