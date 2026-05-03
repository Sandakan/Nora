# Migration from Prettier to Oxfmt

## Todo

- [x] Run automated migration: `npx oxfmt@latest --migrate prettier` <!-- id: 0 -->
- [x] Review and refine `.oxfmtrc.json` <!-- id: 1 -->
- [x] Update `package.json` scripts to use `oxfmt` <!-- id: 2 -->
- [x] Uninstall Prettier and its plugins <!-- id: 3 -->
- [x] Remove Prettier configuration files: `prettier.config.cjs` and `.prettierignore` <!-- id: 4 -->
- [x] Verify migration by running `oxfmt` on the project <!-- id: 5 -->

## Review

- Successfully migrated from Prettier to Oxfmt.
- Installed `oxfmt` as a dev dependency for consistent script behavior.
- Automated migration handled `prettier-plugin-tailwindcss` correctly.
- All scripts in `package.json` updated and verified.
