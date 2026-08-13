/** Lotin → kirill o'girish (o'zbek alifbosi). Dizayndagi jadval bilan bir xil. */

const DIGRAPHS: Record<string, string> = {
  "o'": 'ў',
  "g'": 'ғ',
  sh: 'ш',
  ch: 'ч',
  yo: 'ё',
  yu: 'ю',
  ya: 'я',
  ye: 'е',
  ts: 'ц',
};

const LETTERS: Record<string, string> = {
  a: 'а',
  b: 'б',
  c: 'к',
  d: 'д',
  e: 'е',
  f: 'ф',
  g: 'г',
  h: 'ҳ',
  i: 'и',
  j: 'ж',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  q: 'қ',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  v: 'в',
  w: 'в',
  x: 'х',
  y: 'й',
  z: 'з',
  "'": 'ъ',
};

const isLatinLetter = (ch: string | undefined): boolean => /[a-z']/.test(ch ?? '');

export function toCyrillic(text: string): string {
  if (!text) return text;
  const source = String(text).replace(/[ʻʼ’‘`]/g, "'");
  const low = source.toLowerCase();
  let out = '';
  let i = 0;

  while (i < source.length) {
    const atStart = i === 0 || !isLatinLetter(low[i - 1]);
    const two = low.substr(i, 2);
    let cyr: string | null;
    let len = 1;

    if (DIGRAPHS[two]) {
      cyr = DIGRAPHS[two];
      len = 2;
    } else if (low[i] === 'e') {
      cyr = atStart ? 'э' : 'е';
    } else {
      cyr = low[i] in LETTERS ? LETTERS[low[i]] : null;
    }

    if (cyr === null) {
      out += source[i];
      i += 1;
      continue;
    }
    const ch = source[i];
    if (ch !== ch.toLowerCase() && ch === ch.toUpperCase()) {
      cyr = cyr.charAt(0).toUpperCase() + cyr.slice(1);
    }
    out += cyr;
    i += len;
  }
  return out;
}
