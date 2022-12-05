import { createContext } from 'react';

export interface SongPositionContextType {
  songPosition: number;
}

export const SongPositionContext = createContext({} as SongPositionContextType);
