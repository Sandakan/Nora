export const SpecialPlaylists = {
    History: -1,
    Favorites: -2,
    isSpecialPlaylistId: (id: number) => id === SpecialPlaylists.History || id === SpecialPlaylists.Favorites
} as const;

