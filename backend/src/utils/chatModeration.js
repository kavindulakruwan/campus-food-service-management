const BLOCKED_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'bastard',
  'asshole',
  'motherfucker',
  'dick',
  'pussy',
  'cunt',
  'slut',
  'whore',
  'damn',
  'fucker',
  'nigga',
  'nigger',
  'retard',
];

const normalizeWord = (value) => value.toLowerCase().replace(/[^a-z]/g, '');

const hasBlockedWord = (text = '') => {
  const tokens = text
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  return tokens.some((token) => BLOCKED_WORDS.includes(token));
};

module.exports = {
  hasBlockedWord,
};
