// Progress state: which trophies are earned, saved in localStorage,
// with export to a file and import back. No network, no account.
export const STORAGE_KEY = 'leonida-trophy-guide-v1';
export const EXPORT_VERSION = 1;

/** Load the earned set of trophy names from localStorage. */
export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((name) => typeof name === 'string'));
  } catch {
    return new Set();
  }
}

/** Persist the earned set of trophy names to localStorage. */
export function saveEarned(earned) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
}

/** Build the export document for the earned set. */
export function buildExportDocument(earned) {
  return {
    app: 'leonida-trophy-guide',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
  };
}

/** Download the export document as a JSON file. */
export function downloadExport(earned) {
  const doc = buildExportDocument(earned);
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return doc;
}

/**
 * Parse an imported file's text into an earned set, keeping only names
 * that match a trophy in the guide. Returns { earned, kept, dropped }.
 */
export function parseImportDocument(text, knownNames) {
  const parsed = JSON.parse(text);
  const rawList = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(rawList)) {
    throw new Error('Import file must be a JSON array of trophy names, or an object with an "earned" array.');
  }
  const known = new Set(knownNames);
  const kept = rawList.filter((name) => typeof name === 'string' && known.has(name));
  return { earned: new Set(kept), kept: kept.length, dropped: rawList.length - kept.length };
}
