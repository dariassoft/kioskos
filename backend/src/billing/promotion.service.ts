import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Promotion } from './entities/promotion.entity';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promoRepo: Repository<Promotion>,
  ) {}

  async findAll(): Promise<Promotion[]> {
    return this.promoRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Promotion> {
    const promo = await this.promoRepo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    return promo;
  }

  async create(data: Partial<Promotion>): Promise<Promotion> {
    return this.promoRepo.save(this.promoRepo.create(data));
  }

  async update(id: string, data: Partial<Promotion>): Promise<Promotion> {
    await this.findOne(id);
    await this.promoRepo.update(id, data as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const promo = await this.findOne(id);
    await this.promoRepo.remove(promo);
  }

  /**
   * Busca una promoción activa y vigente para un plan específico.
   * Retorna la mejor promo disponible (mayor descuento) si hay varias.
   */
  async findActiveForPlan(planId: string): Promise<Promotion | null> {
    const now = new Date();
    const promos = await this.promoRepo.find({
      where: {
        is_active: true,
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
      },
    });

    // Filtrar por plan y por usos disponibles
    const applicable = promos.filter((p) => {
      // Verificar límite de usos
      if (p.max_uses !== null && p.current_uses >= p.max_uses) return false;
      // Verificar si aplica a este plan
      if (!p.applies_to_plan_ids || p.applies_to_plan_ids.length === 0) return true;
      return p.applies_to_plan_ids.includes(planId);
    });

    if (applicable.length === 0) return null;

    // Retornar la de mayor descuento
    return applicable.sort((a, b) => Number(b.discount_value) - Number(a.discount_value))[0];
  }

  /**
   * Calcula el precio final con la promoción aplicada.
   */
  calculatePromoPrice(originalPrice: number, promo: Promotion): number {
    if (promo.discount_type === 'percentage') {
      return Math.round(originalPrice * (1 - Number(promo.discount_value) / 100) * 100) / 100;
    }
    // fixed_price: el descuento_value ES el precio
    return Number(promo.discount_value);
  }

  /**
   * Incrementa el contador de usos de una promoción.
   */
  async incrementUses(promoId: string): Promise<void> {
    await this.promoRepo.increment({ id: promoId }, 'current_uses', 1);
  }
}
