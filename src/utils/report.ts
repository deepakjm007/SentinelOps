import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SentinelData, Severity } from '@/types';
import { severityLabel, osLabel, formatTimestamp, categoryLabel } from '@/utils/format';

interface ReportOptions {
  reportType: string;
  reportTitle: string;
  startDate: string;
  endDate: string;
  endpoint: string;
  operatingSystem: string;
  severity: string;
  alertStatus: string;
}

function filterLogs(data: SentinelData, opts: ReportOptions) {
  let logs = [...data.logs];
  if (opts.startDate) logs = logs.filter(l => l.timestamp >= opts.startDate);
  if (opts.endDate) logs = logs.filter(l => l.timestamp <= opts.endDate + 'T23:59:59');
  if (opts.endpoint && opts.endpoint !== 'all') logs = logs.filter(l => l.hostname === opts.endpoint);
  if (opts.operatingSystem && opts.operatingSystem !== 'all') logs = logs.filter(l => l.operating_system === opts.operatingSystem);
  if (opts.severity && opts.severity !== 'all') logs = logs.filter(l => l.severity === opts.severity);
  return logs;
}

function filterAlerts(data: SentinelData, opts: ReportOptions) {
  let alerts = [...data.alerts];
  if (opts.startDate) alerts = alerts.filter(a => a.detection_timestamp >= opts.startDate);
  if (opts.endDate) alerts = alerts.filter(a => a.detection_timestamp <= opts.endDate + 'T23:59:59');
  if (opts.endpoint && opts.endpoint !== 'all') alerts = alerts.filter(a => a.endpoint === opts.endpoint);
  if (opts.severity && opts.severity !== 'all') alerts = alerts.filter(a => a.severity === opts.severity);
  if (opts.alertStatus && opts.alertStatus !== 'all') alerts = alerts.filter(a => a.status === opts.alertStatus);
  return alerts;
}

export function generatePdf(data: SentinelData, opts: ReportOptions): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ─── Header ───
  doc.setFillColor(5, 7, 13);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(0, 229, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SentinelOps', margin, 18);
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 200);
  doc.setFont('helvetica', 'normal');
  doc.text('SOC & SIEM Monitoring Platform', margin, 25);
  doc.text('DEMO — Simulated Data Report', margin, 31);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.reportTitle, pageWidth - margin, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 200);
  doc.text(`Generated: ${formatTimestamp(new Date().toISOString())}`, pageWidth - margin, 25, { align: 'right' });
  doc.text(`Range: ${opts.startDate || 'All'} to ${opts.endDate || 'All'}`, pageWidth - margin, 31, { align: 'right' });

  let y = 50;

  // ─── Executive Summary ───
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, y);
  y += 6;

  const logs = filterLogs(data, opts);
  const alerts = filterAlerts(data, opts);
  const winLogs = logs.filter(l => l.operating_system === 'windows');
  const linLogs = logs.filter(l => l.operating_system === 'linux' || l.operating_system === 'kali');
  const failedLogins = logs.filter(l => l.event_outcome === 'failure');
  const successLogins = logs.filter(l => l.event_outcome === 'success');
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
  const onlineEndpoints = data.endpoints.filter(e => e.status === 'online');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 80);
  const summary = `This report covers ${logs.length} security log events and ${alerts.length} security alerts` +
    ` from the SentinelOps monitoring platform. During the selected period, ${winLogs.length} Windows logs and ${linLogs.length} Linux logs were collected.` +
    ` ${failedLogins.length} failed login attempts and ${successLogins.length} successful logins were recorded.` +
    ` ${criticalAlerts.length} critical alerts and ${resolvedAlerts.length} resolved alerts were identified across ${onlineEndpoints.length} online endpoints.` +
    ` All data is simulated for demonstration purposes.`;
  const summaryLines = doc.splitTextToSize(summary, pageWidth - margin * 2);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4 + 8;

  // ─── Statistics Table ───
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 50);
  doc.text('Security Statistics', margin, y);
  y += 3;

  autoTable(doc, {
    startY: y + 2,
    head: [['Metric', 'Value']],
    body: [
      ['Total Logs', String(logs.length)],
      ['Windows Logs', String(winLogs.length)],
      ['Linux Logs', String(linLogs.length)],
      ['Failed Login Attempts', String(failedLogins.length)],
      ['Successful Logins', String(successLogins.length)],
      ['Total Alerts', String(alerts.length)],
      ['Critical Alerts', String(criticalAlerts.length)],
      ['Resolved Alerts', String(resolvedAlerts.length)],
      ['Online Endpoints', String(onlineEndpoints.length)],
      ['Total Endpoints', String(data.endpoints.length)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [40, 123, 255], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { textColor: [40, 40, 60], fontSize: 9 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ─── Alert Severity Breakdown ───
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 50);
  doc.text('Alert Severity Breakdown', margin, y);
  y += 3;

  const sevCounts = (['critical', 'high', 'medium', 'low'] as Severity[]).map(s => ({
    sev: s, count: alerts.filter(a => a.severity === s).length,
  }));
  autoTable(doc, {
    startY: y + 2,
    head: [['Severity', 'Count', 'Percentage']],
    body: sevCounts.map(s => [
      severityLabel(s.sev),
      String(s.count),
      alerts.length > 0 ? `${((s.count / alerts.length) * 100).toFixed(1)}%` : '0%',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [255, 59, 92], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { textColor: [40, 40, 60], fontSize: 9 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ─── Endpoint Status ───
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 50);
  doc.text('Endpoint Status Summary', margin, y);
  y += 3;

  autoTable(doc, {
    startY: y + 2,
    head: [['Endpoint', 'IP', 'OS', 'Status', 'Logs', 'Risk']],
    body: data.endpoints.map(e => [
      e.name, e.ip_address, osLabel(e.operating_system), e.status, String(e.total_logs),
      e.risk_level === 'none' ? 'None' : severityLabel(e.risk_level),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 229, 168], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { textColor: [40, 40, 60], fontSize: 8 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ─── Detection Rules ───
  if (y > 220) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 50);
  doc.text('Detection Rules', margin, y);
  y += 3;

  autoTable(doc, {
    startY: y + 2,
    head: [['Rule ID', 'Name', 'Severity', 'Enabled', 'Executions']],
    body: data.rules.map(r => [
      r.rule_id, r.name, severityLabel(r.severity), r.enabled ? 'Yes' : 'No', String(r.execution_count),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { textColor: [40, 40, 60], fontSize: 8 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ─── Alerts Table ───
  if (alerts.length > 0) {
    if (y > 200) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 50);
    doc.text('Security Alerts', margin, y);
    y += 3;

    autoTable(doc, {
      startY: y + 2,
      head: [['Alert ID', 'Title', 'Severity', 'Endpoint', 'Source IP', 'Status', 'Timestamp']],
      body: alerts.slice(0, 30).map(a => [
        a.alert_id, a.title.substring(0, 40), severityLabel(a.severity),
        a.endpoint, a.source_ip, a.status, formatTimestamp(a.detection_timestamp),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [255, 138, 36], textColor: [255, 255, 255], fontSize: 7 },
      bodyStyles: { textColor: [40, 40, 60], fontSize: 7 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ─── Recent Security Events ───
  if (logs.length > 0) {
    if (y > 200) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 50);
    doc.text('Security Events (Most Recent)', margin, y);
    y += 3;

    autoTable(doc, {
      startY: y + 2,
      head: [['Timestamp', 'Host', 'Event ID', 'User', 'Source IP', 'Category', 'Severity', 'Outcome']],
      body: logs.slice(0, 30).map(l => [
        formatTimestamp(l.timestamp), l.hostname, String(l.event_id), l.username,
        l.source_ip, categoryLabel(l.event_category), severityLabel(l.severity), l.event_outcome,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 229, 255], textColor: [255, 255, 255], fontSize: 7 },
      bodyStyles: { textColor: [40, 40, 60], fontSize: 7 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ─── Conclusion ───
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 50);
  doc.text('Conclusion', margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const conclusion = `During the reporting period, SentinelOps monitored ${data.endpoints.length} endpoints and processed ${logs.length} security events.` +
    ` ${alerts.length} security alerts were generated by the detection engine, of which ${criticalAlerts.length} were critical severity.` +
    (criticalAlerts.length > 0
      ? ' The presence of critical alerts requires immediate SOC team investigation and remediation.'
      : ' No critical alerts were detected during this period.') +
    ` All data in this report is simulated for demonstration purposes as part of the SentinelOps cybersecurity platform project.`;
  const conclLines = doc.splitTextToSize(conclusion, pageWidth - margin * 2);
  doc.text(conclLines, margin, y);

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 170);
    doc.text(
      `SentinelOps — DEMO Simulated Data | Page ${i} of ${pageCount}`,
      pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' }
    );
  }

  return doc;
}

export function generateCsv(data: SentinelData, opts: ReportOptions) {
  const logs = filterLogs(data, opts);
  const alerts = filterAlerts(data, opts);
  const headers: string[] = [];
  const rows: (string | number)[][] = [];

  if (logs.length > 0) {
    headers.push('Timestamp', 'Hostname', 'Event ID', 'Username', 'Source IP', 'OS', 'Category', 'Severity', 'Outcome', 'Message');
    for (const l of logs) {
      rows.push([
        formatTimestamp(l.timestamp), l.hostname, l.event_id, l.username, l.source_ip,
        osLabel(l.operating_system), categoryLabel(l.event_category), severityLabel(l.severity),
        l.event_outcome, l.message,
      ]);
    }
  } else if (alerts.length > 0) {
    headers.push('Alert ID', 'Title', 'Severity', 'Status', 'Endpoint', 'Source IP', 'Username', 'Detection Timestamp');
    for (const a of alerts) {
      rows.push([
        a.alert_id, a.title, severityLabel(a.severity), a.status, a.endpoint,
        a.source_ip, a.username, formatTimestamp(a.detection_timestamp),
      ]);
    }
  }

  return { headers, rows };
}
