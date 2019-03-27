import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as yargs from 'yargs';
import { globalState } from './global-state';
import { logInfo, logText, logWarn } from './log';
import { plugin } from './plugins';
import { priEvent } from './pri-events';

export const ensureFiles = async () => {
  if (yargs.argv.light) {
    return;
  }

  priEvent.emit('beforeEnsureFiles');

  const ensureProjectFilesQueueGroupByPath = _.groupBy(plugin.ensureProjectFilesQueue, 'fileName');

  await Promise.all(
    Object.keys(ensureProjectFilesQueueGroupByPath).map(async fileRelativePath => {
      const ensureProjectFilesQueue = ensureProjectFilesQueueGroupByPath[fileRelativePath];

      await ensureFile(
        fileRelativePath,
        ensureProjectFilesQueue.map(ensureProjectFiles => ensureProjectFiles.pipeContent)
      );
    })
  );
};

export async function ensureFile(
  fileRelativePath: string,
  pipeContents: ((prev: string) => string | Promise<string>)[]
) {
  const filePath = path.join(globalState.projectRootPath, fileRelativePath);
  const fileExist = fs.existsSync(filePath);

  let exitFileContent = '';
  try {
    exitFileContent = fs.readFileSync(filePath, 'utf8').toString();
  } catch (error) {
    //
  }

  const nextContent = await pipeContents.reduce(
    async (preContent, pipeContent) => Promise.resolve(pipeContent(await preContent)),
    Promise.resolve(exitFileContent)
  );

  if (fileExist) {
    if (exitFileContent === nextContent) {
      // skipped not log
    } else {
      logWarn(`${fileRelativePath} exist, but the content is not correct, has been recovered.`);
    }
  } else {
    logInfo(`${fileRelativePath} not exist, created.`);
  }

  fs.outputFileSync(filePath, nextContent);
}
