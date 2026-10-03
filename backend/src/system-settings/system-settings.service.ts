import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { FEATURE_KEYS, featureSettingKey } from '../billing/feature-catalog';
import { randomUUID } from 'crypto';
import { UpdatePlatformPaymentConfigDto } from './dto/update-platform-payment-config.dto';

const SETTING_DEFAULTS: Record<string, string> = {
  trial_days: '3',
  referral_benefit_enabled: 'true',
  referral_discount_percentage: '5',
  referral_benefit_months: '1',
  allow_registrations: 'true',
  maintenance_mode: 'false',
  platform_mp_enabled: 'false',
  platform_mp_public_key: '',
  platform_mp_access_token: '',
  platform_transfer_accounts: '[]',
};

const LEGACY_SETTING_ALIASES: Record<string, string> = {
  feature_afip: featureSettingKey('electronic_invoicing'),
  feature_accounting: featureSettingKey('automated_accounting'),
  feature_multi_branch: featureSettingKey('multi_branch'),
  feature_reports_history: featureSettingKey('reports_bi'),
  feature_export: featureSettingKey('export_pdf_excel'),
  feature_email_alerts: featureSettingKey('email_notifications'),
  feature_expenses: featureSettingKey('expenses_management'),
};

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepo: Repository<SystemSetting>,
  ) {}

  async onModuleInit() {
    for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
      await this.ensureSetting(key, value);
    }

    for (const feature of FEATURE_KEYS) {
      const key = featureSettingKey(feature);
      const legacyKey = Object.entries(LEGACY_SETTING_ALIASES).find(([, canonical]) => canonical === key)?.[0];
      const legacyValue = legacyKey ? await this.getSetting(legacyKey) : null;
      await this.ensureSetting(key, legacyValue ?? 'true');
    }
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
    const settings = await this.settingRepo.find();
    return settings.map((setting) => setting.key === 'platform_mp_access_token'
      ? { ...setting, value: setting.value ? '********' : '' }
      : setting);
  }

  async updateSetting(key: string, value: string) {
    if (!this.isAllowedSetting(key)) {
      throw new BadRequestException(`La configuración '${key}' no está disponible`);
    }
    return this.settingRepo.save({ key, value });
  }

  isAllowedSetting(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(SETTING_DEFAULTS, key)
      || FEATURE_KEYS.some((feature) => featureSettingKey(feature) === key);
  }

  async isFeatureGloballyEnabled(feature: string): Promise<boolean> {
    const key = feature.startsWith('feature_') ? feature : `feature_${feature}`;
    const value = await this.getSetting(key);
    return value === null || value === 'true';
  }

  async getPublicSettings() {
    const keys = [
      'trial_days',
      'referral_benefit_enabled',
      'referral_discount_percentage',
      'referral_benefit_months',
    ];
    const moduleKeys = FEATURE_KEYS.map(featureSettingKey);
    const settings = await this.settingRepo.find({
      where: [...keys, ...moduleKeys].map((key) => ({ key })),
    });
    return settings.reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  }

  async getPlatformPaymentConfig() {
    const [enabled, publicKey, token, accounts] = await Promise.all([
      this.getSetting('platform_mp_enabled'),
      this.getSetting('platform_mp_public_key'),
      this.getSetting('platform_mp_access_token'),
      this.getSetting('platform_transfer_accounts'),
    ]);
    return {
      mercadopago: {
        enabled: enabled === 'true',
        public_key: publicKey ?? '',
        configured: Boolean(token),
      },
      transfer_accounts: this.parseTransferAccounts(accounts),
    };
  }

  async updatePlatformPaymentConfig(data: UpdatePlatformPaymentConfigDto) {
    const accounts = data.transfer_accounts.map((account) => ({
      id: account.id || randomUUID(),
      name: account.name,
      alias: account.alias ?? '',
      cbu: account.cbu ?? '',
      holder: account.holder ?? '',
      bank: account.bank ?? '',
      active: account.active !== false,
    }));
    if (accounts.some((account) => !account.alias && !account.cbu)) {
      throw new BadRequestException('Cada cuenta de transferencia debe tener alias o CBU');
    }

    await this.settingRepo.save([
      { key: 'platform_mp_enabled', value: String(data.mercadopago_enabled === true) },
      { key: 'platform_mp_public_key', value: data.mercadopago_public_key ?? '' },
      { key: 'platform_transfer_accounts', value: JSON.stringify(accounts) },
    ]);
    if (data.mercadopago_access_token && data.mercadopago_access_token !== '********') {
      await this.settingRepo.save({ key: 'platform_mp_access_token', value: data.mercadopago_access_token });
    }
    return this.getPlatformPaymentConfig();
  }

  private parseTransferAccounts(value: string | null): Array<Record<string, unknown>> {
    if (!value) return [];
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((account) => account && typeof account === 'object') as Array<Record<string, unknown>> : [];
    } catch {
      return [];
    }
  }
}
