"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const tenant_entity_1 = require("./entities/tenant.entity");
const user_entity_1 = require("./entities/user.entity");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const branch_entity_1 = require("../inventory/entities/branch.entity");
const plan_entity_1 = require("../billing/entities/plan.entity");
const subscription_entity_1 = require("../billing/entities/subscription.entity");
const billing_history_entity_1 = require("../billing/entities/billing-history.entity");
const system_settings_service_1 = require("../system-settings/system-settings.service");
let TenantService = class TenantService {
    constructor(tenantRepo, dataSource, systemSettings) {
        this.tenantRepo = tenantRepo;
        this.dataSource = dataSource;
        this.systemSettings = systemSettings;
    }
    async findAll() {
        return this.tenantRepo.find({
            where: { id: (0, typeorm_2.Not)(tenant_entity_1.PLATFORM_TENANT_ID) },
            order: { created_at: 'DESC' },
        });
    }
    async findOne(id) {
        if (id === tenant_entity_1.PLATFORM_TENANT_ID) {
            throw new common_1.NotFoundException(`Tenant ${id} no encontrado`);
        }
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException(`Tenant ${id} no encontrado`);
        return tenant;
    }
    async create(data) {
        const existingUser = await this.dataSource.getRepository(user_entity_1.User).findOne({
            where: { email: data.owner_email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Ya existe un usuario con ese email');
        }
        if (data.tax_id) {
            const existingTenant = await this.tenantRepo.findOne({ where: { tax_id: data.tax_id } });
            if (existingTenant)
                throw new common_1.ConflictException('Ya existe un negocio con ese CUIT/CUIL');
        }
        const plan = await this.dataSource.getRepository(plan_entity_1.Plan).findOne({
            where: { id: data.plan_id, is_active: true },
        });
        if (!plan)
            throw new common_1.BadRequestException('El plan seleccionado no existe o está inactivo');
        return this.dataSource.transaction(async (manager) => {
            const tenantRepo = manager.getRepository(tenant_entity_1.Tenant);
            const userRepo = manager.getRepository(user_entity_1.User);
            const branchRepo = manager.getRepository(branch_entity_1.Branch);
            const subscriptionRepo = manager.getRepository(subscription_entity_1.Subscription);
            const billingRepo = manager.getRepository(billing_history_entity_1.BillingHistory);
            const now = new Date();
            const isPaid = data.activation_mode === 'paid';
            const periodMonths = data.billing_period_months ?? 1;
            const periodEndsAt = new Date(now);
            if (isPaid) {
                periodEndsAt.setMonth(periodEndsAt.getMonth() + periodMonths);
            }
            else {
                const trialDays = Number(await this.systemSettings.getSetting('trial_days')) || 3;
                periodEndsAt.setDate(periodEndsAt.getDate() + trialDays);
            }
            const tenant = await tenantRepo.save(tenantRepo.create({
                business_name: data.business_name,
                owner_email: data.owner_email,
                tax_id: data.tax_id,
                phone: data.phone,
                address: data.address,
                logo_url: data.logo_url,
                status: isPaid ? tenant_entity_1.TenantStatus.ACTIVE : tenant_entity_1.TenantStatus.TRIAL,
                trial_ends_at: isPaid ? undefined : periodEndsAt,
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
                role: roles_decorator_1.UserRole.ADMIN,
                is_active: true,
            }));
            const subscription = await subscriptionRepo.save(subscriptionRepo.create({
                tenant_id: tenant.id,
                plan_id: plan.id,
                start_date: now,
                end_date: periodEndsAt,
                next_billing_date: periodEndsAt,
                auto_renew: isPaid,
                last_payment_date: isPaid ? now : undefined,
                locked_price: Number(plan.price_monthly),
                locked_plan_name: plan.name,
                billing_day: 10,
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
            }));
            if (isPaid) {
                await billingRepo.save(billingRepo.create({
                    tenant_id: tenant.id,
                    amount: Number(plan.price_monthly) * periodMonths,
                    payment_status: billing_history_entity_1.PaymentStatus.PAID,
                    payment_method: data.payment_method ?? 'cash',
                    plan_id: plan.id,
                    plan_name: plan.name,
                    billing_period_start: now,
                    billing_period_end: periodEndsAt,
                }));
            }
            const { password_hash: _passwordHash, ...ownerProfile } = owner;
            return { tenant, owner: ownerProfile, branch, subscription };
        });
    }
    async updateStatus(id, status) {
        if (id === tenant_entity_1.PLATFORM_TENANT_ID) {
            throw new common_1.BadRequestException('El registro técnico de la plataforma no es un negocio administrable');
        }
        await this.tenantRepo.update(id, { status });
        return this.findOne(id);
    }
    async getMetrics() {
        const tenantFilter = { id: (0, typeorm_2.Not)(tenant_entity_1.PLATFORM_TENANT_ID) };
        const total = await this.tenantRepo.count({ where: tenantFilter });
        const active = await this.tenantRepo.count({ where: { ...tenantFilter, status: tenant_entity_1.TenantStatus.ACTIVE } });
        const trial = await this.tenantRepo.count({ where: { ...tenantFilter, status: tenant_entity_1.TenantStatus.TRIAL } });
        const suspended = await this.tenantRepo.count({ where: { ...tenantFilter, status: tenant_entity_1.TenantStatus.SUSPENDED } });
        return { total, active, trial, suspended };
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        system_settings_service_1.SystemSettingsService])
], TenantService);
//# sourceMappingURL=tenant.service.js.map