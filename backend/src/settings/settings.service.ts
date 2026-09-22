import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Branch } from '@inventory/entities/branch.entity';
import { User } from '@tenants/entities/user.entity';
import { Tenant } from '@tenants/entities/tenant.entity';
import { Subscription } from '@billing/entities/subscription.entity';
import { Plan } from '@billing/entities/plan.entity';
import {
  CreateBranchSettingsDto, UpdateBranchSettingsDto,
  CreateUserSettingsDto, UpdateUserSettingsDto, UpdateBusinessProfileDto,
} from './dto/settings.dto';
@Injectable()
export class SettingsService {

  constructor(
    @InjectRepository(Branch) private readonly branchRepo: Repository<Branch>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
  ) {}
  private async getPlan(tenantId: string): Promise<Plan | null> {
    const today = new Date();
    const sub = await this.subscriptionRepo
      .createQueryBuilder('s')
      .where('s.tenant_id = :tenantId', { tenantId })
      .andWhere('s.end_date > :today', { today })
      .orderBy('s.end_date', 'DESC')
      .getOne();
    if (!sub) return null;
    return this.planRepo.findOne({ where: { id: sub.plan_id } });
  }
  private async validateBranchLimit(tenantId: string): Promise<void> {
    const plan = await this.getPlan(tenantId);
    if (!plan) return;
    const count = await this.branchRepo.count({ where: { tenant_id: tenantId } });
    if (count >= plan.max_branches)
      throw new BadRequestException(`Plan "${plan.name}": maximo ${plan.max_branches} sucursal(es). Actualiza tu plan.`);
  }
  private async validateUserLimit(tenantId: string): Promise<void> {
    const plan = await this.getPlan(tenantId);
    if (!plan) return;
    const count = await this.userRepo.count({ where: { tenant_id: tenantId, is_active: true } });
    if (count >= plan.max_users)
      throw new BadRequestException(`Plan "${plan.name}": maximo ${plan.max_users} usuario(s). Actualiza tu plan.`);
  }


  // SUCURSALES
  async getBranches(tenantId: string): Promise<Branch[]> {
    return this.branchRepo.find({
      where: { tenant_id: tenantId },
      order: { is_main_branch: 'DESC', created_at: 'ASC' },
    });
  }
  async createBranch(dto: CreateBranchSettingsDto, tenantId: string): Promise<Branch> {
    await this.validateBranchLimit(tenantId);
    const branch = this.branchRepo.create({ ...dto, tenant_id: tenantId });
    return this.branchRepo.save(branch);
  }
  async updateBranch(id: string, dto: UpdateBranchSettingsDto, tenantId: string): Promise<Branch> {
    const branch = await this.branchRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    Object.assign(branch, dto);
    return this.branchRepo.save(branch);
  }
  async deleteBranch(id: string, tenantId: string): Promise<{ message: string }> {
    const branch = await this.branchRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    if (branch.is_main_branch) throw new BadRequestException('No se puede eliminar la sucursal principal.');
    await this.branchRepo.remove(branch);
    return { message: 'Sucursal eliminada' };
  }
  // USUARIOS
  async getUsers(tenantId: string): Promise<any[]> {
    const users = await this.userRepo.find({ where: { tenant_id: tenantId }, order: { created_at: 'ASC' } });
    const branches = await this.branchRepo.find({ where: { tenant_id: tenantId } });
    const branchMap = new Map(branches.map((b) => [b.id, b.name]));
    return users.map(({ password_hash, ...user }) => ({
      ...user,
      branch_name: user.branch_id ? (branchMap.get(user.branch_id) ?? null) : null,
    }));
  }
  async createUser(dto: CreateUserSettingsDto, tenantId: string): Promise<any> {
    await this.validateUserLimit(tenantId);
    if (dto.branch_id && !(await this.branchRepo.findOne({ where: { id: dto.branch_id, tenant_id: tenantId } }))) {
      throw new NotFoundException('La sucursal no pertenece al negocio actual');
    }
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Ya existe un usuario con ese email');
    const password_hash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      name: dto.name, email: dto.email, password_hash,
      role: dto.role as any, branch_id: dto.branch_id ?? undefined,
      tenant_id: tenantId, is_active: true,
    });
    const saved = await this.userRepo.save(user) as User;
    const { password_hash: _, ...result } = saved;
    return result;
  }
  async updateUser(id: string, dto: UpdateUserSettingsDto, tenantId: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (dto.branch_id !== undefined && dto.branch_id !== null && !(await this.branchRepo.findOne({ where: { id: dto.branch_id, tenant_id: tenantId } }))) {
      throw new NotFoundException('La sucursal no pertenece al negocio actual');
    }
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role as any;
    if (dto.branch_id !== undefined) user.branch_id = dto.branch_id as string;
    if (dto.is_active !== undefined) user.is_active = dto.is_active;
    if (dto.password) user.password_hash = await bcrypt.hash(dto.password, 12);
    const saved = await this.userRepo.save(user) as User;
    const { password_hash, ...result } = saved;
    return result;
  }
  // PERFIL DEL NEGOCIO
  async getBusinessProfile(tenantId: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Negocio no encontrado');
    const plan = await this.getPlan(tenantId);
    const branchCount = await this.branchRepo.count({ where: { tenant_id: tenantId } });
    const userCount = await this.userRepo.count({ where: { tenant_id: tenantId, is_active: true } });
    return { ...tenant, current_plan: plan, branch_count: branchCount, user_count: userCount };
  }
  async updateBusinessProfile(dto: UpdateBusinessProfileDto, tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Negocio no encontrado');
    Object.assign(tenant, dto);
    return this.tenantRepo.save(tenant);
  }
}
