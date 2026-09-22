import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Tenant, TenantStatus, PLATFORM_TENANT_ID } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/tenant.dto';
import { User } from './entities/user.entity';
import { UserRole } from '../common/decorators/roles.decorator';
import { Branch } from '../inventory/entities/branch.entity';
import { Plan } from '../billing/entities/plan.entity';
import { Subscription, SubscriptionStatus } from '../billing/entities/subscription.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepo.find({
      where: { id: Not(PLATFORM_TENANT_ID) },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    if (id === PLATFORM_TENANT_ID) {
      throw new NotFoundException(`Tenant ${id} no encontrado`);
    }
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} no encontrado`);
    return tenant;
  }

  async create(data: CreateTenantDto) {
    const existingUser = await this.dataSource.getRepository(User).findOne({
      where: { email: data.owner_email },
    });
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    if (data.tax_id) {
      const existingTenant = await this.tenantRepo.findOne({ where: { tax_id: data.tax_id } });
      if (existingTenant) throw new ConflictException('Ya existe un negocio con ese CUIT/CUIL');
    }

    const plan = await this.dataSource.getRepository(Plan).findOne({
      where: { id: data.plan_id, is_active: true },
    });
    if (!plan) throw new BadRequestException('El plan seleccionado no existe o está inactivo');

    return this.dataSource.transaction(async (manager) => {
      const tenantRepo = manager.getRepository(Tenant);
      const userRepo = manager.getRepository(User);
      const branchRepo = manager.getRepository(Branch);
      const subscriptionRepo = manager.getRepository(Subscription);

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const tenant = await tenantRepo.save(tenantRepo.create({
        business_name: data.business_name,
        owner_email: data.owner_email,
        tax_id: data.tax_id,
        phone: data.phone,
        address: data.address,
        logo_url: data.logo_url,
        status: TenantStatus.TRIAL,
        trial_ends_at: trialEndsAt,
      }));

      const branch = await branchRepo.save(branchRepo.create({
        tenant_id: tenant.id,
        name: 'Casa Central',
        address: data.address,
        is_main_branch: true,
      }));

      const owner = await userRepo.save(userRepo.create({
        tenant_id: tenant.id,
        branch_id: branch.id,
        name: data.owner_name,
        email: data.owner_email,
        password_hash: await bcrypt.hash(data.owner_password, 12),
        role: UserRole.ADMIN,
        is_active: true,
      }));

      const subscription = await subscriptionRepo.save(subscriptionRepo.create({
        tenant_id: tenant.id,
        plan_id: plan.id,
        start_date: new Date(),
        end_date: trialEndsAt,
        next_billing_date: trialEndsAt,
        auto_renew: false,
        locked_price: Number(plan.price_monthly),
        locked_plan_name: plan.name,
        billing_day: 10,
        status: SubscriptionStatus.ACTIVE,
      }));

      const { password_hash: _passwordHash, ...ownerProfile } = owner;
      return { tenant, owner: ownerProfile, branch, subscription };
    });
  }

  async updateStatus(id: string, status: TenantStatus): Promise<Tenant> {
    if (id === PLATFORM_TENANT_ID) {
      throw new BadRequestException('El registro técnico de la plataforma no es un negocio administrable');
    }
    await this.tenantRepo.update(id, { status });
    return this.findOne(id);
  }

  async getMetrics() {
    const tenantFilter = { id: Not(PLATFORM_TENANT_ID) };
    const total = await this.tenantRepo.count({ where: tenantFilter });
    const active = await this.tenantRepo.count({ where: { ...tenantFilter, status: TenantStatus.ACTIVE } });
    const trial = await this.tenantRepo.count({ where: { ...tenantFilter, status: TenantStatus.TRIAL } });
    const suspended = await this.tenantRepo.count({ where: { ...tenantFilter, status: TenantStatus.SUSPENDED } });
    return { total, active, trial, suspended };
  }
}
