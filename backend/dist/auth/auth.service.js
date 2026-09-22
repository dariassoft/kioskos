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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("../tenants/entities/user.entity");
const tenant_entity_1 = require("../tenants/entities/tenant.entity");
const tenant_entity_2 = require("../tenants/entities/tenant.entity");
const branch_entity_1 = require("../inventory/entities/branch.entity");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const subscription_entity_1 = require("../billing/entities/subscription.entity");
const plan_entity_1 = require("../billing/entities/plan.entity");
let AuthService = class AuthService {
    constructor(userRepo, tenantRepo, branchRepo, subscriptionRepo, planRepo, jwtService) {
        this.userRepo = userRepo;
        this.tenantRepo = tenantRepo;
        this.branchRepo = branchRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.planRepo = planRepo;
        this.jwtService = jwtService;
    }
    async validateUserLimit(tenantId) {
        const today = new Date().toISOString().slice(0, 10);
        const subscription = await this.subscriptionRepo
            .createQueryBuilder('subscription')
            .where('subscription.tenant_id = :tenantId', { tenantId })
            .andWhere('subscription.status = :status', { status: subscription_entity_1.SubscriptionStatus.ACTIVE })
            .andWhere('subscription.start_date <= :today', { today })
            .andWhere('subscription.end_date >= :today', { today })
            .orderBy('subscription.end_date', 'DESC')
            .getOne();
        if (!subscription) {
            throw new common_1.BadRequestException('El negocio no tiene una suscripción activa para crear usuarios');
        }
        const plan = await this.planRepo.findOne({
            where: { id: subscription.plan_id, is_active: true },
        });
        if (!plan) {
            throw new common_1.BadRequestException('El plan actual no está disponible para crear usuarios');
        }
        const activeUsers = await this.userRepo.count({
            where: { tenant_id: tenantId, is_active: true },
        });
        if (activeUsers >= plan.max_users) {
            throw new common_1.BadRequestException(`Plan "${plan.name}": máximo ${plan.max_users} usuario(s). Actualiza tu plan.`);
        }
    }
    async login(dto) {
        const user = await this.userRepo.findOne({ where: { email: dto.email } });
        if (!user || !user.is_active) {
            throw new common_1.UnauthorizedException('Credenciales incorrectas o usuario inactivo');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciales incorrectas');
        }
        const isSuperAdmin = user.role === roles_decorator_1.UserRole.SUPERADMIN;
        const tenant = user.tenant_id
            ? await this.tenantRepo.findOne({ where: { id: user.tenant_id } })
            : null;
        if (!isSuperAdmin && (!tenant || tenant.status === tenant_entity_2.TenantStatus.SUSPENDED || tenant.status === tenant_entity_2.TenantStatus.PAST_DUE)) {
            throw new common_1.UnauthorizedException('El negocio está suspendido o tiene la suscripción vencida');
        }
        if (!isSuperAdmin && tenant?.status === tenant_entity_2.TenantStatus.TRIAL && tenant.trial_ends_at && tenant.trial_ends_at < new Date()) {
            throw new common_1.UnauthorizedException('El período de prueba del negocio ha finalizado');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenant_id: user.tenant_id,
            name: user.name,
            referral_code: tenant?.referral_code,
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant_id: user.tenant_id,
                branch_id: user.branch_id,
                referral_code: tenant?.referral_code,
            },
        };
    }
    async register(dto, tenantId, role = roles_decorator_1.UserRole.CASHIER, enforcePlanLimit = true) {
        if (enforcePlanLimit) {
            await this.validateUserLimit(tenantId);
        }
        const existing = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('Ya existe un usuario con ese email');
        }
        if (dto.branch_id) {
            const branch = await this.branchRepo.findOne({
                where: { id: dto.branch_id, tenant_id: tenantId },
            });
            if (!branch)
                throw new common_1.ConflictException('La sucursal no pertenece al negocio actual');
        }
        const password_hash = await bcrypt.hash(dto.password, 12);
        const user = this.userRepo.create({
            ...dto,
            password_hash,
            role,
            tenant_id: tenantId,
        });
        await this.userRepo.save(user);
        return this.login({ email: dto.email, password: dto.password });
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        const { password_hash, ...profile } = user;
        return profile;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __param(2, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __param(3, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(4, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map