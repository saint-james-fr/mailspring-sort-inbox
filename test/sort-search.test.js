const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildSearchQuery,
  parseSearchQueryState,
  isValidListSortKey,
  isValidReadFilter,
} = require('../src/sort-search');

describe('buildSearchQuery', () => {
  it('returns empty for default filters', () => {
    assert.equal(buildSearchQuery({ readFilter: 'all', starredOnly: false }), '');
  });

  it('combines unread and starred with AND', () => {
    assert.equal(
      buildSearchQuery({ readFilter: 'unread', starredOnly: true }),
      'is:unread is:starred'
    );
  });

  it('supports read-only filter', () => {
    assert.equal(buildSearchQuery({ readFilter: 'read', starredOnly: false }), 'is:read');
  });
});

describe('parseSearchQueryState', () => {
  it('detects unread and starred', () => {
    assert.deepEqual(parseSearchQueryState('is:unread is:starred'), {
      readFilter: 'unread',
      starredOnly: true,
      subjectSearch: false,
    });
  });

  it('detects subject prefix', () => {
    assert.deepEqual(parseSearchQueryState('subject:invoice'), {
      readFilter: 'all',
      starredOnly: false,
      subjectSearch: true,
    });
  });

  it('prefers unread over read when both present (malformed)', () => {
    const state = parseSearchQueryState('is:read is:unread');
    assert.equal(state.readFilter, 'unread');
  });
});

describe('validators', () => {
  it('accepts only date and sender sort keys', () => {
    assert.equal(isValidListSortKey('sender'), true);
    assert.equal(isValidListSortKey('subject'), false);
  });

  it('accepts read filter values', () => {
    assert.equal(isValidReadFilter('unread'), true);
    assert.equal(isValidReadFilter('nope'), false);
  });
});
