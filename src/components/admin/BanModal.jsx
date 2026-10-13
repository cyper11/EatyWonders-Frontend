import React, { useState } from 'react';
import './admin-theme.css';

const BanModal = ({ userName, onConfirm, onCancel }) => {
  const [days, setDays] = useState(10);
  const [reason, setReason] = useState('');

  const presetDurations = [
    { label: '3 Days', value: 3 },
    { label: '7 Days', value: 7 },
    { label: '14 Days', value: 14 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: '1 Year', value: 365 },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(days, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-content-primary">Ban User</h3>
              <p className="text-content-secondary font-medium text-sm">
                Suspending: <span className="font-bold text-content-primary">{userName}</span>
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-6">
            {/* Duration Selection */}
            <div>
              <label className="font-bold text-content-primary text-sm mb-3 block">Ban Duration</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {presetDurations.map((duration) => (
                  <button
                    key={duration.value}
                    type="button"
                    onClick={() => setDays(duration.value)}
                    className={`py-2.5 rounded-xl font-bold transition-all duration-200 ${
                      days === duration.value
                        ? 'bg-red-500 text-white border-transparent shadow-md'
                        : 'bg-background-secondary border border-border-subtle text-content-primary hover:bg-background-tertiary'
                    }`}
                  >
                    {duration.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Duration Input */}
            <div>
              <div className="flex items-center gap-3 mt-4">
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  className="w-24 px-4 py-2.5 bg-background-primary border border-border-subtle rounded-xl text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                <span className="text-content-secondary font-medium">custom days</span>
              </div>
              <p className="text-xs text-content-secondary mt-2 opacity-70">
                User will be banned until {new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="font-bold text-content-primary text-sm mb-1 block">
                Reason for Ban <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the mandatory reason for banning this user..."
                className="w-full min-h-[120px] p-4 bg-background-primary border border-border-subtle rounded-xl text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none mt-2"
                required
              />
            </div>

            {/* Warning Message */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-2">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-amber-500">
                <p className="font-bold">Warning</p>
                <p className="mt-0.5">This action will prevent the user from logging in. They will see a ban message when attempting to access their account.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold bg-background-secondary text-content-primary hover:bg-background-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold transition-all duration-200 ${
                !reason.trim() 
                  ? 'bg-background-tertiary text-content-secondary cursor-not-allowed' 
                  : 'bg-red-500 text-white hover:bg-red-600 shadow-md'
              }`}
            >
              Ban User for {days} Day{days !== 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BanModal;
