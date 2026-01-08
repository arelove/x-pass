/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

// SettingsPage/types.ts

export interface ActivityLog {
  id: number;
  action_type: string;
  details: string;
  timestamp: string;
}

export interface ActivityStats {
  total_logins: number;
  total_actions: number;
  last_login: string | null;
  most_active_day: string | null;
  actions_by_type: ActionTypeCount[];
}

export interface ActionTypeCount {
  action_type: string;
  count: number;
}

export interface ActivityTrend {
  date: string;
  count: number;
}

export interface FailedLoginPhoto {
  id: number;
  user_id: number;
  photo_data: string;
  timestamp: string;
  username_attempt: string;
}

export const CHART_COLORS = [
  '#8884d8', 
  '#82ca9d', 
  '#ffc658', 
  '#ff8042', 
  '#0088FE', 
  '#00C49F', 
  '#FFBB28', 
  '#FF8042'
];
