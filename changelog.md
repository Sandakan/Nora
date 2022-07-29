<h1> Change Log</h1>

<h3>The latest version (v0.7.0-alpha) contains a lot of new features and improvements. As always expect to see bugs in the app because this app is still in alpha phase.</h3>
<br>

<ul>
<li class="version"> v0.7.0-alpha - ( 27<sup>th</sup> of July 2022 )
    <ul>
      <li>🎉 New Features and Updates
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
      <li>🔨 Fixes and Improvements
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
      <li>🐜 Known Issues and Bugs
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
      <li>🎉 Features
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
      <li>🔨 Fixes
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
      <li>🐜 Known Issues
        <ul>
          <li>There is still a small amount of unwanted cpu consumption due to over-rendering of components.</li>
          <li>Blacklisting or removing a song from the library isn't working as intended.</li>
        </ul>
      </li>
    </ul>
  </li>

  <br/>

  <li class="version"> v0.5.0-alpha - ( 25<sup>th</sup> of May 2022 )
    <ul>
      <li>Features
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
      <li>Fixes
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
      <li>Known Issues
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

  <li class="version"> v0.4.1-alpha - ( 16<sup>th</sup> of May 2022 )
    <ul>
      <li>Migrated the song player to the root of the app to provide support for features such as mini-player (Experimental).</li>
      <li>Updated readme file.</li>
      <li>Improved the codebase.</li>
    </ul>
  </li>

    <br/>

  <li class="version"> v0.4.0-alpha - ( 14<sup>th</sup> of May 2022 )
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

  <li class="version"> v0.3.1-alpha - ( 07<sup>th</sup> of May 2022 )
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

  <li class="version"> v0.3.0-alpha - ( 02<sup>nd</sup> of May 2022 )
    <ul>
      <li> Added function to sort songs, artists and albums.</li>
      <li> Added a PlaylistsInfoPage to display information related to playlists.</li>
      <li> Removed unnecessary react props to improve performance.</li>
      <li> Fixed some typescript type errors.</li>
    </ul>
  </li>

  <br/>

  <li class="version"> v0.2.0-alpha - ( 29<sup>th</sup> of April 2022 )
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

  <li class="version"> v0.1.1-alpha - ( 01<sup>st</sup> of April 2022 )
    <ul>
      <li>Added a context menu option for songs to open them in the File Explorer.</li>
    </ul>
  </li>

  <br/>

  <li class="version"> v0.1.0-alpha - ( 23<sup>rd</sup> of March 2022 )
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

  <li class="version"> v0.0.1-alpha - ( 11<sup>th</sup> of March 2022 )
    <ul>
      <li> Initial alpha release.</li>
      <li> Added a lyrics pane which shows lyrics according to the current song.</li>
      <li> Instant identification of newly added songs.</li>
    </ul>
  </li>

</ul>
