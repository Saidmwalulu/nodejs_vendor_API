import xss from 'xss';

export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return '';
  return xss(str.trim());
};