# Internationalization (i18n) Setup

This project has been set up with comprehensive internationalization support for multiple languages including RTL (Right-to-Left) languages.

## Supported Languages

- **English (en)** - Default language
- **Hebrew (he)** - RTL language
- **Russian (ru)** - LTR language
- **Arabic (ar)** - RTL language
- **German (de)** - LTR language
- **French (fr)** - LTR language
- **Spanish (es)** - LTR language

## Features

### 1. Language Selector
- Located in the top navigation bar (desktop and mobile)
- Shows current language with flag and code
- Dropdown menu with all available languages
- Smooth language switching without page reload

### 2. RTL Support
- Automatic direction detection for Arabic and Hebrew
- Comprehensive CSS rules for RTL layout
- Proper text alignment and spacing
- Icon and layout adjustments for RTL languages

### 3. Translation Coverage
- **Navbar**: Logo, menu items, accessibility labels
- **Hero Section**: Main headline, description, call-to-action buttons
- **Features Section**: All feature titles and descriptions
- **Plans Section**: Section headers and loading states
- **Activation Section**: Step-by-step instructions, app download links
- **Footer**: Company description, links, contact information

## File Structure

```
public/
  locales/
    en/common.json    # English translations
    he/common.json    # Hebrew translations
    ru/common.json    # Russian translations
    ar/common.json    # Arabic translations
    de/common.json    # German translations
    fr/common.json    # French translations
    es/common.json    # Spanish translations

src/
  components/
    LanguageSelector.jsx    # Language selection component
    LanguageWrapper.jsx     # RTL/LTR direction wrapper
  utils/
    languageUtils.js        # Language utility functions

app/
  rtl.css                  # RTL-specific CSS rules
  _app.js                  # i18n app wrapper
```

## Usage

### Adding New Translations

1. **Add to all language files**: Update `public/locales/{locale}/common.json`
2. **Use in components**: Import `useI18n` and use `t('key.path')`
3. **Test all languages**: Verify translations work correctly

### Example Component Usage

```jsx
import { useI18n } from '../contexts/I18nContext';

const MyComponent = () => {
  const { t } = useI18n();
  
  return (
    <div>
      <h1>{t('hero.stayConnected')}</h1>
      <p>{t('hero.description')}</p>
    </div>
  );
};
```

### Adding New Languages

1. **Create translation files**: Add `public/locales/{new-locale}/common.json`
2. **Update utilities**: Add language info to `languageUtils.js`
3. **Test RTL support**: If RTL language, verify CSS rules work

## Translation Keys Structure

```json
{
  "navbar": {
    "logo": "RoamJet",
    "downloadApp": "Download App",
    "contactUs": "Contact Us",
    "blog": "Blog"
  },
  "hero": {
    "announcement": "Now available in 200+ countries worldwide.",
    "stayConnected": "Stay connected",
    "noMatterWhere": "no matter where you are",
    "with": "with",
    "description": "Get instant mobile data...",
    "downloadApp": "Download App",
    "learnMore": "Learn more"
    
  },
  "features": {
    "title": "Connect globally",
    "subtitle": "Everything you need for global connectivity",
    "globalCoverage": {
      "title": "Global Coverage",
      "description": "Stay connected in 200+ countries...",
      "countries": "200+ Countries",
      "worldwide": "Worldwide Coverage"
    }
  }
}
```

## RTL Language Support

### Automatic Detection
- Arabic (`ar`) and Hebrew (`he`) automatically trigger RTL mode
- Direction attribute set on `<html>` element
- CSS rules automatically applied

### CSS Classes
- `[dir="rtl"]` selector for RTL-specific styles
- Comprehensive spacing, alignment, and layout adjustments
- Proper handling of margins, padding, borders, and positioning

### Manual RTL Testing
```bash
# Test Arabic
http://localhost:3000/ar

# Test Hebrew  
http://localhost:3000/he
```

## Development

### Running with i18n
```bash
npm run dev
```

### Testing Languages
- Visit `http://localhost:3000` (default English)
- Use language selector in navbar to switch languages
- Language preference is saved in localStorage

### Adding New Translation Keys

1. Add key to English file first: `public/locales/en/common.json`
2. Add translations to all other language files
3. Use in component: `t('new.key.path')`
4. Test in all languages

## Production Deployment

The i18n setup is production-ready and will work with:
- Vercel deployment
- Static site generation
- Server-side rendering
- Client-side navigation

All language routes will be automatically generated and SEO-friendly.
