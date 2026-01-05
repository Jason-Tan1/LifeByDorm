import React, { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
import axios from 'axios'
import './login.css'

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

  if (!isOpen) return null;

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/google`, {
        credential: credentialResponse.credential,
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        onClose();
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google sign-in failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const endpoint = isRegistering ? 'http://localhost:3000/register' : 'http://localhost:3000/login';
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
    <div className="login_modal_overlay" onClick={onClose}>
      <div className="login_modal_container" onClick={(e) => e.stopPropagation()}>
        <button className="login_modal_close" onClick={onClose}>×</button>
        <form onSubmit={handleSubmit}> 
          <h1>LifeByDorm</h1>
          <div className = "login_email"> 
            <h2> Email: </h2>
            <input
              type="text" 
              placeholder = "Enter Email"
              name = "email"
              className = "login_typing"
              onChange = {(e) => setEmail(e.target.value)}
            />
          </div>
          <div className = "login_password">
            <h2> Password: </h2>
            <input 
              type="password"
              placeholder = "Enter Password"
              name = "password"
              className = "login_typing"
              onChange = {(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="login_error">
              <p>{error}</p>
            </div>
          )}
          <div className="login_button">
            <button type="submit">
              {isRegistering ? 'Register' : 'Log In'}
            </button>
          </div>
          
          <div className="login_divider">
            <span>or</span>
          </div>
          
          <div className="google_login_button">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed')}
              useOneTap
              shape="rectangular"
              size="large"
              width="100%"
              text="continue_with"
            />
          </div>
          
          <div className="login_signup">
            <button type="button" onClick={toggleMode}>
              {isRegistering ? 'Already have an account? Log in' : 'Create a new account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default login