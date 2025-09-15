import { shuffleCrypto, initializeDeck, cardKey, parseCardKey } from './deck.js';
import { calculateCodex, calculateDigitalRootFromCodes } from './numerology.js';

export async function runMonteCarloSimulation(deck, suitOrder, count, progressCallback) {
  const cardFrequency = {}; // key -> count
  const rootFrequency = {}; // 1..9
  const perBatch = Math.ceil(count / 50);

  for (let done = 0; done < count;) {
    const thisBatch = Math.min(perBatch, count - done);
    for (let i = 0; i < thisBatch; i++) {
      // draw
      const copy = shuffleCrypto([...deck]);
      const draw = copy.slice(0, 6);
      draw.forEach(c => {
        const key = cardKey(c);
        cardFrequency[key] = (cardFrequency[key] || 0) + 1;
      });
      const codes = draw.map(c => calculateCodex(c, suitOrder));
      const { root } = calculateDigitalRootFromCodes(codes);
      rootFrequency[root] = (rootFrequency[root] || 0) + 1;
    }
    done += thisBatch;
    if (progressCallback) progressCallback(done, count);
    await new Promise(r => setTimeout(r, 12));
  }
  const topCards = Object.entries(cardFrequency).map(([card, freq]) => ({ card, freq })).sort((a,b)=>b.freq-a.freq);
  return { cardFrequency, rootFrequency, simulations: count, topCards };
}
