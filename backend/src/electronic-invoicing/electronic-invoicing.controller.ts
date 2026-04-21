  Controller, Get, Post, Body, Param, Query, UseGuards, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { ElectronicInvoicingService } from './electronic-invoicing.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { GetTenantId } from '@common/decorators/get-tenant.decorator';
import {
  SaveAfipCredentialsDto,
  GenerateInvoiceDto,
  ListInvoicesQueryDto,
} from './dto/afip.dto';

@ApiTags('electronic-invoicing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('electronic-invoicing')
export class ElectronicInvoicingController {
  constructor(
    private readonly eiService: ElectronicInvoicingService,
  ) {}

  // ==========================================
  // CONFIGURACIÓN DE CREDENCIALES ARCA
  // ==========================================

  @Get('credentials')
  @ApiOperation({ summary: 'Ver configuración ARCA del negocio (sin datos sensibles)' })
  getCredentials(@GetTenantId() tenantId: string) {
    return this.eiService.getCredentialsSafe(tenantId);
  }

  @Post('credentials')
  @ApiOperation({
    summary: 'Guardar / actualizar credenciales ARCA',
    description:
      'Encripta y persiste el certificado y clave privada ARCA del negocio. ' +
      'Requiere plan con módulo electronic_invoicing habilitado.',
  })
  saveCredentials(
    @Body() dto: SaveAfipCredentialsDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.eiService.saveCredentials(dto, tenantId);
  }

  @Get('credentials/test')
  @ApiOperation({
    summary: 'Probar conexión con ARCA',
    description:
      'Verifica las credenciales configuradas conectándose al servicio de ARCA ' +
      '(homologación o producción según configuración).',
  })
  testConnection(@GetTenantId() tenantId: string) {
    return this.eiService.testConnection(tenantId);
  }

  // ==========================================
  // FACTURAS ELECTRÓNICAS
  // ==========================================

  @Get('invoices')
  @ApiOperation({ summary: 'Listar facturas electrónicas emitidas (paginado)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  listInvoices(
    @GetTenantId() tenantId: string,
    @Query() query: ListInvoicesQueryDto,
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    return this.eiService.listInvoices(tenantId, page, limit);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Ver detalle de una factura electrónica' })
  getInvoice(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.eiService.getInvoiceById(id, tenantId);
  }

  @Post('invoices')
  @ApiOperation({
    summary: 'Emitir una factura electrónica en ARCA',
    description:
      'Genera el CAE en ARCA y persiste la factura. ' +
      'El tipo de comprobante (A/B/C) se determina automáticamente ' +
      'según el tipo de contribuyente configurado y el receptor.',
  })
  generateInvoice(
    @Body() dto: GenerateInvoiceDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.eiService.generateInvoice(dto, tenantId);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Obtener el comprobante PDF de la factura' })
  async getInvoicePdf(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.eiService.getInvoicePdf(id, tenantId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=factura-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}

