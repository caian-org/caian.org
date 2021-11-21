import { join } from 'path'

import { Configuration } from 'webpack'
import TerserPlugin from 'terser-webpack-plugin'
import nodeExternals from 'webpack-node-externals'

const config: Configuration = {
  mode: 'production',
  target: 'node',
  externals: [nodeExternals()],
  externalsPresets: {
    node: true
  },
  entry: './misc/gulpfile.ts',
  output: {
    path: join(__dirname, 'dist'),
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()]
  }
}

export default config
