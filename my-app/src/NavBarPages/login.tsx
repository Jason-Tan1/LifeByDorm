import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios'
import './login.css'

function login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const location = useLocation();
  const [isAdminFlow, setIsAdminFlow] = useState<boolean>(false);

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
        // Force a reload to update the navbar state
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  }

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
  }

  React.useEffect(() => {
    const qs = new URLSearchParams(location.search);
    setIsAdminFlow(qs.get('admin') === 'true');
  }, [location.search]);

  return (
    <div className = "login">
      <div className = "login_container">
        <form onSubmit={handleSubmit}> 
          <Link to="/">LifeByDorm</Link>
          <Link to="/login?admin=true" className="admin-button">Admin</Link>
          {isAdminFlow && (
            <div style={{ marginTop: 8, color: '#b45309', fontWeight: 600 }}>
              Admin login — please sign in with an admin account
            </div>
          )}
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