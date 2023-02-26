<h1 align="center"> Change Log</h1>

<h3>The latest version (v1.1.0-stable) contains a lot of new features and improvements. As always expect some bugs in the app.</h3>

<br>

<img src="assets\other\release artworks\whats-new-v1.1.0-stable.webp">

<br>
<ul>
  <li class="version">  <h3> v1.1.0-stable - ( 26<sup>th</sup> of February 2023 )</h3>
    <ul>
      <li> <h4>🎉 New Features and Features</h4>
      <ul>
        <li>Support for editing audio files outside the library.</li>
        <li>Support for further customizations when downloading song metadata from the internet.</li>
        <li>Support for folder blacklisting and improvements for song blacklisting.</li>
        <li>Added an indicator to show whether an artist is liked or not.</li>
        <li>Added new keyboard shortcuts to go to forward and backward pages and to change app theme.</li>
        <li>New BlacklistFolderConfirmPrompt and improvements for BlacklistSongConfirmPrompt.</li>
        <li>Support for audio seeking or changing the volume through mouse scrolling by hovering over the seek bar and the volume bar.</li>
        <li>Support for caching song data played from outside the library to improve performance when playing them again in the same session.</li>
      </ul>
      </li>
      <li> <h4>🔨 Fixes and Improvements</h3>
        <ul>
          <li>Improvements for error handling related to network requests.</li>
          <li>Removed Backlisted Songs section in the Settings Page.</li>
          <li>Fixed a bug where Mini Player show un-scrollable unsynchronized lyrics.</li>
          <li>Fixed a bug where artworks without 1:1 aspect ratio breaks the alignment of how the songs are displayed.</li>
          <li>Added a new sort option for SongsPage and FoldersPage to sort blacklisted and whitelisted folders and songs.</li>
          <li>Fixed a bug where  temp artworks aren't getting cleaned up after the app closes.</li>
          <li>Fixed a bug where artists aren't being sorted properly.</li>
          <li>Fixed some bugs where some pages not updating its contents according to data events.</li>
          <li>Fixed a bug where removing a song doesn't trigger 'playlists' and 'genres' data events.</li>
          <li>Fixed a bug where some artist sort options aren't working as expected.</li>
          <li>Fixed a bug where toggling 'like song' in Song or SongCard doesn't get updated in the currentSongData and vice versa.</li>
          <li>Fixed a bug where Artist not showing default artist cover when there is no artwork for an artist.</li>
          <li>Fixed a bug where FoldersPage doesn't get updated when song gets deleted or added.</li>
          <li>Fixed a bug where online lyrics is not being saved to the audio file.</li>
          <li>Fixed a bug where some pages like HomePage, CurrentQueuePage not updating songs when a song gets blacklisted.</li>
          <li>Reduced image file sizes by using them in webp format.</li>
          <li>Removed change theme button on the title bar for production builds.</li>
          <li>Updated Musixmatch Lyrics Disclaimer.</li>
        </ul>
      </li>
      <li> <h4>🐜 Known Issues and Bugs</h4>
        <ul>
          <li>Sometimes users can get unexpected search results when using Search.</li>
          <li>App theme will be changed when you change your system's theme even though you didn't select to use system theme in the app.</li>
          <li>If a song is added next to the last song of the queue, the last song won't be played.</li>
          <li>Sometimes adding a song to play next would only add it to the queue instead of adding it next to the current song.</li>
        </ul>
      </li>
    </ul>
  </li>

  <br>

  <li class="version"> <h3> v1.0.0-stable - ( 17<sup>th</sup> of February 2023 )</h3>
    <ul>
      <li><h4>🎉 New Features and Updates</h4>
      <ul>
        <li> Now LyricsPage will show the copyright info of the lyrics at the bottom of the page.</li>
        <li> Metadata of Musixmatch for songs now include artworks from Spotify.</li>
        <li> Auto-scrolling of synced lyrics can be toggled now in the LyricsPage.</li>
        <li> Ability to sort songs relative to the released year.</li>
        <li> Song component now displays the song released year.</li>
        <li> Now Nora can read and write to audio files with synchronisedLyrics meta tag.</li>
        <li> Added abort controller support for most resource intensive functions to stop them in case of an emergency.</li>
        <li> Added a new feature to allow users to select whether the app window should hide to system tray or close on clicking the close button.</li>
        <li> Added a new feature to allow users to determine whether the app should start as hidden during when on at startup is enabled.</li>
        <li> Added an entry to the system tray with some controls of the app such as show/hide and exit.</li>
        <li> Added the feature to disable Checkbox component.</li>
        <li> Added a new button to refresh lyrics so that if incorrect lyrics is shown it will re-fetch the correct lyrics.</li>
        <li> Added a new button to show offline lyrics when after user have requested for the online lyrics.</li>
        <li> Added a new placeholder image for MusicFoldersPage when there are no any folders.</li>
        <li> Added a new AppShortcutsPrompt that show app shortcuts.</li>
        <li> Added a setting to change Musixmatch token.</li>
        <li> Added support to get metadata for songs from iTunes.</li>
        <li> Added the functionality to start selecting multiple items by holding shift key and selecting an item.</li>
        <li> Added support for sorting on lot of pages including AlbumsPage, FoldersPage, AlbumsInfoPage etc.</li>
        <li> Added new FoldersPage to side bar of the app.</li>
        <li> Added new MusicFolderInfoPage for songs in folders.</li>
        <li> Added a Clear All button for notification panel.</li>
        <li> Added a Spotify artwork fetching script for song metadata.</li>
        <li> Added new button to save online lyrics to song while watching it on LyricsPage.</li>
        <li> Added a queue for parseSong to prevent songs from being parsed twice.</li>
        <li> Added a new title bar for the LyricsPage that shows new buttons that provides features such as Save online lyrics etc.</li>
        <li> Added Lyrics to Mini Player.</li>
        <li> Added support for experimental for multiple search keywords in Search.</li>
        <li> Ability to toggle artists as favorites.</li>
        <li> Added a new default artwork for albums.</li>
        <li> Refactored code into smaller modules for easier readability.</li>
        <li> Improved search functionality</li>
        <li> Added error boundaries to catch errors on app.</li>
        <li> Ability to disable new update alerts for the current version.</li>
        <li> Added a new feature where artists artworks can be showed on the audio-controls panel.</li>
        <li> Now most relevant results in SearchPage will be more relevant to the search query.</li>
        <li> New network connection indicator on the header.</li>
        <li> Now users can fetch song metadata from internet and update their songs. (Experimental)</li>
        <li> Support for Synced Lyrics.</li>
        <li> Lyrics from Musixmatch (Implementation from Fashni's <a href ="https://github.com/fashni/MxLRC">MxLRC package</a>). (Experimental)</li>
        <li> Now users can go back and forward when going through different pages. (Experimental)</li>
        <li> Now users can select multiple songs, artists etc and do specific tasks with them. (Experimental)</li>
        <li> New background artworks when viewing ArtistsPage, SongInfoPage etc.</li>
        <li> Now users can add artworks to user-created playlists.</li>
        <li> Support for recording listening patterns. (Experimental)</li>
        <li> New metrics about listening patterns of a song in SongInfoPage. (Experimental)</li>
        <li> Now users can clear search history results.</li>
        <li> Now users can play songs in a specific genre directly from the GenreInfoPage.</li>
      </ul>
      </li>
      <li><h4>🔨 Fixes and Improvements</h4>
        <ul>
          <li>Improved musixmatch lyrics matching which helps to send correct lyrics for songs.</li>
          <li>Reduced font size on context menu items.</li>
          <li>Updated the UI of some components of the app.</li>
          <li>Updated musixmatchSettingsPrompt with a link to how to generate a new user token.</li>
          <li>Updated app dependencies, removed unnecessary dependencies and fixed some dependency vulnerabilities.</li>
          <li>Updated the maximum dimensions that can be achieved by the Mini Player.</li>
          <li>Updated AUDIO_FADE_INTERVAL and AUDIO_FADE_DURATION.</li>
          <li>Resolved some path issues on Playlist component.</li>
          <li>Improved app updates functionality.</li>
          <li>Fixed a styling issue where material symbols show icon text instead of icon until it loads its resources.</li>
          <li>Fixed a bug where resetting the app while parsing the library wouldn't stop the parsing process.</li>
          <li>Fixed a bug where the app opens the ReleaseNotesPrompt even though there is no new update to the app.</li>
          <li>Fixed a bug where the app won't start with the previously played song position after an app restart.</li>
          <li>Fixed a bug where resetting the app doesn't remove the listening_data.json file.</li>
          <li>Fixed a bug where shuffle state is not saved when the app is closing.</li>
          <li>Fixed a bug where toggling mute state doesn't work when using the keyboard shortcuts.</li>
          <li>Fixed a bug where deleting a currently playing song puts the app in an infinite loop of errors.</li>
          <li>Fixed a bug where HomePage isn't getting updated when a recently played song got deleted.</li>
          <li>Fixed a bug where lyrics are shown with a small delay.</li>
          <li>Fixed a bug where song controls show incorrect metrics such as showing that the song is paused even though the song is playing.</li>
          <li>Fixed a bug where lyrics are fetched without obeying provided filters.</li>
          <li>Fixed a bug where song listening data is not getting recorded.</li>
          <li>Fixed a bug where resources are not being loaded due to resource urls having query parameters.</li>
          <li>Fixed a bug where app shows the error prompt when a user deletes a song.</li>
          <li>Fixed a styling issue where 'drop song here' message prompt not positioned correctly.</li>
          <li>Fixed components re-rendering even though they didn't get any new data.</li>
          <li>Fixed a bug where some keyboard shortcuts not working when in MiniPlayer.</li>
          <li>Fixed a bug where notifications doesn't get removed when reduced motion is enabled.</li>
          <li>Fixed a bug where app is looking for search results with empty strings or strings with only spaces.</li>
          <li>Fixed a bug where ListeningActivityBarGraph not showing listening data metrics.</li>
          <li>Fixed some styling issues appeared on SongArtist component.</li>
          <li>Fixed a bug where mediaSession controls are not working as intended.</li>
          <li>Fixed some error boundary fallback ui styles.</li>
          <li>Fixed some styling issues in Song and SongsPage.</li>
          <li>Fixed a bug where song component in some pages not showing song year.</li>
          <li>Fixed mini player lyrics not positioning to the center.</li>
          <li>Fixed a bug where ReleaseNotesPrompt showing that the app is in latest version even though there is no network connection.</li>
          <li>Fixed an overflowing issue on some pages.</li>
          <li>Fixed a bug where updating an artwork on a song wouldn't show it on the app instantly due to image caching.</li>
          <li>Fixed a bug where lyrics not showing instrumental gaps of a song in lyrics.</li>
          <li>Fixed a bug where lyrics are not being identified as synced.</li>
          <li>Fixed a bug on CurrentQueuePage where current playing song is not positioned correctly.</li>
          <li>Fixed some text styling issues on PlaylistInfoPage.</li>
          <li>Fixed a bug on ConfirmDeletePlaylist prompt not positioning elements correctly.</li>
          <li>Fixed a bug where blacklisted song showing an incorrect index.</li>
          <li>Fixed a bug on render process where, memory leak occurs due to subscribing for max no. of preload's event listeners.</li>
          <li>Fixed a bug where clicking on Artist not directing to ArtistsInfoPage.</li>
          <li>Fixed a bug where clicking on Genre not directing to GenresInfoPage.</li>
          <li>Fixed a bug on PromptMenu where it doesn't wait for the fade out animation to end to clear content on the PromptMenu.</li>
          <li>Fixed a bug on MostRelevantResult where clicking on it doesn't direct to the specified info page.</li>
          <li>Fixed a bug on PromptMenu where prompt menus opened in full-screen or in maximized windows will make its content appear blurred.</li>
          <li>Fixed Artist component showing wrong default artwork.</li>
          <li>Fixed some contrast issues on GenreInfoPage.</li>
          <li>Fixed a bug where Prompts are not positioning Button components correctly.</li>
          <li>Fixed a styling issue on Playlist component where when hovered, shows an overflowed gradient.</li>
          <li>Fixed SongArtwork component on SongTagsEditingPage not positioning its buttons correctly.</li>
          <li>Fixed NetworkIndicator not updating its state as intended.</li>
          <li>Fixed a bug in Playlist where clicking on it wouldn't direct to the PlaylistInfoPage.</li>
        </ul>
      </li>
      <li><h4>🐜 Known Issues and Bugs</h4>
        <ul>
          <li>Sometimes users can get unexpected search results when using Search.</li>
          <li>App theme will be changed when you change your system's theme even though you didn't select to use system theme in the app.</li>
          <li>If a song is added next to the last song of the queue, the last song won't be played.</li>
          <li>Sometimes adding a song to play next would only add it to the queue instead of adding it next to the current song.</li>
        </ul>
      </li>
    </ul>

  </li>

  <br/>

  <li class="version"> <h3> v0.8.0-alpha - ( 19<sup>th</sup> of August 2022 )</h3>
    <ul>
      <li><h4>🎉 New Features and Updates</h4>
      <ul>
        <li>Now double-clicking on a supported song in the File Explorer would play it on the app. Be sure if you made Nora the default audio player for the respective audio file. (Experimental)</li>
        <li>Now users can drag and drop a supported audio file to play it on the player. (Experimental)</li>
        <li>Now users can edit song id3 tags. (Experimental)</li>
        <li>Added windowing technique to improve app performance. Before this update, app would take considerable amount of time to render a huge song library but now it renders almost instantly. (Experimental)</li>
        <li>App theme switching according the system theme.</li>
        <li>Now user can select whether the song duration or the song remaining duration should be displayed.</li>
        <li>Updated taskbar thumbnail buttons to support the system theme.</li>
        <li>Now the app will check for updates every 15 minutes and inform the user to update.</li>
      </ul>
      </li>
      <li> <h4>🔨 Fixes and Improvements</h4>
        <ul>
        <li>Data update events will be queued from this update to improve app performace. If more than 3 events occur around one second interval they will be queued so that all the events will be sent at the same time.</li>
        <li>Updated the app installer and reduced file size of the installer by 13%.</li>
        <li>Updated open_source_licenses.</li>
        <li>Replaced trash package for the electron built in shell.trashItem.</li>
        <li>Updated data update events dispatch process to improve performance.</li>
        <li>Removed some unnecessary resources.</li>
        <li>Cleaned up unnecessary styles.</li>
        <li>Fixed a bug where editing song tags could remove the artwork of a song.</li>
        <li>Fixed a bug where using search features on songs metadata editing page updates the search history.</li>
        <li>Fixed a bug where adding a previously parsed folder would parse the same folder.</li>
        <li>Removed some unnecessary npm packages.</li>
        </ul>
      </li>
      <li> <h4>🐜 Known Issues and Bugs</h4>
        <ul>
          <li>Parsing a big music library could sometimes make the app unresponsive. Currently, the only solution is to wait some time until the parsing process finishes and the app regains responsiveness.</li>
          <li>App theme will be changed when you change your system's theme even though you didn't select to use system theme in the app.</li>
          <li>Lyrics on some songs aren't being read by the app. Still you will be able to see lyrics from the internet.</li>
          <li>If a song is added next to the last song of the queue, the last song won't be played.</li>
          <li>Trying to play corrupted songs will make the app player unusable. Workaround is to play the next song and restart the renderer using F5 button.</li>
          <li>Sometimes adding a song to play next would only add it to the queue instead of adding it next to the current song.</li>
          <li>There is still a small amount of unwanted cpu consumption due to over-rendering of components.</li>
        </ul>
      </li>
    </ul>
  </li>

  <br/>

  <li class="version"> v0.7.0-alpha - ( 27<sup>th</sup> of July 2022 )
    <ul>
      <li> <h4>🎉 New Features and Updates</h3>
      <ul>
        <li>Support for .ogg and .wav file extensions as songs. Now you can play them in the player. (Experimental)</li>
        <li>Added a Release Notes page to display information about the updates of the app. It will inform the user if he/she uses an outdated app.</li>
        <li>Rewrote the whole UI styling with TailwindCSS.</li>
        <li>Added the option to view licenses of the open source packages used in the app.</li>
        <li>Window positions and diamensions will be saved when you move them around.</li>
        <li>SearchPage will now show recent search queries of the user.</li>
        <li>SearchPage will now suggest queries if the user enters a query that doesn't have results.</li>
        <li>SearchPage will now show genres in the search results.</li>
        <li>NotificationPanel now supports buttons to provide additional functionality.</li>
        <li>Added all-time most listened, all-time least listened, monthly most listened, monthly least listened and artist name to songs sort options.</li>
        <li>Added few app-specific error codes to identify errors in the app.</li>
        <li>Added Material Symbols.</li>
        <li>Now the app is responsive to network fluctuations.</li>
        <li>Added song playback controls to the taskbar thumbnail toolbar of the app.</li>
        <li>Ability to make the mini player always on top.</li>
        <li>Now you can add new playlists, add new songs to them, remove songs inside them or remove the whole playlist.</li>
        <li>Ability to clear the song history of the app.</li>
        <li>Sorting options now you select will be saved in the app to provide easier access to what you always go for.</li>
        <li>Added a new volume fade in and fade out transition for songs when toggling through pause and play.</li>
        <li>Queue shuffling using Fisher Yates algorithm.</li>
        <li>Now the sidebar will be folded if you reduce the size of the app beyond a specific boundary.</li>
        <li>Added a Dropdown component and improved its UI, UX and functionality.</li>
        <li>Added new MainContainer and SecondaryContainer components.</li>
        <li>Added a prompt to verify before directing user to links from the app.</li>
        <li>Added a new prompt to confirm sensitive actions of the app.</li>
        <li>Now most of the pages will update themselves if they detect whether their data are updated.</li>
        <li>Now you can sort genres.</li>
        <li>Now you can see what songs you loved most and listened most and which artists you love most on the HomePage.</li>
        <li>Added a new prompt to confirm before deleting a playlist.</li>
      </ul>
      </li>
      <li> <h4>🔨 Fixes and Improvements</h4>
        <ul>
          <li>Now recently played songs will be fetched using the History playlist.</li>
          <li>Removed some unused font files.</li>
          <li>Fixed some bugs related to data caching inside the app.</li>
          <li>Improved data updates detection.</li>
          <li>Fixed some bugs related to parsing songs.</li>
          <li>Fixed some bugs related to restoring a blacklisted song and sending a song to the blacklist.</li>
          <li>Fixed a bug where parsing a song after a read error would parse the song two times.</li>
          <li>Fixed a bug where deleting a song from the library or deleting from the system wouldn't update the library.</li>
          <li>Fixed some bugs related to resetting the app.</li>
          <li>Improved the song parsing process.</li>
          <li>Added a Ref to store all the states in App.</li>
          <li>Fixed some bugs related to the player.</li>
          <li>Improved Button component UI, UX and functionality.</li>
          <li>Improved Checkbox component UI, UX and functionality.</li>
          <li>Improved ErrorPrompt component UI, UX and functionality.</li>
          <li>Improved how notifications appear in the app.</li>
          <li>Improved how the app searches content.</li>
          <li>Updated the song tags editing page. (Experimental)</li>
        </ul>
      </li>
      <li> <h4>🐜 Known Issues and Bugs</h3>
        <ul>
          <li>Editing song tags could remove the artwork of a song.</li>
          <li>Sometimes adding a song to play next would only add it to the queue instead of adding it next to the current song.</li>
          <li>There is still a small amount of unwanted cpu consumption due to over-rendering of components.</li>
        </ul>
      </li>
    </ul>

  </li>

  <br/>

  <li class="version"> v0.6.0-alpha - ( 24<sup>th</sup> of June 2022 )
    <ul>
      <li> <h4>🎉 New Features and Features</h4>
      <ul>
        <li>Added the support to edit song id3 tags. Right click on a song and select Edit song tags to go to the SongID3TagEditorPage. Currently changes to those data wouldn't be updated on the app. (Experimental)</li>
        <li>Added the basement to provide support for m3u files to import and export playlists.</li>
        <li>Artist artworks will be updated when the user listens to their songs.</li>
        <li>Added keyboard shortcuts for the basic functions of the app.</li>
        <li>Added support for reduced motion. You can enable reduced motion in Settings > Accessibility.</li>
        <li>Added Genres to the app. You can view details related to the genre in GenreInfoPage by clicking on a genre.</li>
        <li>Now the app window will blur the title bar when the app loses focus.</li>
        <li>Now enabling song indexing from Settings > Accessibility will number the songs.</li>
        <li>In CurrentQueuePage, app will direct you to the current playing song by scrolling it to the center of the window.</li>
        <li>Added support for repeat and repeat-1 to keep listening to your loved songs all day long.</li>
        <li>Added a loading animation for the notification bar.</li>
        <li>Now users can restore their blacklisted songs from the Settings Page.</li>
        <li>Now the app can be configured to start on system startup.</li>
        <li>Added a button for the users to open the Devtools or the log file in Settings > About.</li>
        <li>Frequently used data such as songs, artists, playlists etc will be cached inside the app at runtime.</li>
        <li>Song lyrics will also be cached in the app until the relevant song finishes.</li>
        <li>Now some parts of the UI such as HomePage will be updated on data modifications. These modifications include new songs, recently played songs etc.</li>
        <li>Updated some functions to support pagination and sorting features to remove some burden off the renderer.</li>
      </ul>
      </li>
      <li> <h4>🔨 Fixes and Improvements</h3>
        <ul>
          <li>Fixed a security vulnerability related to package 'sharp'.</li>
          <li>Removed unnecessary css styles and optimized the styling of the app.</li>
          <li>Fixed a possibility of duplicating songs by adding the same folder again.</li>
          <li>Fixed a bug related to not deleting app data after an app reset.</li>
          <li>Fixed a bug related to over-rendering of react components when a song is playing resulting higher consumption of cpu and memory. This also fixes the jitter when scrolling.</li>
          <li>Removed unnecessary context menu options from the HomePage.</li>
          <li>Fixed a bug related to parsing songs that are still being written to the system.</li>
          <li>Fixed a bug where removing a song from the system will identify as a blacklisted song by the app.</li>
          <li>Now the context menu will appear relevant to the available width and height of the window.</li>
          <li>Fixed an error where some functions are coded asynchronous but are actually synchronous.</li>
          <li>Updated the logger to write logs more clearly on a txt file. Now it shows more relevant information in the logs.</li>
          <li>Some functions now can send multiple results. This reduces number of requests to the api to fetch data.</li>
          <li>Fixed a bug where newly added songs won't be added to the library.</li>
        </ul>
      </li>
      <li> <h4>🐜 Known Issues and Bugs</h4>
        <ul>
          <li>There is still a small amount of unwanted cpu consumption due to over-rendering of components.</li>
          <li>Blacklisting or removing a song from the library isn't working as intended.</li>
        </ul>
      </li>
    </ul>
  </li>

  <br/>

  <li class="version"> <h3>v0.5.0-alpha - ( 25<sup>th</sup> of May 2022 )</h3>
    <ul>
      <li> <h4>🎉New Features and Features</h3>
      <ul>
        <li>Now queues and some other features save their states between sessions (Experimental).</li>
        <li>Now Currently Playing Queue shows information about the current queue including playlist name, artwork etc (Experimental).</li>
        <li>Updated settings page to provide information about app version, github repository etc (Experimental).</li>
        <li>Now users can remove songs from the library, move to the recycle bin or delete permanently from the system. Removed songs from the library will be blacklisted. (Experimental)</li>
        <li>Now logger stores some information about the current system. This includes cpu model, architechture, platform, os and system memory.</li>
        <li>A new event added to detect app quits to provide methods to persist session data.</li>
        <li>Now playlists, albums, and artists' songs can be played by adding it to the queue.</li>
        <li>Now albums and artists support context menu options.</li>
        <li>Now online pictures of the artists will be shown thoughout the app after watching their profile.</li>
        <li>Added a song blacklist function. Now songs removed from the library will be blacklisted and can be restored from the settings page. (Experimental)</li>
        <li>Added new images that will be displayed in situations like when the songs are loading and when there's no songs etc.</li>
        <li>Now searchPage shows results about playlists.</li>
        <li>Now some information about artist data and album data is saved with song data.</li>
        <li>Now you can view all the search results related to your query by clicking 'See All' buttons of specific categories in searchPage.</li>
        <li>Created new components Button and Checkbox.</li>
        <li>Added new buttons in ArtistInfoPage, AlbumInfoPage, PlaylistInfoPage, CurrentQueuePage to provide functions like play all, shuffle and play, and add to queue etc.</li>
      </ul>
      </li>
      <li> <h4>🔨 Fixes and Improvements</h4>
        <ul>
          <li>Fixed a bug related to npm packages.</li>
          <li>Updated parseSong to differentiate between currently added songs and new songs. Previously this problem will duplicate the data related to the song in the library.</li>
          <li>Fixed some music playback issues.</li>
          <li>Fixed some issues related to queuing songs.</li>
          <li>Updated and improved the styles of the app.</li>
          <li>Now number of listens of a song will be updated if the song is listened repeatedly by using repeat function.</li>
          <li>Updated artist online information apis.</li>
          <li>Applied useTransition hook to improve user input responsiveness in the app when a song is playing.</li>
        </ul>
      </li>
      <li><h4>🐜 Known Issues and Bugs</h4>
        <ul>
        <li>Sometimes newly added songs won't be added to the library. The workaround is to reset the app and linking the relevant folder again.</li>
        <li>Shuffle and Repeat states currently is not presisting states between sessions.</li>
        <li>Resync songs context menu option isn't working as intended.</li>
        <li>Scrolling in a page when is a song is playing reduces smoothness of the app due excessive rendering.</li>
        </ul>
      </li>
    </ul>
  </li>

  <br/>

  <li class="version"> <h3>v0.5.0-alpha - ( 25<sup>th</sup> of May 2022 )</h3>
    <ul>
      <li>Migrated the song player to the root of the app to provide support for features such as mini-player (Experimental).</li>
      <li>Updated readme file.</li>
      <li>Improved the codebase.</li>
    </ul>
  </li>

  <br/>

  <li class="version"> <h3>v0.4.0-alpha - ( 14<sup>th</sup> of May 2022 )</h3>
    <ul>
      <li> Added song queuing. Now users can queue songs.</li>
      <li> Started using useContext React api to reduce prop drilling.</li>
      <li> Started using useReducer React api to avoid rendering issues occurred when using useState.</li>
      <li> Improved sorting of songs, artists, and albums. Now they work as intended.</li>
      <li> Updated launch.json files in vscode to support debugging both main and renderer processes.</li>
      <li> Improved user interface styling.</li>
      <li> Adding a new song will now inform the user about the new song adding process.</li>
      <li> Added a context menu option in the homepage to reset the app.</li>
      <li> Now the app will inform the user if it couldn't find the lyrics.</li>
      <li> Added a new event that fires when songs, artists, albums, playlists, or userData gets added.</li>
      <li> Fixed some bugs related to paths in parseSong.ts</li>
      <li> Removed unnecessary comments.</li>
      <li> Added a current queue page to view the current queue of songs.</li>
      <li> Renamed DialogMenu menu to notification panel.</li>
      <li> Removed unnecessary svg icons.</li>
      <li> Improved detection of songs whose got added when the app is running and not running.</li>
      <li> Added a function to remove a song from the library.</li>
      <li> Added a function to remove a linked media folder.</li>
      <li> Added an experimental mini player.</li>
      <li> Added the feature to remove playlists.</li>
      <li> Added a function to send renderer process errors and logs to the main process and save them.</li>
      <li> Added a function that shows main process messages in the renderer process.
      <li> Fixed some bugs related to parsing songs.</li>
      <li> Added a function that provides navigation previous pages. Now users can click backward button in the title bar to go to their previously visited page.
      <li> Added an ErrorPrompt to inform users about possible errors.</li>
      <li> Now artists, albums and playlists show how much hours of songs they have.</li>
      <li> Added the settings page to with options to update theme, music folders, and default page.</li>
      <li> Now songsPage shows how many songs in the library.</li>
    </ul>
  </li>

  <br/>

  <li class="version"> <h3>v0.3.1-alpha - ( 07<sup>th</sup> of May 2022 )</h3>
    <ul>
      <li> Migration from FontAwesome icons to Google Material Icons.</li>
      <li> Improved styles to support Google material icons functionality.</li>
      <li> Offloaded creation and optimization of cover arts to Sharp package.</li>
      <li> Added nanoid to create unique ids for songs, artists and albums.</li>
      <li> Added node-id3 to provide support for future id3 tag editing.</li>
      <li> Added support for icons in the context menu.</li>
      <li> Added a home page context menu item to resync songs.</li>
      <li> Improved sorting of songs, artists and albums.</li>
    </ul>
  </li>

  <br/>

  <li class="version"> <h3>v0.3.0-alpha - ( 02<sup>nd</sup> of May 2022 )</h3>
    <ul>
      <li> Added function to sort songs, artists and albums.</li>
      <li> Added a PlaylistsInfoPage to display information related to playlists.</li>
      <li> Removed unnecessary react props to improve performance.</li>
      <li> Fixed some typescript type errors.</li>
    </ul>
  </li>

  <br/>

  <li class="version"> <h3>v0.2.0-alpha - ( 29<sup>th</sup> of April 2022 )</h3>
    <ul>
      <li> Added new styles for AlbumInfoPage, ArtistInfoPage, and updated some styles on other componenets.</li>
      <li> Now ArtistInfoPage shows information of the artists from Deezer and Last.fm apis.</li>
      <li> Fixed some bugs when parsing songs.</li>
      <li> Now songData, albumData and artistData are linked together in the database for easier access.</li>
      <li> Updated preload script to support typescript types.</li>
      <li> Improved React support of the app.</li>
    </ul>
  </li>

  <br/>

  <li class="version"> <h3>v0.1.1-alpha - ( 01<sup>st</sup> of April 2022 )</h3>
    <ul>
      <li>Added a context menu option for songs to open them in the File Explorer.</li>
    </ul>
  </li>

  <br/>

  <li class="version"> <h3>v0.1.0-alpha - ( 23<sup>rd</sup> of March 2022 )</h3>
    <ul>
      <li> Fixed bugs related to instant identification of newly added songs.</li>
      <li> Added a feature to monitor song listening patterns of the user for better shuffling.</li>
      <li> Fixed some bugs in the search feature.</li>
      <li> Partial playlists support for the app. (Currently you can only add playlists.)</li>
      <li> Favorites playlist and History playlist added to the playlist pane.</li>
      <li> Added a Dialog menu to display messages.</li>
      <li> Added a prompt menu.</li>
      <li> Fixed context menu bugs.</li>
      <li> Context menu now supports individual element context items.</li>
      <li> Added an experimental Song Info page.</li>
      <li> Fixed some styling issues in the UI.</li>
    </ul>
  </li>

  <br/>

  <li class="version"> <h3>v0.0.1-alpha - ( 11<sup>th</sup> of March 2022 )</h3>
    <ul>
      <li> Initial alpha release.</li>
      <li> Added a lyrics pane which shows lyrics according to the current song.</li>
      <li> Instant identification of newly added songs.</li>
    </ul>
  </li>

</ul>
