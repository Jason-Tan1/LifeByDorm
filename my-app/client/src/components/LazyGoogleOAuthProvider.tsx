import { GoogleOAuthProvider } from '@react-oauth/google';
import type { ReactNode } from 'react';

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

export default function LazyGoogleOAuthProvider({ children }: { children: ReactNode }) {
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
