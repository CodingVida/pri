import { SetPipe, PipeCallback } from '../utils/define';

const pipes = new Map<string, PipeCallback[]>();

export const get = async (pipeName: string, defaultValue: string) => {
  if (!pipes.has(pipeName)) {
    return defaultValue;
  }

  const content = await pipes.get(pipeName).reduce(async (value, pipe) => {
    return Promise.resolve(pipe(await value));
  }, Promise.resolve(defaultValue));

  return content;
};

export const set: SetPipe = (pipeName, callback) => {
  if (!pipes.has(pipeName)) {
    pipes.set(pipeName, [callback]);
  } else {
    pipes.get(pipeName).push(callback);
  }
};

export const clear = () => {
  pipes.clear();
};
