const BLOCKED_PATTERNS = [
  // -------------------
  // ENGLISH (STRONG)
  // -------------------
  /\bf+u+c+k+\b/i,
  /\bs+h+i+t+\b/i,
  /\bb+i+t+c+h+\b/i,
  /\bb+a+s+t+a+r+d+\b/i,
  /\ba+s+s+h+o+l+e+\b/i,
  /\bm+o+t+h+e+r+f+u+c+k+e+r+\b/i,
  /\bd+i+c+k+\b/i,
  /\bp+u+s+s+y+\b/i,
  /\bc+u+n+t+\b/i,
  /\bs+l+u+t+\b/i,
  /\bw+h+o+r+e+\b/i,
  /\bd+a+m+n+\b/i,
  /\bf+u+c+k+e+r+\b/i,
  /\bn+i+g+g+a+\b/i,
  /\bn+i+g+g+e+r+\b/i,
  /\br+e+t+a+r+d+\b/i,

  // Obfuscated English (f*ck, sh!t, etc.)
  /f[\W_]*u[\W_]*c[\W_]*k/i,
  /s[\W_]*h[\W_]*i[\W_]*t/i,
  /b[\W_]*i[\W_]*t[\W_]*c[\W_]*h/i,

  // -------------------
  // SINHALA (UNICODE)
  // -------------------
  /හුත්ති/i,
  /හුකා/i,
  /පකයා/i,
  /වේසාව/i,
  /ගෑණු හුත්ති/i,
  /මෝඩයා/i,
  /පට්ට හුක/i,

  // -------------------
  // SINGLISH
  // -------------------
  /huththi/i,
  /hukanna/i,
  /huka/i,
  /pakaya/i,
  /wesawa/i,
  /modaya/i,
  /ponnaya/i,
  /balla/i,

  // Mixed Sinhala + English abusive patterns
  /huthth[iy]a/i,
  /huk[a@]nna/i,
];

// Normalize text (stronger than before)
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\sඅ-ෆ]/gi, ''); // keep Sinhala + English
};

// Main detection
const hasBlockedWord = (text = '') => {
  const normalized = normalizeText(text);

  return BLOCKED_PATTERNS.some((pattern) => pattern.test(normalized));
};

module.exports = {
  hasBlockedWord,
};
