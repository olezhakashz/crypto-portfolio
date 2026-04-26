export const theme = {
  color: {
    bg: '#070A14',
    surface: 'rgba(255,255,255,0.08)',
    surface2: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.12)',

    text: 'rgba(255,255,255,0.92)',
    text2: 'rgba(255,255,255,0.70)',
    text3: 'rgba(255,255,255,0.55)',

    primary: '#8B5CF6',
    onPrimary: '#0B0B12',

    danger: '#F97316',
    onDanger: '#0B0B12',

    // ✅ ДОБАВИТЬ
    success: '#22C55E',
    onSuccess: '#0B0B12',
    accent: '#8B5CF6', // можно = primary, но лучше явно
    black: '#0B0B12', // чтобы labelActive не падал
  },

  space: { sm: 8, md: 12, lg: 16, xl: 24 },

  radius: { lg: 14, xl: 18 },
} as const;
