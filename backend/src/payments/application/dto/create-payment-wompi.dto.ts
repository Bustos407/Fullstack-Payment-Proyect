import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

/**
 * DTO to create a payment using the real Wompi API.
 * The frontend must tokenize the card with the public key and obtain
 * the acceptance tokens (GET /merchants/:public_key).
 */
export class CreatePaymentWompiDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  @IsPositive()
  productId!: number;

  @ApiProperty({ example: 2, description: 'Number of units' })
  @IsInt()
  @IsPositive()
  units!: number;

  @ApiProperty({ description: 'Card token (obtained via POST /tokens/cards)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  cardToken!: string;

  @ApiProperty({ description: 'Acceptance token (GET /merchants/:public_key)' })
  @IsString()
  @IsNotEmpty()
  acceptanceToken!: string;

  @ApiProperty({ description: 'Personal data authorization token' })
  @IsString()
  @IsNotEmpty()
  acceptPersonalAuth!: string;

  @ApiPropertyOptional({ example: 1, description: 'Installments (default 1)' })
  @IsInt()
  @IsPositive()
  installments?: number;

  @ApiProperty({ example: 'John Doe', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customerName!: string;

  @ApiProperty({ example: 'customer@example.com', description: 'Customer email' })
  @IsEmail()
  customerEmail!: string;

  @ApiProperty({ example: '123 Main St', description: 'Delivery address' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deliveryAddress!: string;
}
