export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return;
  }

  window.addEventListener('load', () => {
    const serviceWorkerUrl = new URL(`${import.meta.env.BASE_URL}sw.js`, window.location.href);

    navigator.serviceWorker
      .register(serviceWorkerUrl.toString(), { scope: import.meta.env.BASE_URL })
      .catch((error) => {
        console.warn('Nie udalo sie zarejestrowac service workera.', error);
      });
  });
}
