const fs = require('fs');
const path = require('path');

/**
 * Loads plugin translations for a locale such as "fr-FR" or "pt-BR".
 * Mirrors Mailspring's own lookup: the base language is loaded first, then the
 * full locale overrides it (lang/fr.json, then lang/fr-FR.json). Missing files
 * are skipped, so an unsupported locale returns {} and English is used.
 */
function loadLangCatalog(locale, langDir) {
  const base = (locale || '').split('-')[0];
  const names = [base, locale].filter(Boolean);
  return names.reduce((catalog, name) => {
    const file = path.join(langDir, `${name}.json`);
    if (!fs.existsSync(file)) {
      return catalog;
    }
    return Object.assign(catalog, JSON.parse(fs.readFileSync(file, 'utf8')));
  }, {});
}

module.exports = { loadLangCatalog };
