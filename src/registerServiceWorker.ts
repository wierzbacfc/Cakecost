let pendingServiceWorker: ServiceWorker | null = null;
let isReloadingForUpdate = false;

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return;
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (isReloadingForUpdate) {
      return;
    }

    isReloadingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    const serviceWorkerUrl = new URL('sw.js', window.location.href);
    const serviceWorkerScope = new URL('./', window.location.href);

    navigator.serviceWorker
      .register(serviceWorkerUrl.toString(), { scope: serviceWorkerScope.pathname })
      .then((registration) => {
        watchRegistration(registration);
        registration.update().catch(() => undefined);

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => undefined);
          }
        });
      })
      .catch((error) => {
        console.warn('Nie udalo sie zarejestrowac service workera.', error);
      });
  });
}

export function applyServiceWorkerUpdate() {
  pendingServiceWorker?.postMessage({ type: 'SKIP_WAITING' });
}

function watchRegistration(registration: ServiceWorkerRegistration) {
  if (registration.waiting && navigator.serviceWorker.controller) {
    notifyUpdateAvailable(registration.waiting);
  }

  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;

    if (!newWorker) {
      return;
    }

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        notifyUpdateAvailable(newWorker);
      }
    });
  });
}

function notifyUpdateAvailable(worker: ServiceWorker) {
  pendingServiceWorker = worker;
  window.dispatchEvent(new CustomEvent('cakecost:update-available'));
}
