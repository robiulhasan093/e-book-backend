export function cleanId(value: string) {
  return value?.trim().replace(/\r?\n|\r/g, '');
}