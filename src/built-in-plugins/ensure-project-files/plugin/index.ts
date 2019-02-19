import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as pkg from '../../../../package.json';
import { pri } from '../../../node';
import { PRI_PACKAGE_NAME } from '../../../utils/constants';
import { globalState } from '../../../utils/global-state';
import { prettierConfig } from '../../../utils/prettier-config';
import { declarePath, gitIgnores, npmIgnores, tempPath, tempTypesPath } from '../../../utils/structor-config';
import { ensureComponentFiles } from './ensure-component';
import { ensurePluginFiles } from './ensure-plugin';
import { ensureProjectFiles } from './ensure-project';

pri.event.once('beforeEnsureFiles', async () => {
  ensureGitignore();
  ensureNpmignore();
  ensureNpmrc();
  ensureTsconfig();
  ensureJestTsconfig();
  ensureVscode();
  ensurePrettierrc();
  ensureTslint();
  ensurePackageJson();

  ensureDeclares(pri.projectRootPath);

  switch (pri.projectPackageJson.pri.type) {
    case 'project':
      ensureProjectFiles();
      break;
    case 'component':
      ensureComponentFiles();
      break;
    case 'plugin':
      ensurePluginFiles();
      break;
    default:
  }
});

function ensureDeclares(projectRootPath: string) {
  const declareAbsolutePath = path.join(projectRootPath, declarePath.dir);
  fs.copySync(path.join(__dirname, '../../../../declare'), declareAbsolutePath);
}

const ensurePrettierrc = () =>
  pri.project.addProjectFiles({
    fileName: '.prettierrc',
    pipeContent: () => JSON.stringify(prettierConfig, null, 2) + '\n'
  });

const ensureTsconfig = () =>
  pri.project.addProjectFiles({
    fileName: 'tsconfig.json',
    pipeContent: async () => {
      return (
        JSON.stringify(
          {
            compilerOptions: {
              module: 'esnext',
              moduleResolution: 'node',
              strict: true,
              strictNullChecks: false,
              jsx: 'react',
              target: 'esnext',
              experimentalDecorators: true,
              skipLibCheck: true,
              outDir: globalState.projectConfig.distDir,
              rootDir: './src',
              baseUrl: '.',
              lib: ['dom', 'es5', 'es6', 'scripthost'],
              paths: {
                [PRI_PACKAGE_NAME + '/*']: [PRI_PACKAGE_NAME, path.join(tempTypesPath.dir, '*')],
                ...(pri.projectPackageJson.pri.type === 'project' && { '@/*': ['src/*'] })
              }
            },
            include: [
              `${tempPath.dir}/**/*`,
              ...['src/**/*'].map(each => path.join(globalState.projectConfig.sourceRoot, each))
            ],
            exclude: ['node_modules', globalState.projectConfig.distDir]
          },
          null,
          2
        ) + '\n'
      ); // Make sure ./src structor. # https://github.com/Microsoft/TypeScript/issues/5134
    }
  });

const ensureJestTsconfig = () =>
  pri.project.addProjectFiles({
    fileName: 'tsconfig.jest.json',
    pipeContent: async () => {
      return (
        JSON.stringify(
          {
            extends: './tsconfig',
            compilerOptions: {
              module: 'commonjs'
            }
          },
          null,
          2
        ) + '\n'
      );
    }
  });

const ensureTslint = () =>
  pri.project.addProjectFiles({
    fileName: 'tslint.json',
    pipeContent: () =>
      JSON.stringify(
        {
          extends: ['tslint:latest', 'tslint-config-prettier'],
          defaultSeverity: 'error',
          rules: {
            'object-literal-sort-keys': false,
            'max-classes-per-file': [true, 5],
            'trailing-comma': [false],
            'no-string-literal': true,
            'arrow-parens': false,
            'no-var-requires': true,
            'prefer-conditional-expression': false,
            'no-implicit-dependencies': false,
            'no-object-literal-type-assertion': false,
            'no-submodule-imports': false,
            'no-empty': true,
            'interface-name': false
          }
        },
        null,
        2
      ) + '\n'
  });

const ensureVscode = () =>
  pri.project.addProjectFiles({
    fileName: '.vscode/settings.json',
    pipeContent: (prev: string) =>
      JSON.stringify(
        _.merge({}, prev ? JSON.parse(prev) : {}, {
          'editor.formatOnSave': true,
          'tslint.autoFixOnSave': true,
          'typescript.tsdk': 'node_modules/typescript/lib'
        }),
        null,
        2
      ) + '\n'
  });

const ensureGitignore = () =>
  pri.project.addProjectFiles({
    fileName: '.gitignore',
    pipeContent: (prev = '') => {
      const values = prev.split('\n').filter(eachRule => !!eachRule);
      const gitIgnoresInRoot = gitIgnores.map(name => `/${name}`);
      return _.union(values, gitIgnoresInRoot).join('\n');
    }
  });

const ensureNpmignore = () =>
  pri.project.addProjectFiles({
    fileName: '.npmignore',
    pipeContent: (prev = '') => {
      const values = prev.split('\n').filter(eachRule => !!eachRule);
      const npmIgnoresInRoot = npmIgnores.map(name => `/${name}`);

      if (pri.projectConfig.hideSourceCodeForNpm) {
        npmIgnoresInRoot.push('/src');
      }

      return _.union(values, npmIgnoresInRoot).join('\n');
    }
  });

const ensureNpmrc = () =>
  pri.project.addProjectFiles({
    fileName: '.npmrc',
    pipeContent: () => `package-lock=${globalState.projectConfig.packageLock ? 'true' : 'false'}`
  });

const ensurePackageJson = () =>
  pri.project.addProjectFiles({
    fileName: 'package.json',
    pipeContent: (prev: string) => {
      const prevJson = prev ? JSON.parse(prev) : {};

      const priDeps = pkg.dependencies || {};

      if (pri.projectPackageJson.pri.type === 'project') {
        // Remove all packages which already exists in pri dependencies.
        if (prevJson.dependencies) {
          prevJson.dependencies = _.omit(prevJson.dependencies, Object.keys(priDeps));
        }
        if (prevJson.devDependencies) {
          prevJson.devDependencies = _.omit(prevJson.devDependencies, Object.keys(priDeps));
        }
        if (prevJson.peerDependencies) {
          prevJson.peerDependencies = _.omit(prevJson.peerDependencies, Object.keys(priDeps));
        }
      } else {
        // Not project type, just reset it's version if exist.
        setVersionIfExist(prevJson, 'dependencies', priDeps);
        setVersionIfExist(prevJson, 'devDependencies', priDeps);
        setVersionIfExist(prevJson, 'peerDependencies', priDeps);
      }

      // Mv pri-plugins to devDeps except plugin
      if (pri.projectPackageJson.pri.type === 'plugin') {
        mvPriPlugins(prevJson, 'devDependencies', 'dependencies');
        mvPriPlugins(prevJson, 'peerDependencies', 'dependencies');
      } else {
        mvPriPlugins(prevJson, 'dependencies', 'devDependencies');
        mvPriPlugins(prevJson, 'peerDependencies', 'devDependencies');
      }

      return (
        JSON.stringify(
          _.merge({}, prevJson, {
            scripts: {
              start: 'pri dev',
              docs: 'pri docs',
              build: 'pri build',
              bundle: 'pri bundle',
              preview: 'pri preview',
              analyse: 'pri analyse',
              test: 'pri test',
              format: "tslint --fix './src/**/*.?(ts|tsx)' && prettier --write './src/**/*.?(ts|tsx)'"
            },
            pri: { type: pri.projectPackageJson.pri.type, version: pri.version },
            husky: {
              hooks: {
                'pre-commit': 'npm test'
              }
            }
          }),
          null,
          2
        ) + '\n'
      );
    }
  });

function setVersionIfExist(sourceObj: any, key: string, targetObj: any) {
  if (!_.isEmpty(_.get(sourceObj, key))) {
    Object.keys(_.get(sourceObj, key)).forEach(sourceObjKey => {
      if (targetObj[sourceObjKey]) {
        _.set(sourceObj, [key, sourceObjKey], targetObj[sourceObjKey]);
      }
    });
  }
}

function mvPriPlugins(obj: any, sourceKey: string, targetKey: string) {
  if (!obj[sourceKey]) {
    obj[sourceKey] = {};
  }

  if (!obj[targetKey]) {
    obj[targetKey] = {};
  }

  const priPlugins = Object.keys(obj[sourceKey]).filter(
    packageName => packageName.startsWith('pri-plugin') || packageName.startsWith('@ali/pri-plugin')
  );

  // Add plugins to targetKey
  priPlugins.forEach(packageName => {
    obj[targetKey][packageName] = obj[sourceKey][packageName];
  });

  // Remove plugins from sourceKey
  obj[sourceKey] = _.omit(obj[sourceKey], priPlugins);
}
