import { SUITS, RANKS } from './config.js';
import { initializeDeck, shuffleCrypto, cardKey, parseCardKey } from './deck.js';
import { calculateCodex, calculateDigitalRootFromCodes } from './numerology.js';
import { runMonteCarloSimulation } from './simulation.js';
import { persistHistory, loadHistory, persistSuitOrder, loadSuitOrder, persistSuitConfigs, loadSuitConfigs } from './storage.js';

// App State
const AppState = {
  deck: [],
  currentDraw: [],
  history: [],
  lottoMode: false,
  suitOrder: [],
  simulationData: null,
  savedSuitConfigs: {},
  undoStack: [],
  redoStack: [],
  theme: 'dark',
};

// Accessibility
function announce(message) {
  let live = document.getElementById('aria-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'aria-live';
    live.setAttribute('aria-live', 'polite');
    live.className = 'sr-only';
    document.body.appendChild(live);
  }
  live.textContent = message;
}

// Theme Switcher
function setTheme(theme) {
  AppState.theme = theme;
  document.body.classList.toggle('dark', theme === 'dark');
  document.body.classList.toggle('light', theme === 'light');
  announce(`Theme set to ${theme}`);
}
document.getElementById('themeSwitcher')?.addEventListener('click', () => {
  setTheme(AppState.theme === 'dark' ? 'light' : 'dark');
});

// Draw Cards
function drawCards() {
  AppState.deck = initializeDeck();
  const copy = shuffleCrypto([...AppState.deck]);
  AppState.currentDraw = copy.slice(0, 6);

  AppState.undoStack.push([...AppState.currentDraw]);
  AppState.redoStack = [];

  displayCards();
  // updateCodexComparison(), updateOracle(), displayLottoNumbers() as needed...

  // Save to history
  const entry = {
    type: 'manual',
    timestampMs: Date.now(),
    cards: AppState.currentDraw.map(c => ({ suit: c.suit, rank: c.rank })),
  };
  AppState.history.unshift(entry);
  persistHistory(AppState.history);
  updateHistoryDisplay();
  announce('New cards drawn.');
}
document.getElementById('drawBtn')?.addEventListener('click', drawCards);

// Simulation
async function handleSimulation() {
  const countEl = document.getElementById('simCount');
  const count = Math.max(1, Math.min(10000, parseInt(countEl?.value || '500', 10)));

  document.getElementById('simulateBtn').disabled = true;
  document.getElementById('simProgress').style.width = '0%';
  document.getElementById('simStatus').textContent = 'Starting...';

  const t0 = performance.now();

  AppState.simulationData = await runMonteCarloSimulation(
    AppState.deck,
    AppState.suitOrder,
    count,
    (done, total) => {
      document.getElementById('simProgress').style.width = `${Math.round((done / total) * 100)}%`;
      document.getElementById('simStatus').textContent = `Simulated ${done} of ${total}`;
    }
  );

  const t1 = performance.now();
  document.getElementById('simPerf').textContent = `Execution: ${(t1-t0).toFixed(1)}ms`;

  // Save to history
  const entry = { type: 'simulation', timestampMs: Date.now(), simulations: count, topCards: AppState.simulationData.topCards };
  AppState.history.unshift(entry);
  persistHistory(AppState.history);

  // renderTopCards(), renderRootDist(), updateHistoryDisplay() as needed...

  document.getElementById('simStatus').textContent = 'Done!';
  document.getElementById('simulateBtn').disabled = false;

  announce('Simulation complete.');
}
document.getElementById('simulateBtn')?.addEventListener('click', handleSimulation);

// Suit Slots Drag & Drop + Keyboard & Touch
function updateSuitSlots() {
  const suitSlots = document.getElementById('suitSlots');
  suitSlots.innerHTML = '';
  AppState.suitOrder.forEach((suit, idx) => {
    const slot = document.createElement('div');
    slot.className = 'suit-slot cursor-move rounded-xl px-3 py-4 bg-white/10 border border-white/20 text-center font-semibold';
    slot.setAttribute('data-position', idx);
    slot.setAttribute('role', 'button');
    slot.setAttribute('tabindex', '0');
    slot.setAttribute('aria-label', `Suit ${suit}`);
    slot.textContent = suit;
    suitSlots.appendChild(slot);

    // Mouse drag
    slot.draggable = true;
    slot.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', slot.dataset.position);
      slot.classList.add('opacity-60');
    });
    slot.addEventListener('dragend', () => slot.classList.remove('opacity-60'));
    slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('drag-over'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', (e) => {
      e.preventDefault(); slot.classList.remove('drag-over');
      const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const to = parseInt(slot.dataset.position, 10);
      if (from !== to) swapSuitOrder(from, to);
    });

    // Touch drag
    slot.addEventListener('touchstart', handleTouchStart, { passive: false });
    slot.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Keyboard support
    slot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        swapSuitOrder(idx, Math.max(0, idx - 1));
        slot.focus();
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        swapSuitOrder(idx, Math.min(SUITS.length - 1, idx + 1));
        slot.focus();
      }
    });
  });
}
function swapSuitOrder(from, to) {
  if (from === to) return;
  const order = AppState.suitOrder.slice();
  [order[from], order[to]] = [order[to], order[from]];
  AppState.suitOrder = order;
  persistSuitOrder(order);
  updateSuitSlots();
  announce(`Suit order changed: ${order.join(', ')}`);
}
let draggingSuitIdx = null;
function handleTouchStart(e) {
  draggingSuitIdx = Number(e.target.dataset.position);
}
function handleTouchEnd(e) {
  if (draggingSuitIdx === null) return;
  const touched = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  if (touched?.classList.contains('suit-slot')) {
    const toIdx = Number(touched.dataset.position);
    swapSuitOrder(draggingSuitIdx, toIdx);
  }
  draggingSuitIdx = null;
}

// Undo/Redo for Suit Order
document.getElementById('undoBtn')?.addEventListener('click', () => {
  // Undo logic for suit order
});
document.getElementById('redoBtn')?.addEventListener('click', () => {
  // Redo logic for suit order
});

// Cards Rendering (stub)
function displayCards() {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';
  if (AppState.currentDraw.length === 0) {
    grid.innerHTML = '<div class="col-span-6 text-sm text-indigo-200">Click “Draw 6 Cards” to begin.</div>';
    return;
  }
  AppState.currentDraw.forEach((card, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'card-wrap group';
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('aria-label', `Card ${card.rank}${card.suit}. Press enter/space to flip.`);
    wrap.textContent = card.rank + card.suit;
    grid.appendChild(wrap);
  });
}

// History Rendering (stub)
function updateHistoryDisplay() {
  const list = document.getElementById('historyList');
  list.innerHTML = '';
  if (AppState.history.length === 0) {
    list.innerHTML = '<div class="text-sm text-indigo-200">No history yet.</div>'; return;
  }
  AppState.history.slice(0, 20).forEach((entry, i) => {
    const div = document.createElement('div');
    div.className = 'rounded-xl border border-white/10 bg-white/5 p-3';
    div.textContent = `${entry.type} - ${entry.cards ? entry.cards.map(c => c.rank + c.suit).join(', ') : ''}`;
    list.appendChild(div);
  });
}

// Help Modal
document.getElementById('helpBtn')?.addEventListener('click', () => {
  document.getElementById('helpModal').classList.remove('hidden');
  document.getElementById('helpModal').focus();
  announce('Help modal opened.');
});
document.getElementById('closeHelpBtn')?.addEventListener('click', () => {
  document.getElementById('helpModal').classList.add('hidden');
  announce('Help modal closed.');
});

// Feedback Modal
document.getElementById('feedbackBtn')?.addEventListener('click', () => {
  document.getElementById('feedbackModal').classList.remove('hidden');
  document.getElementById('feedbackModal').focus();
  announce('Feedback modal opened.');
});
document.getElementById('closeFeedbackBtn')?.addEventListener('click', () => {
  document.getElementById('feedbackModal').classList.add('hidden');
  announce('Feedback modal closed.');
});
document.getElementById('feedbackSubmitBtn')?.addEventListener('click', () => {
  announce('Feedback submitted. Thank you!');
  document.getElementById('feedbackModal').classList.add('hidden');
});

// Initialization
function initializeApp() {
  AppState.deck = initializeDeck();
  AppState.suitOrder = loadSuitOrder();
  AppState.savedSuitConfigs = loadSuitConfigs();
  AppState.history = loadHistory();

  setTheme(AppState.theme);
  updateSuitSlots();
  updateHistoryDisplay();
  announce('CardDrawX loaded and ready.');
}
document.addEventListener('DOMContentLoaded', initializeApp);

window.AppState = AppState;
