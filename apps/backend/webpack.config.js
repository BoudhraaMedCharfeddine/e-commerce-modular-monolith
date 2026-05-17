const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: { filename: 'main.js', path: join(__dirname, '../../dist/apps/backend') },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.json',
      optimization: false,
      outputHashing: 'none',
    }),
  ],
};
