const { Actions, FocusedPerspectiveStore } = require('mailspring-exports');
const { buildSearchQuery, parseSearchQueryState, isValidListSortKey, isValidReadFilter, } = require('./sort-search');
const { STORAGE_SORT, STORAGE_SORT_KEY, getSortDirection, getListSortKey, reloadThreadList, } = require('./thread-list-sort-hook');
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
        }
        catch (e) {
            /* ignore */
        }
        return 'all';
    }
    _loadStarredOnly() {
        try {
            return localStorage.getItem(STORAGE_STARRED_ONLY) === '1';
        }
        catch (e) {
            return false;
        }
    }
    activate() {
        if (FocusedPerspectiveStore && typeof FocusedPerspectiveStore.listen === 'function') {
            this._unlistenPerspective = FocusedPerspectiveStore.listen(this._onPerspectiveChanged);
        }
        this._syncFromPerspective(FocusedPerspectiveStore && FocusedPerspectiveStore.current
            ? FocusedPerspectiveStore.current()
            : null);
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
            }
            catch (e) {
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
        }
        catch (e) {
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
        }
        catch (e) {
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
        }
        catch (e) {
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
        const current = FocusedPerspectiveStore && FocusedPerspectiveStore.current
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ydC1zdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zb3J0LXN0b3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sRUFBRSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUMzRSxNQUFNLEVBQ0osZ0JBQWdCLEVBQ2hCLHFCQUFxQixFQUNyQixrQkFBa0IsRUFDbEIsaUJBQWlCLEdBQ2xCLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzdCLE1BQU0sRUFDSixZQUFZLEVBQ1osZ0JBQWdCLEVBQ2hCLGdCQUFnQixFQUNoQixjQUFjLEVBQ2QsZ0JBQWdCLEdBQ2pCLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7QUFFdkMsTUFBTSxtQkFBbUIsR0FBRyxxQkFBcUIsQ0FBQztBQUNsRCxNQUFNLG9CQUFvQixHQUFHLHNCQUFzQixDQUFDO0FBRXBELE1BQU0sY0FBYztJQUNsQjtRQUNFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsY0FBYyxHQUFHLGdCQUFnQixFQUFFLENBQUM7UUFDekMsSUFBSSxDQUFDLFlBQVksR0FBRyxjQUFjLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzVDLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO1FBQzVCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7UUFDakMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELGVBQWU7UUFDYixJQUFJO1lBQ0YsTUFBTSxDQUFDLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3BELElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3hCLE9BQU8sQ0FBQyxDQUFDO2FBQ1Y7U0FDRjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsWUFBWTtTQUNiO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsZ0JBQWdCO1FBQ2QsSUFBSTtZQUNGLE9BQU8sWUFBWSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEdBQUcsQ0FBQztTQUMzRDtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsT0FBTyxLQUFLLENBQUM7U0FDZDtJQUNILENBQUM7SUFFRCxRQUFRO1FBQ04sSUFBSSx1QkFBdUIsSUFBSSxPQUFPLHVCQUF1QixDQUFDLE1BQU0sS0FBSyxVQUFVLEVBQUU7WUFDbkYsSUFBSSxDQUFDLG9CQUFvQixHQUFHLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztTQUN4RjtRQUNELElBQUksQ0FBQyxvQkFBb0IsQ0FDdkIsdUJBQXVCLElBQUksdUJBQXVCLENBQUMsT0FBTztZQUN4RCxDQUFDLENBQUMsdUJBQXVCLENBQUMsT0FBTyxFQUFFO1lBQ25DLENBQUMsQ0FBQyxJQUFJLENBQ1QsQ0FBQztJQUNKLENBQUM7SUFFRCxVQUFVO1FBQ1IsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7WUFDN0IsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztTQUNsQztJQUNILENBQUM7SUFFRCxnQkFBZ0I7UUFDZCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7SUFDN0IsQ0FBQztJQUVELGNBQWM7UUFDWixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDM0IsQ0FBQztJQUVELGFBQWE7UUFDWCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDMUIsQ0FBQztJQUVELGNBQWM7UUFDWixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDM0IsQ0FBQztJQUVELHNCQUFzQjtRQUNwQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7SUFDN0IsQ0FBQztJQUVELFNBQVMsQ0FBQyxRQUFRO1FBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlCLE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVELE9BQU87UUFDTCxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDdEMsSUFBSTtnQkFDRixRQUFRLEVBQUUsQ0FBQzthQUNaO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyx1Q0FBdUMsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUMzRDtTQUNGO0lBQ0gsQ0FBQztJQUVELGdCQUFnQixDQUFDLEdBQUc7UUFDbEIsSUFBSSxHQUFHLEtBQUssS0FBSyxJQUFJLEdBQUcsS0FBSyxNQUFNLEVBQUU7WUFDbkMsT0FBTztTQUNSO1FBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUM7UUFDMUIsSUFBSTtZQUNGLFlBQVksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3pDO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixZQUFZO1NBQ2I7UUFDRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDZixnQkFBZ0IsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxjQUFjLENBQUMsR0FBRztRQUNoQixJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDNUIsT0FBTztTQUNSO1FBQ0QsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLEdBQUcsRUFBRTtZQUM3QixnQkFBZ0IsRUFBRSxDQUFDO1lBQ25CLE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDO1FBQ3hCLElBQUk7WUFDRixZQUFZLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzdDO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixZQUFZO1NBQ2I7UUFDRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDZixnQkFBZ0IsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxhQUFhLENBQUMsVUFBVTtRQUN0QixJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDbEMsT0FBTztTQUNSO1FBQ0QsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLFVBQVUsRUFBRTtZQUNuQyxPQUFPO1NBQ1I7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVELGdCQUFnQjtRQUNkLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztRQUM5RCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxjQUFjO1FBQ1osTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzFELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELGNBQWMsQ0FBQyxXQUFXO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNsQyxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSxFQUFFO1lBQzlCLE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQsaUJBQWlCO1FBQ2YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsa0JBQWtCO1FBQ2hCLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzFCLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO1FBQzVCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2QixPQUFPLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2YsZ0JBQWdCLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBRUQsa0JBQWtCO1FBQ2hCLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUMzQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELGVBQWU7UUFDYixJQUFJO1lBQ0YsWUFBWSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDNUQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzNFO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixZQUFZO1NBQ2I7UUFDRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELG1CQUFtQjtRQUNqQixNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQztZQUM3QixVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDNUIsV0FBVyxFQUFFLElBQUksQ0FBQyxZQUFZO1NBQy9CLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxxQkFBcUI7UUFDbkIsTUFBTSxPQUFPLEdBQ1gsdUJBQXVCLElBQUksdUJBQXVCLENBQUMsT0FBTztZQUN4RCxDQUFDLENBQUMsdUJBQXVCLENBQUMsT0FBTyxFQUFFO1lBQ25DLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDWCxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELG9CQUFvQixDQUFDLFdBQVc7UUFDOUIsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixPQUFPO1NBQ1I7UUFDRCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztRQUM1QyxNQUFNLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QyxJQUFJLFdBQVcsQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLFVBQVUsS0FBSyxLQUFLLEVBQUU7WUFDckQsTUFBTSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7U0FDOUI7UUFDRCxJQUFJLFdBQVcsQ0FBQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1NBQzNCO1FBRUQsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxNQUFNLENBQUMsVUFBVSxFQUFFO1lBQzFDLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUNyQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQ2hCO1FBQ0QsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLE1BQU0sQ0FBQyxXQUFXLEVBQUU7WUFDNUMsSUFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO1lBQ3ZDLE9BQU8sR0FBRyxJQUFJLENBQUM7U0FDaEI7UUFDRCxJQUFJLElBQUksQ0FBQyxjQUFjLEtBQUssTUFBTSxDQUFDLGFBQWEsRUFBRTtZQUNoRCxJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7WUFDM0MsT0FBTyxHQUFHLElBQUksQ0FBQztTQUNoQjtRQUNELElBQUksT0FBTyxFQUFFO1lBQ1gsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ2hCO0lBQ0gsQ0FBQztDQUNGO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDIn0=