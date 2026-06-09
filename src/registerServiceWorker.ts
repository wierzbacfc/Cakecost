export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return;
  }

  window.addEventListener('load', () => {
    const serviceWorkerUrl = new URL('sw.js', window.location.href);
    const serviceWorkerScope = new URL('./', window.location.href);

    navigator.serviceWorker
      .register(serviceWorkerUrl.toString(), { scope: serviceWorkerScope.pathname })
      .catch((error) => {
        console.warn('Nie udalo sie zarejestrowac service workera.', error);
      });
  });
}
