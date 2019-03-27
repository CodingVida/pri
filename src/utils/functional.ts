export const pipeEvent = (func: any) => {
  return (event: any) => {
    return func(event.target.value, event);
  };
};

export function ensureEndWithSlash(str: string) {
  if (str.endsWith('/')) {
    return str;
  } 
    return `${str  }/`;
  
}

export function ensureStartWithSlash(str: string) {
  if (str.startsWith('/')) {
    return str;
  } 
    return `/${  str}`;
  
}

export function ensureStartWithWebpackRelativePoint(str: string) {
  if (str.startsWith('/')) {
    throw Error(`${str} is an absolute path!`);
  }

  if (!str.startsWith('./') && !str.startsWith('../')) {
    return `./${  str}`;
  } 
    return str;
  
}

export function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
