# Contributing to X-PASS

First off, thank you for considering contributing to X-PASS! 🎉

## Ways to Contribute

### 🐛 Reporting Bugs
1. Check if the bug is already reported in [Issues](https://github.com/ar3love/x-pass/issues)
2. Open a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - System info (OS, version)

### 🌍 Translations
Add a new language:
1. Copy `src/assets/locales/en/translation.json`
2. Translate all keys
3. Update `src/i18n.ts` with language code
4. Submit a PR

### 🎨 Themes
Create a new theme:
1. Add file `src/context/theme/themes/yourtheme.ts`
2. Follow existing theme structure
3. Update `src/context/theme/index.ts`
4. Submit a PR with screenshot

### 💻 Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Run dev server
npm run tauri dev
```

## Code Style
- **TypeScript**: Follow existing patterns
- **Rust**: Use `rustfmt` and `clippy`
- **Commits**: Use conventional commits (feat, fix, docs, style, refactor)

## Pull Request Guidelines
- Reference related issues
- Add tests for new features
- Update documentation
- Ensure CI passes

## Questions?
Open a [Discussion](https://github.com/ar3love/x-pass/discussions) or contact [@ar3love](https://github.com/ar3love).

---

Thank you for making X-PASS better! ❤️