import { forwardRef } from 'react';
import type { TextInput } from 'react-native';
import { Input as PanelInput, type InputProps as PanelInputProps } from '@/components/panel/input';

export type TextInputRef = TextInput;

export interface InputProps extends Omit<PanelInputProps, 'label' | 'errorMessage'> {
  label: string;
  error?: string | undefined;
}

/** Existing Input API, rendered by PanelUI's Input (label, error message and keyboard handling included). */
export const Input = forwardRef<TextInput, InputProps>(function Input({ label, error, multiline, className, ...props }, ref) {
  return (
    <PanelInput
      ref={ref}
      label={label}
      errorMessage={error}
      accessibilityLabel={label}
      multiline={multiline}
      className={[multiline ? 'min-h-28 pt-3' : '', className].filter(Boolean).join(' ') || undefined}
      {...props}
    />
  );
});
