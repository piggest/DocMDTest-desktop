import type { Configuration } from 'webpack';

import { rules as sharedRules } from './webpack.rules';
import { plugins } from './webpack.plugins';

// sharedRulesを直接変更しないようスプレッドで新配列を生成
const rendererRules = [
  ...sharedRules,
  { test: /\.css$/, use: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },
];

export const rendererConfig: Configuration = {
  module: {
    rules: rendererRules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
