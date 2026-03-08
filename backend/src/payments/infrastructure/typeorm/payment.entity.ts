import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentStatus } from '../../domain/payment-status.enum';
import { Product } from '../../../products/infrastructure/typeorm/product.entity';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, { eager: true })
  product!: Product;

  @Column({ type: 'int' })
  units!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'enum', enum: PaymentStatus })
  status!: PaymentStatus;

  @Column({ type: 'varchar', length: 255 })
  customerName!: string;

  @Column({ type: 'varchar', length: 255 })
  customerEmail!: string;

  @Column({ type: 'varchar', length: 255 })
  deliveryAddress!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  wompiTransactionId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

