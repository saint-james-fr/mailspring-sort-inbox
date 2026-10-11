/** Pure search/sort helpers (testable without Mailspring). */

const LIST_SORT_KEYS = ['date', 'sender'];
const READ_FILTERS = ['all', 'unread', 'read'];

function buildSearchQuery({ readFilter = 'all', starredOnly = false }) {
  const parts = [];
  if (readFilter === 'unread') {
    parts.push('is:unread');
  } else if (readFilter === 'read') {
    parts.push('is:read');
  }
  if (starredOnly) {
    parts.push('is:starred');
  }
  return parts.join(' ').trim();
}

function parseSearchQueryState(query) {
  const q = (query || '').trim();
  let readFilter = 'all';
  if (/\bis:unread\b/i.test(q)) {
    readFilter = 'unread';
  } else if (/\bis:read\b/i.test(q)) {
    readFilter = 'read';
  }
  const starredOnly = /\bis:starred\b/i.test(q);
  const subjectSearch = /^subject:/i.test(q);
  return { readFilter, starredOnly, subjectSearch };
}

function isValidListSortKey(key) {
  return LIST_SORT_KEYS.includes(key);
}

function isValidReadFilter(filter) {
  return READ_FILTERS.includes(filter);
}

module.exports = {
  LIST_SORT_KEYS,
  READ_FILTERS,
  buildSearchQuery,
  parseSearchQueryState,
  isValidListSortKey,
  isValidReadFilter,
};
