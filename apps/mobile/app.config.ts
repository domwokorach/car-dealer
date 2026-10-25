import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json. Plain-HTTP access to a LAN API is enabled ONLY for development variants
 * (APP_VARIANT=development, set by the EAS "development" profiles and `pnpm --filter @car-dealer/mobile run:*`).
 * Preview and production builds keep the platform defaults, which block cleartext traffic: use HTTPS there.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const isDevVariant = process.env.APP_VARIANT === 'development';
  const ios = config.ios ?? {};

  return {
    ...config,
    name: isDevVariant ? 'Car Dealer (Dev)' : (config.name ?? 'Car Dealer'),
    slug: config.slug ?? 'car-dealer',
    ios: {
      ...ios,
      infoPlist: {
        ...ios.infoPlist,
        ...(isDevVariant ? { NSAppTransportSecurity: { NSAllowsLocalNetworking: true } } : {}),
      },
    },
    plugins: [
      ...(config.plugins ?? []),
      ['expo-build-properties', { android: { usesCleartextTraffic: isDevVariant } }],
    ],
  };
};
