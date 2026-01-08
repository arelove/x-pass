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

// pseudo_mode.rs
use rusqlite::{Connection, Result as RusqliteResult, params};
use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2
};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PseudoModeSettings {
    pub enabled: bool,
    pub passwords: Vec<PseudoPasswordInfo>,
    pub hide_activity_logs: bool,
    pub hide_failed_login_photos: bool,
    pub hide_security_settings: bool,
    pub show_fake_entries: bool,
    pub hide_pseudo_mode_card: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PseudoPasswordInfo {
    pub id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub length: Option<usize>,
}

/// Initializes the pseudo-mode settings table
pub fn init_pseudo_mode_table(conn: &Connection) -> RusqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS pseudo_mode_settings (
            user_id INTEGER PRIMARY KEY,
            enabled BOOLEAN DEFAULT 0,
            hide_activity_logs BOOLEAN DEFAULT 0,
            hide_failed_login_photos BOOLEAN DEFAULT 0,
            hide_security_settings BOOLEAN DEFAULT 0,
            show_fake_entries BOOLEAN DEFAULT 0,
            hide_pseudo_mode_card BOOLEAN DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    Ok(())
}

/// Adds a pseudo-password for the user with validation
#[tauri::command]
pub fn add_pseudo_password(user_id: i64, password: String) -> Result<(), String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // IMPORTANT: Check that pseudo-password does not match the main password
    let (salt_str, hash): (String, String) = conn.query_row(
        "SELECT salt, hash FROM users WHERE id = ?1",
        params![user_id],
        |row| Ok((row.get(0)?, row.get(1)?))
    ).map_err(|_| "User not found".to_string())?;
    
    let salt = SaltString::from_b64(&salt_str).map_err(|_| "Invalid salt")?;
    let parsed_hash = PasswordHash::new(&hash).map_err(|_| "Invalid hash")?;
    let argon2 = Argon2::default();
    
    // If password matches the main one, return error
    if argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok() {
        return Err("Cannot use main password as pseudo password!".to_string());
    }
    
    // Generate hash for pseudo-password
    let pseudo_salt = SaltString::generate(&mut OsRng);
    let pseudo_hash = argon2
        .hash_password(password.as_bytes(), &pseudo_salt)
        .map_err(|e| e.to_string())?
        .to_string();
    
    conn.execute(
        "INSERT INTO pseudo_passwords (user_id, salt, hash) VALUES (?1, ?2, ?3)",
        params![user_id, pseudo_salt.as_str(), pseudo_hash],
    ).map_err(|e| e.to_string())?;
    
    // Log the addition of pseudo-password
    crate::activity_logger::log_activity(
        &conn,
        user_id,
        "pseudo_password_added",
        "Pseudo password added to account"
    ).ok();
    
    Ok(())
}

/// Deletes all pseudo-passwords for the user
#[tauri::command]
pub fn delete_all_pseudo_passwords(user_id: i64) -> Result<(), String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    conn.execute(
        "DELETE FROM pseudo_passwords WHERE user_id = ?1",
        params![user_id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Returns the count of pseudo-passwords for the user
#[tauri::command]
pub fn get_pseudo_passwords_count(user_id: i64) -> Result<i64, String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pseudo_passwords WHERE user_id = ?1",
        params![user_id],
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;
    
    Ok(count)
}

/// Saves pseudo-mode settings
#[tauri::command]
pub fn save_pseudo_mode_settings(
    user_id: i64,
    enabled: bool,
    hide_activity_logs: bool,
    hide_failed_login_photos: bool,
    hide_security_settings: bool,
    show_fake_entries: bool,
    hide_pseudo_mode_card: bool,
) -> Result<(), String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT OR REPLACE INTO pseudo_mode_settings 
         (user_id, enabled, hide_activity_logs, hide_failed_login_photos, 
          hide_security_settings, show_fake_entries, hide_pseudo_mode_card) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            user_id, 
            enabled, 
            hide_activity_logs, 
            hide_failed_login_photos,
            hide_security_settings,
            show_fake_entries,
            hide_pseudo_mode_card
        ],
    ).map_err(|e| e.to_string())?;
    
    // Log settings update
    crate::activity_logger::log_activity(
        &conn,
        user_id,
        "pseudo_mode_settings_updated",
        &format!("Pseudo mode settings updated (enabled: {})", enabled)
    ).ok();
    
    Ok(())
}

/// Retrieves pseudo-mode settings
#[tauri::command]
pub fn get_pseudo_mode_settings(user_id: i64) -> Result<PseudoModeSettings, String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // Get settings
    let (enabled, hide_activity_logs, hide_failed_login_photos, 
         hide_security_settings, show_fake_entries, hide_pseudo_mode_card): 
         (bool, bool, bool, bool, bool, bool) = conn.query_row(
        "SELECT COALESCE(enabled, 0), 
                COALESCE(hide_activity_logs, 0),
                COALESCE(hide_failed_login_photos, 0),
                COALESCE(hide_security_settings, 0),
                COALESCE(show_fake_entries, 0),
                COALESCE(hide_pseudo_mode_card, 0)
         FROM pseudo_mode_settings WHERE user_id = ?1",
        params![user_id],
        |row| Ok((
            row.get(0)?, 
            row.get(1)?, 
            row.get(2)?,
            row.get(3)?,
            row.get(4)?,
            row.get(5)?
        ))
    ).unwrap_or((false, false, false, false, false, false));
    
    // Get list of pseudo-passwords (only IDs)
    let mut stmt = conn.prepare(
        "SELECT id FROM pseudo_passwords WHERE user_id = ?1"
    ).map_err(|e| e.to_string())?;
    
    let passwords: Vec<PseudoPasswordInfo> = stmt.query_map(params![user_id], |row| {
        Ok(PseudoPasswordInfo {
            id: row.get(0)?,
            length: None, // Do not send password length for security reasons
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    
    Ok(PseudoModeSettings {
        enabled,
        passwords,
        hide_activity_logs,
        hide_failed_login_photos,
        hide_security_settings,
        show_fake_entries,
        hide_pseudo_mode_card,
    })
}

/// Checks if the user is currently in pseudo-mode
#[tauri::command]
pub fn is_pseudo_mode_active(user_id: i64) -> Result<bool, String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    let is_pseudo: bool = conn.query_row(
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
    ).unwrap_or(false);
    
    Ok(is_pseudo)
}

/// Deletes a specific pseudo-password
#[tauri::command]
pub fn delete_pseudo_password(user_id: i64, pseudo_id: i64) -> Result<(), String> {
    use crate::password_manager::get_conn;
    
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    let count = conn.execute(
        "DELETE FROM pseudo_passwords WHERE id = ?1 AND user_id = ?2",
        params![pseudo_id, user_id],
    ).map_err(|e| e.to_string())?;
    
    if count == 0 {
        return Err("Pseudo password not found".to_string());
    }
    
    Ok(())
}