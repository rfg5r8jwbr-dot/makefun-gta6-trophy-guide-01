// Leonida Trophy Guide — entry point. Loads the trophy data, wires the
// filters, the spoiler setting and the export/import controls, and renders.
import { KIND_FILTERS, applyFilters } from './filters.js';
import { downloadExport, loadEarned, parseImportDocument, saveEarned } from './state.js';
import { renderEmptyState, renderFilterNote, renderProgress, renderTrophyList } from './render.js';
import { renderRoadmap } from './roadmap.js';

const trophyList = document.getElementById('trophyList');
const kindChips = document.getElementById('kindChips');
const gradeFilter = document.getElementById('gradeFilter');
const searchBox = document.getElementById('searchBox');
const spoilerToggle = document.getElementById('spoilerToggle');
const hideEarnedToggle = document.getElementById('hideEarnedToggle');
const missableOnlyToggle = document.getElementById('missableOnlyToggle');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');

const response = await fetch('data/trophies.json');
const doc = await response.json();
const trophies = doc.trophies;

let earned = loadEarned();
let kind = 'all';
let openGuides = new Set();

function currentSettings() {
  return {
    kind,
    grade: gradeFilter.value,
    query: searchBox.value,
    hideEarned: hideEarnedToggle.checked,
    missableOnly: missableOnlyToggle.checked,
    earned,
  };
}

function handleToggle(name, isEarned) {
  if (isEarned) earned.add(name);
  else earned.delete(name);
  saveEarned(earned);
  renderAll();
}

function renderAll() {
  const visible = applyFilters(trophies, currentSettings());
  renderTrophyList(trophyList, visible, earned, spoilerToggle.checked, handleToggle);
  renderProgress(trophies, earned);
  renderFilterNote(visible.length, trophies.length, kind);
  renderEmptyState(visible.length, kind);
  for (const card of trophyList.querySelectorAll('.trophy')) {
    if (openGuides.has(card.dataset.trophy)) {
      const toggle = card.querySelector('.guide-toggle');
      if (toggle) toggle.click();
    }
  }
}

function buildKindChips() {
  for (const filter of KIND_FILTERS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = filter.label;
    chip.dataset.kind = filter.id;
    chip.setAttribute('aria-pressed', String(filter.id === kind));
    chip.addEventListener('click', () => {
      kind = filter.id;
      for (const other of kindChips.querySelectorAll('.chip')) {
        other.setAttribute('aria-pressed', String(other.dataset.kind === kind));
      }
      renderAll();
    });
    kindChips.append(chip);
  }
}

function rememberOpenGuides() {
  openGuides = new Set(
    [...trophyList.querySelectorAll('.trophy')].filter((card) => {
      const guide = card.querySelector('.guide');
      return guide && !guide.hidden;
    }).map((card) => card.dataset.trophy),
  );
}

gradeFilter.addEventListener('change', renderAll);
searchBox.addEventListener('input', renderAll);
spoilerToggle.addEventListener('change', renderAll);
hideEarnedToggle.addEventListener('change', renderAll);
missableOnlyToggle.addEventListener('change', renderAll);
trophyList.addEventListener('click', (event) => {
  if (event.target.classList.contains('guide-toggle')) {
    setTimeout(rememberOpenGuides, 0);
  }
});

exportBtn.addEventListener('click', () => {
  downloadExport(earned);
});

importFile.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const result = parseImportDocument(await file.text(), trophies.map((trophy) => trophy.name));
    earned = result.earned;
    saveEarned(earned);
    renderAll();
    document.getElementById('filterNote').textContent =
      `Imported ${result.kept} earned trophies` +
      (result.dropped > 0 ? ` (${result.dropped} names did not match this guide and were skipped).` : '.');
  } catch (error) {
    document.getElementById('filterNote').textContent = `Import failed: ${error.message}`;
  }
  event.target.value = '';
});

resetBtn.addEventListener('click', () => {
  if (window.confirm('Clear all earned trophies? This cannot be undone.')) {
    earned = new Set();
    saveEarned(earned);
    renderAll();
  }
});

buildKindChips();
renderRoadmap(document.getElementById('roadmapStages'), trophies);
renderAll();
