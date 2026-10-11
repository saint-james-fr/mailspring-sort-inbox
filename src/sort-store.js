const { Actions, FocusedPerspectiveStore } = require('mailspring-exports');
const {
  buildSearchQuery,
  parseSearchQueryState,
  isValidListSortKey,
  isValidReadFilter,
} = require('./sort-search');
const {
  STORAGE_SORT,
  STORAGE_SORT_KEY,
  getSortDirection,
  getListSortKey,
  reloadThreadList,
} = require('./thread-list-sort-hook');

const STORAGE_READ_FILTER = 'airmail-read-filter';
const STORAGE_STARRED_ONLY = 'airmail-starred-only';

class SortStoreClass {
  constructor() {
    this._listeners = new Set();
    this._sortDirection = getSortDirection();
    this._listSortKey = getListSortKey();
    this._readFilter = this._loadReadFilter();
    this._starredOnly = this._loadStarredOnly();
    this._subjectSearch = false;
    this._unlistenPerspective = null;
    this._onPerspectiveChanged = this._onPerspectiveChanged.bind(this);
  }

  _loadReadFilter() {
    try {
      const v = localStorage.getItem(STORAGE_READ_FILTER);
      if (isValidReadFilter(v)) {
        return v;
      }
    } catch (e) {
      /* ignore */
    }
    return 'all';
  }

  _loadStarredOnly() {
    try {
      return localStorage.getItem(STORAGE_STARRED_ONLY) === '1';
    } catch (e) {
      return false;
    }
  }

  activate() {
    if (FocusedPerspectiveStore && typeof FocusedPerspectiveStore.listen === 'function') {
      this._unlistenPerspective = FocusedPerspectiveStore.listen(this._onPerspectiveChanged);
    }
    this._syncFromPerspective(
      FocusedPerspectiveStore && FocusedPerspectiveStore.current
        ? FocusedPerspectiveStore.current()
        : null
    );
  }

  deactivate() {
    if (this._unlistenPerspective) {
      this._unlistenPerspective();
      this._unlistenPerspective = null;
    }
  }

  getSortDirection() {
    return this._sortDirection;
  }

  getListSortKey() {
    return this._listSortKey;
  }

  getReadFilter() {
    return this._readFilter;
  }

  getStarredOnly() {
    return this._starredOnly;
  }

  getSubjectSearchActive() {
    return this._subjectSearch;
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    for (const listener of this._listeners) {
      try {
        listener();
      } catch (e) {
        console.error('mailspring-sort-inbox: listener error', e);
      }
    }
  }

  setSortDirection(dir) {
    if (dir !== 'asc' && dir !== 'desc') {
      return;
    }
    this._sortDirection = dir;
    try {
      localStorage.setItem(STORAGE_SORT, dir);
    } catch (e) {
      /* ignore */
    }
    this._notify();
    reloadThreadList();
  }

  setListSortKey(key) {
    if (!isValidListSortKey(key)) {
      return;
    }
    if (this._listSortKey === key) {
      reloadThreadList();
      return;
    }
    this._listSortKey = key;
    try {
      localStorage.setItem(STORAGE_SORT_KEY, key);
    } catch (e) {
      /* ignore */
    }
    this._notify();
    reloadThreadList();
  }

  setReadFilter(readFilter) {
    if (!isValidReadFilter(readFilter)) {
      return;
    }
    if (this._readFilter === readFilter) {
      return;
    }
    this._readFilter = readFilter;
    this._persistFilters();
    this._applySearchFilters();
  }

  toggleUnreadOnly() {
    const next = this._readFilter === 'unread' ? 'all' : 'unread';
    this.setReadFilter(next);
  }

  toggleReadOnly() {
    const next = this._readFilter === 'read' ? 'all' : 'read';
    this.setReadFilter(next);
  }

  setStarredOnly(starredOnly) {
    const next = Boolean(starredOnly);
    if (this._starredOnly === next) {
      return;
    }
    this._starredOnly = next;
    this._persistFilters();
    this._applySearchFilters();
  }

  toggleStarredOnly() {
    this.setStarredOnly(!this._starredOnly);
  }

  clearSearchFilters() {
    this._readFilter = 'all';
    this._starredOnly = false;
    this._subjectSearch = false;
    this._persistFilters();
    Actions.searchQuerySubmitted('');
    this._notify();
    reloadThreadList();
  }

  focusSubjectSearch() {
    Actions.searchQueryChanged('subject:');
    this._subjectSearch = true;
    this._notify();
  }

  _persistFilters() {
    try {
      localStorage.setItem(STORAGE_READ_FILTER, this._readFilter);
      localStorage.setItem(STORAGE_STARRED_ONLY, this._starredOnly ? '1' : '0');
    } catch (e) {
      /* ignore */
    }
    this._notify();
  }

  _applySearchFilters() {
    const query = buildSearchQuery({
      readFilter: this._readFilter,
      starredOnly: this._starredOnly,
    });
    Actions.searchQuerySubmitted(query);
    reloadThreadList();
  }

  _onPerspectiveChanged() {
    const current =
      FocusedPerspectiveStore && FocusedPerspectiveStore.current
        ? FocusedPerspectiveStore.current()
        : null;
    this._syncFromPerspective(current);
  }

  _syncFromPerspective(perspective) {
    if (!perspective) {
      return;
    }
    const query = perspective.searchQuery || '';
    const parsed = parseSearchQueryState(query);
    if (perspective.unread && parsed.readFilter === 'all') {
      parsed.readFilter = 'unread';
    }
    if (perspective.starred && !parsed.starredOnly) {
      parsed.starredOnly = true;
    }

    let changed = false;
    if (this._readFilter !== parsed.readFilter) {
      this._readFilter = parsed.readFilter;
      changed = true;
    }
    if (this._starredOnly !== parsed.starredOnly) {
      this._starredOnly = parsed.starredOnly;
      changed = true;
    }
    if (this._subjectSearch !== parsed.subjectSearch) {
      this._subjectSearch = parsed.subjectSearch;
      changed = true;
    }
    if (changed) {
      this._notify();
    }
  }
}

module.exports = new SortStoreClass();
