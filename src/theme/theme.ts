// theme.ts
// This file is the single source of truth for ALL visual design in the app.
// Every color, spacing value, border radius, and font size used in the UI
// comes from here. If you want to change the look of the entire app, this is the file to edit.
//
// The design uses a dark mode theme with purple/violet as the primary accent color.

export const theme = {
  color: {
    // ── Backgrounds ──────────────────────────────────────────────────────────
    bg: '#060810',                          // The very dark navy/black main background
    surface: 'rgba(255,255,255,0.055)',     // Card background — slightly lighter than bg
    surface2: 'rgba(255,255,255,0.035)',    // Input/secondary surface — even more subtle
    surfaceHover: 'rgba(255,255,255,0.08)', // Background color when a card is hovered/pressed

    // ── Borders ───────────────────────────────────────────────────────────────
    border: 'rgba(255,255,255,0.09)',        // Normal borders (very subtle white)
    borderStrong: 'rgba(255,255,255,0.16)', // Stronger border used for inputs and focused elements

    // ── Text ──────────────────────────────────────────────────────────────────
    text: 'rgba(255,255,255,0.95)',  // Primary text — almost fully white
    text2: 'rgba(255,255,255,0.60)', // Secondary text — for descriptions and subtitles
    text3: 'rgba(255,255,255,0.38)', // Tertiary text — very dim, used for hints and labels

    // ── Primary Accent — violet/purple ────────────────────────────────────────
    primary: '#7C3AED',                     // The main purple — used for buttons and highlights
    primaryLight: '#A78BFA',               // Lighter purple — used for icons, links, loading spinners
    primaryGlow: 'rgba(124,58,237,0.35)',   // Semi-transparent purple — used for glow/shadow effects
    onPrimary: '#ffffff',                  // Text color on top of a purple background

    // ── Success / Gain — teal/emerald (price went UP) ─────────────────────────
    success: '#10B981',                    // Bright teal/green — shown when price is positive
    successGlow: 'rgba(16,185,129,0.30)',  // Teal glow for positive indicators
    onSuccess: '#ffffff',                 // Text on top of a success/teal background

    // ── Danger / Loss — rose/red (price went DOWN) ────────────────────────────
    danger: '#F43F5E',                    // Bright red/rose — shown when price is negative
    dangerGlow: 'rgba(244,63,94,0.30)',    // Red glow for negative indicators
    onDanger: '#ffffff',                  // Text on top of a danger/red background

    // ── Accent — same as primary, provided as an alias for convenience ─────────
    accent: '#7C3AED',
    accentSoft: 'rgba(124,58,237,0.18)', // Very translucent purple — used for avatar backgrounds

    // ── Gold — used for market rank badges (#1, #2, #3…) ─────────────────────
    gold: '#F59E0B',
    goldSoft: 'rgba(245,158,11,0.15)', // Very light gold background behind rank badges

    // ── Misc ──────────────────────────────────────────────────────────────────
    black: '#060810', // Alias for the bg color
    white: '#ffffff',
  },

  // ── Spacing scale ────────────────────────────────────────────────────────────
  // These are used as padding/margin values throughout the app (in pixels)
  space: { xs: 4, sm: 8, md: 14, lg: 20, xl: 28, xxl: 40 },

  // ── Border radius scale ───────────────────────────────────────────────────────
  // Controls how rounded corners are (in pixels). 'full' = completely round (circle/pill)
  radius: { sm: 10, md: 14, lg: 18, xl: 24, full: 999 },

  // ── Font size scale ───────────────────────────────────────────────────────────
  // Used for text size throughout the app (in pixels)
  font: {
    xs: 11,  // Tiny: hints, labels, timestamps
    sm: 13,  // Small: secondary text
    md: 15,  // Normal: most body text
    lg: 18,  // Large: headings within cards
    xl: 24,  // Extra large: section titles
    xxl: 32, // Biggest: page titles (e.g. "Settings")
  },
} as const; // 'as const' tells TypeScript these are fixed values — never changed at runtime
