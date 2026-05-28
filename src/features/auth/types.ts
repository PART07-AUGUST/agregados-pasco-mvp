import type { User } from '../../shared/types';

export interface AuthState {
  user: User | null;
  sessionToken: string | null;
  loading: boolean;
  error: string | null;
}

