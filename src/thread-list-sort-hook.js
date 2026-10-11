const path = require('path');
const { AccountStore, DatabaseStore, Thread } = require('mailspring-exports');

const STORAGE_SORT = 'airmail-sort-direction';
const STORAGE_SORT_KEY = 'airmail-sort-key';

let queryHookInstalled = false;
let subscriptionHookInstalled = false;

function getSortDirection() {
  try {
    const v = localStorage.getItem(STORAGE_SORT);
    if (v === 'asc' || v === 'desc') return v;
  } catch (e) {
    /* ignore */
  }
  return 'desc';
}

function getListSortKey() {
  try {
    const v = localStorage.getItem(STORAGE_SORT_KEY);
    if (v === 'date' || v === 'sender') return v;
  } catch (e) {
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
  if (
    matchers.some(
      (m) =>
        m.attr &&
        m.attr.modelKey === 'id' &&
        (m.comparator === 'in' || m.comparator === '=')
    )
  ) {
    return true;
  }
  return matchers.some((m) => {
    const key = m.attr && m.attr.modelKey;
    return (
      key === 'categories' ||
      key === 'unread' ||
      key === 'starred' ||
      (key === 'inAllMail' && matchers.some((x) => x.attr && x.attr.modelKey === 'starred'))
    );
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
  } catch (e) {
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
  } catch (e) {
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
      return (
        `${listSenderFieldSubquery(table, 'email')} ${sqlDir}, ` +
        `${listSenderFieldSubquery(table, 'name')} ${sqlDir}, ` +
        `\`${table}\`.\`lastMessageReceivedTimestamp\` ${tieDir}`
      );
    },
  };
}

function listSenderSortKey(thread) {
  if (!thread) {
    return '';
  }

  const messages =
    thread.__messages instanceof Array
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
    } else {
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
  const modulePath = path.join(
    resourcePath,
    'internal_packages',
    'thread-list',
    'lib',
    'thread-list-store.js'
  );
  const loaded = require(modulePath);
  return loaded.default || loaded;
}

function reloadThreadList() {
  try {
    const threadListStore = loadThreadListStore();
    if (threadListStore && typeof threadListStore.createListDataSource === 'function') {
      threadListStore.createListDataSource();
    }
  } catch (e) {
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
    const orders =
      this._query && typeof this._query.orderSortDescriptors === 'function'
        ? this._query.orderSortDescriptors()
        : [];
    const usesListSenderSort = orders.some(
      (o) => o.attr && o.attr.modelKey === LIST_SENDER_SORT_ATTR.modelKey
    );
    if (usesListSenderSort) {
      return listSenderSortKey(old) !== listSenderSortKey(updated);
    }
    return originalSortChange.call(this, old, updated);
  };
  QuerySubscription.prototype.__sortInboxSortChangePatched = true;
  subscriptionHookInstalled = true;
}

function installSearchQuerySubscriptionHook(resourcePath) {
  const searchMod = require(path.join(
    resourcePath,
    'internal_packages',
    'thread-search',
    'lib',
    'search-query-subscription.js'
  ));
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
    const useCustomSort =
      getListSortKey() === 'sender' ||
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
