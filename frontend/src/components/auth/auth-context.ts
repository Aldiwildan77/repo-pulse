import { createContext } from "react";

export interface UserIdentity {
  provider: string;
  providerUserId: string;
  providerEmail: string | null;
  providerUsername: string | null;
}

export interface User {
  id: number;
  providerUserId: string | null;
  providerUsername: string | null;
  discordBound: boolean;
  slackBound: boolean;
  githubBound: boolean;
  googleBound: boolean;
  googleEmail: string | null;
  gitlabBound: boolean;
  gitlabUsername: string | null;
  totpEnabled: boolean;
  identities: UserIdentity[];
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
