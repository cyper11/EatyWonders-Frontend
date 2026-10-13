import React from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

const NotFound = () => {
  useDocumentTitle('Page not found');
  return (
    <section className="min-h-[60vh] grid place-items-center text-center py-16" aria-labelledby="nf-title">
      <div className="max-w-md">
        <h1 id="nf-title" className="m-0 font-display text-4xl sm:text-5xl font-semibold text-content-primary">
          Page not found
        </h1>
        <p className="mt-4 text-content-secondary text-lg">
          The link may be broken, or the page may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-full bg-brand-accent text-on-accent font-bold no-underline hover:bg-brand-strong transition-colors"
          >
            Back to home
          </Link>
          <Link
            to="/#map"
            className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-full border border-strong text-content-primary font-bold no-underline hover:border-brand-accent hover:text-brand-accent transition-colors"
          >
            Open the food map
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
