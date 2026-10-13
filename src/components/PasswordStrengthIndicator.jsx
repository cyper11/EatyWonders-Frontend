import React, { useEffect, useState } from 'react';
import api from '../api/backend';

const PasswordStrengthIndicator = ({ password, showErrors = true }) => {
  const [validation, setValidation] = useState({
    isValid: false,
    errors: [],
    strength: 0,
    strengthLevel: 'Weak',
    strengthColor: '#ef4444'
  });
  const [loading, setLoading] = useState(false);

  const calculateLocalStrength = (p) => {
    if (!p) return { strength: 0, strengthLevel: 'Weak', strengthColor: '#ef4444', errors: [], isValid: false };
    
    let strength = 0;
    const errors = [];
    
    if (p.length < 8) errors.push('Password must be at least 8 characters long');
    else strength += 25;
    
    if (!/[A-Z]/.test(p)) errors.push('Password must contain at least one uppercase letter (A-Z)');
    else strength += 20;
    
    if (!/[a-z]/.test(p)) errors.push('Password must contain at least one lowercase letter (a-z)');
    else strength += 20;
    
    if (!/[0-9]/.test(p)) errors.push('Password must contain at least one number (0-9)');
    else strength += 20;
    
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)) errors.push('Password must contain at least one special character');
    else strength += 15;
    
    let level = 'Weak';
    let color = '#ef4444';
    
    if (strength >= 100) { level = 'Strong'; color = '#22c55e'; }
    else if (strength >= 70) { level = 'Good'; color = '#eab308'; }
    else if (strength >= 40) { level = 'Fair'; color = '#f97316'; }
    
    return { strength, strengthLevel: level, strengthColor: color, errors, isValid: errors.length === 0 };
  };

  useEffect(() => {
    // 1. Immediate frontend calculation
    const localResult = calculateLocalStrength(password);
    setValidation(localResult);

    if (!password) return;

    // 2. Async backend validation to ensure sync
    const validatePasswordAsync = async () => {
      setLoading(true);
      try {
        const { data } = await api.post('/auth/validate-password', { password });
        // Update with backend data if it differs (safety net)
        setValidation(data);
      } catch (err) {
        console.error('Password validation failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(validatePasswordAsync, 500);
    return () => clearTimeout(debounceTimer);
  }, [password]);

  if (!password) return null;

  return (
    <div style={{ marginTop: '8px', marginBottom: '12px' }}>
      {/* Strength Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div
          style={{
            flex: 1,
            height: '4px',
            backgroundColor: '#e5e7eb',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${validation.strength}%`,
              backgroundColor: validation.strengthColor,
              transition: 'width 0.3s ease, background-color 0.3s ease'
            }}
          />
        </div>
        <span
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: validation.strengthColor,
            minWidth: '60px',
            textAlign: 'right'
          }}
        >
          {loading ? 'Checking...' : validation.strengthLevel}
        </span>
      </div>

      {/* Error Messages */}
      {showErrors && validation.errors.length > 0 && (
        <ul
          style={{
            margin: '0',
            paddingLeft: '20px',
            listStyle: 'none',
            fontSize: '12px',
            color: '#dc2626',
            lineHeight: '1.4'
          }}
        >
          {validation.errors.map((error, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>
              • {error}
            </li>
          ))}
        </ul>
      )}

      {/* Success Message */}
      {showErrors && validation.isValid && validation.errors.length === 0 && (
        <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '500' }}>
          ✓ Password strength is {validation.strengthLevel}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
