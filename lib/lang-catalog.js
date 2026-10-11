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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZy1jYXRhbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xhbmctY2F0YWxvZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBRTdCOzs7OztHQUtHO0FBQ0gsU0FBUyxlQUFlLENBQUMsTUFBTSxFQUFFLE9BQU87SUFDdEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFDLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM3QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUU7UUFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3hCLE9BQU8sT0FBTyxDQUFDO1NBQ2hCO1FBQ0QsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDVCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFFLGVBQWUsRUFBRSxDQUFDIn0=