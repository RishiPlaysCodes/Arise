// Solo Levelling design system
export const colors = {
  bg: '#0a0a0f',
  bgDarker: '#050508',
  panel: '#14141f',
  panelLight: '#1c1c2e',
  border: '#2a2a42',
  borderGlow: '#3d3d63',
  purple: '#7c3aed',
  purpleDark: '#5b21b6',
  purpleLight: '#a78bfa',
  blue: '#3b82f6',
  blueGlow: '#60a5fa',
  cyan: '#06b6d4',
  green: '#10b981',
  emerald: '#34d399',
  gold: '#f59e0b',
  red: '#ef4444',
  redDark: '#b91c1c',
  orange: '#fb923c',
  text: '#f5f5fa',
  textDim: '#9494ac',
  textMuted: '#5f5f78',
  white: '#ffffff',
};

export const rankColors = {
  E: '#8b8b9e', D: '#32CD32', C: '#4169E1', B: '#a78bfa',
  A: '#FF8C00', S: '#ef4444', SS: '#fbbf24',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 };

export const font = {
  h1: 26, h2: 22, h3: 18, body: 15, small: 13, tiny: 11,
};

export const shadow = {
  glow: {
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
