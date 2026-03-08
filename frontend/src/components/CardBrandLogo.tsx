import React from 'react';
import type { CardBrand } from '../utils/cardBrand';

interface CardBrandLogoProps {
  brand: CardBrand;
  className?: string;
}

/** Minimal wordmarks in official colors (payment-form style). */
const VisaLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 12" className={className} aria-label="Visa" role="img">
    <text
      x="0"
      y="10"
      fill="#1A1F71"
      fontSize="11"
      fontWeight="700"
      fontFamily="Arial, sans-serif"
      letterSpacing="0.08em"
    >
      VISA
    </text>
  </svg>
);

const MastercardLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 16" className={className} aria-label="Mastercard" role="img">
    <circle cx="9" cy="8" r="6.5" fill="#EB001B" />
    <circle cx="15" cy="8" r="6.5" fill="#F79E1B" />
    <path
      d="M12 3.2a5 5 0 0 0-2.9 1 6.5 6.5 0 0 1 0 9.6A5 5 0 0 0 12 12.8a5 5 0 0 0 2.9-1 6.5 6.5 0 0 1 0-9.6A5 5 0 0 0 12 3.2z"
      fill="#FF5F00"
    />
  </svg>
);

const AmexLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 36 12" className={className} aria-label="American Express" role="img">
    <text
      x="0"
      y="10"
      fill="#006FCF"
      fontSize="10"
      fontWeight="700"
      fontFamily="Arial, sans-serif"
      letterSpacing="0.05em"
    >
      AMEX
    </text>
  </svg>
);

const logos: Record<CardBrand, React.FC<{ className?: string }>> = {
  visa: VisaLogo,
  mastercard: MastercardLogo,
  amex: AmexLogo,
};

export const CardBrandLogo: React.FC<CardBrandLogoProps> = ({ brand, className = '' }) => {
  const Logo = logos[brand];
  return (
    <span className={`card-brand-logo card-brand-logo--svg ${className}`} title={brand}>
      <Logo className="card-brand-logo__img" />
    </span>
  );
};
