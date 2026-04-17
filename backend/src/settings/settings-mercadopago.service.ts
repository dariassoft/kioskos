import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MercadopagoCredentials } from '@sales/entities/mercadopago-credentials.entity'
import { SaveMercadopagoCredentialsDto } from './dto/mercadopago.dto'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class SettingsMercadopagoService {
  constructor(
    @InjectRepository(MercadopagoCredentials)
    private readonly mpRepo: Repository<MercadopagoCredentials>,
    private readonly configService: ConfigService,
  ) {}

  async get(tenantId: string): Promise<MercadopagoCredentials | null> {
    return this.mpRepo.findOne({ where: { tenant_id: tenantId } })
  }

  async save(dto: SaveMercadopagoCredentialsDto, tenantId: string): Promise<MercadopagoCredentials> {
    let config = await this.mpRepo.findOne({ where: { tenant_id: tenantId } })
    if (!config) {
      config = this.mpRepo.create({ tenant_id: tenantId })
    }

    config.public_key = dto.public_key
    config.access_token = dto.access_token
    config.store_id = dto.store_id ?? null
    config.pos_id = dto.pos_id ?? null
    config.is_sandbox = dto.is_sandbox ?? true
    config.is_configured = true
    config.last_verified_at = new Date()

    return this.mpRepo.save(config)
  }

  /**
   * Genera la URL de MercadoPago para iniciar el flujo de autorización OAuth.
   */
  async getAuthUrl(tenantId: string): Promise<string> {
    const clientId = this.configService.get<string>('MP_CLIENT_ID');
    const redirectUri = this.configService.get<string>('MP_REDIRECT_URI');
    
    // El state nos sirve para recuperar el tenantId al volver
    const state = tenantId; 

    return `https://auth.mercadopago.com.ar/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  /**
   * Procesa el código devuelto por MercadoPago y lo cambia por tokens.
   */
  async handleCallback(code: string, tenantId: string): Promise<MercadopagoCredentials> {
    const clientId = this.configService.get<string>('MP_CLIENT_ID');
    const clientSecret = this.configService.get<string>('MP_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('MP_REDIRECT_URI');

    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Error de MercadoPago: ${data.message || 'Fallo en el intercambio de tokens'}`);
    }

    let config = await this.mpRepo.findOne({ where: { tenant_id: tenantId } });
    if (!config) {
      config = this.mpRepo.create({ tenant_id: tenantId });
    }

    config.access_token = data.access_token;
    config.refresh_token = data.refresh_token;
    config.mp_user_id = String(data.user_id);
    config.public_key = data.public_key;
    config.is_configured = true;
    config.is_sandbox = false; // OAuth suele ser para producción directamente
    config.last_verified_at = new Date();
    
    // Calcular expiración (data.expires_in está en segundos)
    if (data.expires_in) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);
      config.token_expires_at = expiresAt;
    }

    return this.mpRepo.save(config);
  }
}

