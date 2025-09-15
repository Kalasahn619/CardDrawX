import { LS_HISTORY, LS_SUIT_ORDER, LS_SUIT_CONFIGS } from './config.js';

export function persistHistory(history) { localStorage.setItem(LS_HISTORY, JSON.stringify(history)); }
export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]') || []; } catch { return []; }
}
export function persistSuitOrder(suitOrder) {
  localStorage.setItem(LS_SUIT_ORDER, JSON.stringify(suitOrder));
}
export function loadSuitOrder() {
  try { return JSON.parse(localStorage.getItem(LS_SUIT_ORDER) || '"♥","♦","♠","♣"') || ["♥","♦","♠","♣"]; } catch { return ["♥","♦","♠","♣"]; }
}
export function persistSuitConfigs(configs) {
  localStorage.setItem(LS_SUIT_CONFIGS, JSON.stringify(configs));
}
export function loadSuitConfigs() {
  try { return JSON.parse(localStorage.getItem(LS_SUIT_CONFIGS) || '{}') || {}; } catch { return {}; }
}
