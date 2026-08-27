// Every Studio object receives a stable ID (Development Plan §7).
// uid() is the machine identity; Studio codes ("RFML 003") are the human
// identity assigned once per project and never reused (§24).

export function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

export function formatCode(prefix, n) {
  return `${prefix} ${String(n).padStart(3, '0')}`
}
