export interface ProductProps {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export class ProductDomain {
  private readonly props: ProductProps;

  constructor(props: ProductProps) {
    this.props = props;
  }

  get id(): number {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get price(): number {
    return this.props.price;
  }

  get stock(): number {
    return this.props.stock;
  }

  canReserveUnits(units: number): boolean {
    return units > 0 && this.props.stock >= units;
  }

  reserveUnits(units: number): ProductDomain {
    if (!this.canReserveUnits(units)) {
      throw new Error('Insufficient stock to reserve');
    }

    return new ProductDomain({
      ...this.props,
      stock: this.props.stock - units,
    });
  }

  toJSON(): ProductProps {
    return { ...this.props };
  }
}

