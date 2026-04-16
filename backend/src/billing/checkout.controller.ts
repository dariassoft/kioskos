import {
  Controller, Get, Post, Param, Body, Headers, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto, ConfirmTransferDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/superadmin.guard';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  // ─── Público: obtener planes para la landing ───────────────────────────────
  @Get('plans')
  @ApiOperation({ summary: 'Listar planes activos (público, para la landing page)' })
  getPublicPlans() {
    return this.checkoutService.getPublicPlans();
  }

  // ─── Público: iniciar checkout ────────────────────────────────────────────
  @Post('start')
  @ApiOperation({ summary: 'Iniciar proceso de checkout / suscripción' })
  @HttpCode(HttpStatus.CREATED)
  createCheckout(@Body() dto: CreateCheckoutDto) {
    return this.checkoutService.createCheckout(dto);
  }

  // ─── Público: estado de la solicitud (polling) ───────────────────────────
  @Get('status/:pendingId')
  @ApiOperation({ summary: 'Consultar estado de un pending checkout' })
  getStatus(@Param('pendingId') pendingId: string) {
    return this.checkoutService.getCheckoutStatus(pendingId);
  }

  // ─── Público: confirmar transferencia manual ─────────────────────────────
  @Post('confirm-transfer')
  @ApiOperation({ summary: 'Confirmar que se realizó una transferencia bancaria' })
  confirmTransfer(@Body() dto: ConfirmTransferDto) {
    return this.checkoutService.confirmTransfer(dto);
  }

  // ─── Webhook de MercadoPago (público, validado internamente) ─────────────
  @Post('webhook/mercadopago')
  @ApiOperation({ summary: 'Webhook interno para notificaciones de MercadoPago' })
  @HttpCode(HttpStatus.OK)
  handleMpWebhook(@Body() body: any, @Headers() headers: any) {
    // TODO producción: validar x-signature de MP
    return this.checkoutService.handleMercadoPagoWebhook(body);
  }

  // ─── Público: info de sandbox para testing ───────────────────────────────────
  @Get('sandbox-info')
  @ApiOperation({ summary: 'Información de testing con tarjetas de prueba (sandbox)' })
  getSandboxInfo() {
    return this.checkoutService.getSandboxInfo()
  }

  // ─── SuperAdmin: listar transferencias pendientes de verificación ─────────
  @Get('admin/manual-pending')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Listar transferencias manuales pendientes' })
  getManualPending() {
    return this.checkoutService.getManualPendingList();
  }

  // ─── SuperAdmin: aprobar transferencia manual ─────────────────────────────
  @Post('admin/approve/:pendingId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Aprobar transferencia manual y activar cuenta' })
  adminApprove(@Param('pendingId') pendingId: string) {
    return this.checkoutService.adminApprovePending(pendingId);
  }
}

