import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from '../application/payments.service';
import { CreatePaymentDto } from '../application/dto/create-payment.dto';
import { CreatePaymentWompiDto } from '../application/dto/create-payment-wompi.dto';
import { Payment } from '../infrastructure/typeorm/payment.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear pago (flujo mock, datos de tarjeta en body)' })
  @ApiResponse({ status: 201, description: 'Pago creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o stock insuficiente' })
  async create(@Body() dto: CreatePaymentDto): Promise<Payment> {
    const result = await this.paymentsService.createPayment(dto);
    if (!result.ok) {
      throw new BadRequestException(result.error);
    }
    return result.value;
  }

  @Post('wompi')
  @ApiOperation({ summary: 'Crear pago con API real (cardToken + acceptanceToken)' })
  @ApiResponse({ status: 201, description: 'Pago creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createWithWompi(@Body() dto: CreatePaymentWompiDto): Promise<Payment> {
    return this.paymentsService.createPaymentWithWompi(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pago por ID' })
  @ApiResponse({ status: 200, description: 'Pago encontrado' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async findOne(@Param('id') id: string): Promise<Payment | null> {
    return this.paymentsService.findOne(id);
  }
}

