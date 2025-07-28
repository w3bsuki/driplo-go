import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-svelte-csf',
    '@storybook/addon-essentials'
  ],
  framework: {
    name: '@storybook/sveltekit',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  staticDirs: ['../static'],
  core: {
    disableTelemetry: true
  },
  viteFinal: async (config) => {
    // Ensure Tailwind CSS works
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '$lib': '/src/lib'
        }
      }
    };
  }
};

export default config;