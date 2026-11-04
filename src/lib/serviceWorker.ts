// Registers sw.js (src/sw.js) in production builds, so repeat visits load the app from the device.
//
// If it misbehaves:
// - on one device, open the site with ?sw=off: the worker and its caches are removed and the page
//   reloads without it. It stays off on that device until opened with ?sw=on.
// - for everyone, build with SERVICE_WORKER=off: pages stop registering it and the deployed sw.js
//   removes itself from devices that already have it.

const OFF_KEY = 'canopy:sw-off'

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  const params = new URLSearchParams(location.search)
  const flag = params.get('sw')
  try {
    if (flag === 'off') localStorage.setItem(OFF_KEY, '1')
    if (flag === 'on') localStorage.removeItem(OFF_KEY)
  } catch {
    // Storage blocked: ?sw=off still applies to this visit.
  }
  let off = !__SERVICE_WORKER__ || flag === 'off'
  try {
    off ||= localStorage.getItem(OFF_KEY) === '1'
  } catch {
    // Storage blocked.
  }

  if (off) {
    void removeServiceWorker().then((removed) => {
      if (flag === null || !removed) return
      params.delete('sw')
      const query = params.toString()
      location.replace(location.pathname + (query ? `?${query}` : '') + location.hash)
    })
    return
  }
  // After the page has loaded, so installing (and keeping this build's files) never competes
  // with the first visit's own downloads.
  const register = () => void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {})
  if (document.readyState === 'complete') register()
  else addEventListener('load', register, { once: true })
}

/** Unregisters the worker and deletes its caches. True if there was anything to remove. */
async function removeServiceWorker() {
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((r) => r.unregister()))
  const names = (await caches.keys()).filter((n) => n.startsWith('canopy-'))
  await Promise.all(names.map((n) => caches.delete(n)))
  return registrations.length > 0 || names.length > 0
}
