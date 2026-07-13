export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PROPOSAL_NEW: '/proposals/new',
  PROPOSAL_EDIT: '/proposals/:id',
  PROPOSAL_PREVIEW: '/proposals/:id/preview',
  PUBLIC_PROPOSAL: '/p/:token',
} as const
