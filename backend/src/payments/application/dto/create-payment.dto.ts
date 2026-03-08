import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  @IsPositive()
  productId!: number;

  @ApiProperty({ example: 2, description: 'Cantidad de unidades' })
  @IsInt()
  @IsPositive()
  units!: number;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del titular de la tarjeta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cardHolderName!: string;

  @ApiProperty({ example: '4242424242424242', description: 'Número de tarjeta (flujo mock)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  cardNumber!: string;

  @ApiProperty({ example: '12/28', description: 'Fecha de expiración MM/YY' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  cardExp!: string;

  @ApiProperty({ example: '123', description: 'CVV' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  cardCvv!: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del cliente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customerName!: string;

  @ApiProperty({ example: 'cliente@ejemplo.com', description: 'Email del cliente' })
  @IsEmail()
  customerEmail!: string;

  @ApiProperty({ example: 'Calle 123 #45-67', description: 'Dirección de entrega' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deliveryAddress!: string;
}

