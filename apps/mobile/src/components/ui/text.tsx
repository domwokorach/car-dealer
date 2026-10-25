import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { typography, type TypographyVariant } from '@/theme';

export type TextTone = 'default' | 'muted' | 'inverse' | 'accent' | 'danger' | 'success';

/** Semantic token classes: they follow the active light/dark theme. `inverse` is for text on always-dark surfaces. */
const toneClass: Record<TextTone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  inverse: 'text-white',
  accent: 'text-primary',
  danger: 'text-destructive-foreground',
  success: 'text-success-foreground',
};

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
}

export function Text({ variant = 'body', tone = 'default', style, className, ...props }: TextProps) {
  return <RNText className={[toneClass[tone], className].filter(Boolean).join(' ')} style={[typography[variant], style]} {...props} />;
}
