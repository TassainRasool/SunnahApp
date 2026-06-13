const RULE_REGEX = /\[(\w)(?::\d+)?\[([^\]]*)\]\]/g;

export const TAJWEED_COLORS = {
  h: '#7aaaf0',
  n: '#f0d060',
  f: '#60c080',
  o: '#f07060',
  g: '#d080f0',
  p: '#f0a030',
  s: '#60c0f0',
  a: '#f06080',
  q: '#80d0a0',
  l: '#a0b0f0',
  u: '#f0a060',
  w: '#90d0f0',
  i: '#d0a0f0',
  c: '#f080a0',
  m: '#f0d080',
  d: '#80f0a0',
  b: '#d0d080',
};

export const TAJWEED_NAMES = {
  h: 'Hamzat al-Wasl',
  n: 'Noon Sakinah',
  f: 'Idgham bi Ghunnah',
  o: 'Madd Wajib',
  g: 'Ghunnah',
  p: 'Madd Asli',
  s: 'Sukoon',
  a: 'Ikhfa',
  q: 'Qalqala',
  l: 'Lam Al-Ta\'rif',
  u: 'Ikhfa Tanween',
  w: 'Idgham Meem',
  i: 'Ikhfa Shafawi',
  c: 'Ikhfa Meem',
  m: 'Madd Lazim',
  d: 'Idgham',
  b: 'Idgham bila Ghunnah',
};

const LEGEND_PRIORITY = ['g', 'q', 'a', 'n', 'f', 'p', 'o', 'l', 's', 'm', 'b'];

export const TAJWEED_LEGEND = LEGEND_PRIORITY.map(code => ({
  code,
  name: TAJWEED_NAMES[code],
  color: TAJWEED_COLORS[code],
}));

export function parseTajweedText(text) {
  const segments = [];
  let lastIndex = 0;
  let match;

  RULE_REGEX.lastIndex = 0;

  while ((match = RULE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), color: null });
    }
    segments.push({ text: match[2], color: TAJWEED_COLORS[match[1]] || null });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), color: null });
  }

  return segments;
}

export function stripTajweedMarkers(text) {
  return text.replace(RULE_REGEX, '$2');
}
