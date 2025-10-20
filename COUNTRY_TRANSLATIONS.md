# Country Translations Guide

## Overview
Your app now automatically translates country names based on the user's domain/language preference. This feature works seamlessly across all components.

## How It Works

When a user visits your site on a specific domain (e.g., `ru.romajet.net`, `ar.romajet.net`, `de.romajet.net`), country names are automatically translated to match the domain language.

### Supported Languages
- **English (en)** - Default language
- **Arabic (ar)** - العربية
- **German (de)** - Deutsch
- **Spanish (es)** - Español
- **French (fr)** - Français
- **Hebrew (he)** - עברית
- **Russian (ru)** - Русский

## Examples

| Country Code | English | Arabic | German | Russian | Hebrew |
|--------------|---------|---------|--------|---------|--------|
| US | United States | الولايات المتحدة | Vereinigte Staaten | США | ארצות הברית |
| FR | France | فرنسا | Frankreich | Франция | צרפת |
| DE | Germany | ألمانيا | Deutschland | Германия | גרמניה |
| IL | Israel | إسرائيل | Israel | Израиль | ישראל |
| RU | Russia | روسيا | Russland | Россия | רוסיה |

## Implementation Details

### Files Modified
1. **`src/utils/countryTranslations.js`** - Core translation utility with all translations
2. **`src/components/EsimPlans.jsx`** - Landing and plans page country display
3. **`src/components/Dashboard.jsx`** - Order country names in dashboard
4. **`src/components/EsimPlans.jsx`** - Country dropdown filter
5. **`src/components/CountrySearchBar.jsx`** - Popular country suggestions
6. **`src/data/mobileCountries.js`** - Hardcoded mobile countries

### Key Functions

#### `translateCountryName(countryCode, countryName, locale)`
Translates a single country name based on country code and locale.

```javascript
import { translateCountryName } from '../utils/countryTranslations';

// Example usage
const translatedName = translateCountryName('US', 'United States', 'ar');
// Returns: الولايات المتحدة
```

#### `translateCountries(countries, locale)`
Translates an array of country objects.

```javascript
import { translateCountries } from '../utils/countryTranslations';

// Example usage
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'FR', name: 'France' }
];

const translated = translateCountries(countries, 'de');
// Returns:
// [
//   { code: 'US', name: 'Vereinigte Staaten' },
//   { code: 'FR', name: 'Frankreich' }
// ]
```

#### `getMobileCountries(locale)`
Returns hardcoded countries with automatic translation.

```javascript
import { getMobileCountries } from '../data/mobileCountries';

// Example usage
const countries = getMobileCountries('ru');
// Returns translated countries for Russian locale
```

## Adding New Translations

To add translations for a new language or update existing ones:

1. Open `src/utils/countryTranslations.js`
2. Find or add the language code in the `countryTranslations` object
3. Add country code and translated name pairs:

```javascript
export const countryTranslations = {
  // Existing languages...
  
  // Add new language
  it: { // Italian
    'US': 'Stati Uniti',
    'GB': 'Regno Unito',
    'FR': 'Francia',
    'DE': 'Germania',
    // Add more...
  },
};
```

4. Update the supported languages in your middleware if needed

## How Translations are Applied

### 1. Domain Detection
The middleware (`middleware.js`) detects the language from the domain:
- `ru.romajet.net` → Russian (ru)
- `ar.romajet.net` → Arabic (ar)
- `de.romajet.net` → German (de)
- etc.

### 2. I18n Context
The detected language is stored in the `I18nContext` as `locale`.

### 3. Automatic Translation
Components use the `locale` from context to automatically translate:
- Country names in listings
- Country names in search results
- Country names in orders
- Country suggestions in search bar

## Testing

To test translations:

1. Visit your site on different domains:
   - `https://ru.romajet.net` - See Russian country names
   - `https://ar.romajet.net` - See Arabic country names
   - `https://de.romajet.net` - See German country names

2. Change language using the language selector (if available)

3. Check these pages:
   - Landing page country listings
   - Plans page
   - Dashboard orders
   - Search results

## Notes

- **Fallback**: If a translation is not available for a country code, the original English name is used
- **Performance**: Translations are applied in-memory, no API calls needed
- **Consistency**: All country names across the app use the same translation system
- **RTL Support**: Arabic and Hebrew translations work correctly with RTL layouts
- **Search**: Search functionality still uses English country names internally for consistency

## Country Coverage

Currently, translations are provided for ~100+ major countries including:
- All G20 countries
- All European Union countries
- All Middle Eastern countries
- Major Asian, African, and American countries
- Popular tourist destinations

For less common countries not in the translation list, the English name is displayed as fallback.

## Future Enhancements

Possible improvements for the future:
1. Add more languages (Portuguese, Italian, Chinese, etc.)
2. Add more country translations for each language
3. Allow admin to manage translations via dashboard
4. Store translations in database for easy updates
5. Add region/continent translations

---

**Note**: All translations are stored in `src/utils/countryTranslations.js` for easy maintenance and updates.

