# Change Log

> ### The latest version, **( v2.5.0-stable )** contains a lot of new features and improvements. As always expect some bugs in the app.

<br>

![Nora v2.3.0-stable version artwork](resources/other/release%20artworks/whats-new-v2.5.0-stable.webp)

<br>

- ### **v2.5.0-stable - ( 14<sup>th</sup> of December 2023 )**

  - ### 🎉 New Features and Updates

    - Added localization support for Nora.
    - Added a setting to change the language in Nora.
    - Added support for reading album artists in songs.
    - Added support reading and writing song lyrics to .LRC files. Fixes [#215](https://github.com/Sandakan/Nora/issues/215).
    - Added a feature to play the next/previous lyrics line using Alt + Up/Down shortcuts for synced lyrics in LyricsPage. Fixes [#216](https://github.com/Sandakan/Nora/issues/216).
    - Added support for 10-band equalizer.
    - Added partial support for saving song album artist.
    - Added migrations support for local storage.
    - Added support for saving LRC files in a separate folder other than the folder where the relevant song is located.
    - Added support for renaming the playlist.
    - Scrobble song requests now include albumArtist data.
    - Sorting songs with `track number` now also considers their disk numbers. Fixes [#211](https://github.com/Sandakan/Nora/issues/211).
    - Added up next song popup for the mini-player.
    - Added a button to clear app local storage data.
    - Added support for holding metadata saves if that song is currently being played to prevent player confusions and song corruptions.
    - Added support for saving lyrics to an LRC file if edited through the SongTagsEditingPage.
    - CurrentQueuePage now shows the remaining time of the queue.
    - Added a new button to add an instrumental line below when editing lyrics lines.
    - Added a duration bar for lyrics lines to display current line duration.
    - Added auto scrolling as a button in CurrentQueuePage.
    - Added support for recording and storing song seek data.
    - Most seeked position and the seeked frequency of a song will be displayed in the SongInfoPage.
    - Added a new icon to show the lower volume level.

  - ### 🔨 Fixes and Improvements

    - Improved app performance when parsing large libraries and toggling favorites.
    - Improved how index numbers are displayed in songs.
    - Improved animations overall fluidness of the app.
    - Fixed a bug where multiple selections add duplicates to the selections.
    - Fixed a bug where albums persist from the previous page when in ArtistPage page if the previous ArtistPage had albums but the current one doesn't. Fixes [#202](https://github.com/Sandakan/Nora/issues/202).
    - Fixed a bug where lyrics offset is showed as positive even though it is set to negative.
    - Fixed a bug where total song duration in Playlists, CurrentQueue are reset to if they count to more than 24 hours.
    - Fixed padding issues when displaying song index.
    - Fixed a bug where default artist artworks are not displayed.
    - Fixed a bug where albums are created using data from artist tag in a song instead of the albumArtist tag.
    - Fixed a bug where sorting option is not saved in FoldersPage and PlaylistInfoPage.
    - Fixed a bug where the user cannot remove unsynchronized lyrics from a song.
    - Fixed a bug where listening data are not recorded if the song is being repeated.
    - Fixed a bug where Last.FM scrobbling data is not sent if the song is being repeated.
    - Fixed a bug where images flash when components re-render.
    - Fixed a bug where correct equalizer preset name is not displayed when changing different presets.
    - Fixed a bug where SongTagsEditingPage shows that there are metadata updates even though there aren't any when opening the page.
    - Improved enhanced synchronized lyrics support.
    - Fixed a bug where the last lyric line shows its range ends in Infinity.
    - Improved animations when displaying enhanced lyrics.
    - Fixed a bug where background image doesn't update when a new artist artwork is downloaded in ArtistInfoPage.

<br>

<br>

- ### **v2.4.3-stable - ( 21<sup>th</sup> of October 2023 )**

  - ### 🔨 Fixes and Improvements
    - Updated dependencies to fix some security vulnerabilities.

<br>

<br>

- ### **v2.4.2-stable - ( 10<sup>th</sup> of September 2023 )**

  - ### 🔨 Fixes and Improvements
    - Fixed a bug where the installer doesn't include required environment variables.
    - Fixed a bug where users can't apply custom musixmatch tokens.
    - Fixed a bug where users can't authenticate with Last.FM.

<br>

- ### **v2.4.1-stable - ( 10<sup>th</sup> of September 2023 )**

  - ### 🔨 Fixes and Improvements
    - Fixed a bug where environment variables are not initialized when migrating the database to a newer version. Fixes [#195](https://github.com/Sandakan/Nora/issues/195).

<br>

- ### **v2.4.0-stable - ( 09<sup>th</sup> of September 2023 )**

  - ### 🎉 New Features and Updates

    - Added support for authenticating Last.FM users from Nora.
    - Added support for Last.Fm scrobbling. Fixes #187.
    - Added support for sending favorites data to Last.Fm.
    - Added support for sending now-playing song info to Last.FM.
    - Added a feature that shows similar artists and relevant hashtags for an artist when in the ArtistInfopage.
    - Added a feature that shows similar tracks of a song when in the SongInfoPage.
    - Added a feature that shows unavailable tracks and a summary of the album when in the AlbumInfoPage.
    - Added support for saving the window state so that Nora starts from the previous window state (e.g.: full-screen).
    - Added support for viewing both synchronized and Un-synchronized lyrics in the SongTagsEditingPage.
    - Added a pane to display additional info about the song in the SongInfoPage.
    - Added a new `Account Settings` section to the SettingsPage.
    - Added icons to buttons in the LyricsEditingPage.
    - Added a button to go to LyricsEditingPage from the LyricsPage.
    - Added an alert in the SongTagsEditingPage if there are pending lyrics to be written to a song.
    - Added an option to display song track number instead of the index number when in Albums Info Page. Fixes [#194](https://github.com/Sandakan/Nora/issues/194).

  - ### 🔨 Fixes and Improvements

    - Fixed a bug where suggestion prompts don't hide when clicked on the button with an up arrow.
    - Updated the feature to edit the next line's start tag with the current line's end tag and vice versa automatically.
    - Fixed a bug where saved lyrics will be overwritten if the user selected the 'Synchronized Lyrics Only' or 'Un-synchronized and Synchronized Lyrics Only' options to save lyrics automatically and clicked the 'Show Online Lyrics' button.
    - Fixed a bug where ignoring DuplicateArtistsSuggestions and SeparateArtistsSuggestions are not working.
    - Fixed a bug where the 'No lyrics found' message will be shown in the LyricsPage when you try to view online lyrics that are not available for a song but have offline lyrics.
    - Improved performance when displaying songs in CurrentQueuePage.
    - Improved app logs to display the destination of the log.
    - Improved app performance and reduced time taken when opening songs from File Explorer.
    - Improved performance when opening Albums, Playlists, and Genres with bigger song lists.
    - Updated outdated dependencies and fixed dependency vulnerabilities.
    - Updated some icons in the app.
    - Fixed a bug where saving automatically downloaded lyrics may confuse the audio player to skip the song. Fixes [#192](https://github.com/Sandakan/Nora/issues/192).
    - Fixed a bug where ignoring DuplicateArtistsSuggestions and SeparateArtistsSuggestions are not working.
    - Fixed a bug where automatically downloaded lyrics may try to save to songs that do not support modifying song metadata.
    - Fixed a bug where songs show the original artwork instead of the optimized artwork and sometimes may fail to load the optimized artwork.
    - Fixed a bug where duplicate album entries are added to artists when songs with the same album and artist are parsed. Fixes [#191](https://github.com/Sandakan/Nora/issues/191).
    - Fixed a bug where the sorting state of songs in MusicFoldersPage is not being saved.
    - Fixed a bug where search results from SongTagsEditingPage for artists, albums, and genres are fixed to a maximum limit of 5.
    - Fixed a bug where clicking 'Play All' shuffles the queue.
    - Fixed a bug where Ctrl + Click an item doesn't select it.
    - Fixed a bug where user cannot use Shift + Click and Control + Click selection combinations simultaneously.
    - Fixed a bug where suggestions don't get minimized when the up-arrow button is clicked.

  - ### 🐜 Known Issues and Bugs
    - Nora may fail to load some FLAC songs [#184](https://github.com/Sandakan/Nora/issues/184).

<br>

![Nora v2.3.0-stable version artwork](resources/other/release%20artworks/whats-new-v2.4.0-stable.webp)

<br>

- ### **v2.3.0-stable - ( 30<sup>th</sup> of June 2023 )**

  - ### 🎉 New Features and Features

    - Added support for enhanced synced lyrics in Nora (Experimental).
    - Added support for syncing unsynced lyrics right from the app (Experimental).
    - Added support for importing and exporting app data (Experimental).
    - Added support for importing and exporting playlists (Experimental).
    - Added support for editing the tracking number of songs from the app (Experimental).
    - Added support for re-parsing songs on demand to fix any errors that occurred when parsing the song (Experimental).
    - Added support for animated artworks (Experimental).
    - Added support for saving automatically downloaded lyrics when in LyricsPage.
    - Added a button next to `Most Loved Songs` on the `Home page` which directs to the Favorites playlist.
    - Added the feature to save artwork with the selected artwork's name.

  - ### 🔨 Fixes and Improvements
    - Fixed a bug where the app may crash in mini-player mode when using Window's window snap feature.
    - Improved app error handling when parsing songs.
    - Fixed a bug where the text style of `Unknown artist` is inconsistent across different pages.
    - Fixed a bug where scrolling to the page section is not working.
    - Added a fix for flickering issues in notifications with progress indicators.
    - Fixed a bug where the `Update token` button in the Musixmatch Settings prompt is not disabled even though the typed token is the same saved token.
    - Fixed a bug where the `Show token` button is not disabled when opening Musixmatch Settings prompt with a previously saved token.
    - Fixed a bug where clicking the `Adjust Playback Speed` context menu option doesn't point you to the correct section of Settings.
    - Increased the brightness of Song Card artworks.
    - Fixed a bug where some messages sent from the main process to the renderer have timestamps.
    - Fixed a bug where songs in an album don't show their respective album name.
    - Fixed some additional padding on All Result Pages.
    - Improved app performance by limiting re-rendering in unwanted situations.
    - Reduced the size of media control buttons in the Mini player.
    - Fixed a bug where blacklisted icons in Song cards aren't positioned correctly.
    - Fixed some bugs related to recording listening data.
    - Fixed some brightness issues in SongCard.
    - Fixed a bug where albums with the same names get categorized into the same album even though they have different artists.
    - Moved the toggle predictive search button into the search bar.
    - Fixed some styling issues in SongTagsEditingPage.
    - Linked Nora's website to the app.
    - Moved lyrics-related settings from the Audio Playback section to the new 'Lyrics' section in Settings.
    - Fixed a bug where the app doesn't start with the previous window's dimensions.
    - Fixed a bug where sometimes the app doesn't show an error message when the player stops due to an error.
    - Moved musixmatch metadata result from the bottom of the list to the top.
    - Linked Nora's official website to the app.
    - Improved the render cycle timings to improve app performance.
    - Marked notifications as a low priority to improve performance.
    - Fixed a bug where songs inside lists like playlists, genres, albums, etc don't play the whole list when clicking the play button on a song.
    - Fixed a bug where CurrentQueuePage doesn't get updated when shuffled.
    - Fixed a bug where incorrect colors are used for inputs in the SongTagsEditingPage.
    - Fixed a bug where the contents of the TitleBar are not visible when the app is in light mode and displaying a background image.
    - Fixed a bug where listening data sessions record listening data even though the song is paused.
    - Fixed some dependency security vulnerabilities.
    - Improved app logs.
  - ### 🐜 Known Issues and Bugs
    - Nora may fail to load some FLAC songs.

<br>

![Nora v2.2.0-stable version artwork](resources/other/release%20artworks/whats-new-v2.2.0-stable.webp)

<br>

- ### **v2.2.0-stable - ( 20<sup>th</sup> of May 2023 )**

  - ### 🎉 New Features and Features

    - Added the feature to save some images that appear in the app.
    - Added an experimental fix for the bug where other music players like Groove Music don't recognize artworks edited by
      Nora.
    - Added a new keyboard shortcut to quickly navigate to Search. Fixes [#173](https://github.com/Sandakan/Nora/issues/173).

  - ### 🔨 Fixes and Improvements

    - Improved the artists' splitting algorithm of suggestions.
    - Fixed a bug where images and lyrics lines are draggable.
    - Fixed a bug where playlist images aren't positioned correctly when the "artworks made from song covers" feature is
      enabled.
    - Fixed a bug in which the app doesn't inform the user if the metadata update process fails.
    - Improved the app version matching algorithm and fixed a bug where the app informs the user about a new update even
      though app the is in the latest version.
    - Fixed a test contrast issue on the Artist Info page. Fixes [#174](https://github.com/Sandakan/Nora/issues/174).
    - In Search page, the "Most Relevant" list (side-scroll) doesn't prevent you from scrolling down when hovering over them.

  - ### 🐜 Known Issues and Bugs
    - Sometimes updating song artwork may need an app restart to show on the app [#162](https://github.com/Sandakan/Nora/issues/162).
    - The app may crash in mini-player mode when trying to use window snap feature [#163](https://github.com/Sandakan/Nora/issues/163).

<br>

![Nora v2.1.0-stable version artwork](resources/other/release%20artworks/whats-new-v2.1.0-stable.webp)

<br>

- ### **v2.1.0-stable - ( 13<sup>th</sup> of May 2023 )**

  - ### 🎉 New Features and Features

    - Added a new design for the song cards on the Home page. Thanks to [**@Shapalapa** for the design inspiration](https://discord.com/channels/727373643935645727/1096107720358248571/1096107720358248571).
    - Now songs show their album name next to their artist names.
    - Added support for a new suggestion in the SongInfoPage that gets triggered when there are names of featured artists in the title of a song asking to add them to the song artists.
    - Added the 'go to album' option to the context menu of songs.
    - Added a feature to show the details of the song when right-clicking to get the context menu.
    - Linked the new Nora Official Discord server with the app.
    - Now, the SearchPage won't limit the no of results you can see to 5 on some components.
    - Added experimental support for the offset tag in synced lyrics.
    - Added a new hotkey to change the playback speed. Fixes [#168](https://github.com/Sandakan/Nora/issues/168).
    - Added support for a range of playback speeds instead of a predefined list.
    - Added experimental feature as the default sorting option for songs in an album according to their track number. Fixes [#169](https://github.com/Sandakan/Nora/issues/169).
    - Added a new context menu option for folders to show the relevant folder on the Windows Explorer.

  - ### 🔨 Fixes and Improvements

    - Fixed some bugs related to draggable songs in the queue. Fixes [#63](https://github.com/Sandakan/Nora/issues/63).
    - Fixed some bugs related to sorting content in the app. Fixes https://github.com/Sandakan/Nora/issues/156.
    - Fixed a bug where clicking `Play next` would add the song next to the next song.
    - Updated the context menu options by right-clicking the current song info container in the footer. Fixes [#160](https://github.com/Sandakan/Nora/issues/160) and [#158](https://github.com/Sandakan/Nora/issues/158).
    - Fixed a bug where deleting the current playing song wouldn't remove it from the current queue.
    - Fixed some bugs related to lyrics not being read from the audio source.
    - Fixed a bug where app UI goes out of bounds. Fixes [#157](https://github.com/Sandakan/Nora/issues/157).
    - Fixed a possible bug where media control buttons don't work as expected. Fixes [#166](https://github.com/Sandakan/Nora/issues/166).
    - Removed predictive search when searching for artists, albums, and genres in the SongTagsEditingPage.
    - Updated components to show information about the content when right-clicking a component.
    - Fixed some image scaling issues in ArtistInfoPage.
    - Fixed a bug where adding song metadata from the internet with new album data doesn't count the song artwork to the album artwork.
    - Improved the app's responsiveness to various screen sizes. Fixes [#128](https://github.com/Sandakan/Nora/issues/128).
    - Updated the file association icons to show the relevant file type.
    - Fixed a bug related to synced lyrics saved in audio files.
    - Fixed a bug where sometimes users can't see the artist name when in ArtistInfoPage due to contrast issues between light and dark modes.
    - Improved the artist detection algorithm of the SeparateArtistsSuggestion.
    - Improved app performance by loading only necessary components to display.
    - Fixed a bug where the context menu overflows out of the visible part of the app's window.
    - Fixed some bugs related to how SongCards display in the HomePage when different screen sizes.
    - Added a new line with "•••" as the first line of synced lyrics.
    - Fixed a bug where metrics in ListeningActivityBarGraph overflow out of its container.
    - Fixed a bug where the `Download Synced Lyrics` button in the metadata editing page keeps spinning even though fetching lyrics failed.
    - Improved the app version detection algorithm of the app.
    - Updated Musixmatch Settings to show a message about the token updating process.
    - Fixed a bug where library updates don't reflect on the AllSearchResultsPage.

  - ### 🐜 Known Issues and Bugs
    - Sometimes updating song artwork may need an app restart to show on the app #162.
    - The app may crash in mini-player mode when trying to use window snap feature #163.

<br>

![Nora v2.0.0-stable version artwork](resources/other/release%20artworks/whats-new-v2.0.0-stable.webp)

<br>

- ### **v2.0.0-stable - ( 23<sup>th</sup> of April 2023 )**

  - ### 🎉 New Features and Features

    - Added the 'Generate Palettes' button to the About section of the Settings to generate palettes on demand.
    - Added playback-only experimental support for audio formats like FLAC, AAC, and M4R. Fixes
      [#148](https://github.com/Sandakan/Nora/issues/148), [#142](https://github.com/Sandakan/Nora/issues/142), [#154](https://github.com/Sandakan/Nora/issues/154).
    - Added support for viewing storage usage by the app.
    - Added experimental support for an improved folder structure. Fixes #134.
    - Added experimental support for suggestions for duplicate artists and artists identified as single artists. Fixes
      [#140](https://github.com/Sandakan/Nora/issues/140).
    - Added a new context option for the currently playing song artwork to the currently playing song's album. Fixes
      https://github.com/Sandakan/Nora/issues/149.
    - Added a new banner to the SongTagsEditingPage when trying to edit song formats that are supported for playback only.
    - Added experimental support to generate a playlist cover automatically from the songs inside with the support to
      randomize the artworks as an additional feature. Fixes https://github.com/Sandakan/Nora/issues/145.
    - Added new options to configure the automatically generated playlist cover in the Preferences section of Settings.
    - Added experimental support for an Audio Equalizer to the app. Fixes [#151](https://github.com/Sandakan/Nora/issues/151).
    - Added a new prompt for the user to customize chosen folders before parsing them. Fixes [#134](https://github.com/Sandakan/Nora/issues/134).
    - Added a new feature to reduce animations when the system is on battery power.
    - Added a new feature to change the playback speed of the player.
    - Added a new button to the right side of the app's footer for advanced playback options.
    - Added a new smooth scrolling feature to pages that directs users to specific parts of the page.
    - Added a new title next to the artwork in the queue to show the queue type.
    - Add a new transition effect for some icons.
    - Added support for responsive song cards in the Home.
    - Added support to toggle between predictive search and normal search.
    - Added support for highlighting more than one lyrics line at a time. Fixes [#135](https://github.com/Sandakan/Nora/issues/135).
    - Added a new artwork filter for Deezer artist artworks to prevent showing artwork placeholders.
    - Added a new auto-scrolling feature for the Queue page to scroll to the currently playing song on song skip.
    - Added a new feature to show some info about the song to be played next in the currently playing song info container
      periodically.

  - ### 🔨 Fixes and Improvements

    - Reduced the parsing time of a newly created library by around 30%.
    - Fixed a bug where the app theme will change when changing the system's theme even though the user didn't select to
      use the system theme in the app.
    - Fixed a bug where the theme of the taskbar playback control buttons changed with the app theme instead of the system
      theme.
    - Fixed a bug where users can't go to the same page with different data. For example, the user can't go to another
      artist's info page while staying on another artist's info page.
    - Migrated the Music Folders section from Settings to the Music Folders page in the sidebar.
    - Fixed a bug where Sidebar becomes cluttered in smaller resolutions. Fixes
      [#136](https://github.com/Sandakan/Nora/issues/136).
    - Updated some texts in the SongTagsEditingPage.
    - Fixed a bug where users can save the same song tags again and again in the SongTagsEditingPage.
    - Improved directory handling by the app.
    - Reduced the brightness of background artwork.
    - Fixed a bug where error messages and stack traces aren't being added to the log file.
    - Fixed a bug where updating song id3 tags doesn't update album metadata.
    - Fixed a bug where the app doesn't check for updates right after the connection was established.
    - Fixed a bug where the focus state of a button persists even after the button is clicked.
    - Fixed a bug where SongTagsEditingPage allows checking for song online results even though the app isn't connected to
      the internet.
    - Fixed a bug where disabled buttons show a loading animation. Fixes [#130](https://github.com/Sandakan/Nora/issues/139).
    - Fixed a bug where clicking the recent search results and clicking another element to go to another page and come
      back doesn't persist the clicked recent search result in the search page.
    - Fixed a bug where the user can't update the artwork of a playlist after creating it.
    - Fixed a bug where images aren't being shown on the app after they were updated due to caching.
    - Fixed a bug where the app could go into an infinite error loop if there were any playback errors that the app
      couldn't handle.
    - Fixed a bug where removing a song from an album with only one song doesn't remove the album.
    - Fixed some bugs related to sorting folders.
    - Fixed flickering issues on some components when they were being updated.
    - Fixed a bug where images show the alt text when hovered.
    - Increased the font weight of the text in the sidebar.
    - Fixed a bug where artist images shown next to the currently playing song cover aren't positioned correctly.
    - Fixed a bug in Metadata Editing Page where the album cover is always the current song cover.
    - Fixed a bug where selecting 'Add Selected' or 'Add All' when choosing song metadata results from the internet
      doesn't update the artists, albums, and genres I the editing page. Fixes [#138](https://github.com/Sandakan/Nora/issues/138).
    - Improved accessibility in the Song Metadata Editor.
    - Improved transitions in prompt menus.
    - Fixed a bug where closing the prompt menu will flicker the menu.
    - Fixed a bug where clicking the Most Relevant Album doesn't open the relevant Album page.
    - Fixed a bug where artist names on the Song Info page aren't positioned properly.
    - Fixed some bugs related to customizing selected metadata prompt.
    - Fixed a bug where hovering over seek bars show an incorrect value.
    - Fixed a bug where the message 'No Synced Lyrics Found' persists after disabling the lyrics.
    - Added support for selecting multiple items by Shift + Click and select all by clicking Ctrl + A. Fixes [#143](https://github.com/Sandakan/Nora/issues/143).
    - Fixed a bug where the loading element in a button isn't positioned correctly.
    - Improved accessibility in SongTagsEditingPage.
    - Fixed a bug where the F5 shortcut to reload doesn't work for other programs when Nora is opened. Fixes [#155](https://github.com/Sandakan/Nora/issues/155).
    - Fixed a bug where resetting the app doesn't clear local storage data.
    - Reduced the space required to save listening data information by around 90%.
    - Fixed a bug where resetting the app doesn't remove the data related to blacklists.
    - Fixed a bug where Mini-player doesn't follow reduced motion.
    - Fixed a bug where adding a song to play next to the last song of the queue will not be played.
    - Fixed a bug where users can go to the same page repeatedly.
    - Fixed a bug where clicking a button to go to a specific page twice would direct users to Home.
    - Fixed a bug where folder modifications are not recognized in folder structures.
    - Updated some styles in prompts.
    - Updated some styles in the Release Notes prompt and open_source_licenses prompt.
    - Reordered buttons in the About section of Settings.
    - Fixed some security vulnerabilities in the app.
    - Fixed a bug where Img component try to fetch 404 requests repeatedly.
    - Fixed a bug where users can download lyrics in the lyrics editor even though the app is not connected to the internet.

  <!-- - ### 🐜 Known Issues and Bugs -->

<br>

![Nora v1.2.0-stable version artwork](resources/other/release%20artworks/whats-new-v1.2.0-stable.webp)

<br>

- ### **v1.2.0-stable - ( 9<sup>th</sup> of March 2023 )**

  - ### 🎉 New Features and Features

    - Added new AppStats section to the SettingsPage.
    - Added a new notification type that shows the progression of the song parsing process and song deletion process.
    - Added a 'See All' button for Recently Added Songs and Recently Played Songs sections in HomePage. Closes [#118](https://github.com/Sandakan/Nora/issues/118).
    - Added the functionality to change the increment interval of the scroll event when hovered over audio and volume seek bars. Closes [#133](https://github.com/Sandakan/Nora/issues/133).
    - Added a volume seek bar to the mini player. Closes [#126](https://github.com/Sandakan/Nora/issues/126).
    - Revamped some settings in the SettingsPage.
    - Added support for saving preferences in localStorage for easier access.
    - Added icon.icns to provide support for linux.
    - Added windowing to FoldersPage, AllSearchResultsPage and PlaylistsPage to improve performance.

  - ### 🔨 Fixes and Improvements
    - Fixed a bug where LyricsPage shows the button to 'show saved lyrics' when there aren't any in the audio file. Fixes [#119](https://github.com/Sandakan/Nora/issues/119).
    - Fixed a bug where user can't save lyrics for songs outside the library.
    - Fixed a bug where songs outside the library shows 'unknown title' without showing the audio file name when the title tag is empty. Fixes [#124](https://github.com/Sandakan/Nora/issues/124).
    - Fixed a bug where folders with higher privileges like 'System Volume Information' prevent adding them to the app.
    - Fixed a bug where app cannot be built in a Linux system.
    - Fixed a bug where pressing F5 reloads the app even though the window isn't focused. Fixes [#129](https://github.com/Sandakan/Nora/issues/129).
    - Fixed a bug where clicking the close button in Mini-player closes the app even though 'Close to system tray' is enabled. Fixes [#125](https://github.com/Sandakan/Nora/issues/125).
    - Fixed a bug where MusicFoldersPage shows 'unknown folder name' without showing the folder path when an external drive is added as a folder.
    - Fixed a bug where ReleaseNotesPrompt's important notes aren't positioned properly inside the container.
    - Fixed a bug where AlbumsPage shows more than required album columns.
    - Improved performance of the app when opening songs from the file explorer.
    - Improved support for packaging Linux distributions (Experimental).
    - Improved the functionality when restoring blacklisted songs.
    - Improved accessibility features of the app.
    - Updated the UI in GenreInfoPage and AlbumInfoPage.
    - Updated app dependencies.
  - ### 🐜 Known Issues and Bugs
    - Sometimes users can get unexpected search results when using Search.
    - App theme will be changed when you change your system's theme even though you didn't select to use system theme in the app.
    - If a song is added next to the last song of the queue, the last song won't be played.
    - Sometimes adding a song to play next would only add it to the queue instead of adding it next to the current song.

<br>

![Nora v1.1.0-stable version artwork](resources/other/release%20artworks/whats-new-v1.1.0-stable.webp)

<br>

- ### **v1.1.0-stable - ( 26<sup>th</sup> of February 2023 )**

  - ### 🎉 New Features and Features
    - Support for editing audio files outside the library.
    - Support for further customizations when downloading song metadata from the internet.
    - Support for folder blacklisting and improvements for song blacklisting.
    - Added an indicator to show whether an artist is liked or not.
    - Added new keyboard shortcuts to go to forward and backward pages and to change app theme.
    - New BlacklistFolderConfirmPrompt and improvements for BlacklistSongConfirmPrompt.
    - Support for audio seeking or changing the volume through mouse scrolling by hovering over the seek bar and the volume bar.
    - Support for caching song data played from outside the library to improve performance when playing them again in the same session.
  - ### 🔨 Fixes and Improvements
    - Improvements for error handling related to network requests.
    - Removed Backlisted Songs section in the Settings Page.
    - Fixed a bug where Mini Player show un-scrollable unsynchronized lyrics.
    - Fixed a bug where artworks without 1:1 aspect ratio breaks the alignment of how the songs are displayed.
    - Added a new sort option for SongsPage and FoldersPage to sort blacklisted and whitelisted folders and songs.
    - Fixed a bug where temp artworks aren't getting cleaned up after the app closes.
    - Fixed a bug where artists aren't being sorted properly.
    - Fixed some bugs where some pages not updating its contents according to data events.
    - Fixed a bug where removing a song doesn't trigger 'playlists' and 'genres' data events.
    - Fixed a bug where some artist sort options aren't working as expected.
    - Fixed a bug where toggling 'like song' in Song or SongCard doesn't get updated in the currentSongData and vice versa.
    - Fixed a bug where Artist not showing default artist cover when there is no artwork for an artist.
    - Fixed a bug where FoldersPage doesn't get updated when song gets deleted or added.
    - Fixed a bug where online lyrics is not being saved to the audio file.
    - Fixed a bug where some pages like HomePage, CurrentQueuePage not updating songs when a song gets blacklisted.
    - Reduced image file sizes by using them in webp format.
    - Removed change theme button on the title bar for production builds.
    - Updated Musixmatch Lyrics Disclaimer.
  - ### 🐜 Known Issues and Bugs
    - Sometimes users can get unexpected search results when using Search.
    - App theme will be changed when you change your system's theme even though you didn't select to use system theme in the app.
    - If a song is added next to the last song of the queue, the last song won't be played.
    - Sometimes adding a song to play next would only add it to the queue instead of adding it next to the current song.

<br>

![Nora v1.0.0-stable version artwork](resources/other/release%20artworks/whats-new-v1.0.0-stable.webp)

<br>

- ### **v1.0.0-stable - ( 17<sup>th</sup> of February 2023 )**

  - ### 🎉 New Features and Updates
    - Now LyricsPage will show the copyright info of the lyrics at the bottom of the page.
    - Metadata of Musixmatch for songs now include artworks from Spotify.
    - Auto-scrolling of synced lyrics can be toggled now in the LyricsPage.
    - Ability to sort songs relative to the released year.
    - Song component now displays the song released year.
    - Now Nora can read and write to audio files with synchronisedLyrics meta tag.
    - Added abort controller support for most resource intensive functions to stop them in case of an emergency.
    - Added a new feature to allow users to select whether the app window should hide to system tray or close on clicking the close button.
    - Added a new feature to allow users to determine whether the app should start as hidden during when on at startup is enabled.
    - Added an entry to the system tray with some controls of the app such as show/hide and exit.
    - Added the feature to disable Checkbox component.
    - Added a new button to refresh lyrics so that if incorrect lyrics is shown it will re-fetch the correct lyrics.
    - Added a new button to show offline lyrics when after user have requested for the online lyrics.
    - Added a new placeholder image for MusicFoldersPage when there are no any folders.
    - Added a new AppShortcutsPrompt that show app shortcuts.
    - Added a setting to change Musixmatch token.
    - Added support to get metadata for songs from iTunes.
    - Added the functionality to start selecting multiple items by holding shift key and selecting an item.
    - Added support for sorting on lot of pages including AlbumsPage, FoldersPage, AlbumsInfoPage etc.
    - Added new FoldersPage to side bar of the app.
    - Added new MusicFolderInfoPage for songs in folders.
    - Added a Clear All button for notification panel.
    - Added a Spotify artwork fetching script for song metadata.
    - Added new button to save online lyrics to song while watching it on LyricsPage.
    - Added a queue for parseSong to prevent songs from being parsed twice.
    - Added a new title bar for the LyricsPage that shows new buttons that provides features such as Save online lyrics etc.
    - Added Lyrics to Mini Player.
    - Added support for experimental for multiple search keywords in Search.
    - Ability to toggle artists as favorites.
    - Added a new default artwork for albums.
    - Refactored code into smaller modules for easier readability.
    - Improved search functionality
    - Added error boundaries to catch errors on app.
    - Ability to disable new update alerts for the current version.
    - Added a new feature where artists artworks can be showed on the audio-controls panel.
    - Now most relevant results in SearchPage will be more relevant to the search query.
    - New network connection indicator on the header.
    - Now users can fetch song metadata from internet and update their songs. (Experimental)
    - Support for Synced Lyrics.
    - Lyrics from Musixmatch (Implementation from Fashni's <a href ="https://github.com/fashni/MxLRC">MxLRC package</a>). (Experimental)
    - Now users can go back and forward when going through different pages. (Experimental)
    - Now users can select multiple songs, artists etc and do specific tasks with them. (Experimental)
    - New background artworks when viewing ArtistsPage, SongInfoPage etc.
    - Now users can add artworks to user-created playlists.
    - Support for recording listening patterns. (Experimental)
    - New metrics about listening patterns of a song in SongInfoPage. (Experimental)
    - Now users can clear search history results.
    - Now users can play songs in a specific genre directly from the GenreInfoPage.
  - ### 🔨 Fixes and Improvements
    - Improved musixmatch lyrics matching which helps to send correct lyrics for songs.
    - Reduced font size on context menu items.
    - Updated the UI of some components of the app.
    - Updated musixmatchSettingsPrompt with a link to how to generate a new user token.
    - Updated app dependencies, removed unnecessary dependencies and fixed some dependency vulnerabilities.
    - Updated the maximum dimensions that can be achieved by the Mini Player.
    - Updated AUDIO_FADE_INTERVAL and AUDIO_FADE_DURATION.
    - Resolved some path issues on Playlist component.
    - Improved app updates functionality.
    - Fixed a styling issue where material symbols show icon text instead of icon until it loads its resources.
    - Fixed a bug where resetting the app while parsing the library wouldn't stop the parsing process.
    - Fixed a bug where the app opens the ReleaseNotesPrompt even though there is no new update to the app.
    - Fixed a bug where the app won't start with the previously played song position after an app restart.
    - Fixed a bug where resetting the app doesn't remove the listening_data.json file.
    - Fixed a bug where shuffle state is not saved when the app is closing.
    - Fixed a bug where toggling mute state doesn't work when using the keyboard shortcuts.
    - Fixed a bug where deleting a currently playing song puts the app in an infinite loop of errors.
    - Fixed a bug where HomePage isn't getting updated when a recently played song got deleted.
    - Fixed a bug where lyrics are shown with a small delay.
    - Fixed a bug where song controls show incorrect metrics such as showing that the song is paused even though the song is playing.
    - Fixed a bug where lyrics are fetched without obeying provided filters.
    - Fixed a bug where song listening data is not getting recorded.
    - Fixed a bug where resources are not being loaded due to resource urls having query parameters.
    - Fixed a bug where app shows the error prompt when a user deletes a song.
    - Fixed a styling issue where 'drop song here' message prompt not positioned correctly.
    - Fixed components re-rendering even though they didn't get any new data.
    - Fixed a bug where some keyboard shortcuts not working when in MiniPlayer.
    - Fixed a bug where notifications doesn't get removed when reduced motion is enabled.
    - Fixed a bug where app is looking for search results with empty strings or strings with only spaces.
    - Fixed a bug where ListeningActivityBarGraph not showing listening data metrics.
    - Fixed some styling issues appeared on SongArtist component.
    - Fixed a bug where mediaSession controls are not working as intended.
    - Fixed some error boundary fallback ui styles.
    - Fixed some styling issues in Song and SongsPage.
    - Fixed a bug where song component in some pages not showing song year.
    - Fixed mini player lyrics not positioning to the center.
    - Fixed a bug where ReleaseNotesPrompt showing that the app is in latest version even though there is no network connection.
    - Fixed an overflowing issue on some pages.
    - Fixed a bug where updating an artwork on a song wouldn't show it on the app instantly due to image caching.
    - Fixed a bug where lyrics not showing instrumental gaps of a song in lyrics.
    - Fixed a bug where lyrics are not being identified as synced.
    - Fixed a bug on CurrentQueuePage where current playing song is not positioned correctly.
    - Fixed some text styling issues on PlaylistInfoPage.
    - Fixed a bug on ConfirmDeletePlaylist prompt not positioning elements correctly.
    - Fixed a bug where blacklisted song showing an incorrect index.
    - Fixed a bug on render process where, memory leak occurs due to subscribing for max no. of preload's event listeners.
    - Fixed a bug where clicking on Artist not directing to ArtistsInfoPage.
    - Fixed a bug where clicking on Genre not directing to GenresInfoPage.
    - Fixed a bug on PromptMenu where it doesn't wait for the fade out animation to end to clear content on the PromptMenu.
    - Fixed a bug on MostRelevantResult where clicking on it doesn't direct to the specified info page.
    - Fixed a bug on PromptMenu where prompt menus opened in full-screen or in maximized windows will make its content appear blurred.
    - Fixed Artist component showing wrong default artwork.
    - Fixed some contrast issues on GenreInfoPage.
    - Fixed a bug where Prompts are not positioning Button components correctly.
    - Fixed a styling issue on Playlist component where when hovered, shows an overflowed gradient.
    - Fixed SongArtwork component on SongTagsEditingPage not positioning its buttons correctly.
    - Fixed NetworkIndicator not updating its state as intended.
    - Fixed a bug in Playlist where clicking on it wouldn't direct to the PlaylistInfoPage.
  - ### 🐜 Known Issues and Bugs
    - Sometimes users can get unexpected search results when using Search.
    - App theme will be changed when you change your system's theme even though you didn't select to use system theme in the app.
    - If a song is added next to the last song of the queue, the last song won't be played.
    - Sometimes adding a song to play next would only add it to the queue instead of adding it next to the current song.

<br>

![Nora v0.8.0-alpha version artwork](resources/other/release%20artworks/whats-new-v0.8.0-alpha.webp)

<br>

- ### **v0.8.0-alpha - ( 19<sup>th</sup> of August 2022 )**

  - ### 🎉 New Features and Updates
    - Now double-clicking on a supported song in the File Explorer would play it on the app. Be sure if you made Nora the default audio player for the respective audio file. (Experimental).
    - Now users can drag and drop a supported audio file to play it on the player. (Experimental)
    - Now users can edit song id3 tags. (Experimental)
    - Added windowing technique to improve app performance. Before this update, app would take considerable amount of time to render a huge song library but now it renders almost instantly. (Experimental)
    - App theme switching according the system theme.
    - Now user can select whether the song duration or the song remaining duration should be displayed.
    - Updated taskbar thumbnail buttons to support the system theme.
    - Now the app will check for updates every 15 minutes and inform the user to update.
  - ### 🔨 Fixes and Improvements
    - Data update events will be queued from this update to improve app performace. If more than 3 events occur around one second interval they will be queued so that all the events will be sent at the same time.
    - Updated the app installer and reduced file size of the installer by 13%.
    - Updated open_source_licenses.
    - Replaced trash package for the electron built in shell.trashItem.
    - Updated data update events dispatch process to improve performance.
    - Removed some unnecessary resources.
    - Cleaned up unnecessary styles.
    - Fixed a bug where editing song tags could remove the artwork of a song.
    - Fixed a bug where using search features on songs metadata editing page updates the search history.
    - Fixed a bug where adding a previously parsed folder would parse the same folder.
    - Removed some unnecessary npm packages.
  - ### 🐜 Known Issues and Bugs
    - Parsing a big music library could sometimes make the app unresponsive. Currently, the only solution is to wait some time until the parsing process finishes and the app regains responsiveness.
    - App theme will be changed when you change your system's theme even though you didn't select to use system theme in the app.
    - Lyrics on some songs aren't being read by the app. Still you will be able to see lyrics from the internet.
    - If a song is added next to the last song of the queue, the last song won't be played.
    - Trying to play corrupted songs will make the app player unusable. Workaround is to play the next song and restart the renderer using F5 button.
    - Sometimes adding a song to play next would only add it to the queue instead of adding it next to the current song.
    - There is still a small amount of unwanted cpu consumption due to over-rendering of components.

<br>

![Nora v0.7.0-alpha version artwork](resources/other/release%20artworks/whats-new-v0.7.0-alpha.webp)

<br>

- ### **v0.7.0-alpha - ( 27<sup>th</sup> of July 2022 )**

  - ### 🎉 New Features and Updates
    - Support for .ogg and .wav file extensions as songs. Now you can play them in the player. (Experimental).
    - Added a Release Notes page to display information about the updates of the app. It will inform the user if he/she uses an outdated app.
    - Rewrote the whole UI styling with TailwindCSS.
    - Added the option to view licenses of the open source packages used in the app.
    - Window positions and diamensions will be saved when you move them around.
    - SearchPage will now show recent search queries of the user.
    - SearchPage will now suggest queries if the user enters a query that doesn't have results.
    - SearchPage will now show genres in the search results.
    - NotificationPanel now supports buttons to provide additional functionality.
    - Added all-time most listened, all-time least listened, monthly most listened, monthly least listened and artist name to songs sort options.
    - Added few app-specific error codes to identify errors in the app.
    - Added Material Symbols.
    - Now the app is responsive to network fluctuations.
    - Added song playback controls to the taskbar thumbnail toolbar of the app.
    - Ability to make the mini player always on top.
    - Now you can add new playlists, add new songs to them, remove songs inside them or remove the whole playlist.
    - Ability to clear the song history of the app.
    - Sorting options now you select will be saved in the app to provide easier access to what you always go for.
    - Added a new volume fade in and fade out transition for songs when toggling through pause and play.
    - Queue shuffling using Fisher Yates algorithm.
    - Now the sidebar will be folded if you reduce the size of the app beyond a specific boundary.
    - Added a Dropdown component and improved its UI, UX and functionality.
    - Added new MainContainer and SecondaryContainer components.
    - Added a prompt to verify before directing user to links from the app.
    - Added a new prompt to confirm sensitive actions of the app.
    - Now most of the pages will update themselves if they detect whether their data are updated.
    - Now you can sort genres.
    - Now you can see what songs you loved most and listened most and which artists you love most on the HomePage.
    - Added a new prompt to confirm before deleting a playlist.
  - ### 🔨 Fixes and Improvements
    - Now recently played songs will be fetched using the History playlist.
    - Removed some unused font files.
    - Fixed some bugs related to data caching inside the app.
    - Improved data updates detection.
    - Fixed some bugs related to parsing songs.
    - Fixed some bugs related to restoring a blacklisted song and sending a song to the blacklist.
    - Fixed a bug where parsing a song after a read error would parse the song two times.
    - Fixed a bug where deleting a song from the library or deleting from the system wouldn't update the library.
    - Fixed some bugs related to resetting the app.
    - Improved the song parsing process.
    - Added a Ref to store all the states in App.
    - Fixed some bugs related to the player.
    - Improved Button component UI, UX and functionality.
    - Improved Checkbox component UI, UX and functionality.
    - Improved ErrorPrompt component UI, UX and functionality.
    - Improved how notifications appear in the app.
    - Improved how the app searches content.
    - Updated the song tags editing page. (Experimental)
  - ### 🐜 Known Issues and Bugs
    - Editing song tags could remove the artwork of a song.
    - Sometimes adding a song to play next would only add it to the queue instead of adding it next to the current song.
    - There is still a small amount of unwanted cpu consumption due to over-rendering of components.

<br>

- ### **v0.6.0-alpha - ( 24<sup>th</sup> of June 2022 )**

  - ### 🎉 New Features and Features
    - Added the support to edit song id3 tags. Right click on a song and select Edit song tags to go to the SongID3TagEditorPage. Currently changes to those data wouldn't be updated on the app. (Experimental)
    - Added the basement to provide support for m3u files to import and export playlists.
    - Artist artworks will be updated when the user listens to their songs.
    - Added keyboard shortcuts for the basic functions of the app.
    - Added support for reduced motion. You can enable reduced motion in Settings > Accessibility.
    - Added Genres to the app. You can view details related to the genre in GenreInfoPage by clicking on a genre.
    - Now the app window will blur the title bar when the app loses focus.
    - Now enabling song indexing from Settings > Accessibility will number the songs.
    - In CurrentQueuePage, app will direct you to the current playing song by scrolling it to the center of the window.
    - Added support for repeat and repeat-1 to keep listening to your loved songs all day long.
    - Added a loading animation for the notification bar.
    - Now users can restore their blacklisted songs from the Settings Page.
    - Now the app can be configured to start on system startup.
    - Added a button for the users to open the Devtools or the log file in Settings > About.
    - Frequently used data such as songs, artists, playlists etc will be cached inside the app at runtime.
    - Song lyrics will also be cached in the app until the relevant song finishes.
    - Now some parts of the UI such as HomePage will be updated on data modifications. These modifications include new songs, recently played songs etc.
    - Updated some functions to support pagination and sorting features to remove some burden off the renderer.
  - ### 🔨 Fixes and Improvements
    - Fixed a security vulnerability related to package 'sharp'.
    - Removed unnecessary css styles and optimized the styling of the app.
    - Fixed a possibility of duplicating songs by adding the same folder again.
    - Fixed a bug related to not deleting app data after an app reset.
    - Fixed a bug related to over-rendering of react components when a song is playing resulting higher consumption of cpu and memory. This also fixes the jitter when scrolling.
    - Removed unnecessary context menu options from the HomePage.
    - Fixed a bug related to parsing songs that are still being written to the system.
    - Fixed a bug where removing a song from the system will identify as a blacklisted song by the app.
    - Now the context menu will appear relevant to the available width and height of the window.
    - Fixed an error where some functions are coded asynchronous but are actually synchronous.
    - Updated the logger to write logs more clearly on a txt file. Now it shows more relevant information in the logs.
    - Some functions now can send multiple results. This reduces number of requests to the api to fetch data.
    - Fixed a bug where newly added songs won't be added to the library.
  - ### 🐜 Known Issues and Bugs
    - There is still a small amount of unwanted cpu consumption due to over-rendering of components.
    - Blacklisting or removing a song from the library isn't working as intended.

<br/>

- ### **v0.5.0-alpha - ( 25<sup>th</sup> of May 2022 )**

  - ### 🎉New Features and Features

    - Now queues and some other features save their states between sessions (Experimental).
    - Now Currently Playing Queue shows information about the current queue including playlist name, artwork etc (Experimental).
    - Updated settings page to provide information about app version, github repository etc (Experimental).
    - Now users can remove songs from the library, move to the recycle bin or delete permanently from the system. Removed songs from the library will be blacklisted. (Experimental)
    - Now logger stores some information about the current system. This includes cpu model, architechture, platform, os and system memory.
    - A new event added to detect app quits to provide methods to persist session data.
    - Now playlists, albums, and artists' songs can be played by adding it to the queue.
    - Now albums and artists support context menu options.
    - Now online pictures of the artists will be shown thoughout the app after watching their profile.
    - Added a song blacklist function. Now songs removed from the library will be blacklisted and can be restored from the settings page. (Experimental)
    - Added new images that will be displayed in situations like when the songs are loading and when there's no songs etc.
    - Now searchPage shows results about playlists.
    - Now some information about artist data and album data is saved with song data.
    - Now you can view all the search results related to your query by clicking 'See All' buttons of specific categories in searchPage.
    - Created new components Button and Checkbox.
    - Added new buttons in ArtistInfoPage, AlbumInfoPage, PlaylistInfoPage, CurrentQueuePage to provide functions like play all, shuffle and play, and add to queue etc.

  - ### 🔨 Fixes and Improvements

    - Fixed a bug related to npm packages.
    - Updated parseSong to differentiate between currently added songs and new songs. Previously this problem will duplicate the data related to the song in the library.
    - Fixed some music playback issues.
    - Fixed some issues related to queuing songs.
    - Updated and improved the styles of the app.
    - Now number of listens of a song will be updated if the song is listened repeatedly by using repeat function.
    - Updated artist online information apis.
    - Applied useTransition hook to improve user input responsiveness in the app when a song is playing.

  - ### 🐜 Known Issues and Bugs
    - Sometimes newly added songs won't be added to the library. The workaround is to reset the app and linking the relevant folder again.
    - Shuffle and Repeat states currently is not presisting states between sessions.
    - Resync songs context menu option isn't working as intended.
    - Scrolling in a page when is a song is playing reduces smoothness of the app due excessive rendering.

<br/>

- ### **v0.5.0-alpha - ( 25<sup>th</sup> of May 2022 )**

  - Migrated the song player to the root of the app to provide support for features such as mini-player (Experimental).
  - Updated readme file.
  - Improved the codebase.

<br/>

- ### **v0.4.0-alpha - ( 14<sup>th</sup> of May 2022 )**

  - Added song queuing. Now users can queue songs.
  - Started using useContext React api to reduce prop drilling.
  - Started using useReducer React api to avoid rendering issues occurred when using useState.
  - Improved sorting of songs, artists, and albums. Now they work as intended.
  - Updated launch.json files in vscode to support debugging both main and renderer processes.
  - Improved user interface styling.
  - Adding a new song will now inform the user about the new song adding process.
  - Added a context menu option in the homepage to reset the app.
  - Now the app will inform the user if it couldn't find the lyrics.
  - Added a new event that fires when songs, artists, albums, playlists, or userData gets added.
  - Fixed some bugs related to paths in parseSong.ts
  - Removed unnecessary comments.
  - Added a current queue page to view the current queue of songs.
  - Renamed DialogMenu menu to notification panel.
  - Removed unnecessary svg icons.
  - Improved detection of songs whose got added when the app is running and not running.
  - Added a function to remove a song from the library.
  - Added a function to remove a linked media folder.
  - Added an experimental mini player.
  - Added the feature to remove playlists.
  - Added a function to send renderer process errors and logs to the main process and save them.
  - Added a function that shows main process messages in the renderer process.
  - Fixed some bugs related to parsing songs.
  - Added a function that provides navigation previous pages. Now users can click backward button in the title bar to go to their previously visited page.
  - Added an ErrorPrompt to inform users about possible errors.
  - Now artists, albums and playlists show how much hours of songs they have.
  - Added the settings page to with options to update theme, music folders, and default page.
  - Now songsPage shows how many songs in the library.

<br/>

- ### **v0.3.1-alpha - ( 07<sup>th</sup> of May 2022 )**

  - Migration from FontAwesome icons to Google Material Icons.
  - Improved styles to support Google material icons functionality.
  - Offloaded creation and optimization of cover arts to Sharp package.
  - Added nanoid to create unique ids for songs, artists and albums.
  - Added node-id3 to provide support for future id3 tag editing.
  - Added support for icons in the context menu.
  - Added a home page context menu item to resync songs.
  - Improved sorting of songs, artists and albums.

<br/>

- ### **v0.3.0-alpha - ( 02<sup>nd</sup> of May 2022 )**

  - Added function to sort songs, artists and albums.
  - Added a PlaylistsInfoPage to display information related to playlists.
  - Removed unnecessary react props to improve performance.
  - Fixed some typescript type errors.

<br/>

- ### **v0.2.0-alpha - ( 29<sup>th</sup> of April 2022 )**

  - Added new styles for AlbumInfoPage, ArtistInfoPage, and updated some styles on other componenets.
  - Now ArtistInfoPage shows information of the artists from Deezer and Last.fm apis.
  - Fixed some bugs when parsing songs.
  - Now songData, albumData and artistData are linked together in the database for easier access.
  - Updated preload script to support typescript types.
  - Improved React support of the app.

<br/>

- ### **v0.1.1-alpha - ( 01<sup>st</sup> of April 2022 )**

  - Added a context menu option for songs to open them in the File Explorer.

<br/>

- ### **v0.1.0-alpha - ( 23<sup>rd</sup> of March 2022 )**

  - Fixed bugs related to instant identification of newly added songs.
  - Added a feature to monitor song listening patterns of the user for better shuffling.
  - Fixed some bugs in the search feature.
  - Partial playlists support for the app. (Currently you can only add playlists.)
  - Favorites playlist and History playlist added to the playlist pane.
  - Added a Dialog menu to display messages.
  - Added a prompt menu.
  - Fixed context menu bugs.
  - Context menu now supports individual element context items.
  - Added an experimental Song Info page.
  - Fixed some styling issues in the UI.

<br/>

- ### **v0.0.1-alpha - ( 11<sup>th</sup> of March 2022 )**
  - Initial alpha release.
  - Added a lyrics pane which shows lyrics according to the current song.
  - Instant identification of newly added songs.
