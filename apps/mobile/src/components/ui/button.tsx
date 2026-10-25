import type { PressableProps } from 'react-native';
import { Button as PanelButton } from '@/components/panel/button';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantMap = { primary: 'primary', secondary: 'outline', ghost: 'ghost', inverse: 'secondary' } as const;

/** Existing Button API, rendered by PanelUI's Button. `inverse` is for always-dark surfaces. */
export function Button({ title, variant = 'primary', loading, disabled, ...props }: ButtonProps) {
  return (
    <PanelButton
      variant={variantMap[variant]}
      size="lg"
      loading={loading}
      disabled={disabled ?? undefined}
      accessibilityLabel={title}
      className={variant === 'inverse' ? 'border-white bg-white' : undefined}
      labelClassName={variant === 'inverse' ? 'text-black' : undefined}
      {...props}
    >
      {title}
    </PanelButton>
  );
}
