import React from 'react';

const PasswordChecklist = ({ password }) => {
  // Define rules with their checking logic
  const rules = [
    {
      label: 'At least 8 characters',
      check: () => password.length >= 8
    },
    {
      label: 'Contains uppercase letter',
      check: () => /[A-Z]/.test(password)
    },
    {
      label: 'Contains lowercase letter',
      check: () => /[a-z]/.test(password)
    },
    {
      label: 'Contains number',
      check: () => /\d/.test(password)
    },
    {
      label: 'Contains special character',
      check: () => /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  ];

  // Compute strength from rules

  return (
    <div style={{ marginTop: '8px', marginBottom: '12px' }}>

      {/* Password Checklist */}
      <ul
        style={{
          margin: '0',
          paddingLeft: '0',
          listStyle: 'none',
          fontSize: '13px',
          lineHeight: '1.6',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        {rules.map((rule, idx) => {
          const isMet = password && rule.check();
          return (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: isMet ? '#15803d' : '#1e293b',
                fontWeight: isMet ? '700' : '500',
                transition: 'color 0.3s ease'
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  borderRadius: '50%',
                  backgroundColor: isMet ? 'rgba(22, 163, 74, 0.15)' : '#f1f5f9',
                  border: isMet ? '1.5px solid #16a34a' : '1.5px solid #cbd5e1',
                  color: isMet ? '#16a34a' : '#94a3b8',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  transition: 'all 0.3s ease'
                }}
              >
                {isMet ? '✓' : ''}
              </span>
              <span style={{ color: isMet ? '#15803d' : '#334155' }}>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordChecklist;
