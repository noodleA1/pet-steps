export const themeColors: {
  primary: { light: string; dark: string };
  secondary: { light: string; dark: string };
  background: { light: string; dark: string };
  surface: { light: string; dark: string };
  foreground: { light: string; dark: string };
  muted: { light: string; dark: string };
  border: { light: string; dark: string };
  success: { light: string; dark: string };
  warning: { light: string; dark: string };
  error: { light: string; dark: string };
  fire: { light: string; dark: string };
  water: { light: string; dark: string };
  earth: { light: string; dark: string };
  air: { light: string; dark: string };
  happiness: { light: string; dark: string };
  hunger: { light: string; dark: string };
  thirst: { light: string; dark: string };
  health: { light: string; dark: string };
  attack: { light: string; dark: string };
  defense: { light: string; dark: string };
};

declare const themeConfig: {
  themeColors: typeof themeColors;
};

export default themeConfig;
