import React, { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import type { TokenResponse } from '@react-oauth/google'
import axios from 'axios'
import MailOutlineIcon from '@mui/icons-material/MailOutline';
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
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [showVerificationStep, setShowVerificationStep] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
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
    setShowVerificationStep(false);
    setVerificationCode("");
    setEmail("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (!showVerificationStep) {
        // Step 1: Send Code
        await axios.post(`${API_BASE}/auth/send-code`, { email });
        setShowVerificationStep(true);
      } else {
        // Step 2: Verify Code
        const response = await axios.post(`${API_BASE}/auth/verify-code`, { 
            email, 
            code: verificationCode 
        });

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          setShowSuccessPopup(true);
          setTimeout(() => {
            handleClose();
            window.location.reload();
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
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
          // Email Form (Passwordless)
          <form onSubmit={handleSubmit} className="email_screen">
            <button 
              type="button" 
              className="back_button" 
              onClick={() => {
                  if (showVerificationStep) setShowVerificationStep(false);
                  else setShowEmailForm(false);
                  setError("");
              }}
            >
              <ArrowBackIcon />
              <span>Back</span>
            </button>
            <div className="email_header">
              <h1>{showVerificationStep ? "Check your inbox" : "Sign in or Sign up"}</h1>
            </div>

            {!showVerificationStep ? (
                <div className="field_group">
                  <label className="field_label">Email address</label>
                  <input
                    type="email"
                    placeholder="Email"
                    name="email"
                    className="input_field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <p style={{marginTop: '10px', fontSize: '13px', color: '#666'}}>
                      We'll email you a code to sign in without a password.
                  </p>
                </div>
            ) : (
                <div className="field_group">
                  <label className="field_label">Verification Code</label>
                  <p style={{marginBottom: '15px', fontSize: '14px', color: '#555'}}>
                      We sent a code to <strong>{email}</strong>. Enter it below.
                  </p>
                  <input
                    type="text"
                    placeholder="123456"
                    name="code"
                    className="input_field"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    autoFocus
                    maxLength={6}
                  />
                </div>
            )}

            {error && (
              <div className="login_error">
                <p>{error}</p>
              </div>
            )}

            <div className="primary_action">
              <button type="submit" className="primary_button">
                  {showVerificationStep ? "Verify & Continue" : "Send Code"}
              </button>
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