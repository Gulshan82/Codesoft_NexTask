/**
 * Dynamically loads the Google Identity Services (GSI) client script
 * and resolves with the google object once loaded.
 */
export const loadGoogleScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.google && window.google.accounts) {
      resolve(window.google);
      return;
    }
    const id = 'google-gsi-client';
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => {
      resolve(window.google);
    });
    script.addEventListener('error', () => {
      console.error('Failed to load Google Identity Services script');
      resolve(null);
    });
  });
};
