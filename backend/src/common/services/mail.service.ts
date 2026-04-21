import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendWelcomeEmail(to: string, businessName: string): Promise<void> {
    this.logger.log(`📧 ENVIANDO EMAIL DE BIENVENIDA:
      PARA: ${to}
      ASUNTO: ¡Bienvenido a Kioskos & Despenzas - ${businessName}!
      CONTENIDO: Tu cuenta ha sido activada exitosamente. Ya puedes ingresar con tu email y la contraseña que elegiste.
    `);
  }

  async sendTransferInstructions(to: string, businessName: string, amount: number, reference: string): Promise<void> {
    this.logger.log(`📧 ENVIANDO INSTRUCCIONES DE TRANSFERENCIA:
      PARA: ${to}
      ASUNTO: Instrucciones de pago para ${businessName}
      CONTENIDO: Por favor transfiere $${amount} con la referencia ${reference}. 
      Alias: ${this.config.get('TRANSFER_ALIAS')}
      CBU: ${this.config.get('TRANSFER_CBU')}
      Una vez realizada, adjunta el comprobante o notifica desde el panel.
    `);
  }

  async sendManualActivationEmail(to: string, businessName: string): Promise<void> {
    this.logger.log(`📧 ENVIANDO AVISO DE ACTIVACIÓN MANUAL:
      PARA: ${to}
      ASUNTO: Tu cuenta de ${businessName} ha sido activada
      CONTENIDO: Hemos verificado tu transferencia. Tu cuenta ya está activa. ¡Bienvenido!
    `);
  }
}
