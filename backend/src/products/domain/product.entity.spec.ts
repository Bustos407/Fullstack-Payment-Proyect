import { ProductDomain } from './product.entity';

describe('ProductDomain', () => {
  const baseProps = {
    id: 1,
    name: 'Test Product',
    description: 'Desc',
    price: 10000,
    stock: 5,
  };

  it('debería crear una instancia con las props correctas', () => {
    const product = new ProductDomain(baseProps);
    expect(product.id).toBe(1);
    expect(product.name).toBe('Test Product');
    expect(product.stock).toBe(5);
  });

  it('canReserveUnits retorna true cuando hay stock suficiente', () => {
    const product = new ProductDomain(baseProps);
    expect(product.canReserveUnits(3)).toBe(true);
    expect(product.canReserveUnits(5)).toBe(true);
  });

  it('canReserveUnits retorna false cuando no hay stock suficiente', () => {
    const product = new ProductDomain(baseProps);
    expect(product.canReserveUnits(6)).toBe(false);
    expect(product.canReserveUnits(0)).toBe(false);
    expect(product.canReserveUnits(-1)).toBe(false);
  });

  it('reserveUnits reduce el stock correctamente', () => {
    const product = new ProductDomain(baseProps);
    const updated = product.reserveUnits(2);
    expect(updated.stock).toBe(3);
    expect(product.stock).toBe(5);
  });

  it('reserveUnits lanza error si no hay stock suficiente', () => {
    const product = new ProductDomain(baseProps);
    expect(() => product.reserveUnits(10)).toThrow('Stock insuficiente para reservar');
    expect(() => product.reserveUnits(0)).toThrow('Stock insuficiente para reservar');
  });

  it('toJSON devuelve una copia de las props', () => {
    const product = new ProductDomain(baseProps);
    const json = product.toJSON();
    expect(json).toEqual(baseProps);
    expect(json).not.toBe(baseProps);
  });
});
