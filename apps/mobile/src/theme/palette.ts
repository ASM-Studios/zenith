export type Palette = {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
};

export const darkPalette: Palette = {
  background: '#0b1020',
  surface: '#161d33',
  text: '#ffffff',
  mutedText: '#9aa4bf',
  border: '#2a3450',
  accent: '#4da3ff',
};

export const lightPalette: Palette = {
  background: '#f7f8fb',
  surface: '#ffffff',
  text: '#0b1020',
  mutedText: '#4a5470',
  border: '#d5dbe8',
  accent: '#1565d8',
};
