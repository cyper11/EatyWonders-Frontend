const TAG_RULES = [
  {
    tags: ['Vegan', 'Vegetarian'],
    pattern: /\b(vegan|plant-based|no meat|veggie)\b/i,
  },
  {
    tags: ['Halal'],
    pattern: /\bhalal\b/i,
  },
  {
    tags: ['Allergen Warning'],
    pattern: /\b(peanut|nuts|seafood|shrimp|shellfish)\b/i,
  },
];

export function autoDetectTags(text) {
  const haystack = String(text || '');
  return TAG_RULES.flatMap((rule) => (rule.pattern.test(haystack) ? rule.tags : []))
    .filter((tag, index, tags) => tags.indexOf(tag) === index);
}

export default autoDetectTags;
