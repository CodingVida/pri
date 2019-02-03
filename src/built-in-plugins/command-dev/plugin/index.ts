import * as _ from 'lodash';
import { pri } from '../../../node';
import { logFatal } from '../../../utils/log';
import text from '../../../utils/text';

pri.commands.registerCommand({
  name: ['dev'],
  options: {
    debugDashboard: {
      alias: 'd',
      description: 'Debug dashboard'
    }
  },
  description: text.commander.dev.description,
  action: async (options: any) => {
    switch (pri.projectPackageJson.pri.type) {
      case 'project':
        const projectDevModule = await import('./project-dev');
        await projectDevModule.projectDev(options);
        break;
      case 'component':
        const componentDevModule = await import('./component-dev');
        await componentDevModule.componentDev();
        break;
      case 'cli':
        logFatal(`cli not support 'npm start' yet, try 'tsc -w'!`);
      case 'plugin':
        const pluginDevModule = await import('./plugin-dev');
        await pluginDevModule.pluginDev();
        break;
      default:
    }
  }
});
