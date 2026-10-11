import { React } from 'mailspring-exports';
import SortStore from './sort-store';
import { t } from './i18n';

export default class AirmailSortButton extends React.Component {
  static displayName = 'AirmailSortButton';

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      sortDirection: SortStore.getSortDirection(),
      listSortKey: SortStore.getListSortKey(),
      readFilter: SortStore.getReadFilter(),
      starredOnly: SortStore.getStarredOnly(),
      subjectSearch: SortStore.getSubjectSearchActive(),
    };
    this._containerRef = null;
  }

  componentDidMount() {
    document.addEventListener('mousedown', this._onDocumentClick);
    document.addEventListener('keydown', this._onKeyDown);
    this._unsub = SortStore.subscribe(() => {
      this.setState({
        sortDirection: SortStore.getSortDirection(),
        listSortKey: SortStore.getListSortKey(),
        readFilter: SortStore.getReadFilter(),
        starredOnly: SortStore.getStarredOnly(),
        subjectSearch: SortStore.getSubjectSearchActive(),
      });
    });
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this._onDocumentClick);
    document.removeEventListener('keydown', this._onKeyDown);
    if (this._unsub) {
      this._unsub();
    }
  }

  _onDocumentClick = (e) => {
    if (this._containerRef && !this._containerRef.contains(e.target)) {
      this.setState({ isOpen: false });
    }
  };

  _onKeyDown = (e) => {
    if (e.key === 'Escape' && this.state.isOpen) {
      this.setState({ isOpen: false });
    }
  };

  _toggleOpen = () => {
    this.setState((prev) => ({ isOpen: !prev.isOpen }));
  };

  _close = () => {
    this.setState({ isOpen: false });
  };

  renderCheck(isChecked) {
    return <span className="airmail-menu-check">{isChecked ? '✓' : ''}</span>;
  }

  renderSectionTitle(label) {
    return <div key={label} className="airmail-menu-section">{label}</div>;
  }

  renderMenuItem(key, label, isChecked, onClick) {
    return (
      <div key={key} className="airmail-menu-item" onClick={() => { onClick(); this._close(); }}>
        {this.renderCheck(isChecked)}
        <span className="airmail-menu-label">{label}</span>
      </div>
    );
  }

  render() {
    const { isOpen, sortDirection, listSortKey, readFilter, starredOnly, subjectSearch } =
      this.state;
    const hasSearchFilters = readFilter !== 'all' || starredOnly;
    const isCustomActive =
      listSortKey !== 'date' ||
      sortDirection !== 'desc' ||
      hasSearchFilters ||
      subjectSearch;

    return (
      <div className="airmail-sort-container" ref={(el) => { this._containerRef = el; }}>
        <button
          type="button"
          className={`btn btn-toolbar narrow airmail-sort-btn${isCustomActive ? ' active' : ''}`}
          onClick={this._toggleOpen}
          title={t('Sort & Filter')}
          aria-expanded={isOpen}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <rect x="2" y="2.5" width="12" height="1.8" rx="0.9" />
            <rect x="4.5" y="6.8" width="7" height="1.8" rx="0.9" />
            <rect x="6.8" y="11.2" width="2.4" height="1.8" rx="0.9" />
          </svg>
        </button>
        {isOpen && (
          <div className="airmail-sort-dropdown">
            {this.renderSectionTitle(t('Sort by'))}
            {this.renderMenuItem('date', t('Date'), listSortKey === 'date', () =>
              SortStore.setListSortKey('date')
            )}
            {this.renderMenuItem('sender', t('Sender'), listSortKey === 'sender', () =>
              SortStore.setListSortKey('sender')
            )}
            <div className="airmail-menu-divider" />
            {this.renderSectionTitle(t('Show'))}
            {this.renderMenuItem('unread', t('Unread only'), readFilter === 'unread', () =>
              SortStore.toggleUnreadOnly()
            )}
            {this.renderMenuItem('read', t('Read only'), readFilter === 'read', () =>
              SortStore.toggleReadOnly()
            )}
            {this.renderMenuItem('starred', t('Starred'), starredOnly, () =>
              SortStore.toggleStarredOnly()
            )}
            {hasSearchFilters &&
              this.renderMenuItem('clear-filters', t('Clear filters'), false, () =>
                SortStore.clearSearchFilters()
              )}
            <div className="airmail-menu-divider" />
            {this.renderSectionTitle(t('Search'))}
            {this.renderMenuItem('subject', t('By subject…'), subjectSearch, () =>
              SortStore.focusSubjectSearch()
            )}
            <div className="airmail-menu-divider" />
            {this.renderSectionTitle(t('Order'))}
            {this.renderMenuItem('asc', t('Oldest first'), sortDirection === 'asc', () =>
              SortStore.setSortDirection('asc')
            )}
            {this.renderMenuItem('desc', t('Newest first'), sortDirection === 'desc', () =>
              SortStore.setSortDirection('desc')
            )}
          </div>
        )}
      </div>
    );
  }
}
