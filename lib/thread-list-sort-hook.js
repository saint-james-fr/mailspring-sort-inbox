const path = require('path');
const { AccountStore, DatabaseStore, Thread } = require('mailspring-exports');
const STORAGE_SORT = 'airmail-sort-direction';
const STORAGE_SORT_KEY = 'airmail-sort-key';
let queryHookInstalled = false;
let subscriptionHookInstalled = false;
function getSortDirection() {
    try {
        const v = localStorage.getItem(STORAGE_SORT);
        if (v === 'asc' || v === 'desc')
            return v;
    }
    catch (e) {
        /* ignore */
    }
    return 'desc';
}
function getListSortKey() {
    try {
        const v = localStorage.getItem(STORAGE_SORT_KEY);
        if (v === 'date' || v === 'sender')
            return v;
    }
    catch (e) {
        /* ignore */
    }
    return 'date';
}
function isThreadListSeedQuery(query) {
    if (!query || query.objectClass() !== 'Thread') {
        return false;
    }
    const range = query.range();
    if (!range) {
        return false;
    }
    const offset = range.offset;
    return range.limit === 0 && (offset === 0 || offset === null);
}
function matcherIndicatesThreadList(matchers) {
    if (matchers.some((m) => m && m.constructor && m.constructor.name === 'StructuredSearchMatcher')) {
        return true;
    }
    if (matchers.some((m) => m && m.constructor && m.constructor.name === 'SearchMatcher')) {
        return true;
    }
    if (matchers.some((m) => m.attr &&
        m.attr.modelKey === 'id' &&
        (m.comparator === 'in' || m.comparator === '='))) {
        return true;
    }
    return matchers.some((m) => {
        const key = m.attr && m.attr.modelKey;
        return (key === 'categories' ||
            key === 'unread' ||
            key === 'starred' ||
            (key === 'inAllMail' && matchers.some((x) => x.attr && x.attr.modelKey === 'starred')));
    });
}
function hasThreadListQueryRange(query) {
    const range = query.range();
    if (!range) {
        return false;
    }
    if (isThreadListSeedQuery(query)) {
        return true;
    }
    if (!Number.isInteger(range.limit) || range.limit <= 0) {
        return false;
    }
    const offset = range.offset;
    return offset === 0 || offset === null || Number.isInteger(offset);
}
function isMailboxThreadListQuery(query) {
    if (!query || query.objectClass() !== 'Thread') {
        return false;
    }
    let matchers;
    try {
        matchers = query.matchersFlattened();
    }
    catch (e) {
        return false;
    }
    if (!matcherIndicatesThreadList(matchers)) {
        return false;
    }
    return hasThreadListQueryRange(query);
}
function hasCategoryJoin(query) {
    try {
        return query
            .matchersFlattened()
            .some((m) => m.comparator === 'containsAny' && m.attr && m.attr.modelKey === 'categories');
    }
    catch (e) {
        return false;
    }
}
// Must not reuse lastMessageReceivedTimestamp as attr — that enables the ThreadCategory
// subselect and breaks ORDER BY on Thread.data.
const LIST_SENDER_SORT_ATTR = { modelKey: '__sortInboxListSender' };
function getAccountEmailsSqlInList() {
    const emails = AccountStore.emailAddresses()
        .map((e) => (e || '').toLowerCase())
        .filter(Boolean);
    if (emails.length === 0) {
        return "''";
    }
    return emails.map((e) => `'${e.replace(/'/g, "''")}'`).join(', ');
}
// Mirrors thread-list-participants: first non-draft message, from vs to when all are from me.
function listSenderFieldSubquery(table, jsonField) {
    const myEmails = getAccountEmailsSqlInList();
    const fromPath = `$.from[0].${jsonField}`;
    const toPath = `$.to[0].${jsonField}`;
    return `(
    SELECT LOWER(COALESCE(
      CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM \`Message\` mx
          WHERE mx.\`threadId\` = \`${table}\`.\`id\` AND mx.\`draft\` = 0
            AND LOWER(COALESCE(json_extract(mx.\`data\`, '$.from[0].email'), '')) NOT IN (${myEmails})
        )
        AND EXISTS (
          SELECT 1 FROM \`Message\` mx2
          WHERE mx2.\`threadId\` = \`${table}\`.\`id\` AND mx2.\`draft\` = 0
        )
        THEN json_extract(m0.\`data\`, '${toPath}')
        ELSE json_extract(m0.\`data\`, '${fromPath}')
      END,
    ''))
    FROM \`Message\` m0
    WHERE m0.\`threadId\` = \`${table}\`.\`id\` AND m0.\`draft\` = 0
    ORDER BY m0.\`date\` ASC
    LIMIT 1
  )`;
}
function createListSenderSortOrder(direction) {
    const sqlDir = direction === 'asc' ? 'ASC' : 'DESC';
    const tieDir = direction === 'asc' ? 'ASC' : 'DESC';
    return {
        attr: LIST_SENDER_SORT_ATTR,
        direction: sqlDir,
        orderBySQL(klass) {
            const table = klass.name;
            return (`${listSenderFieldSubquery(table, 'email')} ${sqlDir}, ` +
                `${listSenderFieldSubquery(table, 'name')} ${sqlDir}, ` +
                `\`${table}\`.\`lastMessageReceivedTimestamp\` ${tieDir}`);
        },
    };
}
function listSenderSortKey(thread) {
    if (!thread) {
        return '';
    }
    const messages = thread.__messages instanceof Array
        ? thread.__messages.filter((m) => m && !m.draft)
        : [];
    if (messages.length > 0) {
        const field = messages.every((m) => m.isFromMe && m.isFromMe()) ? 'to' : 'from';
        for (const message of messages) {
            const contacts = message[field];
            if (contacts && contacts.length > 0) {
                const p = contacts[0];
                return `${(p.email || '').toLowerCase()}\0${(p.name || '').toLowerCase()}`;
            }
        }
    }
    const participants = (thread.participants || []).filter((p) => p && !p.isMe());
    if (participants.length > 0) {
        const p = participants[0];
        return `${(p.email || '').toLowerCase()}\0${(p.name || '').toLowerCase()}`;
    }
    return '';
}
function queryHasSentTimestampOrder(query) {
    const orders = query._orders || [];
    return orders.some((o) => o.attr && o.attr.modelKey === 'lastMessageSentTimestamp');
}
function applyThreadListSort(query) {
    if (!query || query._finalized || !isMailboxThreadListQuery(query)) {
        return;
    }
    const sortKey = getListSortKey();
    const direction = getSortDirection();
    const sentOrder = queryHasSentTimestampOrder(query);
    if (sortKey === 'sender') {
        if (hasCategoryJoin(query) && !query._distinct) {
            query.distinct();
        }
        query._orders = [createListSenderSortOrder(direction)];
        return;
    }
    if (sortKey === 'date' && direction === 'asc') {
        if (sentOrder) {
            query._orders = [Thread.attributes.lastMessageSentTimestamp.ascending()];
        }
        else {
            query._orders = [Thread.attributes.lastMessageReceivedTimestamp.ascending()];
        }
        return;
    }
    if (sortKey === 'date' && direction === 'desc' && !sentOrder && isThreadListSeedQuery(query)) {
        query._orders = [];
    }
}
function loadThreadListStore() {
    const resourcePath = AppEnv.getLoadSettings().resourcePath;
    const modulePath = path.join(resourcePath, 'internal_packages', 'thread-list', 'lib', 'thread-list-store.js');
    const loaded = require(modulePath);
    return loaded.default || loaded;
}
function reloadThreadList() {
    try {
        const threadListStore = loadThreadListStore();
        if (threadListStore && typeof threadListStore.createListDataSource === 'function') {
            threadListStore.createListDataSource();
        }
    }
    catch (e) {
        console.error('mailspring-sort-inbox: failed to reload thread list', e);
    }
}
function installQueryFinalizeHook(resourcePath) {
    if (queryHookInstalled) {
        return;
    }
    const queryMod = require(path.join(resourcePath, 'src/flux/models/query.js'));
    const ModelQuery = queryMod.default;
    if (!ModelQuery || ModelQuery.prototype.__sortInboxFinalizePatched) {
        queryHookInstalled = true;
        return;
    }
    const originalFinalize = ModelQuery.prototype.finalize;
    ModelQuery.prototype.finalize = function finalizeWithSortInbox() {
        applyThreadListSort(this);
        return originalFinalize.call(this);
    };
    ModelQuery.prototype.__sortInboxFinalizePatched = true;
    queryHookInstalled = true;
}
function installQuerySubscriptionHook(resourcePath) {
    if (subscriptionHookInstalled) {
        return;
    }
    const subMod = require(path.join(resourcePath, 'src/flux/models/query-subscription.js'));
    const QuerySubscription = subMod.QuerySubscription;
    if (!QuerySubscription || QuerySubscription.prototype.__sortInboxSortChangePatched) {
        subscriptionHookInstalled = true;
        return;
    }
    const originalSortChange = QuerySubscription.prototype._itemSortOrderHasChanged;
    QuerySubscription.prototype._itemSortOrderHasChanged = function itemSortOrderHasChanged(old, updated) {
        const orders = this._query && typeof this._query.orderSortDescriptors === 'function'
            ? this._query.orderSortDescriptors()
            : [];
        const usesListSenderSort = orders.some((o) => o.attr && o.attr.modelKey === LIST_SENDER_SORT_ATTR.modelKey);
        if (usesListSenderSort) {
            return listSenderSortKey(old) !== listSenderSortKey(updated);
        }
        return originalSortChange.call(this, old, updated);
    };
    QuerySubscription.prototype.__sortInboxSortChangePatched = true;
    subscriptionHookInstalled = true;
}
function installSearchQuerySubscriptionHook(resourcePath) {
    const searchMod = require(path.join(resourcePath, 'internal_packages', 'thread-search', 'lib', 'search-query-subscription.js'));
    const SearchQuerySubscription = searchMod.default;
    if (!SearchQuerySubscription || SearchQuerySubscription.prototype.__sortInboxSearchPatched) {
        return;
    }
    SearchQuerySubscription.prototype._addThreadIdsToSearch = function addThreadIdsToSearch(ids = []) {
        const currentResults = this._set && this._set.ids().length > 0;
        let searchIds = ids;
        if (currentResults) {
            const currentResultIds = this._set.ids();
            searchIds = [...new Set(currentResultIds.concat(ids))];
        }
        let dbQuery = DatabaseStore.findAll(Thread).where({ id: searchIds });
        const useCustomSort = getListSortKey() === 'sender' ||
            (getListSortKey() === 'date' && getSortDirection() === 'asc');
        if (!useCustomSort) {
            dbQuery = dbQuery.order(Thread.attributes.lastMessageReceivedTimestamp.descending());
        }
        this.replaceQuery(dbQuery);
    };
    SearchQuerySubscription.prototype.__sortInboxSearchPatched = true;
}
function installThreadListSortHook() {
    const resourcePath = AppEnv.getLoadSettings().resourcePath;
    installQueryFinalizeHook(resourcePath);
    installQuerySubscriptionHook(resourcePath);
    installSearchQuerySubscriptionHook(resourcePath);
}
module.exports = {
    STORAGE_SORT,
    STORAGE_SORT_KEY,
    getSortDirection,
    getListSortKey,
    installThreadListSortHook,
    reloadThreadList,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkLWxpc3Qtc29ydC1ob29rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RocmVhZC1saXN0LXNvcnQtaG9vay5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsTUFBTSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFFOUUsTUFBTSxZQUFZLEdBQUcsd0JBQXdCLENBQUM7QUFDOUMsTUFBTSxnQkFBZ0IsR0FBRyxrQkFBa0IsQ0FBQztBQUU1QyxJQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQztBQUMvQixJQUFJLHlCQUF5QixHQUFHLEtBQUssQ0FBQztBQUV0QyxTQUFTLGdCQUFnQjtJQUN2QixJQUFJO1FBQ0YsTUFBTSxDQUFDLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLLE1BQU07WUFBRSxPQUFPLENBQUMsQ0FBQztLQUMzQztJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsWUFBWTtLQUNiO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMsY0FBYztJQUNyQixJQUFJO1FBQ0YsTUFBTSxDQUFDLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxLQUFLLE1BQU0sSUFBSSxDQUFDLEtBQUssUUFBUTtZQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQzlDO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixZQUFZO0tBQ2I7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFLO0lBQ2xDLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLFdBQVcs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