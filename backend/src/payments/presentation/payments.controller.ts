import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from '../application/payments.service';
import { CreatePaymentWompiDto } from '../application/dto/create-payment-wompi.dto';
import { Payment } from '../infrastructure/typeorm/payment.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear pago (API Wompi Sandbox - cardToken + acceptanceToken)' })
  @ApiResponse({ status: 201, description: 'Pago creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() dto: CreatePaymentWompiDto): Promise<Payment> {
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

