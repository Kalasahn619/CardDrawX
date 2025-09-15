import { SUITS, RANKS } from './config.js';

export function initializeDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ suit: s, rank: r });
  return d;
}

export function cardKey(card) { return `${card.rank}${card.suit}`; }
export function parseCardKey(key) { 
  const suit = key.slice(-1); 
  const rank = key.slice(0, key.length - 1); 
  return { rank, suit }; 
}

export function shuffleCrypto(arr) {
  function secureRandomInt(maxExclusive) {
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] % maxExclusive;
    }
    return Math.floor(Math.random() * maxExclusive);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
