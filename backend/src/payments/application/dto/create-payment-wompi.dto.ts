import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

/**
 * DTO para crear pago usando la API real de Wompi.
 * El frontend debe tokenizar la tarjeta con la llave pública y obtener
 * los tokens de aceptación (GET /merchants/:public_key).
 */
export class CreatePaymentWompiDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  @IsPositive()
  productId!: number;

  @ApiProperty({ example: 2, description: 'Cantidad de unidades' })
  @IsInt()
  @IsPositive()
  units!: number;

  @ApiProperty({ description: 'Token de tarjeta (obtenido vía POST /tokens/cards)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  cardToken!: string;

  @ApiProperty({ description: 'Token de aceptación de términos (GET /merchants/:public_key)' })
  @IsString()
  @IsNotEmpty()
  acceptanceToken!: string;

  @ApiProperty({ description: 'Token de autorización de datos personales' })
  @IsString()
  @IsNotEmpty()
  acceptPersonalAuth!: string;

  @ApiPropertyOptional({ example: 1, description: 'Cuotas (por defecto 1)' })
  @IsInt()
  @IsPositive()
  installments?: number;

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
