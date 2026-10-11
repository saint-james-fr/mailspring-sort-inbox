"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const sort_store_1 = __importDefault(require("./sort-store"));
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
            mailspring_exports_1.React.createElement("button", { type: "button", className: `btn btn-toolbar narrow airmail-sort-btn${isCustomActive ? ' active' : ''}`, onClick: this._toggleOpen, title: "Sort & Filter", "aria-expanded": isOpen },
                mailspring_exports_1.React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": "true" },
                    mailspring_exports_1.React.createElement("rect", { x: "2", y: "2.5", width: "12", height: "1.8", rx: "0.9" }),
                    mailspring_exports_1.React.createElement("rect", { x: "4.5", y: "6.8", width: "7", height: "1.8", rx: "0.9" }),
                    mailspring_exports_1.React.createElement("rect", { x: "6.8", y: "11.2", width: "2.4", height: "1.8", rx: "0.9" }))),
            isOpen && (mailspring_exports_1.React.createElement("div", { className: "airmail-sort-dropdown" },
                this.renderSectionTitle('Sort by'),
                this.renderMenuItem('date', 'Date', listSortKey === 'date', () => sort_store_1.default.setListSortKey('date')),
                this.renderMenuItem('sender', 'Sender', listSortKey === 'sender', () => sort_store_1.default.setListSortKey('sender')),
                mailspring_exports_1.React.createElement("div", { className: "airmail-menu-divider" }),
                this.renderSectionTitle('Show'),
                this.renderMenuItem('unread', 'Unread only', readFilter === 'unread', () => sort_store_1.default.toggleUnreadOnly()),
                this.renderMenuItem('read', 'Read only', readFilter === 'read', () => sort_store_1.default.toggleReadOnly()),
                this.renderMenuItem('starred', 'Starred', starredOnly, () => sort_store_1.default.toggleStarredOnly()),
                hasSearchFilters &&
                    this.renderMenuItem('clear-filters', 'Clear filters', false, () => sort_store_1.default.clearSearchFilters()),
                mailspring_exports_1.React.createElement("div", { className: "airmail-menu-divider" }),
                this.renderSectionTitle('Search'),
                this.renderMenuItem('subject', 'By subject…', subjectSearch, () => sort_store_1.default.focusSubjectSearch()),
                mailspring_exports_1.React.createElement("div", { className: "airmail-menu-divider" }),
                this.renderSectionTitle('Order'),
                this.renderMenuItem('asc', 'Oldest first', sortDirection === 'asc', () => sort_store_1.default.setSortDirection('asc')),
                this.renderMenuItem('desc', 'Newest first', sortDirection === 'desc', () => sort_store_1.default.setSortDirection('desc'))))));
    }
}
exports.default = AirmailSortButton;
AirmailSortButton.displayName = 'AirmailSortButton';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWlybWFpbC1zb3J0LWJ1dHRvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9haXJtYWlsLXNvcnQtYnV0dG9uLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDJEQUEyQztBQUMzQyw4REFBcUM7QUFFckMsTUFBcUIsaUJBQWtCLFNBQVEsMEJBQUssQ0FBQyxTQUFTO0lBRzVELFlBQVksS0FBSztRQUNmLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQWtDZixxQkFBZ0IsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDaEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2FBQ2xDO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsZUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDakIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLFFBQVEsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2FBQ2xDO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsZ0JBQVcsR0FBRyxHQUFHLEVBQUU7WUFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDO1FBRUYsV0FBTSxHQUFHLEdBQUcsRUFBRTtZQUNaLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNuQyxDQUFDLENBQUM7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