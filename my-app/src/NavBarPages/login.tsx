import React, { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import type { TokenResponse } from '@react-oauth/google'
import axios from 'axios'
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import './login.css'
import LBDLogo from '../assets/LBDLogo-removebg-preview.png';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function login({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);

  // Custom Google Login Hook
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse: TokenResponse) => {
      try {
        // Send the access token to your backend to verify and create a session
        const response = await axios.post(`${API_BASE}/auth/google`, {
          // Note: using access_token instead of credential for useGoogleLogin
          access_token: tokenResponse.access_token,
        });

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          onClose();
          window.location.reload();
        }
      } catch (err: any) {
        console.error("Google Login Error:", err);
        setError(err.response?.data?.message || 'Google sign-in failed');
      }
    },
    onError: (error) => {
      console.error("Google Login Failed:", error);
      setError('Google sign-in failed');
    }
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setShowEmailForm(false);
    setError("");
    onClose();
  };

  /* Removed old handleGoogleSuccess as it's replaced by the hook above */



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = isRegistering ? `${API_BASE}/register` : `${API_BASE}/login`;
      const response = await axios.post(endpoint, {
        email,
        password
      });

      if (response.data.token) {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token);
        // Close modal and reload to update navbar state
        onClose();
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  }

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
  }

  //Login Modal
  return (
    <div className="login_modal_overlay" onClick={handleClose}>
      <div className="login_modal_container" onClick={(e) => e.stopPropagation()}>
        <button className="login_modal_close" onClick={handleClose}>×</button>

        {!showEmailForm ? (
          // Welcome Screen
          <div className="login_welcome">
            {/* Logo is kept but sized in CSS to match the clean aesthetic */}
            <div className="login_logo">
              <img src={LBDLogo} alt="LifeByDorm Logo" />
            </div>
            <h1 className="login_tagline">
              Sign in to unlock the <br /> best of LifeByDorm.
            </h1>

            <div className="login_options">
              <button
                className="google_custom_button"
                onClick={() => loginWithGoogle()}
              >
                <img
                  src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                  alt="Google"
                  className="google_icon"
                />
                Continue with Google
              </button>

              <button
                className="email_option_button"
                onClick={() => setShowEmailForm(true)}
              >
                <MailOutlineIcon className="email_icon" />
                Continue with email
              </button>
            </div>

            {error && (
              <div className="login_error">
                <p>{error}</p>
              </div>
            )}

            <div className="login_footer">
              <p>
                By proceeding, you agree to our <span className="footer_link">Terms of Use</span> and confirm you have read our <span className="footer_link">Privacy and Cookie Statement</span>.
              </p>
            </div>
          </div>
        ) : (
          // Email Form
          <form onSubmit={handleSubmit}>
            <button
              type="button"
              className="back_button"
              onClick={() => setShowEmailForm(false)}
            >
              ← Back
            </button>

            <div className="login_logo">
              <img src={LBDLogo} alt="LifeByDorm Logo" />
            </div>

            <h2 className="login_form_title">{isRegistering ? 'Create Account' : 'Sign In'}</h2>

            <div className="login_email">
              <h2> Email: </h2>
              <input
                type="text"
                placeholder="Enter Email"
                name="email"
                className="login_typing"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="login_password">
              <h2> Password: </h2>
              <input
                type="password"
                placeholder="Enter Password"
                name="password"
                className="login_typing"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="login_error">
                <p>{error}</p>
              </div>
            )}
            <div className="login_button">
              <button type="submit">
                {isRegistering ? 'Register' : 'Sign In'}
              </button>
            </div>

            <div className="login_signup">
              <p onClick={toggleMode}>
                {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create one!"}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default login