export function normalizeFileText(fileText = '') {
  return String(fileText).replace(/^\uFEFF/, '');
}
