/**
 * React Query Keys
 */

export const queryKeys = {
  all: ["query"],
  auth: {
    all: ["auth"],
    me: ["auth", "me"],
  },
  users: {
    all: ["users"],
    profile: ["users", "profile"],
    detail: (id: string) => ["users", "detail", id],
  },
};
