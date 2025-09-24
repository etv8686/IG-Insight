export const toSet = (arr: string[]) => new Set(arr);

export const diff = (a: string[], b: string[]) => {
  const sb = toSet(b);
  return a.filter(x => !sb.has(x));
};

export const inter = (a: string[], b: string[]) => {
  const sb = toSet(b);
  return a.filter(x => sb.has(x));
};
