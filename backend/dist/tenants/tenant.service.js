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
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tenant_entity_1 = require("./entities/tenant.entity");
let TenantService = class TenantService {
    constructor(tenantRepo) {
        this.tenantRepo = tenantRepo;
    }
    async findAll() {
        return this.tenantRepo.find({ order: { created_at: 'DESC' } });
    }
    async findOne(id) {
        const tenant = await this.tenantRepo.findOne({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException(`Tenant ${id} no encontrado`);
        return tenant;
    }
    async create(data) {
        const tenant = this.tenantRepo.create(data);
        return this.tenantRepo.save(tenant);
    }
    async updateStatus(id, status) {
        await this.tenantRepo.update(id, { status });
        return this.findOne(id);
    }
    async getMetrics() {
        const total = await this.tenantRepo.count();
        const active = await this.tenantRepo.count({ where: { status: tenant_entity_1.TenantStatus.ACTIVE } });
        const trial = await this.tenantRepo.count({ where: { status: tenant_entity_1.TenantStatus.TRIAL } });
        const suspended = await this.tenantRepo.count({ where: { status: tenant_entity_1.TenantStatus.SUSPENDED } });
        return { total, active, trial, suspended };
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TenantService);
//# sourceMappingURL=tenant.service.js.map