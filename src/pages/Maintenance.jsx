import React, { useState, useEffect } from 'react';
import { Construction, Clock, RefreshCw, Zap, Server, Globe } from 'lucide-react';
import api from '../api/backend';

const Maintenance = () => {
  const [status, setStatus] = useState({
    maintenanceMode: true,
    maintenanceReason: 'System update in progress',
    maintenanceStartedAt: null,
    lastBuild: null,
  });
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Fetch maintenance status
  const fetchStatus = async () => {
    try {
      const response = await api.get('/api/webhooks/maintenance-status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchStatus();
    
    // Poll every 10 seconds for status updates
    const interval = setInterval(fetchStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate elapsed time
  useEffect(() => {
    if (!status.maintenanceStartedAt) return;

    const startTime = new Date(status.maintenanceStartedAt);
    
    const updateElapsed = () => {
      const now = new Date();
      const diff = Math.floor((now - startTime) / 1000);
      setElapsed(diff);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    
    return () => clearInterval(timer);
  }, [status.maintenanceStartedAt]);

  // Format elapsed time
  const formatElapsed = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Get status indicator color
  const getStatusColor = () => {
    if (loading) return 'bg-yellow-500';
    if (status.maintenanceMode) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Get status text
  const getStatusText = () => {
    if (loading) return 'Connecting...';
    if (status.maintenanceMode) {
      return status.maintenanceReason?.includes('Build') 
        ? 'Build in Progress' 
        : 'Maintenance Mode';
    }
    return 'System Online';
  };

  return (
    <div className="min-h-dvh bg-[var(--bg-dk-1)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Live Status Indicator */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center gap-3 px-5 py-3 bg-[var(--surface)] rounded-full shadow-lg border border-[var(--border-subtle)]">
            {/* Animated pulse dot */}
            <span className={`relative flex h-4 w-4 ${getStatusColor()}`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${getStatusColor()} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-4 w-4 ${getStatusColor()}`}></span>
            </span>
            
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--text-content-secondary)] uppercase tracking-wider">
                Live Status
              </span>
              <span className="text-sm font-bold text-[var(--text-content-primary)]">
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-center">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Construction className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Under Maintenance
              </h1>
              <p className="text-white/90 text-sm">
                New features are currently being served
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg-dk-2)] rounded-xl p-4 border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[var(--text-content-secondary)]" />
                  <span className="text-xs font-bold text-[var(--text-content-secondary)] uppercase">
                    Elapsed
                  </span>
                </div>
                <p className="text-lg font-bold text-[var(--text-content-primary)]">
                  {status.maintenanceStartedAt ? formatElapsed(elapsed) : '--'}
                </p>
              </div>

              <div className="bg-[var(--bg-dk-2)] rounded-xl p-4 border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-[var(--text-content-secondary)]" />
                  <span className="text-xs font-bold text-[var(--text-content-secondary)] uppercase">
                    Build ID
                  </span>
                </div>
                <p className="text-lg font-bold text-[var(--text-content-primary)] truncate">
                  {status.lastBuild ? `#${status.lastBuild.slice(-6)}` : '--'}
                </p>
              </div>
            </div>

            {/* Status Message */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Server className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-600 dark:text-amber-400 mb-1">
                    {status.maintenanceReason || 'System Update'}
                  </h3>
                  <p className="text-sm text-[var(--text-content-secondary)]">
                    Our team is deploying new features and improvements. 
                    The site will be back online shortly.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--bg-dk-2)] hover:bg-[var(--bg-dk-3)] text-[var(--text-content-primary)] font-bold rounded-xl transition-all duration-200 border border-[var(--border-subtle)] disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Checking...' : 'Check Status'}
              </button>

              <a
                href="mailto:support@eatywonders.com"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white font-bold rounded-xl transition-all duration-200"
              >
                <Globe className="w-4 h-4" />
                Contact Support
              </a>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-content-secondary)]">
                © {new Date().getFullYear()} Eaty Wonders. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Auto-refresh notice */}
        <p className="text-center text-xs text-[var(--text-content-secondary)] mt-4">
          Status automatically updates every 10 seconds
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
