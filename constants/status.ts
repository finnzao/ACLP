export const STATUS_COLORS = {
  'em conformidade': {
    bg: 'bg-secondary',
    text: 'text-white',
    border: 'border-secondary'
  },
  'EM_CONFORMIDADE': {
    bg: 'bg-secondary',
    text: 'text-white',
    border: 'border-secondary'
  },
  'inadimplente': {
    bg: 'bg-danger',
    text: 'text-white',
    border: 'border-danger'
  },
  'INADIMPLENTE': {
    bg: 'bg-danger',
    text: 'text-white',
    border: 'border-danger'
  }
} as const;

export const STATUS_LABELS = {
  'em conformidade': 'Em Conformidade',
  'EM_CONFORMIDADE': 'Em Conformidade',
  'inadimplente': 'Inadimplente',
  'INADIMPLENTE': 'Inadimplente'
} as const;

export type StatusType = keyof typeof STATUS_LABELS;