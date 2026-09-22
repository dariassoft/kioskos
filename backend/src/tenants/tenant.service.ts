import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} no encontrado`);
    return tenant;
  }

  async create(data: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepo.create(data);
    return this.tenantRepo.save(tenant);
  }

  async updateStatus(id: string, status: TenantStatus): Promise<Tenant> {
    await this.tenantRepo.update(id, { status });
    return this.findOne(id);
  }

  async getMetrics() {
    const total = await this.tenantRepo.count();
    const active = await this.tenantRepo.count({ where: { status: TenantStatus.ACTIVE } });
    const trial = await this.tenantRepo.count({ where: { status: TenantStatus.TRIAL } });
    const suspended = await this.tenantRepo.count({ where: { status: TenantStatus.SUSPENDED } });
    return { total, active, trial, suspended };
  }
}
