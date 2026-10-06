export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));

export function safeUrl(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' || /[\s\\<>"'\u0000-\u001f]/.test(value)) throw new Error('Unsafe URL: ' + value);
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    if (url.hostname && !url.username && !url.password) return value;
  } else {
    let decoded;
    try { decoded = decodeURIComponent(value); } catch { throw new Error('Invalid URL encoding'); }
    if (/^(?:\.\/)?[a-z0-9_-][a-z0-9_./()%\-]*$/i.test(value) && !decoded.split('/').includes('..') && !/[\\\u0000-\u001f]/.test(decoded)) return value;
  }
  throw new Error('Links must be an http(s) URL or a safe relative file path: ' + value);
}
