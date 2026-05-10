export const theme = {
  color: {
    // Backgrounds
    bg: '#060810',
    surface: 'rgba(255,255,255,0.055)',
    surface2: 'rgba(255,255,255,0.035)',
    surfaceHover: 'rgba(255,255,255,0.08)',

    // Borders
    border: 'rgba(255,255,255,0.09)',
    borderStrong: 'rgba(255,255,255,0.16)',

    // Text
    text: 'rgba(255,255,255,0.95)',
    text2: 'rgba(255,255,255,0.60)',
    text3: 'rgba(255,255,255,0.38)',

    // Primary — violet
    primary: '#7C3AED',
    primaryLight: '#A78BFA',
    primaryGlow: 'rgba(124,58,237,0.35)',
    onPrimary: '#ffffff',

    // Gain — teal/emerald
    success: '#10B981',
    successGlow: 'rgba(16,185,129,0.30)',
    onSuccess: '#ffffff',

    // Loss — rose
    danger: '#F43F5E',
    dangerGlow: 'rgba(244,63,94,0.30)',
    onDanger: '#ffffff',

    // Accent (= primary alias)
    accent: '#7C3AED',
    accentSoft: 'rgba(124,58,237,0.18)',

    // Gold for rank badges
    gold: '#F59E0B',
    goldSoft: 'rgba(245,158,11,0.15)',

    // Misc
    black: '#060810',
    white: '#ffffff',
  },

  space: { xs: 4, sm: 8, md: 14, lg: 20, xl: 28, xxl: 40 },

  radius: { sm: 10, md: 14, lg: 18, xl: 24, full: 999 },

  font: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
} as const;
