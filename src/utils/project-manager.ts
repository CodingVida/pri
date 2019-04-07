import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { analyseProject } from './analyse-project';
import { CONFIG_FILE } from './constants';
import { globalState } from './global-state';
import { prettierConfig } from './prettier-config';
import { layoutPath, notFoundPath, pagesPath, storesPath } from './structor-config';

export async function addPage(options: { path: string }) {
  await analyseProject();
  const fileFullPath = `${path.join(globalState.projectRootPath, pagesPath.dir, options.path, 'index')}.tsx`;

  if (fs.existsSync(fileFullPath)) {
    throw Error(`${options.path} already exist!`);
  }

  const prettier = await import('prettier');

  fs.outputFileSync(
    fileFullPath,
    prettier.format(
      `
      import * as React from "react"

      class Props {

      }

      class State {

      }

      export default class Page extends React.PureComponent<Props, State> {
        public static defaultProps = new Props()
        public state = new State()

        public render() {
          return (
            <div>
              New page for ${options.path}
            </div>
          )
        }
      }
    `,
      { ...prettierConfig, parser: 'typescript' }
    )
  );
}

export async function createLayout() {
  const pathFullPath = path.join(globalState.projectRootPath, path.format(layoutPath));

  if (fs.existsSync(pathFullPath)) {
    throw Error(`layout already exist!`);
  }

  const prettier = await import('prettier');

  fs.outputFileSync(
    pathFullPath,
    prettier.format(
      `
    import * as React from "react"

    class Props {

    }

    class State {

    }

    export default class Page extends React.PureComponent<Props, State> {
      public static defaultProps = new Props()
      public state = new State()

      public render() {
        return (
          <div>
            {this.props.children}
          </div>
        )
      }
    }
  `,
      { ...prettierConfig, parser: 'typescript' }
    )
  );
}

export async function create404() {
  const pathFullPath = path.join(globalState.projectRootPath, path.format(notFoundPath));

  if (fs.existsSync(pathFullPath)) {
    throw Error(`404 page already exist!`);
  }

  const prettier = await import('prettier');

  fs.outputFileSync(
    pathFullPath,
    prettier.format(
      `
    import * as React from "react"

    class Props {

    }

    class State {

    }

    export default class Page extends React.PureComponent<Props, State> {
      public static defaultProps = new Props()
      public state = new State()

      public render() {
        return (
          <div>
            Page not found
          </div>
        )
      }
    }
  `,
      { ...prettierConfig, parser: 'typescript' }
    )
  );
}

export async function createConfig() {
  const configFilePath = path.join(globalState.projectRootPath, CONFIG_FILE);

  if (fs.existsSync(configFilePath)) {
    throw Error(`config already exist!`);
  }

  fs.outputJSONSync(configFilePath, {});
}
