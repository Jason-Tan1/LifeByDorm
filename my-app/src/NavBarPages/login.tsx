import React, { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import type { TokenResponse } from '@react-oauth/google'
import axios from 'axios'
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);

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
          setShowSuccessPopup(true);
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 2000);
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
              Become Verified and<br /> unlock the best of LifeByDorm.
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
          // Email Form (replicates screenshot layout)
          <form onSubmit={handleSubmit} className="email_screen">
            <button 
              type="button" 
              className="back_button" 
              onClick={() => setShowEmailForm(false)}
            >
              <ArrowBackIcon />
              <span>Back</span>
            </button>
            <div className="email_header">
              <h1>{isRegistering ? "Create an account" : "Welcome back."}</h1>
            </div>

            <div className="field_group">
              <label className="field_label">Email address</label>
              <input
                type="email"
                placeholder="Email"
                name="email"
                className="input_field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field_group">
              <label className="field_label">Password</label>
              <div className="password_wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  name="password"
                  className="input_field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password_toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </button>
              </div>
            </div>

            <div className="forgot_row">
              <a className="forgot_link" href="#">Forgot password?</a>
            </div>

            {error && (
              <div className="login_error">
                <p>{error}</p>
              </div>
            )}

            <div className="primary_action">
              <button type="submit" className="primary_button">{isRegistering ? "Create account" : "Sign in"}</button>
            </div>

            <div className="member_separator">
              <span className="line" />
              <span className="member_text">{isRegistering ? "Already a member?" : "Not a member?"}</span>
              <span className="line" />
            </div>

            <div className="join_row">
              <a 
                className="join_link" 
                href="#" 
                onClick={(e) => { e.preventDefault(); toggleMode(); }}
              >
                {isRegistering ? "Sign in to LifeByDorm" : "Join to unlock the best of LifeByDorm."}
              </a>
            </div>

            <div className="login_footer_small">
              <p>
                By proceeding, you agree to our Terms of Use and confirm you have read our <span className="footer_link">Privacy and Cookie Statement</span>.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default login