import React, { useState } from 'react';

const STATUS_COLORS = {
  'Open': { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  'In Progress': { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  'Resolved': { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  'Closed': { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', dot: 'bg-gray-400' },
};

const CATEGORY_ICONS = {
  'Menu Verification': '🍽️',
  'Account Issue': '🔐',
  'Billing/Payouts': '💳',
  'Bug Report': '🐛',
  'Other': '📋',
};

const AdminTickets = ({ tickets = [], onResolve, onUpdateStatus, busyTicketId }) => {
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});

  const filtered = filter === 'all'
    ? tickets
    : tickets.filter(t => t.status === filter);

  const counts = {
    all: tickets.length,
    Open: tickets.filter(t => t.status === 'Open').length,
    'In Progress': tickets.filter(t => t.status === 'In Progress').length,
    Resolved: tickets.filter(t => t.status === 'Resolved').length,
    Closed: tickets.filter(t => t.status === 'Closed').length,
  };

  const handleStatusChange = (ticketId, newStatus) => {
    const notes = adminNotes[ticketId] || '';
    if (onUpdateStatus) {
      onUpdateStatus(ticketId, newStatus, notes);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'Open', 'In Progress', 'Resolved', 'Closed'].map(status => {
          const isActive = filter === status;
          const label = status === 'all' ? 'All Tickets' : status;
          const count = counts[status] || 0;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                  : 'bg-[var(--admin-bg-secondary)] text-[var(--admin-text-muted)] border border-transparent hover:bg-[var(--admin-bg-tertiary)] hover:text-[var(--admin-text-primary)]'
              }`}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                isActive ? 'bg-brand-accent/20 text-brand-accent' : 'bg-[var(--admin-bg-tertiary)] text-[var(--admin-text-muted)]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tickets List */}
      {filtered.length === 0 ? (
        <div className="admin-kpi-card text-center py-16">
          <div className="w-16 h-16 bg-[var(--admin-bg-tertiary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--admin-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-[var(--admin-text-muted)] font-medium">No {filter === 'all' ? '' : filter.toLowerCase()} tickets found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(ticket => {
            const colors = STATUS_COLORS[ticket.status] || STATUS_COLORS['Open'];
            const isExpanded = expandedId === ticket.id;
            const isBusy = busyTicketId === ticket.id;

            return (
              <div
                key={ticket.id}
                className={`admin-kpi-card transition-all duration-200 ${isExpanded ? 'ring-1 ring-brand-accent/30' : ''}`}
              >
                {/* Ticket Header */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Category Icon */}
                    <div className="w-10 h-10 rounded-xl bg-[var(--admin-bg-tertiary)] flex items-center justify-center text-lg flex-shrink-0">
                      {CATEGORY_ICONS[ticket.category] || '📋'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-bold text-[var(--admin-text-primary)] truncate max-w-md">
                          {ticket.subject}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {ticket.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--admin-text-muted)]">
                        <span className="font-medium">{ticket.user_name || ticket.user_email || 'Unknown User'}</span>
                        <span>·</span>
                        <span>{ticket.category}</span>
                        <span>·</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Resolve for open tickets */}
                  {ticket.status === 'Open' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(ticket.id, 'Resolved'); }}
                      disabled={isBusy}
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all flex-shrink-0 disabled:opacity-50"
                    >
                      {isBusy ? 'Updating...' : '✓ Resolve'}
                    </button>
                  )}

                  {/* Expand chevron */}
                  <svg
                    className={`w-5 h-5 text-[var(--admin-text-muted)] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[var(--admin-bg-tertiary)] space-y-4">
                    {/* Description */}
                    <div>
                      <h4 className="text-[10px] font-black text-[var(--admin-text-muted)] uppercase tracking-widest mb-2">Description</h4>
                      <p className="text-sm text-[var(--admin-text-primary)] leading-relaxed whitespace-pre-wrap bg-[var(--admin-bg-tertiary)] p-4 rounded-xl">
                        {ticket.description}
                      </p>
                    </div>

                    {/* Ticket Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-[var(--admin-bg-tertiary)] p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider mb-0.5">Ticket ID</p>
                        <p className="text-sm font-bold text-[var(--admin-text-primary)]">#{ticket.id}</p>
                      </div>
                      <div className="bg-[var(--admin-bg-tertiary)] p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider mb-0.5">Submitted</p>
                        <p className="text-sm font-bold text-[var(--admin-text-primary)]">
                          {new Date(ticket.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="bg-[var(--admin-bg-tertiary)] p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider mb-0.5">Last Updated</p>
                        <p className="text-sm font-bold text-[var(--admin-text-primary)]">
                          {new Date(ticket.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="bg-[var(--admin-bg-tertiary)] p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider mb-0.5">User Email</p>
                        <p className="text-sm font-bold text-[var(--admin-text-primary)] truncate">{ticket.user_email || '—'}</p>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {ticket.admin_notes && (
                      <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Admin Notes</h4>
                        <p className="text-sm text-[var(--admin-text-primary)]">{ticket.admin_notes}</p>
                      </div>
                    )}

                    {/* Admin Actions */}
                    <div className="space-y-3">
                      <textarea
                        placeholder="Add admin notes (optional)..."
                        value={adminNotes[ticket.id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                        rows={2}
                        className="w-full bg-[var(--admin-bg-tertiary)] border border-[var(--admin-bg-tertiary)] rounded-xl p-3 text-sm text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        {['Open', 'In Progress', 'Resolved', 'Closed'].map(status => {
                          if (status === ticket.status) return null;
                          const btnColors = STATUS_COLORS[status];
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(ticket.id, status)}
                              disabled={isBusy}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border disabled:opacity-50 ${btnColors.bg} ${btnColors.text} ${btnColors.border} hover:opacity-80`}
                            >
                              {isBusy ? 'Updating...' : `Mark as ${status}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
