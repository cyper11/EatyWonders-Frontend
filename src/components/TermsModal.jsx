import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { TERMS_AND_CONDITIONS_SECTIONS } from '../utils/legalConstants';

const TermsModal = ({ onClose, onAgree }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contentRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    // Only update state if we just reached the bottom (not already at bottom)
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 5 || scrollHeight <= clientHeight;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  }, [hasScrolledToBottom]);

  // Auto-enable if content fits without scrolling
  useEffect(() => {
    const el = contentRef.current;
    if (el && el.scrollHeight <= el.clientHeight) {
      setHasScrolledToBottom(true);
    }
  }, []);

  const handleAgree = () => {
    onAgree();
    setHasScrolledToBottom(false);
  };

  const handleClose = () => {
    onClose();
    setHasScrolledToBottom(false);
  };

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        padding: '24px',
        fontFamily: "'Poppins', 'Inter', system-ui, -apple-system, sans-serif",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 32px 24px',
            borderBottom: '1px solid #e8ebe6',
            background: 'linear-gradient(135deg, #f0f7ec 0%, #f8faf7 100%)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  backgroundColor: 'rgba(47, 138, 47, 0.1)',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#2f8a2f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: '12px',
                }}
              >
                📋 Legal Document
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#1a2e1a',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.2,
                }}
              >
                Terms & Conditions
              </h2>
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '13px',
                  color: '#6b7c6b',
                  fontWeight: '500',
                }}
              >
                Please read the following terms carefully before proceeding
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64736b',
                fontSize: '18px',
                fontWeight: '400',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(0,0,0,0.05)'; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 32px',
          }}
        >
          {TERMS_AND_CONDITIONS_SECTIONS.map((section, index) => (
            <div key={index} style={{ marginBottom: '24px' }}>
              {section.title && (
                <h3
                  style={{
                    margin: index === 0 ? '0 0 10px' : '28px 0 10px',
                    fontSize: '15px',
                    fontWeight: '700',
                    color: '#1a2e1a',
                    letterSpacing: '-0.1px',
                    lineHeight: 1.4,
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e8f0e4',
                  }}
                >
                  {section.title}
                </h3>
              )}
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#3d4f3d',
                  lineHeight: 1.75,
                  letterSpacing: '0.01em',
                }}
              >
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '18px 32px',
            borderTop: '1px solid #e8ebe6',
            backgroundColor: '#fafbf9',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '10px 22px',
              backgroundColor: '#f0f2ee',
              color: '#3d4f3d',
              border: '1px solid #d8ddd5',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.target.style.backgroundColor = '#e5e8e2'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = '#f0f2ee'; }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleAgree}
            disabled={!hasScrolledToBottom}
            style={{
              padding: '10px 24px',
              backgroundColor: hasScrolledToBottom ? '#2f8a2f' : '#c0c7be',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed',
              opacity: hasScrolledToBottom ? 1 : 0.7,
              transition: 'all 0.2s ease',
              boxShadow: hasScrolledToBottom ? '0 4px 12px rgba(47, 138, 47, 0.3)' : 'none',
            }}
            onMouseEnter={(e) => { if (hasScrolledToBottom) e.target.style.backgroundColor = '#257425'; }}
            onMouseLeave={(e) => { if (hasScrolledToBottom) e.target.style.backgroundColor = '#2f8a2f'; }}
          >
            I have read and agree
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default TermsModal;
