"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../tenants/entities/user.entity");
const tenant_entity_1 = require("../../tenants/entities/tenant.entity");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService, userRepo, tenantRepo) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
        this.configService = configService;
        this.userRepo = userRepo;
        this.tenantRepo = tenantRepo;
    }
    async validate(payload) {
        const user = await this.userRepo.findOne({ where: { id: payload.sub } });
        if (!user || !user.is_active) {
            throw new common_1.UnauthorizedException('Token inválido: usuario inactivo o inexistente');
        }
        if (!payload.tenant_id && user.role !== 'superadmin') {
            throw new common_1.UnauthorizedException('Token inválido: falta tenant_id');
        }
        if (user.role !== 'superadmin' && payload.tenant_id !== user.tenant_id) {
            throw new common_1.UnauthorizedException('Token inválido: el negocio no coincide');
        }
        const tenant = await this.tenantRepo.findOne({ where: { id: user.tenant_id } });
        if (!tenant || tenant.status === tenant_entity_1.TenantStatus.SUSPENDED || tenant.status === tenant_entity_1.TenantStatus.PAST_DUE) {
            throw new common_1.UnauthorizedException('El negocio está suspendido o tiene la suscripción vencida');
        }
        if (tenant.status === tenant_entity_1.TenantStatus.TRIAL && tenant.trial_ends_at && tenant.trial_ends_at < new Date()) {
            throw new common_1.UnauthorizedException('El período de prueba del negocio ha finalizado');
        }
        return {
            id: payload.sub,
            email: user.email,
            role: user.role,
            tenant_id: user.tenant_id,
            name: user.name,
            referral_code: payload.referral_code,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map