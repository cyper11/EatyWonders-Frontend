import React from 'react';

const Icons = {
  X: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  File: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
};

const DocumentsModal = ({ app, onCancel }) => {
  const documents = [
    { label: 'Business Registration (DTI/SEC)', url: app.businessRegistrationUrl, id: 'reg' },
    { label: 'Barangay Business Clearance', url: app.barangayClearanceUrl, id: 'barangay' },
    { label: 'Valid Government ID', url: app.idUrl, id: 'id' },
    { label: 'BIR Registration', url: app.birUrl, id: 'bir' },
  ].filter(doc => doc.url);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-dvh px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm" 
          aria-hidden="true"
          onClick={onCancel}
        ></div>

        {/* Modal content */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-surface border border-background-tertiary rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-background-tertiary">
            <div>
              <h3 className="text-xl font-bold text-content-primary">Legal Documents</h3>
              <p className="text-sm text-content-secondary">
                {app.name} — {app.applicantName}
                {app.businessRegDate && (
                  <span className="ml-2 px-2 py-0.5 bg-brand-accent/10 text-brand-accent text-xs rounded-full">
                    Reg: {new Date(app.businessRegDate).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-background-tertiary text-content-secondary transition-colors"
            >
              <Icons.X />
            </button>
          </div>

          <div className="p-6">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-content-secondary">No documents uploaded for this application.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex flex-col gap-3 p-4 rounded-2xl border border-background-tertiary bg-background-secondary shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent">
                          <Icons.File />
                        </div>
                        <span className="font-bold text-content-primary">{doc.label}</span>
                      </div>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-background-tertiary text-content-secondary transition-colors"
                        title="Open in new tab"
                      >
                        <Icons.Download />
                      </a>
                    </div>
                    
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-background-tertiary bg-black/5">
                      <img 
                        src={doc.url} 
                        alt={doc.label}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x225?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-background-tertiary flex justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2 rounded-xl text-sm font-bold text-content-primary hover:bg-background-tertiary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsModal;
