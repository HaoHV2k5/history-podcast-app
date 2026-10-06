/**
 * Vietnamese currency formatter (VND)
 */
export function formatVND(amount?: number | string | null): string {
  if (amount === undefined || amount === null) return '0 ₫';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

/**
 * Format ISO date string into readable Vietnamese format
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Format duration in seconds into mm:ss or hh:mm:ss
 */
export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Mask sensitive numbers like Citizen ID or Bank Account
 */
export function maskIdentifier(value?: string | null): string {
  if (!value) return '—';
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  const start = trimmed.slice(0, 3);
  const end = trimmed.slice(-3);
  return `${start}••••${end}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return '—';
  const trimmed = phone.trim();
  if (trimmed.length < 7) return trimmed;
  return `${trimmed.slice(0, 3)}•••${trimmed.slice(-3)}`;
}
