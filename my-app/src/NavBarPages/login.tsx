import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google'
import type { TokenResponse } from '@react-oauth/google'
import axios from 'axios'
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './login.css'
import LBDLogo from '../assets/LBDLogo-removebg-preview.png';

// Use relative path '' when on localhost to leverage the Vite proxy (vite.config.ts)
// Otherwise use the environment variable (for production)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000');

console.log('Login Component configured with API_BASE:', API_BASE || '(Relative Proxy)');
console.log('Is Local:', isLocal);

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function login({ isOpen, onClose }: LoginModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [showVerificationStep, setShowVerificationStep] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [, setShowSuccessPopup] = useState<boolean>(false);

  // Custom Google Login Hook
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse: TokenResponse) => {
      try {
        setLoading(true);
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
        setLoading(false);
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
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

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
    } finally {
      setLoading(false);
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
              {t('login.welcomeTagline')}
            </h1>

            <div className="login_options">
              <button
                className="google_custom_button"
                onClick={() => loginWithGoogle()}
                disabled={loading}
              >
                <img
                  src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                  alt="Google"
                  className="google_icon"
                />
                {t('login.continueGoogle')}
              </button>

              <button
                className="email_option_button"
                onClick={() => setShowEmailForm(true)}
                disabled={loading}
              >
                <MailOutlineIcon className="email_icon" />
                {t('login.continueEmail')}
              </button>
            </div>

            {error && (
              <div className="login_error">
                <p>{error}</p>
              </div>
            )}

            <div className="login_footer">
              <p>
                By proceeding, you agree to our <Link to="/terms" target="_blank" rel="noopener noreferrer" className="footer_link">Terms of Use</Link> and confirm you have read our <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="footer_link">Privacy and Cookie Statement</Link>.
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
              disabled={loading}
            >
              <ArrowBackIcon />
              <span>{t('login.back')}</span>
            </button>
            <div className="email_header">
              <h1>{showVerificationStep ? t('login.checkInbox') : t('login.signInUp')}</h1>
            </div>

            {!showVerificationStep ? (
              <div className="field_group">
                <label className="field_label">{t('login.emailLabel')}</label>
                <input
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  name="email"
                  className="input_field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                />
                <p style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                  {t('login.emailHint')}
                </p>
              </div>
            ) : (
              <div className="field_group">
                <label className="field_label">{t('login.codeLabel')}</label>
                <p style={{ marginBottom: '15px', fontSize: '14px', color: '#555' }}>
                  <Trans
                    i18nKey="login.codeHint"
                    values={{ email }}
                    components={{ bold: <strong /> }}
                  />
                </p>
                <input
                  type="text"
                  placeholder={t('login.codePlaceholder')}
                  name="code"
                  className="input_field"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  autoFocus
                  maxLength={6}
                  disabled={loading}
                />
              </div>
            )}

            {error && (
              <div className="login_error">
                <p>{error}</p>
              </div>
            )}

            <div className="primary_action">
              <button type="submit" className="primary_button" disabled={loading}>
                {loading ? (showVerificationStep ? t('login.verifying') : t('login.sending')) : (showVerificationStep ? t('login.verifyContinue') : t('login.sendCode'))}
              </button>
            </div>

            <div className="login_footer_small">
              <p>
                <Trans
                  i18nKey="login.terms"
                  components={{ 
                    terms: <Link to="/terms" target="_blank" rel="noopener noreferrer" className="footer_link" />,
                    privacy: <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="footer_link" />
                  }}
                />
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default login