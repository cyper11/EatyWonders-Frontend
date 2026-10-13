import { useEffect } from 'react';

/**
 * Custom hook to update the document title.
 * @param {string} title - The title to set.
 * @param {boolean} [persistent=false] - If true, the title won't be suffixed with " | Eaty Wonders".
 */
const useDocumentTitle = (title, persistent = false) => {
  useEffect(() => {
    const baseTitle = 'Eaty Wonders';
    if (!title) {
      document.title = baseTitle;
    } else {
      document.title = persistent ? title : `${title} | ${baseTitle}`;
    }
  }, [title, persistent]);
};

export default useDocumentTitle;
