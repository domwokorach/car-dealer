import expo from 'eslint-config-expo/flat.js';

export default [
  ...expo,
  {
    ignores: [
      'dist/*',
      '.expo/*',
      // PanelUI source copied in by panelui-cli (tracked by panelui-lock.json): update with the CLI, don't lint.
      'components/panel/**',
      'hooks/**',
      'lib/**',
    ],
  },
];
