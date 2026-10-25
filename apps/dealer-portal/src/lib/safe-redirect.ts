/** Only same-site relative paths may be used as post-login destinations (prevents open redirects). */
export function safeRedirectPath(input: string | null | undefined, fallback = '/dashboard'): string {
  if (!input || !input.startsWith('/') || input.startsWith('//') || input.includes('\\')) return fallback;
  return input;
}
