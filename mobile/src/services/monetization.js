// ============================================================================
// MONETIZATION SERVICE (scaffold)
//
// Freemium model designed to beat paid competitors:
//  - FREE tier: full offline tracking, quests, steps, diet, 3 combat arts,
//    basic punishments. (Genuinely useful so the app spreads organically.)
//  - HUNTER PRO (subscription): AI meal plans refresh, all 8 combat arts,
//    advanced analytics, cloud sync/backup, custom punishments, themes,
//    export data, priority body-recomposition phases.
//
// This module is intentionally provider-agnostic. Wire it to RevenueCat
// (recommended - handles Play Billing + receipts) or expo-in-app-purchases.
// Until a provider is configured, `isPro()` reads a locally stored flag so
// the gating logic is fully testable offline.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PRO = 'entitlement_pro';

export const PRODUCTS = {
  MONTHLY: { id: 'hunter_pro_monthly', price: '$4.99', period: 'month' },
  YEARLY: { id: 'hunter_pro_yearly', price: '$29.99', period: 'year', badge: 'Best Value · 50% off' },
  LIFETIME: { id: 'hunter_pro_lifetime', price: '$79.99', period: 'once' },
};

export const PRO_FEATURES = [
  'Unlimited AI meal-plan regeneration',
  'All 8 combat disciplines + advanced sessions',
  'Cloud sync & backup across devices',
  'Advanced progress analytics & charts',
  'Custom punishment rules & app block list',
  'Exclusive Shadow Monarch UI themes',
  'Export your data (CSV/JSON)',
];

export const FREE_LIMITS = {
  mealPlanRegensPerDay: 1,
  combatArts: ['boxing', 'muay_thai', 'bjj'],
  analyticsDays: 7,
};

export const MonetizationService = {
  async isPro() {
    return (await AsyncStorage.getItem(KEY_PRO)) === 'true';
  },

  // Called by your IAP provider callback after a successful purchase/restore.
  async setPro(active) {
    await AsyncStorage.setItem(KEY_PRO, active ? 'true' : 'false');
  },

  async canUseCombatArt(artKey) {
    if (await this.isPro()) return true;
    return FREE_LIMITS.combatArts.includes(artKey);
  },

  async analyticsWindow() {
    return (await this.isPro()) ? 365 : FREE_LIMITS.analyticsDays;
  },

  // ---- Provider integration point (RevenueCat example) ----
  // import Purchases from 'react-native-purchases';
  // async init(apiKey) { Purchases.configure({ apiKey }); }
  // async purchase(productId) { ... Purchases.purchasePackage(pkg) ... this.setPro(true) }
  // async restore() { const info = await Purchases.restorePurchases(); this.setPro(info.entitlements.active.pro != null); }
};

export default MonetizationService;
