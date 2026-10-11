const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadLangCatalog } = require('../src/lang-catalog');

const LANG_DIR = path.join(__dirname, '..', 'lang');

describe('loadLangCatalog', () => {
  it('loads the base language for a full locale', () => {
    assert.equal(loadLangCatalog('fr-FR', LANG_DIR)['Sort by'], 'Trier par');
  });

  it('returns an empty catalog for English and unknown locales', () => {
    assert.deepEqual(loadLangCatalog('en-US', LANG_DIR), {});
    assert.deepEqual(loadLangCatalog('xx-YY', LANG_DIR), {});
    assert.deepEqual(loadLangCatalog(undefined, LANG_DIR), {});
  });

  it('lets a regional file override its base language', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lang-'));
    fs.writeFileSync(path.join(dir, 'pt.json'), JSON.stringify({ Order: 'Ordem', A: 'base' }));
    fs.writeFileSync(path.join(dir, 'pt-BR.json'), JSON.stringify({ A: 'regional' }));
    assert.deepEqual(loadLangCatalog('pt-BR', dir), { Order: 'Ordem', A: 'regional' });
    fs.rmSync(dir, { recursive: true });
  });
});

describe('shipped translations', () => {
  const files = fs.readdirSync(LANG_DIR).filter((f) => f.endsWith('.json'));
  const keysOf = (file) => Object.keys(JSON.parse(fs.readFileSync(path.join(LANG_DIR, file), 'utf8'))).sort();
  const reference = keysOf(files[0]);

  it('ships at least one language', () => {
    assert.ok(files.length > 0);
  });

  it('every language has the same keys as the reference file', () => {
    for (const file of files) {
      assert.deepEqual(keysOf(file), reference, `${file} is missing or has extra keys`);
    }
  });
});
