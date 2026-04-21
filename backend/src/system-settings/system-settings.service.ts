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
  }

  private async ensureSetting(key: string, defaultValue: string) {
    const exists = await this.settingRepo.findOne({ where: { key } });
    if (!exists) {
      await this.settingRepo.save({ key, value: defaultValue });
    }
  }

  async getSetting(key: string): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting ? setting.value : null;
  }

  async getAllSettings() {
    const settings = await this.settingRepo.find();
    return settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  }

  async updateSetting(key: string, value: string) {
    return this.settingRepo.save({ key, value });
  }
}
