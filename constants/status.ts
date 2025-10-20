export const STATUS_LABELS = {
    'em conformidade': 'Em Conformidade',
    'inadimplente': 'Inadimplente'
  } as const;
  
  export const STATUS_COLORS = {
    'em conformidade': {
      bg: 'bg-secondary',
      text: 'text-white',
      border: 'border-secondary'
    },
    'inadimplente': {
      bg: 'bg-danger',
      text: 'text-white',
      border: 'border-danger'
    }
  } as const;
  
  export type StatusType = keyof typeof STATUS_LABELS;