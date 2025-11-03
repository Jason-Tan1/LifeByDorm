import React from 'react'
import { Link } from 'react-router-dom';
import './login.css'

function login() {
  return (
    <div className = "login">
      <div className = "login_container">
        <Link to ="/"> 
          <a> LifeByDorm </a>
        </Link>
        <div className = "login_email"> 
          <h2> Email: </h2>
           <input type="text" />
        </div>
        <div className = "login_password">
          <h2> Password: </h2>
          <input type="password" />
        </div>
        <div className  = "login_button">
          <button> Log In </button>
        </div>
        <div className = "login_signup">
          <button> Create a new account </button>
        </div>
      </div>
    </div>
  )
}

export default login