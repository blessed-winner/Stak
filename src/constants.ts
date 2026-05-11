export const SPACING_SCALE = {
  4: '4px',
  8: '8px',
  12: '12px',
  16: '16px',
  24: '24px',
  32: '32px',
  48: '48px',
  64: '64px',
  96: '96px',
};

export const COLORS = {
  brand: '#C8FF00',
  brandDim: '#9BBF00',
  surfaceBase: '#0E0E11',
  surfaceRaised: '#16161A',
  surfaceOverlay: '#1E1E24',
  surfaceHover: '#252530',
};

export const ROUTES = {
  DASHBOARD: '/dashboard',
  PORTALS: '/portals',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PORTALS_NEW: '/portals/new',
  PORTAL_DETAIL: (id: string) => `/portals/${id}`,
  CLIENT_PORTAL: (editorSlug: string, portalSlug: string) => `/${editorSlug}/${portalSlug}`,
  SETTINGS: '/settings',
};
