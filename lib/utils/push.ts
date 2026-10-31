/** Restrict server-side delivery to known browser push providers. */
export function isPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint)
    const hosts = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'push.apple.com', 'notify.windows.com']
    return endpoint.length <= 4096 && url.protocol === 'https:' && !url.port && !url.username && !url.password &&
      hosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host))
  } catch { return false }
}
