// Rendering the checklist: trophy cards, their guides and sources,
// the progress line, and the filter note.
import { countByGrade, isSpoilerHidden } from './filters.js';

const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
  misc: 'Completion',
};

/** Build one trophy card. onToggle is called with (name, earned) on check. */
export function buildTrophyCard(trophy, earned, spoilerOn, onToggle) {
  const card = document.createElement('article');
  card.className = 'trophy' + (earned.has(trophy.name) ? ' earned' : '');
  card.dataset.trophy = trophy.name;

  const head = document.createElement('div');
  head.className = 'trophy-head';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'trophy-check';
  check.checked = earned.has(trophy.name);
  check.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  check.addEventListener('change', () => onToggle(trophy.name, check.checked));

  const main = document.createElement('div');
  main.className = 'trophy-main';
  const name = document.createElement('h3');
  name.className = 'trophy-name';
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';

  const hidden = isSpoilerHidden(trophy, spoilerOn, earned);
  if (hidden) {
    name.textContent = 'Hidden story trophy';
    name.classList.add('hidden-trophy');
    desc.textContent = 'Earn this trophy in the game to reveal its name and description.';
  } else {
    name.textContent = trophy.name;
    desc.textContent = trophy.description;
  }

  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge grade-${trophy.grade}`;
  gradeBadge.textContent = GRADE_LABELS[trophy.grade];
  meta.append(gradeBadge);
  for (const kind of trophy.kinds) {
    const badge = document.createElement('span');
    badge.className = `badge kind-${kind}`;
    badge.textContent = KIND_LABELS[kind] ?? kind;
    meta.append(badge);
  }
  if (trophy.missable) {
    const badge = document.createElement('span');
    badge.className = 'badge missable';
    badge.textContent = 'Possibly missable';
    meta.append(badge);
  }
  const stageBadge = document.createElement('span');
  stageBadge.className = 'badge';
  stageBadge.textContent = `Roadmap stage ${trophy.stage}`;
  meta.append(stageBadge);

  main.append(name, desc, meta);
  head.append(check, main);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  toggle.textContent = 'Guide';
  toggle.setAttribute('aria-expanded', 'false');

  const guide = document.createElement('div');
  guide.className = 'guide';
  guide.hidden = true;
  if (hidden) {
    const note = document.createElement('p');
    note.className = 'hidden-trophy';
    note.textContent = 'Its guide stays hidden until the trophy is earned — no spoilers here.';
    guide.append(note);
  } else {
    const text = document.createElement('p');
    text.textContent = trophy.guide;
    guide.append(text);
    const sources = document.createElement('p');
    sources.className = 'sources';
    sources.textContent = 'Sources: ';
    trophy.sources.forEach((source, index) => {
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.name;
      sources.append(link);
    });
    guide.append(sources);
  }
  toggle.addEventListener('click', () => {
    guide.hidden = !guide.hidden;
    toggle.setAttribute('aria-expanded', String(!guide.hidden));
    toggle.textContent = guide.hidden ? 'Guide' : 'Hide guide';
  });

  head.append(toggle);
  card.append(head, guide);
  return card;
}

/** Render the visible trophy list into the container. */
export function renderTrophyList(container, trophies, earned, spoilerOn, onToggle) {
  container.replaceChildren();
  for (const trophy of trophies) {
    container.append(buildTrophyCard(trophy, earned, spoilerOn, onToggle));
  }
}

/** Update the progress bar, counts and grade breakdown. */
export function renderProgress(allTrophies, earned) {
  const total = allTrophies.length;
  const done = earned.size;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById('progressText').textContent = `${done} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;
  const { counts, totals } = countByGrade(allTrophies, earned);
  document.getElementById('progressGrades').textContent =
    `Platinum ${counts.platinum}/${totals.platinum} · Gold ${counts.gold}/${totals.gold} · ` +
    `Silver ${counts.silver}/${totals.silver} · Bronze ${counts.bronze}/${totals.bronze}`;
}

/** Show the one-line note under the controls (counts, online note). */
export function renderFilterNote(visibleCount, totalCount, kind) {
  const note = document.getElementById('filterNote');
  if (kind === 'online') {
    note.textContent = 'This game lists no online trophies: all 55 are single-player and offline, so this filter is empty by design.';
  } else {
    note.textContent = `Showing ${visibleCount} of ${totalCount} trophies.`;
  }
}

/** Show or hide the empty-state message for the list. */
export function renderEmptyState(visibleCount, kind) {
  const empty = document.getElementById('emptyState');
  if (visibleCount === 0) {
    empty.hidden = false;
    empty.textContent = kind === 'online'
      ? 'No online trophies — Grand Theft Auto VI has no multiplayer trophies; all 55 are earned solo, offline.'
      : 'No trophies match these filters. Clear the search or pick another kind.';
  } else {
    empty.hidden = true;
  }
}
