import type { Severity, AlertStatus, EndpointStatus, OS, EventCategory } from '@/types';

export function severityColor(sev: Severity): string {
  switch (sev) {
    case 'critical': return '#FF3B5C';
    case 'high': return '#FF8A24';
    case 'medium': return '#287BFF';
    case 'low': return '#00E5A8';
  }
}

export function severityBgClass(sev: Severity): string {
  switch (sev) {
    case 'critical': return 'severity-critical';
    case 'high': return 'severity-high';
    case 'medium': return 'severity-medium';
    case 'low': return 'severity-low';
  }
}

export function severityLabel(sev: Severity): string {
  return sev.charAt(0).toUpperCase() + sev.slice(1);
}

export function statusColor(status: AlertStatus): string {
  switch (status) {
    case 'new': return '#287BFF';
    case 'active': return '#FF3B5C';
    case 'acknowledged': return '#FF8A24';
    case 'resolved': return '#00E5A8';
  }
}

export function statusLabel(status: AlertStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function endpointStatusColor(status: EndpointStatus): string {
  switch (status) {
    case 'online': return '#00E5A8';
    case 'offline': return '#FF3B5C';
    case 'inactive': return '#FF8A24';
    case 'unknown': return '#8B5CF6';
  }
}

export function osLabel(os: OS): string {
  switch (os) {
    case 'windows': return 'Windows';
    case 'linux': return 'Linux';
    case 'kali': return 'Kali Linux';
  }
}

export function osColor(os: OS): string {
  switch (os) {
    case 'windows': return '#287BFF';
    case 'linux': return '#00E5A8';
    case 'kali': return '#8B5CF6';
  }
}

export function categoryLabel(cat: EventCategory): string {
  const labels: Record<EventCategory, string> = {
    windows_security: 'Windows Security',
    windows_system: 'Windows System',
    windows_application: 'Windows Application',
    linux_auth: 'Linux Auth',
    linux_system: 'Linux System',
    linux_ssh: 'Linux SSH',
    linux_audit: 'Linux Audit',
    file_integrity: 'File Integrity',
    kali_activity: 'Kali Activity',
  };
  return labels[cat];
}

export function categoryColor(cat: EventCategory): string {
  switch (cat) {
    case 'windows_security': return '#287BFF';
    case 'windows_system': return '#4B9FFF';
    case 'windows_application': return '#6FB6FF';
    case 'linux_auth': return '#00E5A8';
    case 'linux_system': return '#33D4B5';
    case 'linux_ssh': return '#5DE3C9';
    case 'linux_audit': return '#7FEEDB';
    case 'file_integrity': return '#FF8A24';
    case 'kali_activity': return '#E879F9';
  }
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function animateCount(target: number, duration = 1000): number {
  return target; // Simplified — animation handled in component via framer-motion
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(c => {
      const s = String(c).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    }).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
