
// src/components/Header.js
import React from 'react';

function Header({ onConfigClick }) {
  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <h1 className="navbar-item title is-4">Multiprompt</h1>
      </div>
      <div className="navbar-end">
        <div className="navbar-item">
          <button className="button is-primary" onClick={onConfigClick}>Config</button>
        </div>
      </div>
    </nav>
  );
}
export default Header;
