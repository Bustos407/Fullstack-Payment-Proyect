import { ProductDomain } from './product.entity';

describe('ProductDomain', () => {
  const baseProps = {
    id: 1,
    name: 'Test Product',
    description: 'Desc',
    price: 10000,
    stock: 5,
  };

  it('should create an instance with the correct props', () => {
    const product = new ProductDomain(baseProps);
    expect(product.id).toBe(1);
    expect(product.name).toBe('Test Product');
    expect(product.stock).toBe(5);
  });

  it('canReserveUnits returns true when there is enough stock', () => {
    const product = new ProductDomain(baseProps);
    expect(product.canReserveUnits(3)).toBe(true);
    expect(product.canReserveUnits(5)).toBe(true);
  });

  it('canReserveUnits returns false when there is not enough stock', () => {
    const product = new ProductDomain(baseProps);
    expect(product.canReserveUnits(6)).toBe(false);
    expect(product.canReserveUnits(0)).toBe(false);
    expect(product.canReserveUnits(-1)).toBe(false);
  });

  it('reserveUnits reduces stock correctly', () => {
    const product = new ProductDomain(baseProps);
    const updated = product.reserveUnits(2);
    expect(updated.stock).toBe(3);
    expect(product.stock).toBe(5);
  });

  it('reserveUnits throws error if there is not enough stock', () => {
    const product = new ProductDomain(baseProps);
    expect(() => product.reserveUnits(10)).toThrow('Insufficient stock to reserve');
    expect(() => product.reserveUnits(0)).toThrow('Insufficient stock to reserve');
  });

  it('toJSON devuelve una copia de las props', () => {
    const product = new ProductDomain(baseProps);
    const json = product.toJSON();
    expect(json).toEqual(baseProps);
    expect(json).not.toBe(baseProps);
  });
});
