import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MercadopagoCredentials } from '@sales/entities/mercadopago-credentials.entity'
import { SaveMercadopagoCredentialsDto } from './dto/mercadopago.dto'

@Injectable()
export class SettingsMercadopagoService {
  constructor(
    @InjectRepository(MercadopagoCredentials)
    private readonly mpRepo: Repository<MercadopagoCredentials>,
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
}

