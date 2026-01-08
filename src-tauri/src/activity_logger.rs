// ============================================================================
// X-PASS Password Manager
// Copyright (C) 2026 ar3love
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See LICENSE.
// ============================================================================
use rusqlite::{Connection, Result as RusqliteResult, params};
use serde::{Serialize, Deserialize};
use chrono::Utc;
use base64::engine::general_purpose;
use base64::Engine as _;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use aes_gcm::AeadCore;
use sha2::{Sha256, Digest};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivityLog {
    pub id: i64,
    pub user_id: i64,
    pub action_type: String,
    pub details: String,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ActivityStats {
    pub total_logins: i64,
    pub total_actions: i64,
    pub last_login: Option<String>,
    pub most_active_day: Option<String>,
    pub actions_by_type: Vec<ActionTypeCount>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ActionTypeCount {
    pub action_type: String,
    pub count: i64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ActivityTrend {
    pub date: String,
    pub count: i64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FailedLoginPhoto {
    pub id: i64,
    pub user_id: i64,
    pub photo_data: String,
    pub timestamp: String,
    pub username_attempt: String,
}

// Generates a deterministic encryption key based on user_id
// This guarantees that the key is always the same for a specific user
fn get_encryption_key(user_id: i64) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(b"photo_encryption_key_v1_");
    hasher.update(user_id.to_le_bytes());
    let result = hasher.finalize();
    
    let mut key = [0u8; 32];
    key.copy_from_slice(&result[..32]);
    key
}

/// Initializes security-related tables
pub fn init_security_tables(conn: &Connection) -> RusqliteResult<()> {
    // Table for deferred deletions
    conn.execute(
        "CREATE TABLE IF NOT EXISTS pending_deletions (
            user_id INTEGER PRIMARY KEY,
            scheduled_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // ✅ UPDATED table: storing encrypted photos in the database
    conn.execute(
        "CREATE TABLE IF NOT EXISTS failed_login_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            encrypted_photo BLOB NOT NULL,
            photo_nonce BLOB NOT NULL,
            timestamp TEXT NOT NULL,
            username_attempt TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Security settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS security_settings (
            user_id INTEGER PRIMARY KEY,
            photo_on_failed_login BOOLEAN DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    Ok(())
}

/// Creates the activity_logs table with optimization
pub fn init_activity_table(conn: &Connection) -> RusqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action_type TEXT NOT NULL,
            details TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Creating composite index to optimize queries
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_activity_user_time 
         ON activity_logs(user_id, timestamp DESC)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_activity_type 
         ON activity_logs(action_type)",
        [],
    )?;
    
    Ok(())
}

fn is_user_in_pseudo_mode(conn: &Connection, user_id: i64) -> bool {
    conn.query_row(
        "SELECT CASE 
            WHEN action_type = 'pseudo_login_access' THEN 1 
            ELSE 0 
         END
         FROM activity_logs 
         WHERE user_id = ?1 
         AND (action_type = 'login' OR action_type = 'pseudo_login_access')
         ORDER BY timestamp DESC 
         LIMIT 1",
        params![user_id],
        |row| row.get(0)
    ).unwrap_or(false)
}

/// Logs user activity with batching support
pub fn log_activity(
    conn: &Connection,
    user_id: i64,
    action_type: &str,
    details: &str
) -> RusqliteResult<()> {
    let timestamp = Utc::now().to_rfc3339();
    
    conn.execute(
        "INSERT INTO activity_logs (user_id, action_type, details, timestamp)
         VALUES (?1, ?2, ?3, ?4)",
        params![user_id, action_type, details, timestamp],
    )?;
    
    Ok(())
}

/// Gets the last N activity log entries
#[tauri::command]
pub fn get_activity_logs(user_id: i64, limit: i64) -> Result<Vec<ActivityLog>, String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // PROTECTION: In pseudo-mode return empty list
    if is_user_in_pseudo_mode(&conn, user_id) {
        return Ok(vec![]);
    }
    
    // ✅ FIXED: Collecting results directly into Vec
    let logs: Vec<ActivityLog> = if limit < 0 {
        // Load ALL logs without limit
        let mut stmt = conn.prepare(
            "SELECT id, user_id, action_type, details, timestamp 
             FROM activity_logs 
             WHERE user_id = ?1 
             ORDER BY timestamp DESC"
        ).map_err(|e| e.to_string())?;
        
        let rows = stmt.query_map(params![user_id], |row| {
            Ok(ActivityLog {
                id: row.get(0)?,
                user_id: row.get(1)?,
                action_type: row.get(2)?,
                details: row.get(3)?,
                timestamp: row.get(4)?,
            })
        }).map_err(|e| e.to_string())?;
        
        rows.filter_map(|r| r.ok()).collect()
    } else {
        // Load with limit
        let mut stmt = conn.prepare(
            "SELECT id, user_id, action_type, details, timestamp 
             FROM activity_logs 
             WHERE user_id = ?1 
             ORDER BY timestamp DESC 
             LIMIT ?2"
        ).map_err(|e| e.to_string())?;
        
        let rows = stmt.query_map(params![user_id, limit], |row| {
            Ok(ActivityLog {
                id: row.get(0)?,
                user_id: row.get(1)?,
                action_type: row.get(2)?,
                details: row.get(3)?,
                timestamp: row.get(4)?,
            })
        }).map_err(|e| e.to_string())?;
        
        rows.filter_map(|r| r.ok()).collect()
    };
    
    Ok(logs)
}

/// Gets activity statistics
#[tauri::command]
pub fn get_activity_stats(user_id: i64) -> Result<ActivityStats, String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // PROTECTION: In pseudo-mode return empty statistics
    if is_user_in_pseudo_mode(&conn, user_id) {
        return Ok(ActivityStats {
            total_logins: 0,
            total_actions: 0,
            last_login: None,
            most_active_day: None,
            actions_by_type: vec![],
        });
    }
    
    // Total number of logins
    let total_logins: i64 = conn.query_row(
        "SELECT COUNT(*) FROM activity_logs 
         WHERE user_id = ?1 AND action_type = 'login'",
        params![user_id],
        |row| row.get(0)
    ).unwrap_or(0);
    
    // Total number of actions
    let total_actions: i64 = conn.query_row(
        "SELECT COUNT(*) FROM activity_logs WHERE user_id = ?1",
        params![user_id],
        |row| row.get(0)
    ).unwrap_or(0);
    
    // Last login
    let last_login: Option<String> = conn.query_row(
        "SELECT timestamp FROM activity_logs 
         WHERE user_id = ?1 AND action_type = 'login' 
         ORDER BY timestamp DESC LIMIT 1",
        params![user_id],
        |row| row.get(0)
    ).ok();
    
    // Most active day
    let most_active_day: Option<String> = conn.query_row(
        "SELECT DATE(timestamp) as day 
         FROM activity_logs 
         WHERE user_id = ?1 
         GROUP BY day 
         ORDER BY COUNT(*) DESC 
         LIMIT 1",
        params![user_id],
        |row| row.get(0)
    ).ok();
    
    // Actions by type
    let mut stmt = conn.prepare(
        "SELECT action_type, COUNT(*) as count 
         FROM activity_logs 
         WHERE user_id = ?1 
         GROUP BY action_type 
         ORDER BY count DESC"
    ).map_err(|e| e.to_string())?;
    
    let actions_by_type = stmt.query_map(params![user_id], |row| {
        Ok(ActionTypeCount {
            action_type: row.get(0)?,
            count: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    
    Ok(ActivityStats {
        total_logins,
        total_actions,
        last_login,
        most_active_day,
        actions_by_type,
    })
}

/// Gets activity trend for the last N days
#[tauri::command]
pub fn get_activity_trend(user_id: i64, days: i64) -> Result<Vec<ActivityTrend>, String> {
    use crate::password_manager::get_conn;
    use chrono::Duration;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // PROTECTION: In pseudo-mode return empty trend
    if is_user_in_pseudo_mode(&conn, user_id) {
        return Ok(vec![]);
    }
    
    let cutoff_date = (Utc::now() - Duration::days(days)).to_rfc3339();
    
    let mut stmt = conn.prepare(
        "SELECT DATE(timestamp) as date, COUNT(*) as count 
         FROM activity_logs 
         WHERE user_id = ?1 AND timestamp >= ?2
         GROUP BY date 
         ORDER BY date ASC"
    ).map_err(|e| e.to_string())?;
    
    let trend = stmt.query_map(params![user_id, cutoff_date], |row| {
        Ok(ActivityTrend {
            date: row.get(0)?,
            count: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    
    Ok(trend)
}

/// Clears all activity logs for the user
#[tauri::command]
pub fn clear_activity_logs(user_id: i64) -> Result<(), String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    conn.execute(
        "DELETE FROM activity_logs WHERE user_id = ?1",
        params![user_id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Deletes old logs
#[tauri::command]
pub fn cleanup_old_logs(user_id: i64, days: i64) -> Result<usize, String> {
    use crate::password_manager::get_conn;
    use chrono::Duration;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    let cutoff_date = (Utc::now() - Duration::days(days)).to_rfc3339();
    
    let deleted = conn.execute(
        "DELETE FROM activity_logs WHERE user_id = ?1 AND timestamp < ?2",
        params![user_id, cutoff_date],
    ).map_err(|e| e.to_string())?;
    
    Ok(deleted)
}

/// Exports logs to JSON format
#[tauri::command]
pub fn export_activity_logs(user_id: i64) -> Result<String, String> {
    let logs = get_activity_logs(user_id, -1)?;  // ✅ Using -1 to load all logs
    serde_json::to_string_pretty(&logs).map_err(|e| e.to_string())
}

/// Gets the total number of logs for a user
#[tauri::command]
pub fn get_activity_count(user_id: i64) -> Result<i64, String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM activity_logs WHERE user_id = ?1",
        params![user_id],
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;
    
    Ok(count)
}

/// Schedules log deletion on next login
#[tauri::command]
pub fn schedule_logs_deletion(user_id: i64, password: String) -> Result<(), String> {
    use crate::password_manager::{verify_user_password, get_conn};
    
    // Verify password
    verify_user_password(user_id, password)?;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    let timestamp = Utc::now().to_rfc3339();
    
    conn.execute(
        "INSERT OR REPLACE INTO pending_deletions (user_id, scheduled_at) VALUES (?1, ?2)",
        params![user_id, timestamp],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Checks and executes pending log deletion
#[tauri::command]
pub fn check_pending_deletion(user_id: i64) -> Result<bool, String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    let pending: Option<String> = conn.query_row(
        "SELECT scheduled_at FROM pending_deletions WHERE user_id = ?1",
        params![user_id],
        |row| row.get(0)
    ).ok();
    
    if pending.is_some() {
        // Delete logs
        conn.execute(
            "DELETE FROM activity_logs WHERE user_id = ?1",
            params![user_id],
        ).map_err(|e| e.to_string())?;
        
        // Remove pending deletion record
        conn.execute(
            "DELETE FROM pending_deletions WHERE user_id = ?1",
            params![user_id],
        ).map_err(|e| e.to_string())?;
        
        return Ok(true);
    }
    
    Ok(false)
}

/// Cancels scheduled log deletion
#[tauri::command]
pub fn cancel_logs_deletion(user_id: i64) -> Result<(), String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    conn.execute(
        "DELETE FROM pending_deletions WHERE user_id = ?1",
        params![user_id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Saves encrypted photo of failed login attempt to database
#[tauri::command]
pub fn save_failed_login_photo(
    username: String,
    photo_data: String,
    username_attempt: String
) -> Result<(), String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // Get user_id by username
    let user_id: i64 = conn.query_row(
        "SELECT id FROM users WHERE username = ?1",
        params![username],
        |row| row.get(0)
    ).map_err(|_| "User not found".to_string())?;
    
    // Check if the feature is enabled
    let enabled: bool = conn.query_row(
        "SELECT COALESCE(photo_on_failed_login, 0) FROM security_settings WHERE user_id = ?1",
        params![user_id],
        |row| row.get(0)
    ).unwrap_or(false);
    
    if !enabled {
        return Ok(());
    }
    
    // Decode base64 photo
    let photo_bytes = general_purpose::STANDARD
        .decode(photo_data.split(',').nth(1).unwrap_or(&photo_data))
        .map_err(|e| e.to_string())?;
    
    // ✅ Encrypt photo
    let key_bytes = get_encryption_key(user_id);
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    let nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
    let encrypted_photo = cipher.encrypt(&nonce, photo_bytes.as_ref())
        .map_err(|_| "Encryption failed".to_string())?;
    
    let timestamp = Utc::now().to_rfc3339();
    
    // ✅ Save to database instead of filesystem
    conn.execute(
        "INSERT INTO failed_login_photos (user_id, encrypted_photo, photo_nonce, timestamp, username_attempt)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            user_id, 
            &encrypted_photo, 
            &*nonce, 
            timestamp, 
            username_attempt
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Gets and decrypts photos of failed login attempts
#[tauri::command]
pub fn get_failed_login_photos(user_id: i64) -> Result<Vec<FailedLoginPhoto>, String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // PROTECTION: In pseudo-mode return empty list
    if is_user_in_pseudo_mode(&conn, user_id) {
        return Ok(vec![]);
    }
    
    let mut stmt = conn.prepare(
        "SELECT id, user_id, encrypted_photo, photo_nonce, timestamp, username_attempt 
         FROM failed_login_photos 
         WHERE user_id = ?1 
         ORDER BY timestamp DESC"
    ).map_err(|e| e.to_string())?;
    
    let key_bytes = get_encryption_key(user_id);
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    let photos: Vec<FailedLoginPhoto> = stmt.query_map(params![user_id], |row| {
        let id: i64 = row.get(0)?;
        let user_id: i64 = row.get(1)?;
        let encrypted_photo: Vec<u8> = row.get(2)?;
        let photo_nonce: Vec<u8> = row.get(3)?;
        let timestamp: String = row.get(4)?;
        let username_attempt: String = row.get(5)?;
        
        // Decrypt photo
        let nonce = Nonce::from_slice(&photo_nonce);
        let decrypted_photo = cipher.decrypt(nonce, encrypted_photo.as_ref())
            .map_err(|_| rusqlite::Error::InvalidQuery)?;
        
        // Convert to base64
        let photo_data = format!(
            "data:image/jpeg;base64,{}", 
            general_purpose::STANDARD.encode(decrypted_photo)
        );
        
        Ok(FailedLoginPhoto {
            id,
            user_id,
            photo_data,
            timestamp,
            username_attempt,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    
    Ok(photos)
}

/// Deletes a failed login attempt photo
#[tauri::command]
pub fn delete_failed_login_photo(photo_id: i64, user_id: i64) -> Result<(), String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // ✅ Simply delete the record from database
    let count = conn.execute(
        "DELETE FROM failed_login_photos WHERE id = ?1 AND user_id = ?2",
        params![photo_id, user_id],
    ).map_err(|e| e.to_string())?;
    
    if count == 0 {
        return Err("Photo not found".to_string());
    }
    
    Ok(())
}

/// Updates the failed login photo setting
#[tauri::command]
pub fn update_photo_setting(user_id: i64, enabled: bool) -> Result<(), String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT OR REPLACE INTO security_settings (user_id, photo_on_failed_login)
         VALUES (?1, ?2)",
        params![user_id, enabled],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Gets the failed login photo setting
#[tauri::command]
pub fn get_photo_setting(user_id: i64) -> Result<bool, String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    let enabled: bool = conn.query_row(
        "SELECT COALESCE(photo_on_failed_login, 0) FROM security_settings WHERE user_id = ?1",
        params![user_id],
        |row| row.get(0)
    ).unwrap_or(false);
    
    Ok(enabled)
}

/// Checks if the failed login photo feature is enabled for a user by username
#[tauri::command]
pub fn is_photo_setting_enabled_for_username(username: String) -> Result<bool, String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    let user_id: i64 = conn.query_row(
        "SELECT id FROM users WHERE username = ?1",
        params![username],
        |row| row.get(0)
    ).map_err(|_| "User not found".to_string())?;
    
    let enabled: bool = conn.query_row(
        "SELECT COALESCE(photo_on_failed_login, 0) FROM security_settings WHERE user_id = ?1",
        params![user_id],
        |row| row.get(0)
    ).unwrap_or(false);
    
    Ok(enabled)
}