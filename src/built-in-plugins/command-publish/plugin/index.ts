import { pri } from '../../../node';
import text from '../../../utils/text';
import { PublishOption } from './interface';

pri.commands.registerCommand({
  name: ['publish'],
  description: text.commander.publish.description,
  options: {
    tag: {
      description: 'npm tag',
    },
    bundle: {
      description: 'create bundle',
    },
    skipLint: {
      description: 'Skip lint',
    },
    skipNpm: {
      description: 'Skip npm publish',
    },
    semver: {
      description: 'Semver version: patch minor major',
    },
    commitOnly: {
      description: 'commit version update without publishing',
    },
    publishOnly: {
      description: 'publish without commit or any other git workflow',
    },
    branch: {
      description: 'branch name',
    },
  },
  action: async (options: PublishOption) => {
    const commandPublishModule = await import('./run-publish');
    await commandPublishModule.publish(options);
  },
});
