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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pMThuLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDdEUsTUFBTSxFQUFFLGVBQWUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBRXRELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztBQUVwRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFFbkIsZ0ZBQWdGO0FBQ2hGLDhEQUE4RDtBQUM5RCxTQUFTLENBQUMsQ0FBQyxFQUFFO0lBQ1gsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLE9BQU8sR0FBRyxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUN6RDtJQUNELE9BQU8sT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDIn0=