import { createContext } from "react";

export interface User {
  providerUserId: string;
  providerUsername: string;
  discordBound: boolean;
  slackBound: boolean;
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
