import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import * as path from 'path';
import * as UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import * as webpack from 'webpack';
import { globalState } from '../utils/global-state';
import { plugin } from '../utils/plugins';
import { srcPath, tempPath } from '../utils/structor-config';
import { babelOptions } from './babel-options';

export interface IHtmlTemplateArgs {
  dashboardServerPort?: number;
  libraryStaticPath?: string;
  appendHead?: string;
  appendBody?: string;
}

export type IOptions<T = {}> = {
  mode: 'development' | 'production';
  entryPath: string | string[];
  htmlTemplatePath?: string;
  htmlTemplateArgs?: IHtmlTemplateArgs;
  publicPath?: string;
  distDir?: string;
  outFileName?: string;
  outCssFileName?: string;
  externals?: any[];
  target?: webpack.Configuration['target'];
  libraryTarget?: webpack.LibraryTarget;
} & T;

const defaultSourcePathToBeResolve = [
  path.join(globalState.projectRootPath, srcPath.dir),
  path.join(globalState.projectRootPath, tempPath.dir)
];

const selfAndProjectNodeModules = [
  path.join(globalState.projectRootPath, 'node_modules'),
  path.join(__dirname, '../../node_modules')
];

/**
 * Get webpack config.
 */
export const getWebpackConfig = async (opts: IOptions) => {
  /**
   * Mutilpe loaders
   */
  const styleLoader = {
    loader: 'style-loader',
    options: plugin.buildConfigStyleLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
  };

  const cssPureLoader = {
    loader: 'css-loader',
    options: plugin.buildConfigCssLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
  };

  const cssModuleLoader = {
    loader: 'css-loader',
    options: plugin.buildConfigCssLoaderOptionsPipes.reduce((options, fn) => fn(options), {
      importLoaders: 1,
      modules: true,
      localIdentName: '[path][name]-[local]-[hash:base64:5]'
    })
  };

  const sassLoader = {
    loader: 'sass-loader',
    options: plugin.buildConfigSassLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
  };

  const lessLoader = {
    loader: 'less-loader',
    options: plugin.buildConfigLessLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
  };

  const babelLoader = {
    loader: 'babel-loader',
    options: plugin.buildConfigBabelLoaderOptionsPipes.reduce((options, fn) => fn(options), babelOptions)
  };

  /**
   * Helper
   */
  function extraCssInProd(...loaders: any[]) {
    if (globalState.projectConfig.cssExtract) {
      if (globalState.isDevelopment) {
        return [styleLoader, ...loaders];
      } else {
        return [MiniCssExtractPlugin.loader, ...loaders];
      }
    } else {
      return [styleLoader, ...loaders];
    }
  }

  const distDir = opts.distDir || path.join(globalState.projectRootPath, globalState.projectConfig.distDir);
  const outFileName = opts.outFileName || globalState.projectConfig.outFileName;
  const outCssFileName = opts.outCssFileName || globalState.projectConfig.outCssFileName;

  let publicPath: string = opts.publicPath || globalState.projectConfig.publicPath || '/';
  if (!publicPath.endsWith('/')) {
    publicPath += '/';
  }

  const stats = { warnings: false, version: false, modules: false, entrypoints: false, hash: false };

  const cssLoaderConfig = {
    include: defaultSourcePathToBeResolve
  };

  const scssLoaderConfig = {
    include: plugin.buildConfigSassLoaderIncludePipes.reduce(
      (options, fn) => fn(options),
      defaultSourcePathToBeResolve
    ),
    exclude: plugin.buildConfigSassLoaderExcludePipes.reduce((options, fn) => fn(options), [])
  };

  const lessLoaderConfig = {
    include: plugin.buildConfigLessLoaderIncludePipes.reduce(
      (options, fn) => fn(options),
      defaultSourcePathToBeResolve
    ),
    exclude: plugin.buildConfigLessLoaderExcludePipes.reduce((options, fn) => fn(options), [])
  };

  const config: webpack.Configuration = {
    mode: opts.mode,
    entry: opts.entryPath,
    devtool: opts.mode === 'development' ? 'source-map' : false,
    externals: opts.externals,
    target: opts.target || 'web',
    output: {
      path: distDir,
      filename: outFileName,
      publicPath,
      chunkFilename: '[name].[hash].chunk.js',
      hotUpdateChunkFilename: 'hot~[id].[hash].chunk.js',
      hotUpdateMainFilename: 'hot-update.[hash].json',
      hashDigestLength: 4,
      globalObject: `(typeof self !== 'undefined' ? self : this)`,
      libraryTarget: opts.libraryTarget || 'var'
    },
    module: {
      rules: [
        {
          test: /\.worker\.tsx?$/,
          use: [
            {
              loader: 'worker-loader',
              options: {
                inline: true
              }
            }
          ],
          include: plugin.buildConfigJsLoaderIncludePipes.reduce(
            (options, fn) => fn(options),
            defaultSourcePathToBeResolve
          ),
          exclude: plugin.buildConfigJsLoaderIncludePipes.reduce((options, fn) => fn(options), [])
        },
        {
          test: /\.tsx?$/,
          use: [babelLoader],
          include: plugin.buildConfigJsLoaderIncludePipes.reduce(
            (options, fn) => fn(options),
            defaultSourcePathToBeResolve
          ),
          exclude: plugin.buildConfigJsLoaderIncludePipes.reduce((options, fn) => fn(options), [])
        },
        {
          test: /\.mdx?$/,
          use: [babelLoader, '@mdx-js/loader'],
          include: plugin.buildConfigJsLoaderIncludePipes.reduce(
            (options, fn) => fn(options),
            defaultSourcePathToBeResolve
          ),
          exclude: plugin.buildConfigJsLoaderIncludePipes.reduce((options, fn) => fn(options), [])
        },
        {
          test: /(?<!\.module)\.css$/,
          use: extraCssInProd(cssPureLoader),
          ...cssLoaderConfig
        },
        {
          test: /\.module\.css$/,
          use: extraCssInProd(cssModuleLoader),
          ...cssLoaderConfig
        },
        { test: /\.css$/, use: extraCssInProd(cssPureLoader), include: selfAndProjectNodeModules },
        {
          test: /(?<!\.module)\.s[a|c]ss$/,
          use: extraCssInProd(cssPureLoader, sassLoader),
          ...scssLoaderConfig
        },
        {
          test: /\.module\.s[a|c]ss$/,
          use: extraCssInProd(cssModuleLoader, sassLoader),
          ...scssLoaderConfig
        },
        {
          test: /(?<!\.module)\.less$/,
          use: extraCssInProd(cssPureLoader, lessLoader),
          ...lessLoaderConfig
        },
        {
          test: /\.module\.less$/,
          use: extraCssInProd(cssModuleLoader, lessLoader),
          ...lessLoaderConfig
        },
        { test: /\.html$/, use: ['raw-loader'] },
        {
          test: /\.(png|jpg|jpeg|gif|woff|woff2|eot|ttf|svg)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 1024 * 100
              }
            }
          ]
        }
      ]
    },
    resolve: {
      modules: selfAndProjectNodeModules,
      alias: {
        ...(globalState.projectPackageJson.pri.type === 'project' && {
          '@': path.join(globalState.projectRootPath, '/src')
        }),
        ...(globalState.isDevelopment && {
          'react-dom': '@hot-loader/react-dom'
        })
      },
      extensions: [
        '.js',
        '.jsx',
        '.tsx',
        '.ts',
        '.md',
        '.mdx',
        '.scss',
        '.less',
        '.css',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        'woff',
        'woff2',
        'eot',
        'ttf',
        'svg'
      ]
    },
    resolveLoader: {
      modules: selfAndProjectNodeModules
    },
    plugins: [],
    optimization: { namedChunks: false },
    stats
  };

  if (globalState.isDevelopment) {
    if (opts.htmlTemplatePath) {
      config.plugins.push(
        new HtmlWebpackPlugin({
          title: globalState.projectConfig.title || globalState.projectRootPath.split(path.sep).pop(),
          filename: 'index.html',
          template: opts.htmlTemplatePath,
          htmlTemplateArgs: opts.htmlTemplateArgs
        })
      );
    }
  }

  if (!globalState.isDevelopment) {
    if (globalState.projectConfig.cssExtract) {
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: outCssFileName
        })
      );

      config.optimization = {
        ...config.optimization,
        minimizer: [
          new UglifyJsPlugin({
            cache: true,
            parallel: true
          }),
          new OptimizeCSSAssetsPlugin({})
        ]
      };
    }

    babelLoader.options.plugins.push(['import', { libraryName: 'antd' }]);
  }

  if (globalState.isDevelopment) {
    // Turn off performance hints during development.
    if (!config.performance) {
      config.performance = {};
    }
    config.performance.hints = false;
  }

  return plugin.buildConfigPipes.reduce(async (newConfig, fn) => fn(await newConfig), Promise.resolve(config));
};
