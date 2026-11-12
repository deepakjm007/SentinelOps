// Centralized type definitions for SentinelOps — Elastic Common Schema (ECS) inspired

export type OS = 'windows' | 'linux' | 'kali';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'active' | 'acknowledged' | 'resolved';
export type EndpointStatus = 'online' | 'offline' | 'inactive' | 'unknown';
export type EventOutcome = 'success' | 'failure' | 'unknown';
export type EventCategory =
  | 'windows_security' | 'windows_system' | 'windows_application'
  | 'linux_auth' | 'linux_system' | 'linux_ssh' | 'linux_audit'
  | 'file_integrity' | 'kali_activity';

export interface SecurityLog {
  id: string;
  event_id: number;
  timestamp: string;
  hostname: string;
  source_ip: string;
  destination_ip: string;
  username: string;
  operating_system: OS;
  event_category: EventCategory;
  event_type: string;
  severity: Severity;
  message: string;
  process_name: string;
  agent_type: 'winlogbeat' | 'filebeat' | 'auditbeat';
  log_source: string;
  event_outcome: EventOutcome;
  simulation_status: 'simulated';
  file_path?: string;
}

export interface Endpoint {
  id: string;
  name: string;
  ip_address: string;
  operating_system: OS;
  os_version: string;
  endpoint_type: string;
  agent_type: 'winlogbeat' | 'filebeat' | 'auditbeat';
  agent_version: string;
  last_log_received: string;
  status: EndpointStatus;
  total_logs: number;
  risk_level: Severity | 'none';
  cpu_usage: number;
  memory_usage: number;
  location: string;
}

export interface DetectionRule {
  id: string;
  rule_id: string;
  name: string;
  description: string;
  event_ids: number[];
  category: EventCategory[];
  severity: Severity;
  threshold: number;
  time_window_minutes: number;
  enabled: boolean;
  implemented: boolean;
  mitre_attack: string;
  mitre_tactic: string;
  last_executed: string;
  execution_count: number;
}

export interface Alert {
  id: string;
  alert_id: string;
  title: string;
  description: string;
  severity: Severity;
  detection_rule_id: string;
  endpoint: string;
  source_ip: string;
  username: string;
  event_ids: number[];
  detection_timestamp: string;
  status: AlertStatus;
  related_log_ids: string[];
  investigation_notes: { timestamp: string; author: string; note: string }[];
}

export interface UseCase {
  id: string;
  use_case_id: string;
  title: string;
  description: string;
  objective: string;
  detection_logic: string;
  event_sources: string[];
  steps_to_reproduce: string[];
  expected_result: string;
  actual_result: string;
  related_rule_id: string;
  related_alert_ids: string[];
  evidence_log_ids: string[];
  status: 'implemented' | 'partial' | 'planned';
}

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  avatar_color: string;
}

export interface Notification {
  id: string;
  type: 'critical_alert' | 'high_threat' | 'endpoint_offline' | 'rule_activity' | 'security_event';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: Severity;
}

export interface SentinelData {
  logs: SecurityLog[];
  endpoints: Endpoint[];
  rules: DetectionRule[];
  alerts: Alert[];
  useCases: UseCase[];
  user: UserProfile;
  notifications: Notification[];
  lastUpdated: string;
}
