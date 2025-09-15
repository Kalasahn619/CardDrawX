import { RANKS } from './config.js';

export function calculateCodex(card, suitOrder) {
  const suitIndex = suitOrder.indexOf(card.suit);
  const rankIndex = RANKS.indexOf(card.rank);
  return suitIndex * RANKS.length + (rankIndex + 1); // 1..40
}

export function calculateDigitalRootFromCodes(codes) {
  const sum = codes.reduce((a,b) => a + b, 0);
  const steps = [];
  let current = sum;
  while (current > 9) {
    const next = current.toString().split('').reduce((a,b)=>a + Number(b), 0);
    steps.push(`${current.toString().split('').join(' + ')} = ${next}`);
    current = next;
  }
  return { sum, root: current, steps };
}
