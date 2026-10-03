export const FEATURE_CATALOG = [
  { key: 'pos_terminal', label: 'Terminal POS y caja' },
  { key: 'inventory', label: 'Inventario y stock' },
  { key: 'barcode_scanner', label: 'Códigos de barras' },
  { key: 'categories_brands', label: 'Categorías y marcas' },
  { key: 'customers_credit', label: 'Clientes y fiado (operación)' },
  { key: 'purchases_suppliers', label: 'Compras y proveedores' },
  { key: 'current_accounts', label: 'Cuenta corriente de clientes (historial y abonos)' },
  { key: 'payment_integrations', label: 'Pagos electrónicos y transferencias' },
  { key: 'automated_accounting', label: 'Contabilidad automática' },
  { key: 'reports_bi', label: 'Reportes y dashboard' },
  { key: 'export_pdf_excel', label: 'Exportación PDF/Excel' },
  { key: 'email_notifications', label: 'Notificaciones por email' },
  { key: 'electronic_invoicing', label: 'Facturación electrónica AFIP' },
  { key: 'expenses_management', label: 'Gestión de gastos' },
  { key: 'supplier_current_accounts', label: 'Cuenta corriente de proveedores' },
  { key: 'returns_and_vat', label: 'Devoluciones e IVA' },
  { key: 'production', label: 'Producción y fraccionamiento' },
  { key: 'multi_branch', label: 'Múltiples sucursales' },
] as const;

export type FeatureKey = (typeof FEATURE_CATALOG)[number]['key'];

export const FEATURE_KEYS = FEATURE_CATALOG.map(({ key }) => key) as FeatureKey[];

/**
 * Dependencias funcionales. Una capacidad dependiente nunca puede quedar
 * habilitada si su módulo base está desactivado en el mismo plan.
 */
export const FEATURE_DEPENDENCIES: Partial<Record<FeatureKey, FeatureKey[]>> = {
  barcode_scanner: ['inventory'],
  categories_brands: ['inventory'],
  current_accounts: ['customers_credit'],
  payment_integrations: ['pos_terminal'],
  electronic_invoicing: ['pos_terminal'],
  supplier_current_accounts: ['purchases_suppliers'],
  returns_and_vat: ['inventory'],
  production: ['inventory'],
  multi_branch: ['inventory'],
  export_pdf_excel: ['reports_bi'],
};

export function getMissingFeatureDependencies(features: Record<string, boolean>): Array<{ feature: FeatureKey; requires: FeatureKey }> {
  const missing: Array<{ feature: FeatureKey; requires: FeatureKey }> = [];
  for (const [feature, dependencies] of Object.entries(FEATURE_DEPENDENCIES)) {
    if (features[feature] !== true) continue;
    for (const dependency of dependencies ?? []) {
      if (features[dependency] !== true) missing.push({ feature: feature as FeatureKey, requires: dependency });
    }
  }
  return missing;
}

export const BUILTIN_PLAN_DEFAULTS: Record<string, Partial<Record<FeatureKey, boolean>>> = {
  Emprendedor: {
    pos_terminal: true,
    inventory: true,
    barcode_scanner: true,
    categories_brands: true,
    customers_credit: true,
    purchases_suppliers: true,
    current_accounts: true,
    payment_integrations: true,
  },
  Negocio: {
    ...Object.fromEntries(FEATURE_KEYS.filter((key) => key !== 'multi_branch' && key !== 'email_notifications').map((key) => [key, true])),
  },
  Profesional: {
    ...Object.fromEntries(FEATURE_KEYS.map((key) => [key, true])),
  },
};

const LEGACY_FEATURE_ALIASES: Record<string, FeatureKey> = {
  accounting: 'automated_accounting',
  feature_accounting: 'automated_accounting',
  multisite: 'multi_branch',
  feature_multi_branch: 'multi_branch',
  reports_history: 'reports_bi',
  feature_reports_history: 'reports_bi',
  pdf_export: 'export_pdf_excel',
  feature_export: 'export_pdf_excel',
  email_alerts: 'email_notifications',
  feature_email_alerts: 'email_notifications',
  feature_afip: 'electronic_invoicing',
  feature_expenses: 'expenses_management',
};

export function canonicalizeFeatures(features?: Record<string, boolean> | null, planName?: string): Record<FeatureKey, boolean> {
  const normalized = {
    ...Object.fromEntries(FEATURE_KEYS.map((key) => [key, false])),
    ...(BUILTIN_PLAN_DEFAULTS[planName ?? ''] ?? {}),
  } as Record<FeatureKey, boolean>;
  if (!features) return normalized;

  for (const [key, enabled] of Object.entries(features)) {
    const canonicalKey = FEATURE_KEYS.includes(key as FeatureKey)
      ? key as FeatureKey
      : LEGACY_FEATURE_ALIASES[key];
    if (canonicalKey) normalized[canonicalKey] = enabled === true;
  }
  return normalized;
}

export function normalizeFeatures(features?: Record<string, boolean> | null, planName?: string): Record<FeatureKey, boolean> {
  const normalized = canonicalizeFeatures(features, planName);

  // La respuesta efectiva nunca expone un módulo usable sin su dependencia.
  let changed = true;
  while (changed) {
    changed = false;
    for (const [feature, dependencies] of Object.entries(FEATURE_DEPENDENCIES)) {
      if (normalized[feature as FeatureKey] && (dependencies ?? []).some((dependency) => !normalized[dependency])) {
        normalized[feature as FeatureKey] = false;
        changed = true;
      }
    }
  }
  return normalized;
}

export function featureSettingKey(feature: FeatureKey): string {
  return `feature_${feature}`;
}