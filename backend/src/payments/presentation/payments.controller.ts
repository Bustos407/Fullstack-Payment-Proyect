import { Body, Controller, Get, Param, Post, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from '../application/payments.service';
import { CreatePaymentWompiDto } from '../application/dto/create-payment-wompi.dto';
import { Payment } from '../infrastructure/typeorm/payment.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear pago (API Wompi Sandbox - cardToken + acceptanceToken)' })
  @ApiResponse({ status: 201, description: 'Pago creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() dto: CreatePaymentWompiDto): Promise<Payment> {
    this.logger.log(
      `POST /payments - body: productId=${dto.productId}, units=${dto.units}, customerEmail=${dto.customerEmail}, cardToken=***, acceptanceToken=***`,
    );
    const payment = await this.paymentsService.createPaymentWithWompi(dto);
    this.logger.log(`POST /payments - OK, paymentId=${payment.id}, status=${payment.status}`);
    return payment;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pago por ID' })
  @ApiResponse({ status: 200, description: 'Pago encontrado' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async findOne(@Param('id') id: string): Promise<Payment | null> {
    this.logger.log(`GET /payments/${id} - buscar pago`);
    const payment = await this.paymentsService.findOne(id);
    this.logger.log(`GET /payments/${id} - ${payment ? `OK status=${payment.status}` : 'no encontrado'}`);
    return payment;
  }
}

