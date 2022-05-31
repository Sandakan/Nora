<h1> Change Log</h1>

<ul>

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
      <li>Improved codebase to support building the app.</li>
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
