/** Every in-app URL in one place. */
export const routes = {
  root: "/",
  signup: "/signup",
  login: "/login",
  mfaChallenge: "/login/2-step",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  /** Forced 2-step login setup once the deadline has passed (D-039). */
  mfaSetup: "/setup/2-step",
  newBrand: "/brands/new",
  invitation: (token: string) => `/invitations/${encodeURIComponent(token)}`,
  brandHome: (brandId: string) => `/${brandId}/home`,
  brandSection: (brandId: string, section: string) => `/${brandId}/${section}`,
  team: (brandId: string) => `/${brandId}/settings/team`,
  security: (brandId: string) => `/${brandId}/settings/security`,
} as const;
