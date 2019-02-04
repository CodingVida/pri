import * as path from 'path';
import { pri } from '../node';
import { globalState } from './global-state';
import { IWhiteFile } from './plugins-interface';
import { srcPath } from './structor-config';

// For component/plugin, add `src` to white list.
export function addWhiteFilesByProjectType() {
  if (globalState.projectPackageJson.pri.type === 'component' || globalState.projectPackageJson.pri.type === 'plugin') {
    const ignoreSrc: IWhiteFile = projectFiles => {
      const relativePath = path.relative(globalState.projectRootPath, projectFiles.dir);
      return relativePath.startsWith(srcPath.dir);
    };
    pri.project.whiteFileRules.add(ignoreSrc);
  }
}
