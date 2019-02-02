import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as prettier from 'prettier';
import * as pkg from '../../../../package.json';
import { pagesPath, pri, testsPath } from '../../../node';
import { PRI_PACKAGE_NAME } from '../../../utils/constants';
import { prettierConfig } from '../../../utils/prettier-config';

export function ensureProjectFiles() {
  ensureProjectEntry();
  ensureTest();
  ensurePackageJson();
}

const ensureProjectEntry = () => {
  const homePagePath = path.join(pagesPath.dir, 'index.tsx');
  const homePageAbsolutePath = path.join(pri.projectRootPath, homePagePath);
  const homeMarkdownPagePath = path.join(pagesPath.dir, 'index.md');
  const homeMarkdownPageAbsolutePath = path.join(pri.projectRootPath, homeMarkdownPagePath);

  if (!fs.existsSync(homePageAbsolutePath) && !fs.existsSync(homeMarkdownPageAbsolutePath)) {
    pri.project.addProjectFiles({
      fileName: homePagePath,
      pipeContent: () =>
        prettier.format(
          `
            import { isDevelopment } from "${PRI_PACKAGE_NAME}/client"
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
                    <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center"}}>
                      Welcome to pri!
                    </h1>
                    <p style={{ padding: "10 50px" }}>
                      Current env: {isDevelopment ? "local" : "prod"}
                    </p>
                  </div>
                )
              }
            }
          `,
          { ...prettierConfig, parser: 'typescript' }
        )
    });
  }
};

export const ensureTest = () =>
  pri.project.addProjectFiles({
    fileName: path.join(testsPath.dir, 'index.ts'),
    pipeContent: (prev: string) =>
      prev
        ? prev
        : prettier.format(
            `
              test("Example", () => {
                expect(true).toBe(true)
              })
            `,
            { ...prettierConfig, parser: 'typescript' }
          )
  });

export function ensurePackageJson() {
  pri.project.addProjectFiles({
    fileName: 'package.json',
    pipeContent: prev => {
      const prevJson = prev ? JSON.parse(prev) : {};
      const projectPriVersion =
        _.get(prevJson, 'devDependencies.pri') || _.get(prevJson, 'dependencies.pri') || pkg.version;

      _.unset(prevJson, 'devDependencies.pri');
      _.set(prevJson, `dependencies.${PRI_PACKAGE_NAME}`, projectPriVersion);

      return JSON.stringify(prevJson, null, 2) + '\n';
    }
  });
}
