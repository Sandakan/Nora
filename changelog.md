# Change Log

- ### v0.4.0 - ( 14<sup>th</sup> of May 2022 )
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

<br>

- ### v0.3.1 - ( 07<sup>th</sup> of May 2022 )
  - Migration from FontAwesome icons to Google Material Icons.
  - Improved styles to support Google material icons functionality.
  - Offloaded creation and optimization of cover arts to Sharp package.
  - Added nanoid to create unique ids for songs, artists and albums.
  - Added node-id3 to provide support for future id3 tag editing.
  - Added support for icons in the context menu.
  - Added a home page context menu item to resync songs.
  - Improved sorting of songs, artists and albums.

<br>

- ### v0.3.0 - ( 02<sup>nd</sup> of May 2022 )
  - Added function to sort songs, artists and albums.
  - Added a PlaylistsInfoPage to display information related to playlists.
  - Removed unnecessary react props to improve performance.
  - Fixed some typescript type errors.

<br>

- ### v0.2.0 - ( 29<sup>th</sup> of April 2022 )
  - Added new styles for AlbumInfoPage, ArtistInfoPage, and updated some styles on other componenets.
  - Now ArtistInfoPage shows information of the artists from Deezer and Last.fm apis.
  - Fixed some bugs when parsing songs.
  - Now songData, albumData and artistData are linked together in the database for easier access.
  - Updated preload script to support typescript types.
  - Improved React support of the app.

<br>

- ### v0.1.1 - ( 01<sup>st</sup> of April 2022 )
  - Added a context menu option for songs to open them in the File Explorer.

<br>

- ### v0.1.0 - ( 23<sup>rd</sup> of March 2022 )
  - Fixed bugs related to instant identification of newly added songs.
  - Added a feature to monitor song listening patterns of the user for better shuffling
  - Fixed some bugs in the search feature.
  - Partial playlists support for the app. (Currently you can only add playlists.)
  - Favorites playlist and History playlist added to the playlist pane.
  - Added a Dialog menu to display messages.
  - Added a prompt menu.
  - Fixed context menu bugs.
  - Context menu now supports individual element context items.
  - Added an experimental Song Info page.
  - Fixed some styling issues in the UI.

<br>

- ### v0.0.1 - ( 11<sup>th</sup> of March 2022 )

  - Initial alpha release.
  - Added a lyrics pane which shows lyrics according to the current song.
  - Instant identification of newly added songs.
