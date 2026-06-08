export const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'cafe', label: 'Cafe', emoji: '☕' },
  { id: 'study', label: 'Study', emoji: '📚' },
  { id: 'food', label: 'Food', emoji: '🍽️' },
  { id: 'hangout', label: 'Hangout', emoji: '🌿' },
  { id: 'event', label: 'Event', emoji: '🎶' },
  { id: 'other', label: 'Other', emoji: '📍' },
];

export const getCategoryMeta = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];