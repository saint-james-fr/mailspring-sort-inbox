const path = require('path');
const { getCurrentLocale, localized } = require('mailspring-exports');
const { loadLangCatalog } = require('./lang-catalog');

const LANG_DIR = path.join(__dirname, '..', 'lang');

let catalog = null;

// Plugin strings come from lang/. Anything else (Date, Show, Unread, ...) falls
// back to Mailspring's own translations, and then to English.
function t(en) {
  if (!catalog) {
    catalog = loadLangCatalog(getCurrentLocale(), LANG_DIR);
  }
  return catalog[en] || localized(en);
}

module.exports = { t };
