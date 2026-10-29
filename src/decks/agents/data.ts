// Shared between the slides and the 3D world (kept apart so slides don't pull in Three.js).
export const LOOP = ['Goal', 'Plan', 'Act', 'Check'] as const
export const LOOP_COLORS = ['#00e5ff', '#b6ff3b', '#ff2bd6', '#ffd23f']
export const TOOLS = [
  { icon: '🔍', name: 'Search' },
  { icon: '📅', name: 'Calendar' },
  { icon: '✉️', name: 'Email' },
  { icon: '📁', name: 'Files' },
  { icon: '💻', name: 'Code' },
]
export const EVERYDAY = [
  { icon: '✈️', name: 'Plan a trip' },
  { icon: '📥', name: 'Sort my inbox' },
  { icon: '📚', name: 'Research homework' },
  { icon: '🎮', name: 'Build a game' },
]
