export interface TheAudioDBApi {
  artists: [
    {
      idArtist: string;
      strArtist: string;
      strArtistStripped: string;
      strArtistAlternate?: string;
      strLabel: string;
      idLabel: string;
      intFormedYear: string;
      intBornYear: string;
      intDiedYear: string;
      strDisbanded: string;
      strStyle: string;
      strGenre: string;
      strMood: string;
      strWebsite?: string;
      strFacebook?: string;
      strTwitter: string;
      strBiographyEN: string;
      strBiographyDE: string;
      strBiographyFR: string;
      strBiographyCN: string;
      strBiographyIT: string;
      strBiographyJP: string;
      strBiographyRU: string;
      strBiographyES: string;
      strBiographyPT: string;
      strBiographySE: string;
      strBiographyHU: string;
      strBiographyIL: string;
      strBiographyPL: string;
      strGender: string;
      intMembers: string;
      strCountry: string;
      strCountryCode: string;
      strArtistThumb: string;
      strArtistLogo: string;
      strArtistCutout: string;
      strArtistClearart: string;
      strArtistWideThumb: string;
      strArtistFanart: string;
      strArtistFanart2: string;
      strArtistFanart3: string;
      strArtistFanart4: string;
      strArtistBanner: string;
      strMusicBrainzID: string;
      strISNIcode: string;
      strLastFMChart: string;
      intCharted: string;
      strLocked: string;
    }
  ];
}
