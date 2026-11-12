// Centralized Simulated Security Data Engine for SentinelOps
// One interconnected dataset: logs → endpoints → detection rules → alerts → use cases

import type {
  SecurityLog, Endpoint, DetectionRule, Alert, UseCase, UserProfile, Notification,
  Severity, EventCategory, OS, SentinelData,
} from '@/types';

// ─── Deterministic PRNG for reproducible data ───
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rng = seeded(424242);
function pick<T>(arr: T[]): T { return arr[Math.floor(rng() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(rng() * (max - min + 1)) + min; }

// ─── Reference data pools ───
const WINDOWS_HOSTS = [
  { name: 'WIN-CLIENT-01', ip: '192.168.10.21', version: 'Windows 11 Pro 23H2', type: 'Workstation', location: 'HQ - Floor 3' },
  { name: 'WIN-CLIENT-02', ip: '192.168.10.22', version: 'Windows 11 Pro 23H2', type: 'Workstation', location: 'HQ - Floor 3' },
  { name: 'WIN-SERVER-01', ip: '192.168.10.10', version: 'Windows Server 2022', type: 'Server', location: 'Data Center A' },
  { name: 'WIN-ADMIN-01', ip: '192.168.10.5', version: 'Windows 11 Pro 23H2', type: 'Admin Workstation', location: 'HQ - Floor 4' },
];
const LINUX_HOSTS = [
  { name: 'UBUNTU-SERVER-01', ip: '192.168.20.10', version: 'Ubuntu 22.04 LTS', type: 'Server', location: 'Data Center A' },
  { name: 'UBUNTU-CLIENT-01', ip: '192.168.20.21', version: 'Ubuntu 24.04 LTS', type: 'Workstation', location: 'HQ - Floor 2' },
  { name: 'LINUX-WEB-01', ip: '192.168.20.30', version: 'Debian 12', type: 'Web Server', location: 'Data Center B' },
  { name: 'LINUX-DB-01', ip: '192.168.20.40', version: 'RHEL 9', type: 'Database Server', location: 'Data Center B' },
  { name: 'LINUX-SSH-01', ip: '192.168.20.50', version: 'Ubuntu 22.04 LTS', type: 'SSH Gateway', location: 'Data Center A' },
];
const KALI_HOST = { name: 'KALI-ATTACKER-01', ip: '192.168.99.100', version: 'Kali Linux 2024.2', type: 'Attacker Machine', location: 'External / Lab' };

const ALL_HOSTS = [...WINDOWS_HOSTS, ...LINUX_HOSTS, KALI_HOST];

const WINDOWS_USERS = ['j.smith', 'admin', 'a.miller', 's.johnson', 'r.wilson', 'c.davis', 'SYSTEM'];
const LINUX_USERS = ['root', 'ubuntu', 'webadmin', 'dbadmin', 'svc_deploy', 'sshd'];
const EXTERNAL_IPS = ['203.0.113.10', '203.0.113.45', '198.51.100.7', '198.51.100.23', '192.0.2.50', '192.0.2.77', '45.77.22.33', '82.65.12.90'];
const INTERNAL_IPS = ['192.168.10.5', '192.168.10.21', '192.168.20.50', '192.168.99.100'];

const WINDOWS_AGENTS = ['winlogbeat'];
const LINUX_AGENTS = ['filebeat', 'auditbeat'];

// ─── Time generation (relative to a fixed "now" for demo) ───
const DEMO_NOW = new Date('2026-11-12T14:30:00Z');
function ts(minutesAgo: number): string {
  const d = new Date(DEMO_NOW.getTime() - minutesAgo * 60 * 1000);
  return d.toISOString();
}
function tsDaysAgo(days: number, hour = 9, minute = 0): string {
  const d = new Date(DEMO_NOW.getTime() - days * 24 * 60 * 60 * 1000);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

let logCounter = 0;
let alertCounter = 0;

// ─── Log builder ───
function mkLog(p: Partial<SecurityLog> & {
  event_id: number; hostname: string; source_ip: string; operating_system: OS;
  event_category: EventCategory; severity: Severity; event_outcome: SecurityLog['event_outcome'];
  message: string; username: string;
}): SecurityLog {
  logCounter++;
  const destIp = p.destination_ip || (p.operating_system === 'windows' ? '192.168.10.1' : '192.168.20.1');
  const agent = p.operating_system === 'windows' ? 'winlogbeat' : p.operating_system === 'kali' ? 'filebeat' : (pick(LINUX_AGENTS) as SecurityLog['agent_type']);
  return {
    id: `LOG-${String(logCounter).padStart(5, '0')}`,
    event_id: p.event_id,
    timestamp: p.timestamp || ts(0),
    hostname: p.hostname,
    source_ip: p.source_ip,
    destination_ip: destIp,
    username: p.username,
    operating_system: p.operating_system,
    event_category: p.event_category,
    event_type: p.event_type || p.event_category,
    severity: p.severity,
    message: p.message,
    process_name: p.process_name || (p.operating_system === 'windows' ? 'System' : 'sshd'),
    agent_type: p.agent_type || agent,
    log_source: p.log_source || (p.operating_system === 'windows' ? 'Windows Security' : 'Linux /var/log/auth.log'),
    event_outcome: p.event_outcome,
    simulation_status: 'simulated',
    file_path: p.file_path,
  };
}

// ─── Build the centralized logs ───
export function buildLogs(): SecurityLog[] {
  const logs: SecurityLog[] = [];
  const now = DEMO_NOW;

  // ===== HISTORICAL LOGS — spread across 7 days for charts/trends =====
  for (let day = 6; day >= 1; day--) {
    const winCount = randInt(8, 14);
    for (let i = 0; i < winCount; i++) {
      const host = pick(WINDOWS_HOSTS);
      const user = pick(WINDOWS_USERS.filter(u => u !== 'SYSTEM'));
      const eid = pick([4624, 4625, 4634, 4672, 4688]);
      const success = eid === 4624 || eid === 4634 || eid === 4672;
      const sev: Severity = eid === 4625 ? 'medium' : eid === 4672 ? 'low' : 'low';
      const msg = eid === 4624 ? `An account was successfully logged on. Account: ${user}`
        : eid === 4625 ? `An account failed to log on. Account: ${user} Reason: Bad password`
        : eid === 4634 ? `An account was logged off. Account: ${user}`
        : eid === 4672 ? `Special privileges assigned to new logon. Account: ${user}`
        : `A new process has been created. Account: ${user} Process: ${pick(['powershell.exe', 'cmd.exe', 'explorer.exe', 'chrome.exe'])}`;
      logs.push(mkLog({
        event_id: eid, hostname: host.name, source_ip: pick(INTERNAL_IPS),
        destination_ip: host.ip, operating_system: 'windows',
        event_category: pick(['windows_security', 'windows_system']),
        event_type: 'windows_event_log', severity: sev, event_outcome: success ? 'success' : 'failure',
        message: msg, username: user, timestamp: tsDaysAgo(day, randInt(0, 23), randInt(0, 59)),
      }));
    }
    const linCount = randInt(6, 12);
    for (let i = 0; i < linCount; i++) {
      const host = pick(LINUX_HOSTS);
      const user = pick(LINUX_USERS);
      const isSSH = rng() > 0.5;
      const success = rng() > 0.4;
      logs.push(mkLog({
        event_id: isSSH ? (success ? 2401 : 2400) : 1000,
        hostname: host.name, source_ip: pick([...EXTERNAL_IPS, ...INTERNAL_IPS]),
        destination_ip: host.ip, operating_system: 'linux',
        event_category: isSSH ? 'linux_ssh' : pick(['linux_auth', 'linux_system', 'linux_audit']),
        event_type: isSSH ? 'ssh_auth' : 'system_log',
        severity: success ? 'low' : 'medium',
        event_outcome: success ? 'success' : 'failure',
        message: isSSH
          ? (success ? `Accepted password for ${user} from ${pick(EXTERNAL_IPS)} port 22 ssh2` : `Failed password for invalid user ${user} from ${pick(EXTERNAL_IPS)} port 22 ssh2`)
          : pick([`User ${user} ran sudo command`, `System cron job executed by ${user}`, `Auditd: command executed by ${user}`]),
        username: user, timestamp: tsDaysAgo(day, randInt(0, 23), randInt(0, 59)),
        process_name: isSSH ? 'sshd' : pick(['sudo', 'cron', 'auditd']),
      }));
    }
  }

  // ===== UC1 — Windows Failed Login (Event ID 4625) — 6 failures from external IP =====
  const uc1Host = WINDOWS_HOSTS[0]; // WIN-CLIENT-01
  const uc1User = 'j.smith';
  const uc1AttackerIP = '203.0.113.10';
  // 6 failed logins within 5 minutes, then more spread out
  for (let i = 0; i < 6; i++) {
    logs.push(mkLog({
      event_id: 4625, hostname: uc1Host.name, source_ip: uc1AttackerIP,
      destination_ip: uc1Host.ip, operating_system: 'windows',
      event_category: 'windows_security', event_type: 'windows_event_log',
      severity: 'high', event_outcome: 'failure',
      message: `An account failed to log on. Account: ${uc1User} Caller Computer: ${uc1Host.name} Logon Type: 3 Reason: Unknown user name or bad password. Attempt ${i + 1}/6`,
      username: uc1User, timestamp: ts(180 - i * 1), // within ~5 min
      process_name: 'lsass.exe', log_source: 'Windows Security',
    }));
  }
  // Additional failed logins on other Windows hosts (for dashboard stats)
  for (let i = 0; i < 5; i++) {
    const host = pick(WINDOWS_HOSTS);
    logs.push(mkLog({
      event_id: 4625, hostname: host.name, source_ip: pick(EXTERNAL_IPS),
      destination_ip: host.ip, operating_system: 'windows',
      event_category: 'windows_security', event_type: 'windows_event_log',
      severity: 'medium', event_outcome: 'failure',
      message: `An account failed to log on. Account: ${pick(WINDOWS_USERS)} Reason: Bad password`,
      username: pick(WINDOWS_USERS), timestamp: ts(randInt(200, 600)),
      process_name: 'lsass.exe', log_source: 'Windows Security',
    }));
  }

  // ===== UC2 — Suspicious Successful Login (4625 x3 then 4624 within 5 min) =====
  const uc2Host = WINDOWS_HOSTS[2]; // WIN-SERVER-01
  const uc2User = 'admin';
  const uc2AttackerIP = '198.51.100.7';
  for (let i = 0; i < 3; i++) {
    logs.push(mkLog({
      event_id: 4625, hostname: uc2Host.name, source_ip: uc2AttackerIP,
      destination_ip: uc2Host.ip, operating_system: 'windows',
      event_category: 'windows_security', event_type: 'windows_event_log',
      severity: 'high', event_outcome: 'failure',
      message: `An account failed to log on. Account: ${uc2User} Logon Type: 10 Reason: Bad password. Attempt ${i + 1}/3`,
      username: uc2User, timestamp: ts(90 - i * 2), process_name: 'lsass.exe', log_source: 'Windows Security',
    }));
  }
  // Successful login after failures
  logs.push(mkLog({
    event_id: 4624, hostname: uc2Host.name, source_ip: uc2AttackerIP,
    destination_ip: uc2Host.ip, operating_system: 'windows',
    event_category: 'windows_security', event_type: 'windows_event_log',
    severity: 'low', event_outcome: 'success',
    message: `An account was successfully logged on. Account: ${uc2User} Logon Type: 10 (RemoteInteractive). Source: ${uc2AttackerIP}`,
    username: uc2User, timestamp: ts(85), process_name: 'lsass.exe', log_source: 'Windows Security',
  }));
  // Special privileges
  logs.push(mkLog({
    event_id: 4672, hostname: uc2Host.name, source_ip: uc2AttackerIP,
    destination_ip: uc2Host.ip, operating_system: 'windows',
    event_category: 'windows_security', event_type: 'windows_event_log',
    severity: 'medium', event_outcome: 'success',
    message: `Special privileges assigned to new logon. Account: ${uc2User} Privileges: SeDebugPrivilege SeTakeOwnershipPrivilege`,
    username: uc2User, timestamp: ts(84), process_name: 'lsass.exe', log_source: 'Windows Security',
  }));

  // ===== UC3 — Linux SSH Monitoring — repeated failed then accepted =====
  const uc3Host = LINUX_HOSTS[4]; // LINUX-SSH-01
  const uc3User = 'root';
  const uc3AttackerIP = '192.0.2.50';
  for (let i = 0; i < 5; i++) {
    logs.push(mkLog({
      event_id: 2400, hostname: uc3Host.name, source_ip: uc3AttackerIP,
      destination_ip: uc3Host.ip, operating_system: 'linux',
      event_category: 'linux_ssh', event_type: 'ssh_auth',
      severity: 'high', event_outcome: 'failure',
      message: `Failed password for invalid user ${uc3User} from ${uc3AttackerIP} port ${randInt(49000, 58000)} ssh2 [preauth]`,
      username: uc3User, timestamp: ts(70 - i * 1), process_name: 'sshd', log_source: 'Linux /var/log/auth.log',
    }));
  }
  logs.push(mkLog({
    event_id: 2401, hostname: uc3Host.name, source_ip: uc3AttackerIP,
    destination_ip: uc3Host.ip, operating_system: 'linux',
    event_category: 'linux_ssh', event_type: 'ssh_auth',
    severity: 'low', event_outcome: 'success',
    message: `Accepted password for ${uc3User} from ${uc3AttackerIP} port ${randInt(49000, 58000)} ssh2`,
    username: uc3User, timestamp: ts(64), process_name: 'sshd', log_source: 'Linux /var/log/auth.log',
  }));
  // Sudo execution after
  logs.push(mkLog({
    event_id: 1000, hostname: uc3Host.name, source_ip: uc3AttackerIP,
    destination_ip: uc3Host.ip, operating_system: 'linux',
    event_category: 'linux_audit', event_type: 'sudo_command',
    severity: 'high', event_outcome: 'success',
    message: `sudo: ${uc3User} : TTY=pts/0 ; PWD=/root ; COMMAND=/usr/bin/cat /etc/shadow`,
    username: uc3User, timestamp: ts(62), process_name: 'sudo', log_source: 'Linux /var/log/auth.log',
  }));

  // ===== UC4 — File Integrity Monitoring =====
  const uc4Host = LINUX_HOSTS[0]; // UBUNTU-SERVER-01
  const uc4User = 'root';
  const sensitiveFiles = [
    { path: '/etc/passwd', msg: 'FIM Alert: /etc/passwd was modified by root. Hash changed.' },
    { path: '/etc/shadow', msg: 'FIM Alert: /etc/shadow was modified. User root added new entry.' },
    { path: '/etc/ssh/sshd_config', msg: 'FIM Alert: /etc/ssh/sshd_config modified. PermitRootLogin changed to yes.' },
  ];
  for (const f of sensitiveFiles) {
    logs.push(mkLog({
      event_id: 2000, hostname: uc4Host.name, source_ip: '192.168.20.50',
      destination_ip: uc4Host.ip, operating_system: 'linux',
      event_category: 'file_integrity', event_type: 'file_modification',
      severity: 'high', event_outcome: 'success',
      message: f.msg, username: uc4User, timestamp: ts(randInt(30, 50)),
      process_name: 'auditbeat', log_source: 'File Integrity Monitoring', file_path: f.path,
    }));
  }
  // Additional normal file access (low severity)
  for (let i = 0; i < 3; i++) {
    logs.push(mkLog({
      event_id: 2000, hostname: pick(LINUX_HOSTS).name, source_ip: pick(INTERNAL_IPS),
      destination_ip: pick(LINUX_HOSTS).ip, operating_system: 'linux',
      event_category: 'file_integrity', event_type: 'file_modification',
      severity: 'low', event_outcome: 'success',
      message: `File modified: ${pick(['/var/log/syslog', '/tmp/deploy.log', '/opt/app/config.yml'])}`,
      username: pick(LINUX_USERS), timestamp: ts(randInt(100, 400)),
      process_name: 'auditbeat', log_source: 'File Integrity Monitoring',
    }));
  }

  // ===== UC5 — Kali Linux Activity (Nmap scanning) =====
  const kaliLogs = [
    { msg: 'Nmap scan initiated: nmap -sV -p 1-1000 192.168.10.0/24', proc: 'nmap', sev: 'high' as Severity, mins: 25 },
    { msg: 'Nmap scan: nmap -sS -O 192.168.20.10 (OS detection against UBUNTU-SERVER-01)', proc: 'nmap', sev: 'high' as Severity, mins: 22 },
    { msg: 'Nmap scan: nmap -p 22,80,443,3389 192.168.10.10 (targeting WIN-SERVER-01)', proc: 'nmap', sev: 'critical' as Severity, mins: 20 },
    { msg: 'Suspicious command: nmap -sV --script vuln 192.168.20.40 (vulnerability scan against LINUX-DB-01)', proc: 'nmap', sev: 'critical' as Severity, mins: 18 },
    { msg: 'Recon: whoami && id && uname -a (post-exploitation enumeration)', proc: 'bash', sev: 'medium' as Severity, mins: 15 },
    { msg: 'Suspicious: nmap -p 22 --script ssh-brute 192.168.20.50 (SSH brute force attempt against LINUX-SSH-01)', proc: 'nmap', sev: 'high' as Severity, mins: 12 },
  ];
  for (const k of kaliLogs) {
    logs.push(mkLog({
      event_id: 3000, hostname: KALI_HOST.name, source_ip: KALI_HOST.ip,
      destination_ip: pick(['192.168.10.0/24', '192.168.20.10', '192.168.20.40', '192.168.20.50']),
      operating_system: 'kali',
      event_category: 'kali_activity', event_type: 'suspicious_command',
      severity: k.sev, event_outcome: 'success',
      message: k.msg, username: 'root', timestamp: ts(k.mins),
      process_name: k.proc, log_source: 'Kali Linux Activity Monitor', agent_type: 'filebeat',
    }));
  }

  // ===== Background noise — successful logins, normal activity =====
  for (let i = 0; i < 20; i++) {
    const host = pick(WINDOWS_HOSTS);
    const user = pick(WINDOWS_USERS.filter(u => u !== 'SYSTEM'));
    logs.push(mkLog({
      event_id: 4624, hostname: host.name, source_ip: pick(INTERNAL_IPS),
      destination_ip: host.ip, operating_system: 'windows',
      event_category: 'windows_security', event_type: 'windows_event_log',
      severity: 'low', event_outcome: 'success',
      message: `An account was successfully logged on. Account: ${user} Logon Type: 2 (Interactive)`,
      username: user, timestamp: ts(randInt(5, 500)), process_name: 'lsass.exe', log_source: 'Windows Security',
    }));
  }
  for (let i = 0; i < 15; i++) {
    const host = pick(LINUX_HOSTS);
    const user = pick(LINUX_USERS);
    logs.push(mkLog({
      event_id: 2401, hostname: host.name, source_ip: pick(INTERNAL_IPS),
      destination_ip: host.ip, operating_system: 'linux',
      event_category: 'linux_ssh', event_type: 'ssh_auth',
      severity: 'low', event_outcome: 'success',
      message: `Accepted password for ${user} from ${pick(INTERNAL_IPS)} port 22 ssh2`,
      username: user, timestamp: ts(randInt(5, 500)), process_name: 'sshd', log_source: 'Linux /var/log/auth.log',
    }));
  }
  // Windows system logs
  for (let i = 0; i < 10; i++) {
    const host = pick(WINDOWS_HOSTS);
    logs.push(mkLog({
      event_id: pick([7036, 6005, 6006, 12, 13]),
      hostname: host.name, source_ip: host.ip,
      destination_ip: host.ip, operating_system: 'windows',
      event_category: pick(['windows_system', 'windows_application']),
      event_type: 'windows_event_log', severity: 'low',
      event_outcome: 'success',
      message: pick([
        'The service entered the running state. Service: Winlogbeat',
        'The Event log service was started.',
        'Windows is starting up.',
        'Application error: chrome.exe crashed unexpectedly',
      ]),
      username: 'SYSTEM', timestamp: ts(randInt(10, 600)),
      process_name: pick(['services.exe', 'EventLog', 'chrome.exe']), log_source: 'Windows System',
    }));
  }

  // Sort by timestamp descending (newest first)
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return logs;
}

// ─── Endpoints ───
export function buildEndpoints(logs: SecurityLog[]): Endpoint[] {
  const all = [...WINDOWS_HOSTS, ...LINUX_HOSTS, KALI_HOST];
  const osMap: Record<string, OS> = {};
  all.forEach(h => {
    if (h.name.startsWith('WIN')) osMap[h.name] = 'windows';
    else if (h.name.startsWith('KALI')) osMap[h.name] = 'kali';
    else osMap[h.name] = 'linux';
  });

  return all.map((h, idx) => {
    const hostLogs = logs.filter(l => l.hostname === h.name);
    const lastLog = hostLogs.length > 0 ? hostLogs[0].timestamp : tsDaysAgo(7);
    const minsSinceLastLog = Math.floor((DEMO_NOW.getTime() - new Date(lastLog).getTime()) / 60000);
    let status: Endpoint['status'] = 'online';
    if (minsSinceLastLog > 1440) status = 'offline';
    else if (minsSinceLastLog > 60) status = 'inactive';

    const os = osMap[h.name];
    const agent = os === 'windows' ? 'winlogbeat' : os === 'kali' ? 'filebeat' : 'filebeat';

    // Risk based on log severities
    const critCount = hostLogs.filter(l => l.severity === 'critical').length;
    const highCount = hostLogs.filter(l => l.severity === 'high').length;
    let riskLevel: Endpoint['risk_level'] = 'none';
    if (critCount > 0) riskLevel = 'critical';
    else if (highCount >= 2) riskLevel = 'high';
    else if (highCount >= 1) riskLevel = 'medium';
    else if (hostLogs.length > 0) riskLevel = 'low';

    return {
      id: `EP-${String(idx + 1).padStart(2, '0')}`,
      name: h.name,
      ip_address: h.ip,
      operating_system: os,
      os_version: h.version,
      endpoint_type: h.type,
      agent_type: agent as Endpoint['agent_type'],
      agent_version: '8.15.3',
      last_log_received: lastLog,
      status,
      total_logs: hostLogs.length,
      risk_level: riskLevel,
      cpu_usage: randInt(5, 85),
      memory_usage: randInt(20, 90),
      location: h.location,
    };
  });
}

// ─── Detection Rules ───
export function buildDetectionRules(): DetectionRule[] {
  const now = ts(0);
  return [
    {
      id: 'DR-01', rule_id: 'WIN-FAILED-LOGIN-001', name: 'Windows Failed Login Detection',
      description: 'Detects repeated Windows failed login attempts (Event ID 4625). Generates a brute-force alert when threshold is exceeded within the configured time window.',
      event_ids: [4625], category: ['windows_security'], severity: 'high',
      threshold: 5, time_window_minutes: 5, enabled: true, implemented: true,
      mitre_attack: 'T1110', mitre_tactic: 'Credential Access',
      last_executed: now, execution_count: 42,
    },
    {
      id: 'DR-02', rule_id: 'WIN-SUSPICIOUS-LOGIN-002', name: 'Suspicious Successful Login After Failures',
      description: 'Detects a successful Windows login (Event ID 4624) preceded by at least 3 failed login attempts (Event ID 4625) within 5 minutes — indicative of a successful brute-force compromise.',
      event_ids: [4625, 4624], category: ['windows_security'], severity: 'critical',
      threshold: 3, time_window_minutes: 5, enabled: true, implemented: true,
      mitre_attack: 'T1110.001', mitre_tactic: 'Credential Access',
      last_executed: now, execution_count: 18,
    },
    {
      id: 'DR-03', rule_id: 'LINUX-SSH-003', name: 'Linux SSH Authentication Monitoring',
      description: 'Monitors Linux SSH authentication events. Identifies repeated failed SSH logins and suspicious authentication patterns from external IPs.',
      event_ids: [2400, 2401], category: ['linux_ssh'], severity: 'medium',
      threshold: 4, time_window_minutes: 10, enabled: true, implemented: true,
      mitre_attack: 'T1110.004', mitre_tactic: 'Credential Access',
      last_executed: now, execution_count: 35,
    },
    {
      id: 'DR-04', rule_id: 'FIM-SENSITIVE-004', name: 'File Integrity Monitoring',
      description: 'Monitors modifications to sensitive system files: /etc/passwd, /etc/shadow, /etc/ssh/sshd_config. Triggers alerts on unauthorized changes.',
      event_ids: [2000], category: ['file_integrity'], severity: 'high',
      threshold: 1, time_window_minutes: 60, enabled: true, implemented: true,
      mitre_attack: 'T1078.003', mitre_tactic: 'Persistence / Defense Evasion',
      last_executed: now, execution_count: 12,
    },
    {
      id: 'DR-05', rule_id: 'KALI-ACTIVITY-005', name: 'Kali Linux Activity Monitoring',
      description: 'Monitors suspicious command execution from Kali Linux endpoints including Nmap scanning, OS detection, vulnerability scanning, and SSH brute-force attempts.',
      event_ids: [3000], category: ['kali_activity'], severity: 'high',
      threshold: 1, time_window_minutes: 30, enabled: true, implemented: true,
      mitre_attack: 'T1046', mitre_tactic: 'Discovery',
      last_executed: now, execution_count: 27,
    },
  ];
}

// ─── Detection Engine — evaluate logs against rules and generate alerts ───
export function buildAlerts(logs: SecurityLog[], rules: DetectionRule[]): Alert[] {
  const alerts: Alert[] = [];
  const now = ts(0);

  function mkAlertId() { alertCounter++; return `ALR-${String(alertCounter).padStart(4, '0')}`; }

  // --- Rule 1: Windows Failed Login Brute Force ---
  const r1 = rules[0];
  const fail4625 = logs.filter(l => l.event_id === 4625 && l.operating_system === 'windows');
  // Group by (hostname, source_ip, username) and check threshold within 5 min
  const groups1: Record<string, SecurityLog[]> = {};
  for (const l of fail4625) {
    const key = `${l.hostname}|${l.source_ip}|${l.username}`;
    if (!groups1[key]) groups1[key] = [];
    groups1[key].push(l);
  }
  for (const [key, group] of Object.entries(groups1)) {
    // Sort by timestamp ascending
    group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    // Sliding window check
    for (let i = 0; i < group.length; i++) {
      const windowStart = new Date(group[i].timestamp).getTime();
      const inWindow = group.filter(l => {
        const t = new Date(l.timestamp).getTime();
        return t >= windowStart && t <= windowStart + r1.time_window_minutes * 60000;
      });
      if (inWindow.length >= r1.threshold) {
        const [hostname, source_ip, username] = key.split('|');
        const exists = alerts.find(a => a.endpoint === hostname && a.source_ip === source_ip && a.detection_rule_id === r1.id);
        if (!exists) {
          alerts.push({
            id: mkAlertId(), alert_id: `ALR-${String(alertCounter).padStart(4, '0')}`,
            title: 'Multiple Windows Failed Login Attempts — Possible Brute Force',
            description: `${inWindow.length} failed login attempts detected from ${source_ip} against ${hostname} for user "${username}" within ${r1.time_window_minutes} minutes. This pattern is consistent with a brute-force attack.`,
            severity: r1.severity, detection_rule_id: r1.id,
            endpoint: hostname, source_ip, username,
            event_ids: [4625], detection_timestamp: inWindow[inWindow.length - 1].timestamp,
            status: 'active', related_log_ids: inWindow.map(l => l.id), investigation_notes: [],
          });
        }
        break; // one alert per group
      }
    }
  }

  // --- Rule 2: Suspicious Successful Login After Failures ---
  const r2 = rules[1];
  const winLogs = logs.filter(l => l.operating_system === 'windows' && (l.event_id === 4625 || l.event_id === 4624));
  const winGroups: Record<string, SecurityLog[]> = {};
  for (const l of winLogs) {
    const key = `${l.hostname}|${l.source_ip}|${l.username}`;
    if (!winGroups[key]) winGroups[key] = [];
    winGroups[key].push(l);
  }
  for (const [key, group] of Object.entries(winGroups)) {
    group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    // Find a 4624 preceded by >= 3 4625 within 5 minutes
    for (let i = 0; i < group.length; i++) {
      if (group[i].event_id === 4624) {
        const successTime = new Date(group[i].timestamp).getTime();
        const priorFailures = group.filter(l =>
          l.event_id === 4625 &&
          new Date(l.timestamp).getTime() <= successTime &&
          new Date(l.timestamp).getTime() >= successTime - r2.time_window_minutes * 60000
        );
        if (priorFailures.length >= r2.threshold) {
          const [hostname, source_ip, username] = key.split('|');
          const evidence = [...priorFailures, group[i]];
          const exists = alerts.find(a => a.endpoint === hostname && a.source_ip === source_ip && a.detection_rule_id === r2.id);
          if (!exists) {
            alerts.push({
              id: mkAlertId(), alert_id: `ALR-${String(alertCounter).padStart(4, '0')}`,
              title: 'Suspicious Successful Login After Failed Attempts',
              description: `A successful login was detected for user "${username}" on ${hostname} from ${source_ip} after ${priorFailures.length} failed attempts within ${r2.time_window_minutes} minutes. This indicates a possible successful brute-force compromise.`,
              severity: r2.severity, detection_rule_id: r2.id,
              endpoint: hostname, source_ip, username,
              event_ids: [4625, 4624], detection_timestamp: group[i].timestamp,
              status: 'new', related_log_ids: evidence.map(l => l.id), investigation_notes: [],
            });
          }
          break;
        }
      }
    }
  }

  // --- Rule 3: Linux SSH Failed Authentication ---
  const r3 = rules[2];
  const sshFails = logs.filter(l => l.event_category === 'linux_ssh' && l.event_outcome === 'failure');
  const sshGroups: Record<string, SecurityLog[]> = {};
  for (const l of sshFails) {
    const key = `${l.hostname}|${l.source_ip}`;
    if (!sshGroups[key]) sshGroups[key] = [];
    sshGroups[key].push(l);
  }
  for (const [key, group] of Object.entries(sshGroups)) {
    group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (let i = 0; i < group.length; i++) {
      const windowStart = new Date(group[i].timestamp).getTime();
      const inWindow = group.filter(l => {
        const t = new Date(l.timestamp).getTime();
        return t >= windowStart && t <= windowStart + r3.time_window_minutes * 60000;
      });
      if (inWindow.length >= r3.threshold) {
        const [hostname, source_ip] = key.split('|');
        const username = inWindow[0].username;
        const exists = alerts.find(a => a.endpoint === hostname && a.source_ip === source_ip && a.detection_rule_id === r3.id);
        if (!exists) {
          const sev: Severity = inWindow.length >= 6 ? 'high' : 'medium';
          alerts.push({
            id: mkAlertId(), alert_id: `ALR-${String(alertCounter).padStart(4, '0')}`,
            title: 'Linux SSH Authentication Failure — Repeated Attempts',
            description: `${inWindow.length} failed SSH authentication attempts from ${source_ip} against ${hostname} within ${r3.time_window_minutes} minutes. User targeted: ${username}.`,
            severity: sev, detection_rule_id: r3.id,
            endpoint: hostname, source_ip, username,
            event_ids: [2400], detection_timestamp: inWindow[inWindow.length - 1].timestamp,
            status: 'active', related_log_ids: inWindow.map(l => l.id), investigation_notes: [],
          });
        }
        break;
      }
    }
  }

  // --- Rule 4: File Integrity Monitoring ---
  const r4 = rules[3];
  const fimLogs = logs.filter(l => l.event_category === 'file_integrity' && l.severity !== 'low');
  for (const l of fimLogs) {
    alerts.push({
      id: mkAlertId(), alert_id: `ALR-${String(alertCounter).padStart(4, '0')}`,
      title: `Sensitive File Modification — ${l.file_path || 'Unknown'}`,
      description: `Security-sensitive file ${l.file_path || ''} was modified on ${l.hostname} by user ${l.username}. ${l.message}`,
      severity: r4.severity, detection_rule_id: r4.id,
      endpoint: l.hostname, source_ip: l.source_ip, username: l.username,
      event_ids: [2000], detection_timestamp: l.timestamp,
      status: 'new', related_log_ids: [l.id], investigation_notes: [],
    });
  }

  // --- Rule 5: Kali Linux Activity ---
  const r5 = rules[4];
  const kaliLogs = logs.filter(l => l.event_category === 'kali_activity');
  // One alert per type of suspicious activity
  const kaliSeen = new Set<string>();
  for (const l of kaliLogs) {
    const sigKey = `${l.hostname}|${l.process_name}|${l.source_ip}`;
    if (kaliSeen.has(sigKey)) continue;
    kaliSeen.add(sigKey);
    alerts.push({
      id: mkAlertId(), alert_id: `ALR-${String(alertCounter).padStart(4, '0')}`,
      title: l.message.includes('Nmap') ? 'Suspicious Network Scanning Activity — Nmap Detected'
        : l.message.includes('whoami') ? 'Post-Exploitation Enumeration Detected'
        : 'Suspicious Command Execution from Kali Endpoint',
      description: `Suspicious activity detected from Kali Linux endpoint ${l.hostname} (${l.source_ip}): ${l.message}`,
      severity: l.severity, detection_rule_id: r5.id,
      endpoint: l.hostname, source_ip: l.source_ip, username: l.username,
      event_ids: [3000], detection_timestamp: l.timestamp,
      status: l.severity === 'critical' ? 'new' : 'active',
      related_log_ids: kaliLogs.filter(k => k.hostname === l.hostname && k.process_name === l.process_name).map(k => k.id),
      investigation_notes: [],
    });
  }

  // Resolve one alert as "resolved" for demo variety
  if (alerts.length > 4) {
    alerts[alerts.length - 1].status = 'resolved';
    alerts[alerts.length - 1].investigation_notes.push({
      timestamp: ts(10), author: 'analyst.miller',
      note: 'Investigated and confirmed as authorized security testing activity. Alert resolved.',
    });
  }
  // Acknowledge one
  if (alerts.length > 6) {
    alerts[2].status = 'acknowledged';
    alerts[2].investigation_notes.push({
      timestamp: ts(15), author: 'analyst.johnson',
      note: 'Under investigation. Checking with endpoint owner if activity was expected.',
    });
  }

  return alerts;
}

// ─── Use Cases ───
export function buildUseCases(logs: SecurityLog[], rules: DetectionRule[], alerts: Alert[]): UseCase[] {
  const findLogs = (host: string, eid: number) => logs.filter(l => l.hostname === host && l.event_id === eid).map(l => l.id);
  const findAlerts = (ruleId: string) => alerts.filter(a => a.detection_rule_id === ruleId).map(a => a.alert_id);

  return [
    {
      id: 'UC-01', use_case_id: 'UC1', title: 'Windows Failed Login Detection',
      description: 'Detect and alert on multiple failed Windows login attempts (Event ID 4625) that may indicate a brute-force attack.',
      objective: 'Identify repeated failed authentication attempts against Windows endpoints and generate a high-severity alert for SOC analyst review.',
      detection_logic: 'Rule WIN-FAILED-LOGIN-001 monitors Windows Security Event ID 4625. When ≥ 5 failed logins from the same source IP and user occur within a 5-minute window, a brute-force alert is generated.',
      event_sources: ['Windows Security Log', 'Winlogbeat', 'Event ID 4625'],
      steps_to_reproduce: [
        'Simulate 6 failed login attempts from external IP 203.0.113.10 against WIN-CLIENT-01',
        'Winlogbeat forwards Event ID 4625 logs to SentinelOps',
        'Detection engine evaluates events against Rule WIN-FAILED-LOGIN-001',
        'Threshold (5 failures in 5 minutes) is exceeded',
        'Brute-force alert is generated with severity High',
      ],
      expected_result: 'A high-severity alert is generated when 5+ failed logins are detected within 5 minutes, including source IP, target account, and all evidence logs.',
      actual_result: 'ALERT GENERATED — 6 failed login attempts from 203.0.113.10 detected. Alert with full evidence chain created.',
      related_rule_id: 'DR-01',
      related_alert_ids: findAlerts('DR-01'),
      evidence_log_ids: findLogs('WIN-CLIENT-01', 4625),
      status: 'implemented',
    },
    {
      id: 'UC-02', use_case_id: 'UC2', title: 'Suspicious Successful Login',
      description: 'Detect a successful login that follows multiple failed attempts — a strong indicator of a successful brute-force compromise.',
      objective: 'Correlate failed login attempts (4625) followed by a successful login (4624) within a short time window to identify potential account compromise.',
      detection_logic: 'Rule WIN-SUSPICIOUS-LOGIN-002 correlates Event IDs 4625 and 4624. When ≥ 3 failed logins are followed by a successful login from the same source within 5 minutes, a critical alert is generated.',
      event_sources: ['Windows Security Log', 'Winlogbeat', 'Event ID 4625', 'Event ID 4624', 'Event ID 4672'],
      steps_to_reproduce: [
        'Simulate 3 failed login attempts from 198.51.100.7 against WIN-SERVER-01',
        'Simulate a subsequent successful login (Event ID 4624) within 5 minutes',
        'Special privileges assigned (Event ID 4672) is also logged',
        'Detection engine correlates the failure-success pattern',
        'Critical alert is generated',
      ],
      expected_result: 'A critical-severity alert is generated when failed logins are followed by a successful login, indicating possible credential compromise.',
      actual_result: 'ALERT GENERATED — 3 failed attempts followed by successful login from 198.51.100.7 on WIN-SERVER-01. Critical alert generated with full correlation timeline.',
      related_rule_id: 'DR-02',
      related_alert_ids: findAlerts('DR-02'),
      evidence_log_ids: [...findLogs('WIN-SERVER-01', 4625), ...findLogs('WIN-SERVER-01', 4624), ...findLogs('WIN-SERVER-01', 4672)],
      status: 'implemented',
    },
    {
      id: 'UC-03', use_case_id: 'UC3', title: 'Linux SSH Login Monitoring',
      description: 'Monitor Linux SSH authentication events to detect brute-force attempts and suspicious remote access patterns.',
      objective: 'Identify repeated failed SSH authentication attempts and detect when a brute-force attempt succeeds, alerting SOC analysts to investigate.',
      detection_logic: 'Rule LINUX-SSH-003 monitors SSH authentication events (Event IDs 2400/2401). When ≥ 4 failed SSH logins occur within 10 minutes, a medium or high alert is generated depending on volume.',
      event_sources: ['Linux /var/log/auth.log', 'Filebeat', 'sshd'],
      steps_to_reproduce: [
        'Simulate 5 failed SSH login attempts from 192.0.2.50 against LINUX-SSH-01',
        'Simulate a subsequent successful SSH login (Accepted password)',
        'Detect sudo command execution post-login (cat /etc/shadow)',
        'Detection engine evaluates SSH events against Rule LINUX-SSH-003',
        'Alert generated with SSH authentication evidence',
      ],
      expected_result: 'A medium/high-severity alert is generated for repeated SSH failures, with evidence including source IP, targeted user, and post-login activity.',
      actual_result: 'ALERT GENERATED — 5 failed SSH attempts from 192.0.2.50 detected. Sudo command execution post-login also captured in evidence.',
      related_rule_id: 'DR-03',
      related_alert_ids: findAlerts('DR-03'),
      evidence_log_ids: logs.filter(l => l.hostname === 'LINUX-SSH-01').map(l => l.id),
      status: 'implemented',
    },
    {
      id: 'UC-04', use_case_id: 'UC4', title: 'File Integrity Monitoring',
      description: 'Monitor and alert on modifications to critical system files that could indicate privilege escalation or persistence.',
      objective: 'Detect unauthorized changes to security-sensitive files (/etc/passwd, /etc/shadow, /etc/ssh/sshd_config) and generate alerts for immediate investigation.',
      detection_logic: 'Rule FIM-SENSITIVE-004 monitors file modification events from Auditbeat. Any modification to monitored sensitive files triggers an immediate high-severity alert.',
      event_sources: ['Auditbeat', 'File Integrity Monitoring', 'Linux Audit Log'],
      steps_to_reproduce: [
        'Simulate modification of /etc/passwd on UBUNTU-SERVER-01',
        'Simulate modification of /etc/shadow (new user entry added)',
        'Simulate modification of /etc/ssh/sshd_config (PermitRootLogin enabled)',
        'Auditbeat forwards FIM events to SentinelOps',
        'Detection engine matches against Rule FIM-SENSITIVE-004',
      ],
      expected_result: 'A high-severity alert is generated for each sensitive file modification, including file path, modifying user, and change details.',
      actual_result: 'ALERTS GENERATED — 3 sensitive file modifications detected on UBUNTU-SERVER-01. Individual alerts created for /etc/passwd, /etc/shadow, and /etc/ssh/sshd_config.',
      related_rule_id: 'DR-04',
      related_alert_ids: findAlerts('DR-04'),
      evidence_log_ids: logs.filter(l => l.event_category === 'file_integrity' && l.severity !== 'low').map(l => l.id),
      status: 'implemented',
    },
    {
      id: 'UC-05', use_case_id: 'UC5', title: 'Malicious Activity Simulation',
      description: 'Simulate and detect malicious reconnaissance and attack activity from a Kali Linux endpoint, including Nmap scanning and exploitation attempts.',
      objective: 'Demonstrate SentinelOps ability to detect and alert on offensive security tooling and scanning activity from attacker endpoints.',
      detection_logic: 'Rule KALI-ACTIVITY-005 monitors activity from Kali Linux endpoints. Detection of Nmap commands, vulnerability scanning, and suspicious enumeration triggers high or critical alerts.',
      event_sources: ['Kali Linux Activity Monitor', 'Filebeat', 'Nmap process logs'],
      steps_to_reproduce: [
        'KALI-ATTACKER-01 initiates Nmap scan against internal network (192.168.10.0/24)',
        'OS detection scan launched against UBUNTU-SERVER-01',
        'Vulnerability scan (nmap --script vuln) targeting LINUX-DB-01',
        'SSH brute-force attempt against LINUX-SSH-01',
        'Post-exploitation enumeration (whoami, id, uname)',
        'Detection engine matches against Rule KALI-ACTIVITY-005',
      ],
      expected_result: 'High/critical-severity alerts generated for each suspicious activity, including affected targets and command details.',
      actual_result: 'ALERTS GENERATED — Multiple alerts generated for Nmap scanning, vulnerability assessment, SSH brute-force, and post-exploitation enumeration from KALI-ATTACKER-01.',
      related_rule_id: 'DR-05',
      related_alert_ids: findAlerts('DR-05'),
      evidence_log_ids: logs.filter(l => l.event_category === 'kali_activity').map(l => l.id),
      status: 'implemented',
    },
  ];
}

// ─── User Profile ───
export function buildDefaultUser(): UserProfile {
  return {
    id: 'USER-001',
    full_name: 'SOC Analyst',
    username: 'soc.analyst',
    email: 'analyst@sentinelops.io',
    role: 'SOC Analyst — Tier 2',
    created_at: tsDaysAgo(30, 8, 0),
    avatar_color: 'cyan',
  };
}

// ─── Notifications derived from data ───
export function buildNotifications(logs: SecurityLog[], endpoints: Endpoint[], alerts: Alert[]): Notification[] {
  const notifications: Notification[] = [];
  // Critical alerts
  alerts.filter(a => a.severity === 'critical').slice(0, 3).forEach(a => {
    notifications.push({
      id: `NTF-${notifications.length + 1}`,
      type: 'critical_alert', title: 'Critical Alert Triggered',
      message: `${a.title} on ${a.endpoint}`,
      timestamp: a.detection_timestamp, read: false, severity: 'critical',
    });
  });
  // High alerts
  alerts.filter(a => a.severity === 'high').slice(0, 3).forEach(a => {
    notifications.push({
      id: `NTF-${notifications.length + 1}`,
      type: 'high_threat', title: 'High-Severity Threat Detected',
      message: `${a.title} — Source: ${a.source_ip}`,
      timestamp: a.detection_timestamp, read: false, severity: 'high',
    });
  });
  // Offline endpoints
  endpoints.filter(e => e.status === 'offline').forEach(e => {
    notifications.push({
      id: `NTF-${notifications.length + 1}`,
      type: 'endpoint_offline', title: 'Endpoint Offline',
      message: `${e.name} (${e.ip_address}) has gone offline`,
      timestamp: e.last_log_received, read: false, severity: 'medium',
    });
  });
  // Rule activity
  notifications.push({
    id: `NTF-${notifications.length + 1}`,
    type: 'rule_activity', title: 'Detection Rule Executed',
    message: 'Rule WIN-FAILED-LOGIN-001 executed successfully. 1 new alert generated.',
    timestamp: ts(5), read: false, severity: 'low',
  });
  // Security event
  notifications.push({
    id: `NTF-${notifications.length + 1}`,
    type: 'security_event', title: 'Security Event Spike',
    message: 'Unusual increase in failed authentication events detected in the last hour.',
    timestamp: ts(15), read: true, severity: 'medium',
  });
  return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── Master dataset builder ───
// SentinelData interface is defined in @/types and imported at the top

export function buildAllData(): SentinelData {
  const logs = buildLogs();
  const endpoints = buildEndpoints(logs);
  const rules = buildDetectionRules();
  const alerts = buildAlerts(logs, rules);
  const useCases = buildUseCases(logs, rules, alerts);
  const user = buildDefaultUser();
  const notifications = buildNotifications(logs, endpoints, alerts);
  return { logs, endpoints, rules, alerts, useCases, user, notifications, lastUpdated: new Date().toISOString() };
}
