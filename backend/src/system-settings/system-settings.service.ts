import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepo: Repository<SystemSetting>,
  ) {}

  async onModuleInit() {
    // Inicializar configuraciones por defecto si no existen
    await this.ensureSetting('trial_days', '3');
    await this.ensureSetting('referral_benefit_enabled', 'true');
    await this.ensureSetting('referral_discount_percentage', '5');
    await this.ensureSetting('referral_benefit_months', '1');
    await this.ensureSetting('allow_registrations', 'true');
    await this.ensureSetting('maintenance_mode', 'false');
    
    // Módulos Globales
    await this.ensureSetting('feature_afip', 'true');
    await this.ensureSetting('feature_accounting', 'true');
    await this.ensureSetting('feature_multi_branch', 'true');
    await this.ensureSetting('feature_reports_history', 'true');
    await this.ensureSetting('feature_export', 'true');
    await this.ensureSetting('feature_email_alerts', 'true');
    await this.ensureSetting('feature_expenses', 'true');
  }

  private async ensureSetting(key: string, defaultValue: string) {
    const exists = await this.settingRepo.findOne({ where: { key } });
    if (!exists) {
      await this.settingRepo.save({ key, value: defaultValue });
    }
  }

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting ? setting.value : null;
  }

  async getAllSettings() {
    return this.settingRepo.find();
  }

  async updateSetting(key: string, value: string) {
    return this.settingRepo.save({ key, value });
  }

  async getPublicSettings() {
    const keys = [
      'trial_days',
      'referral_benefit_enabled',
      'referral_discount_percentage',
      'referral_benefit_months',
    ];
    const settings = await this.settingRepo.find({
      where: keys.map((key) => ({ key })),
    });
    return settings.reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  }
}
