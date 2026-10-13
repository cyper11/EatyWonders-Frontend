import React from 'react';
import './StyleGuide.css';
import '../style/auth.css';
import Button from '../components/ui/Button';
import VeganBadge from '../components/VeganBadge';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTheme } from '../context/ThemeContext';

const ColorCard = ({ name, variable, value }) => (
  <div className="color-card">
    <div className="color-swatch" style={{ backgroundColor: `var(${variable})` }} />
    <div className="color-info">
      <strong>{name}</strong>
      <code>{variable}</code>
    </div>
  </div>
);

const StyleGuide = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="styleguide-page">
      <header className="styleguide-header">
        <h1>Design System</h1>
        <p>Eaty Wonders Semantic UI Tokens & Components</p>
        <Button variant="outline" onClick={toggleTheme} sx={{ mt: 2 }}>
          Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
        </Button>
      </header>

      <section className="styleguide-section">
        <h2>Colors & Theme</h2>
        <div className="color-grid">
          <ColorCard name="Background Primary" variable="--bg-primary" />
          <ColorCard name="Background Secondary" variable="--bg-secondary" />
          <ColorCard name="Surface" variable="--surface" />
          <ColorCard name="Accent" variable="--accent" />
          <ColorCard name="Text Primary" variable="--text-primary" />
          <ColorCard name="Text Secondary" variable="--text-secondary" />
          <ColorCard name="Auth Green" variable="--auth-green" />
          <ColorCard name="Auth Border" variable="--auth-border" />
        </div>
      </section>

      <section className="styleguide-section">
        <h2>Typography</h2>
        <div className="typography-sample">
          <h1>Heading 1 - Poppins ExtraBold</h1>
          <p>The quick brown fox jumps over the lazy dog. Poppins is our primary typeface for a modern, accessible feel.</p>
        </div>
        <div className="typography-sample">
          <h2>Heading 2 - Poppins Bold</h2>
          <p>Used for section headers and major navigation elements.</p>
        </div>
        <div className="typography-sample">
          <h3>Heading 3 - Poppins SemiBold</h3>
          <p>Used for card titles and component headers.</p>
        </div>
        <div className="typography-sample">
          <p><strong>Body Text</strong> - Standard reading text with optimized line-height for readability.</p>
          <p style={{ color: 'var(--text-secondary)' }}>Secondary Text - Used for metadata and less critical information.</p>
        </div>
      </section>

      <section className="styleguide-section">
        <h2>Buttons</h2>
        <div className="component-demo">
          <Button variant="primary">Primary Action</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="primary" disabled>Disabled Action</Button>
        </div>
      </section>

      <section className="styleguide-section">
        <h2>Auth Components</h2>
        <div className="auth-demo-grid">
          <div className="auth-card" style={{ width: '100%', margin: 0 }}>
            <div className="auth-header">
              <div className="auth-brand-mark">
                <RestaurantIcon />
              </div>
              <h1>Auth Header</h1>
              <p>Sample description for auth pages</p>
            </div>
            
            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <EmailOutlinedIcon />
                <input type="text" placeholder="you@example.com" />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <LockOutlinedIcon />
                <input type="password" placeholder="••••••••" />
              </div>
            </div>

            <button className="auth-submit-button">
              <span>Primary Submit</span>
              <ArrowForwardIcon />
            </button>

            <div className="auth-alert auth-alert-error">
              This is a sample error message.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="auth-alert" style={{ color: '#25652b', background: '#eef8e8', border: '1px solid #cce6c2' }}>
              Sample success or info message.
            </div>
            
            <div className="badge-demo">
              <VeganBadge label="Vegan-Friendly" />
              <VeganBadge label="Vegan Choice" />
            </div>

            <div className="auth-divider">
              <span>OR</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StyleGuide;
