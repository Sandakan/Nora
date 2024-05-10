import { createContext } from 'react';

export interface SongPositionContextType {
  songPosition: number;
}

export const SongPositionContext = createContext<SongPositionContextType>({
  songPosition: 0
});
