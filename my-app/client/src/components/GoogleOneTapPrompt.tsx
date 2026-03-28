import { useState } from 'react';
import { useGoogleOneTapLogin } from '@react-oauth/google';
import Toast from './Toast';
import './GoogleOneTapPrompt.css';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

export function GoogleOneTapPrompt() {
  const [error, setError] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  const showError = (msg: string) => {
    setError(msg);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      try {
        if (!credentialResponse.credential) {
          throw new Error('No credential received');
        }

        const res = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: credentialResponse.credential }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Google sign-in failed');

        if (data.token) {
          localStorage.setItem('token', data.token);
          window.location.reload();
        }
      } catch (err: any) {
        console.error("Google One Tap Error:", err);
        showError(err.message || 'Google sign-in failed');
      }
    },
    onError: () => {
      console.error("Google One Tap Failed");
    },
    disabled: isLoggedIn, // Don't show if already logged in
    auto_select: false,
    cancel_on_tap_outside: false,
    use_fedcm_for_prompt: false, // Turn off browser-native prompt to allow CSS positioning
    prompt_parent_id: 'lbd-google-onetap-container',
  });

  return (
    <>
      {!isLoggedIn && (
        <div className="onetap-container">
          <div className="onetap-inner">
            <div id="lbd-google-onetap-container" style={{ position: 'relative', marginTop: '12px' }}></div>
          </div>
        </div>
      )}
      <Toast open={snackbarOpen} message={error} severity="error" onClose={handleSnackbarClose} />
    </>
  );
}

export default GoogleOneTapPrompt;
