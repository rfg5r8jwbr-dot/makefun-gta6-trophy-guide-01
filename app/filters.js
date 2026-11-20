// Filtering and the spoiler setting: which trophies are shown, and what a
// hidden story trophy looks like before it is earned.
export const KIND_FILTERS = [
  { id: 'all', label: 'All kinds' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'activities', label: 'Activities' },
  { id: 'online', label: 'Online' },
];

/**
 * Return the trophies visible under the current settings.
 * settings: { kind, grade, query, hideEarned, missableOnly, earned }
 * The game lists no online trophies, so kind 'online' always yields none.
 */
export function applyFilters(trophies, settings) {
  const query = settings.query.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (settings.kind !== 'all' && !trophy.kinds.includes(settings.kind)) return false;
    if (settings.grade !== 'all' && trophy.grade !== settings.grade) return false;
    if (settings.hideEarned && settings.earned.has(trophy.name)) return false;
    if (settings.missableOnly && !trophy.missable) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/** A story trophy is spoiler-hidden when the setting is on and it is not earned. */
export function isSpoilerHidden(trophy, spoilerOn, earned) {
  return spoilerOn && trophy.kinds.includes('story') && !earned.has(trophy.name);
}

/** Count earned trophies per grade, for the progress line. */
export function countByGrade(trophies, earned) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) {
    totals[trophy.grade] += 1;
    if (earned.has(trophy.name)) counts[trophy.grade] += 1;
  }
  return { counts, totals };
}
