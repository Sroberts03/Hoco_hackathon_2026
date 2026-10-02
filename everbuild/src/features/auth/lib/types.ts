export type Role = "creator" | "company";

/** The signed-in user with their Everbuild profile. */
export type Viewer = {
  id: string;
  email: string;
  role: Role;
  displayName: string;
  isVerifiedCompany: boolean;
};

/** State returned by the auth Server Actions to their forms. */
export type AuthFormState = {
  error?: string;
  notice?: string;
  fields?: Record<string, string>;
};
