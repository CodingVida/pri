export const getPlugin = () => {
  return import('./plugin');
};

export const getConfig = () => {
  return {
    name: 'pri-plugin-mocks',
  };
};
