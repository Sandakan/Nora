<div align="center">

<img src="resources/other/nora_logo_banner.webp" alt="Nora Logo">

# Nora Player

### An elegant music player for the modern desktop

Built with Electron and React • Inspired by [Oto Music](https://play.google.com/store/apps/details?id=com.piyush.music&gl=us)

![GitHub all releases](https://img.shields.io/github/downloads/Sandakan/Nora/total?label=all%20time%20downloads&style=for-the-badge)
![GitHub release (latest by date)](https://img.shields.io/github/downloads/Sandakan/Nora/v3.1.0-stable/total?style=for-the-badge)
![GitHub package.json version](https://img.shields.io/github/package-json/v/Sandakan/Nora?color=blue&label=latest%20version&style=for-the-badge)

[![GitHub license](https://img.shields.io/github/license/Sandakan/Nora?style=for-the-badge)](https://github.com/Sandakan/Nora/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/Sandakan/Oto-Music-for-Desktop?style=for-the-badge)](https://github.com/Sandakan/Nora/issues)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/Sandakan/Nora/build.yml?branch=master&style=for-the-badge)

[![Crowdin](https://badges.crowdin.net/nora/localized.svg)](https://crowdin.com/project/nora)

[Download](https://github.com/Sandakan/Nora/releases/latest) • [Features](#-features) • [Build Guide](#-build-from-source) • [Changelog](/changelog.md) • [Discord](https://discord.gg/c5rGKnBs4y)

</div>

---

## 🎯 Why Nora?

Nora reimagines desktop music playback with thoughtful design and powerful features. Built to overcome the limitations of default music apps, it provides an intuitive and beautiful experience that puts your music front and center.

![Nora Banner Artwork](/resources/other/artwork%200.webp)

## ✨ Features

**Library Management**

- ✅ Organize songs, artists, albums, and playlists with ease
- ✅ Advanced search with smart song filters
- ✅ Edit song metadata easily and conveniently[^3]

**Listening Experience**

- ✅ Sing along with song lyrics[^1]
- ✅ Support for synced lyrics
- ✅ Last.FM scrobbling integration
- ✅ Mini-player mode for distraction-free listening

**Personalization**

- ✅ Keep favorite songs and artists close to you
- ✅ Read your favorite artist's biography
- ✅ Create playlists that meet your needs
- ⏳ Personalized music shuffling[^2] (Upcoming)

**Customization**

- ✅ Switch between Light and Dark themes with ease

![Latest Version Artwork](/resources/other/release%20artworks/whats-new-v3.1.0-stable.webp)

Check out the [changelog](/changelog.md) to see what's new in the latest release.

## 📥 Download

Go to the **[Releases page](https://github.com/Sandakan/Nora/releases) > Assets > Choose your platform** or [download the latest version directly](https://github.com/Sandakan/Nora/releases/latest).

## 📸 Gallery

![Support for Online and Offline Lyrics](/resources/other/artwork%201.webp)

![Switch between Dark and Light Modes](/resources/other/artwork%202.webp)

![Support for Last.FM Scrobbling](/resources/other/artwork%209.webp)

![Organize your music library with ease](/resources/other/artwork%203.webp)

![See how your favorite artists appear on songs and albums](/resources/other/artwork%204.webp)

![Keep your favorites closer to you](/resources/other/artwork%205.webp)

![Search through your music library easily and efficiently](/resources/other/artwork%206.webp)

![Edit song metadata and organize your library](/resources/other/artwork%207.webp)

![Listen with the mini player](/resources/other/artwork%208.webp)

## 💬 What People Say

<div align="center">

> _"A sleek music player with a modern design, this solution seeks to provide users with a seamless experience when it comes to listening to their favorite local tunes."_  
> — Robert Condorache, [Softpedia](https://www.softpedia.com/get/Multimedia/Audio/Audio-Players/Oto-Music-for-Desktop.shtml)

---

> _"The application interface adopts rounded corners in a large area, the fonts and icons are round and cute, and the visual effect is very comfortable."_  
> — [Apps Worth Watching in the Near Future • SSPAI](https://sspai.com/post/78669)

---

> _"Just found the most beautiful music player for Windows: Nora"_  
> — [r/windowsapps • Reddit](https://www.reddit.com/r/windowsapps/comments/11xgg99/just_found_the_most_beautiful_music_player_for/)

</div>

## 🛠 Build From Source

Clone the repository

```bash
git clone https://github.com/Sandakan/Nora
```

Navigate to project folder

```bash
cd Nora
```

Install dependencies

```bash
npm install
```

Launch in development mode

```bash
npm start
```

## 📊 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Sandakan/Nora&type=Date)](https://star-history.com/#Sandakan/Nora&Date)

## 🤝 Feedback & Contributing

Have feedback, bug reports, or feature requests? Reach out through:

- [Discord Server](https://discord.gg/c5rGKnBs4y)
- [Email](mailto:sandakannipunajith@gmail.com)
- [GitHub Issues](https://github.com/Sandakan/Nora/issues)

Help translate Nora on [Crowdin](https://crowdin.com/project/nora)!

---

<div align="center">

Made with ❤️ by Sandakan Nipunajith  
Love, Sri Lanka

_All songs, artists, albums, and cover art used in demonstrations are property of their respective owners and used for illustrative purposes only. All copyrights are respected._

</div>

---

[^1]: Song lyrics use the [SongLyrics](https://www.npmjs.com/package/songlyrics) package and an implementation from the [MxLRC](https://github.com/fashni/MxLRC) package.

[^2]: Personalized shuffles and playlists are generated by analyzing listening patterns and play counts.

[^3]: Currently, the app only supports editing MP3 files due to dependency limitations.
