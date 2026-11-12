import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { SentinelData, SecurityLog, Endpoint, Alert, DetectionRule, UseCase, UserProfile, Notification } from '@/types';
import { buildAllData } from '@/data/engine';

const STORAGE_KEY = 'sentinelops_data_v1';
const AUTH_KEY = 'sentinelops_auth_v1';
const PROFILE_KEY = 'sentinelops_profile_v1';

interface DataContextValue {
  data: SentinelData;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  loginAsDemo: () => void;
  register: (profile: { full_name: string; username: string; email: string }) => void;
  updateUser: (profile: Partial<UserProfile>) => void;
  resetDemoData: () => void;
  updateAlert: (alertId: string, updates: Partial<Alert>) => void;
  addAlertNote: (alertId: string, note: string, author: string) => void;
  updateRule: (ruleId: string, updates: Partial<DetectionRule>) => void;
  toggleRule: (ruleId: string) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function loadData(): SentinelData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  const data = buildAllData();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  return data;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SentinelData>(() => loadData());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try { return localStorage.getItem(AUTH_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data]);

  const login = useCallback(() => {
    setIsAuthenticated(true);
    try { localStorage.setItem(AUTH_KEY, 'true'); } catch { /* ignore */ }
  }, []);

  const loginAsDemo = useCallback(() => {
    setIsAuthenticated(true);
    try { localStorage.setItem(AUTH_KEY, 'true'); } catch { /* ignore */ }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try { localStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
  }, []);

  const register = useCallback((profile: { full_name: string; username: string; email: string }) => {
    const newUser: UserProfile = {
      id: 'USER-001',
      full_name: profile.full_name,
      username: profile.username,
      email: profile.email,
      role: 'SOC Analyst — Tier 1',
      created_at: new Date().toISOString(),
      avatar_color: 'cyan',
    };
    setData(prev => ({ ...prev, user: newUser }));
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(newUser));
      localStorage.setItem(AUTH_KEY, 'true');
    } catch { /* ignore */ }
    setIsAuthenticated(true);
  }, []);

  const updateUser = useCallback((profile: Partial<UserProfile>) => {
    setData(prev => {
      const updated = { ...prev, user: { ...prev.user, ...profile } };
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(updated.user)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = buildAllData();
    setData(fresh);
  }, []);

  const updateAlert = useCallback((alertId: string, updates: Partial<Alert>) => {
    setData(prev => ({
      ...prev,
      alerts: prev.alerts.map(a => a.id === alertId ? { ...a, ...updates } : a),
    }));
  }, []);

  const addAlertNote = useCallback((alertId: string, note: string, author: string) => {
    setData(prev => ({
      ...prev,
      alerts: prev.alerts.map(a =>
        a.id === alertId
          ? { ...a, investigation_notes: [...a.investigation_notes, { timestamp: new Date().toISOString(), author, note }] }
          : a
      ),
    }));
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<DetectionRule>) => {
    setData(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r),
    }));
  }, []);

  const toggleRule = useCallback((ruleId: string) => {
    setData(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r),
    }));
  }, []);

  const markNotificationRead = useCallback((notifId: string) => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === notifId ? { ...n, read: true } : n),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }));
  }, []);

  return (
    <DataContext.Provider value={{
      data, isAuthenticated, login, logout, loginAsDemo, register, updateUser,
      resetDemoData, updateAlert, addAlertNote, updateRule, toggleRule,
      markNotificationRead, markAllNotificationsRead,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
