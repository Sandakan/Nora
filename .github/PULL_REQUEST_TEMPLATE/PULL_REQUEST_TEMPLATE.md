# Pull Request Title

## Description:

## Changelog:

- ### 🎉 New Features and Updates

- ### 🔨 Fixes and Improvements

- ### 🚀 Development updates

- ### 🐜 Known Issues and Bugs

## Other Issues:

## Checklist:

- [ ] Have you checked to ensure there aren't other open [Pull Requests](https://github.com/Sandakan/Nora/pulls) for the same update/change?
- [ ] Have you linted your code locally before submission with `npm run lint` and `npm run prettier-write` commands?
- [ ] Have you successfully run the app with your changes locally with `npm run dev`?
- [ ] Have you successfully ran available tests with `npm run test`?

> [!IMPORTANT] > **Fill below checklist items to,**
>
> - release a new update of the app
> - add an emergency change
>
> **Pull requests that directly modify the `main` branch should only fill the checklist items.** > **Delete if it's not the case.**

- [ ] Create a version artwork (if the update is minor or major).
  - [ ] Paste the artwork to the [/resources/other/release artworks/](https://github.com/Sandakan/Nora/tree/master/resources/other/release%20artworks) directory.
  - [ ] Paste the artwork to the top of this PR.
  - [ ] Link the artwork to the [readme.md](https://github.com/Sandakan/Nora/tree/master/readme.md) in the project root.
- [ ] Create and paste the artwork for the installer to the [/build/installer_assets/sidebar.bmp](https://github.com/Sandakan/Nora/tree/master/build/installer_assets/sidebar.bmp) directory.
- [ ] Update the `version` entry in `package.json` and `package-lock.json` files in the [root](https://github.com/Sandakan/Nora/tree/master/) directory.
- [ ] Manage the changelog of this release
  - [ ] Copy the release notes from this PR and paste them to the [changelog.md](https://github.com/Sandakan/Nora/tree/master/changelog.md) file.
  - [ ] Create a new `versions` entry in [release-notes.json](https://github.com/Sandakan/Nora/tree/master/release-notes.json) file.
    - [ ] Add the `artworkPath` to the entry.
    - [ ] Add relevant `importantNotes` to the entry.
    - [ ] Copy each release note, remove unnecessary items like markdown synta , and add them to the `new`, `fixed`, and `knownIssues` sections separately in the `notes` entry.
    - [ ] Update these changes also in the `latestVersion` entry in that file.
    - [ ] Verify the file with the [release-notes-schema.json](https://github.com/Sandakan/Nora/tree/master/release-notes-schema.json) file.
- [ ] Update the [readme.md](https://github.com/Sandakan/Nora/tree/master/readme.md) file of the project
  - [ ] Update the `release downloads` badge URL with the created tag (same as the `version` entry in [package.json](https://github.com/Sandakan/Nora/tree/master/package.json)) of the release.
