import { Body, Controller, Get, Param, Post, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService, PaymentResponse } from '../application/payments.service';
import { CreatePaymentWompiDto } from '../application/dto/create-payment-wompi.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment (Wompi Sandbox API - cardToken + acceptanceToken)' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async create(@Body() dto: CreatePaymentWompiDto): Promise<PaymentResponse> {
    this.logger.log(
      `POST /payments - body: productId=${dto.productId}, units=${dto.units}, customerEmail=${dto.customerEmail}, cardToken=***, acceptanceToken=***`,
    );
    const payment = await this.paymentsService.createPaymentWithWompi(dto);
    this.logger.log(`POST /payments - OK, paymentId=${payment.id}, status=${payment.status}`);
    return payment;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(@Param('id') id: string): Promise<PaymentResponse | null> {
    this.logger.log(`GET /payments/${id} - find payment`);
    const payment = await this.paymentsService.findOne(id);
    this.logger.log(`GET /payments/${id} - ${payment ? `OK status=${payment.status}` : 'not found'}`);
    return payment;
  }
}

