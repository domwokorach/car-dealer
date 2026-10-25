import { useCSSVariable } from 'uniwind';

/** Design tokens: same palette as the web apps (packages/ui-web/src/styles/theme.css). */
export const colors = {
  ink: '#0A0B0D',
  graphite: '#14161A',
  steel: '#2B2F36',
  slate: '#5D6470',
  silver: '#C7CCD4',
  mist: '#F3F4F6',
  paper: '#FFFFFF',
  accent: '#00A1DE',
  accentStrong: '#007FB0',
  success: '#1F8A5B',
  warning: '#B7791F',
  danger: '#C0392B',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { none: 0, sm: 2, md: 6, pill: 999 } as const;

export const typography = {
  display: { fontSize: 36, lineHeight: 42, fontWeight: '200', letterSpacing: 0.5 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '300', letterSpacing: 0.4 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '400', letterSpacing: 0.3 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  price: { fontSize: 22, lineHeight: 28, fontWeight: '500' },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Semantic colours resolved from the active PanelUI theme (light, dark, or system). Use for values className can't reach. */
export function useColors() {
  const [background, foreground, muted, border, primary, card, surface, destructive] = useCSSVariable([
    '--color-background',
    '--color-foreground',
    '--color-muted-foreground',
    '--color-border',
    '--color-primary',
    '--color-card',
    '--color-surface',
    '--color-destructive',
  ]) as (string | undefined)[];
  return {
    background: background ?? colors.paper,
    foreground: foreground ?? colors.ink,
    muted: muted ?? colors.slate,
    border: border ?? colors.silver,
    primary: primary ?? colors.accentStrong,
    card: card ?? colors.paper,
    surface: surface ?? colors.mist,
    destructive: destructive ?? colors.danger,
  };
}
