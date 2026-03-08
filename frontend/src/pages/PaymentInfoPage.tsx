import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { CardInfo, DeliveryInfo, setCardAndDeliveryInfo } from '../store/checkoutSlice';
import { isWompiEnabled, getAcceptanceTokens, type AcceptanceTokens } from '../api/wompi';
import { getCardBrand } from '../utils/cardBrand';
import { CardBrandLogo } from '../components/CardBrandLogo';

export const PaymentInfoPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [cardInfo, setCardInfoState] = useState<CardInfo>({
    cardHolderName: '',
    cardNumber: '',
    cardExp: '',
    cardCvv: '',
  });
  const [deliveryInfo, setDeliveryInfoState] = useState<DeliveryInfo>({
    customerName: '',
    customerEmail: '',
    deliveryAddress: '',
  });
  const [acceptance, setAcceptance] = useState<AcceptanceTokens | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPersonal, setAcceptPersonal] = useState(false);

  const wompiEnabled = isWompiEnabled();

  useEffect(() => {
    if (!wompiEnabled) return;
    getAcceptanceTokens()
      .then(setAcceptance)
      .catch(() => setAcceptance(null));
  }, [wompiEnabled]);

  const cardBrand = getCardBrand(cardInfo.cardNumber);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wompiAcceptance =
      wompiEnabled && acceptance && acceptTerms && acceptPersonal
        ? { acceptanceToken: acceptance.acceptanceToken, acceptPersonalAuth: acceptance.acceptPersonalAuth }
        : undefined;
    dispatch(setCardAndDeliveryInfo({ cardInfo, deliveryInfo, wompiAcceptance }));
  };

  return (
    <section>
      <h2>Datos de tarjeta y entrega</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="card">
          <h3>Tarjeta de crédito</h3>
          <label>
            Nombre del titular
            <input
              type="text"
              value={cardInfo.cardHolderName}
              onChange={(e) => setCardInfoState({ ...cardInfo, cardHolderName: e.target.value })}
              required
            />
          </label>
          <label>
            Número de tarjeta
            <div className="input-with-logo">
              <input
                type="text"
                value={cardInfo.cardNumber}
                onChange={(e) => setCardInfoState({ ...cardInfo, cardNumber: e.target.value })}
                placeholder="4242 4242 4242 4242"
                required
              />
              {cardBrand && <CardBrandLogo brand={cardBrand} />}
            </div>
          </label>
          <div className="form-row-inline">
            <label>
              Expiración (MM/YY)
              <input
                type="text"
                value={cardInfo.cardExp}
                onChange={(e) => setCardInfoState({ ...cardInfo, cardExp: e.target.value })}
                required
              />
            </label>
            <label>
              CVV
              <input
                type="password"
                value={cardInfo.cardCvv}
                onChange={(e) => setCardInfoState({ ...cardInfo, cardCvv: e.target.value })}
                required
              />
            </label>
          </div>
        </div>

        <div className="card">
          <h3>Datos de entrega</h3>
          <label>
            Nombre completo
            <input
              type="text"
              value={deliveryInfo.customerName}
              onChange={(e) => setDeliveryInfoState({ ...deliveryInfo, customerName: e.target.value })}
              required
            />
          </label>
          <label>
            Correo electrónico
            <input
              type="email"
              value={deliveryInfo.customerEmail}
              onChange={(e) => setDeliveryInfoState({ ...deliveryInfo, customerEmail: e.target.value })}
              required
            />
          </label>
          <label>
            Dirección de entrega
            <input
              type="text"
              value={deliveryInfo.deliveryAddress}
              onChange={(e) => setDeliveryInfoState({ ...deliveryInfo, deliveryAddress: e.target.value })}
              required
            />
          </label>
        </div>

        {wompiEnabled && (
          <div className="card">
            <h3>Aceptación de términos (Wompi)</h3>
            {!acceptance ? (
              <p>Cargando términos...</p>
            ) : (
              <>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
              />
              He leído y acepto los{' '}
              <a href={acceptance.termsPermalink} target="_blank" rel="noopener noreferrer">
                Términos y condiciones
              </a>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptPersonal}
                onChange={(e) => setAcceptPersonal(e.target.checked)}
                required={wompiEnabled}
              />
              He leído y acepto la{' '}
              <a href={acceptance.personalDataPermalink} target="_blank" rel="noopener noreferrer">
                Autorización de datos personales
              </a>
            </label>
              </>
            )}
          </div>
        )}

        <div className="actions">
          <button type="submit" className="primary" disabled={!acceptance || !acceptTerms || !acceptPersonal}>
            Continuar
          </button>
        </div>
      </form>
    </section>
  );
};

