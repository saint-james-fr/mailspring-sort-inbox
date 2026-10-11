"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const sort_store_1 = __importDefault(require("./sort-store"));
const i18n_1 = require("./i18n");
class AirmailSortButton extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._onDocumentClick = (e) => {
            if (this._containerRef && !this._containerRef.contains(e.target)) {
                this.setState({ isOpen: false });
            }
        };
        this._onKeyDown = (e) => {
            if (e.key === 'Escape' && this.state.isOpen) {
                this.setState({ isOpen: false });
            }
        };
        this._toggleOpen = () => {
            this.setState((prev) => ({ isOpen: !prev.isOpen }));
        };
        this._close = () => {
            this.setState({ isOpen: false });
        };
        this.state = {
            isOpen: false,
            sortDirection: sort_store_1.default.getSortDirection(),
            listSortKey: sort_store_1.default.getListSortKey(),
            readFilter: sort_store_1.default.getReadFilter(),
            starredOnly: sort_store_1.default.getStarredOnly(),
            subjectSearch: sort_store_1.default.getSubjectSearchActive(),
        };
        this._containerRef = null;
    }
    componentDidMount() {
        document.addEventListener('mousedown', this._onDocumentClick);
        document.addEventListener('keydown', this._onKeyDown);
        this._unsub = sort_store_1.default.subscribe(() => {
            this.setState({
                sortDirection: sort_store_1.default.getSortDirection(),
                listSortKey: sort_store_1.default.getListSortKey(),
                readFilter: sort_store_1.default.getReadFilter(),
                starredOnly: sort_store_1.default.getStarredOnly(),
                subjectSearch: sort_store_1.default.getSubjectSearchActive(),
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
    renderCheck(isChecked) {
        return mailspring_exports_1.React.createElement("span", { className: "airmail-menu-check" }, isChecked ? '✓' : '');
    }
    renderSectionTitle(label) {
        return mailspring_exports_1.React.createElement("div", { key: label, className: "airmail-menu-section" }, label);
    }
    renderMenuItem(key, label, isChecked, onClick) {
        return (mailspring_exports_1.React.createElement("div", { key: key, className: "airmail-menu-item", onClick: () => { onClick(); this._close(); } },
            this.renderCheck(isChecked),
            mailspring_exports_1.React.createElement("span", { className: "airmail-menu-label" }, label)));
    }
    render() {
        const { isOpen, sortDirection, listSortKey, readFilter, starredOnly, subjectSearch } = this.state;
        const hasSearchFilters = readFilter !== 'all' || starredOnly;
        const isCustomActive = listSortKey !== 'date' ||
            sortDirection !== 'desc' ||
            hasSearchFilters ||
            subjectSearch;
        return (mailspring_exports_1.React.createElement("div", { className: "airmail-sort-container", ref: (el) => { this._containerRef = el; } },
            mailspring_exports_1.React.createElement("button", { type: "button", className: `btn btn-toolbar narrow airmail-sort-btn${isCustomActive ? ' active' : ''}`, onClick: this._toggleOpen, title: i18n_1.t('Sort & Filter'), "aria-expanded": isOpen },
                mailspring_exports_1.React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": "true" },
                    mailspring_exports_1.React.createElement("rect", { x: "2", y: "2.5", width: "12", height: "1.8", rx: "0.9" }),
                    mailspring_exports_1.React.createElement("rect", { x: "4.5", y: "6.8", width: "7", height: "1.8", rx: "0.9" }),
                    mailspring_exports_1.React.createElement("rect", { x: "6.8", y: "11.2", width: "2.4", height: "1.8", rx: "0.9" }))),
            isOpen && (mailspring_exports_1.React.createElement("div", { className: "airmail-sort-dropdown" },
                this.renderSectionTitle(i18n_1.t('Sort by')),
                this.renderMenuItem('date', i18n_1.t('Date'), listSortKey === 'date', () => sort_store_1.default.setListSortKey('date')),
                this.renderMenuItem('sender', i18n_1.t('Sender'), listSortKey === 'sender', () => sort_store_1.default.setListSortKey('sender')),
                mailspring_exports_1.React.createElement("div", { className: "airmail-menu-divider" }),
                this.renderSectionTitle(i18n_1.t('Show')),
                this.renderMenuItem('unread', i18n_1.t('Unread only'), readFilter === 'unread', () => sort_store_1.default.toggleUnreadOnly()),
                this.renderMenuItem('read', i18n_1.t('Read only'), readFilter === 'read', () => sort_store_1.default.toggleReadOnly()),
                this.renderMenuItem('starred', i18n_1.t('Starred'), starredOnly, () => sort_store_1.default.toggleStarredOnly()),
                hasSearchFilters &&
                    this.renderMenuItem('clear-filters', i18n_1.t('Clear filters'), false, () => sort_store_1.default.clearSearchFilters()),
                mailspring_exports_1.React.createElement("div", { className: "airmail-menu-divider" }),
                this.renderSectionTitle(i18n_1.t('Search')),
                this.renderMenuItem('subject', i18n_1.t('By subject…'), subjectSearch, () => sort_store_1.default.focusSubjectSearch()),
                mailspring_exports_1.React.createElement("div", { className: "airmail-menu-divider" }),
                this.renderSectionTitle(i18n_1.t('Order')),
                this.renderMenuItem('asc', i18n_1.t('Oldest first'), sortDirection === 'asc', () => sort_store_1.default.setSortDirection('asc')),
                this.renderMenuItem('desc', i18n_1.t('Newest first'), sortDirection === 'desc', () => sort_store_1.default.setSortDirection('desc'))))));
    }
}
exports.default = AirmailSortButton;
AirmailSortButton.displayName = 'AirmailSortButton';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWlybWFpbC1zb3J0LWJ1dHRvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9haXJtYWlsLXNvcnQtYnV0dG9uLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDJEQUEyQztBQUMzQyw4REFBcUM7QUFDckMsaUNBQTJCO0FBRTNCLE1BQXFCLGlCQUFrQixTQUFRLDBCQUFLLENBQUMsU0FBUztJQUc1RCxZQUFZLEtBQUs7UUFDZixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFrQ2YscUJBQWdCLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUN2QixJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2hFLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQzthQUNsQztRQUNILENBQUMsQ0FBQztRQUVGLGVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQzthQUNsQztRQUNILENBQUMsQ0FBQztRQUVGLGdCQUFXLEdBQUcsR0FBRyxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQztRQUVGLFdBQU0sR0FBRyxHQUFHLEVBQUU7WUFDWixJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFD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