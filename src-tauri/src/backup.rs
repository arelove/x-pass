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

// src-tauri/src/backup.rs
use rusqlite::{Connection, params};
use serde::{Serialize, Deserialize};
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit},
    Aes256Gcm,
    Nonce,
};
use base64::{engine::general_purpose, Engine as _};
use chrono::Utc;
use argon2::Argon2;

#[derive(Serialize, Deserialize, Clone)]
pub struct BackupEntry {
    pub service: String,
    pub login: String,
    pub password: String,
    pub note: String,
}

#[derive(Serialize, Deserialize)]
pub struct EncryptedBackup {
    pub version: String,
    pub timestamp: String,
    pub username: String,
    pub salt: String,
    pub encrypted_data: String,
    pub nonce: String,
}

#[tauri::command]
pub fn export_vault_encrypted(user_id: i64, username: String, enc_key: String) -> Result<String, String> {
    let conn = crate::password_manager::get_conn().map_err(|e| e.to_string())?;
    
    // ✅ Get user's salt to include in the backup
    let user_salt: String = conn.query_row(
        "SELECT salt FROM users WHERE id = ?1",
        params![user_id],
        |row| row.get(0)
    ).map_err(|_| "User not found".to_string())?;
    
    // Get all user's entries
    let entries = get_user_entries(&conn, user_id, &enc_key)?;
    
    // Serialize to JSON
    let json_data = serde_json::to_string(&entries).map_err(|e| e.to_string())?;
    
    // Encrypt the data
    let key_bytes = general_purpose::STANDARD.decode(&enc_key).map_err(|e| e.to_string())?;
    if key_bytes.len() != 32 {
        return Err("Invalid key length".to_string());
    }
    
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
    
    let encrypted = cipher.encrypt(&nonce, json_data.as_bytes())
        .map_err(|_| "Encryption failed".to_string())?;
    
    let backup = EncryptedBackup {
        version: "1.0".to_string(),
        timestamp: Utc::now().to_rfc3339(),
        username,
        salt: user_salt,
        encrypted_data: general_purpose::STANDARD.encode(&encrypted),
        nonce: general_purpose::STANDARD.encode(&nonce),
    };
    
    // Log the export
    crate::activity_logger::log_activity(
        &conn,
        user_id,
        "vault_exported",
        &format!("Vault exported with {} entries", entries.len())
    ).ok();
    
    serde_json::to_string_pretty(&backup).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_vault_with_password(
    user_id: i64,
    current_user_password: String, 
    backup_password: String,     
    backup_json: String,
    merge: bool
) -> Result<usize, String> {
    let conn = crate::password_manager::get_conn().map_err(|e| e.to_string())?;
    
    // 1. Get salt of the current (new) user
    let (current_salt_str, _): (String, String) = conn.query_row(
        "SELECT salt, hash FROM users WHERE id = ?1",
        params![user_id],
        |row| Ok((row.get(0)?, row.get(1)?))
    ).map_err(|_| "User not found".to_string())?;
    
    // 2. Generate encryption key from the NEW user's password
    let current_salt = argon2::password_hash::SaltString::from_b64(&current_salt_str)
        .map_err(|_| "Invalid salt")?;
    let mut current_enc_key_material = [0u8; 32];
    let argon2 = Argon2::default();
    argon2
        .hash_password_into(
            current_user_password.as_bytes(), 
            current_salt.as_str().as_bytes(), 
            &mut current_enc_key_material
        )
        .map_err(|e| e.to_string())?;
    let current_enc_key = general_purpose::STANDARD.encode(current_enc_key_material);
    
    // 3. Parse backup
    let backup: EncryptedBackup = serde_json::from_str(&backup_json)
        .map_err(|e| format!("Invalid backup format: {}", e))?;
    
    // 4. ✅ Use salt from backup to generate decryption key
    let backup_salt = argon2::password_hash::SaltString::from_b64(&backup.salt)
        .map_err(|_| "Invalid backup salt".to_string())?;
    
    let mut backup_enc_key_material = [0u8; 32];
    argon2
        .hash_password_into(
            backup_password.as_bytes(), 
            backup_salt.as_str().as_bytes(), 
            &mut backup_enc_key_material
        )
        .map_err(|e| e.to_string())?;
    let backup_enc_key = general_purpose::STANDARD.encode(backup_enc_key_material);
    
    // 5. Decrypt backup using OLD account password
    let key_bytes = general_purpose::STANDARD.decode(&backup_enc_key)
        .map_err(|e| e.to_string())?;
    if key_bytes.len() != 32 {
        return Err("Invalid key length".to_string());
    }
    
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    let encrypted_data = general_purpose::STANDARD.decode(&backup.encrypted_data)
        .map_err(|_| "Invalid encrypted data".to_string())?;
    let nonce_bytes = general_purpose::STANDARD.decode(&backup.nonce)
        .map_err(|_| "Invalid nonce".to_string())?;
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let decrypted = cipher.decrypt(nonce, encrypted_data.as_ref())
        .map_err(|_| "Decryption failed - wrong backup password or corrupted backup".to_string())?;
    
    let json_str = String::from_utf8(decrypted)
        .map_err(|_| "Invalid UTF-8 data".to_string())?;
    
    let entries: Vec<BackupEntry> = serde_json::from_str(&json_str)
        .map_err(|e| format!("Invalid backup data: {}", e))?;
    
    // 6. Remove existing entries if not merging
    if !merge {
        conn.execute("DELETE FROM entries WHERE user_id = ?1", params![user_id])
            .map_err(|e| e.to_string())?;
    }
    
    // 7. Import and RE-ENCRYPT with the NEW user's key
    let mut imported = 0;
    for entry in &entries {
        if merge {
            let exists: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM entries WHERE user_id = ?1 AND service = ?2 AND login = ?3)",
                params![user_id, &entry.service, &entry.login],
                |row| row.get(0)
            ).unwrap_or(false);
            
            if exists {
                continue;
            }
        }
        
        // ✅ Encrypt using the NEW user's key
        add_entry_internal(&conn, user_id, entry, &current_enc_key)?;
        imported += 1;
    }
    
    crate::activity_logger::log_activity(
        &conn,
        user_id,
        "vault_imported",
        &format!("Imported {} entries (merge: {})", imported, merge)
    ).ok();
    
    Ok(imported)
}

// Helper functions remain unchanged

fn get_user_entries(conn: &Connection, user_id: i64, enc_key: &str) -> Result<Vec<BackupEntry>, String> {
    let key_bytes = general_purpose::STANDARD.decode(enc_key).map_err(|e| e.to_string())?;
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    let mut stmt = conn.prepare(
        "SELECT service, login, enc_password, password_nonce, enc_note, note_nonce 
         FROM entries WHERE user_id = ?1"
    ).map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map(params![user_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, Vec<u8>>(2)?,
            row.get::<_, Vec<u8>>(3)?,
            row.get::<_, Vec<u8>>(4)?,
            row.get::<_, Vec<u8>>(5)?,
        ))
    }).map_err(|e| e.to_string())?;
    
    let mut entries = Vec::new();
    for row_result in rows {
        let (service, login, enc_password, password_nonce, enc_note, note_nonce) = 
            row_result.map_err(|e| e.to_string())?;
        
        // Decrypt password
        let password_nonce_slice = Nonce::from_slice(&password_nonce);
        let dec_password = cipher.decrypt(password_nonce_slice, enc_password.as_ref())
            .map_err(|_| "Decryption failed".to_string())?;
        let password = String::from_utf8(dec_password)
            .map_err(|_| "Invalid UTF-8".to_string())?;
        
        // Decrypt note
        let note_nonce_slice = Nonce::from_slice(&note_nonce);
        let dec_note = cipher.decrypt(note_nonce_slice, enc_note.as_ref())
            .map_err(|_| "Decryption failed".to_string())?;
        let note = String::from_utf8(dec_note)
            .map_err(|_| "Invalid UTF-8".to_string())?;
        
        entries.push(BackupEntry {
            service,
            login,
            password,
            note,
        });
    }
    
    Ok(entries)
}

fn add_entry_internal(
    conn: &Connection,
    user_id: i64,
    entry: &BackupEntry,
    enc_key: &str
) -> Result<(), String> {
    let key_bytes = general_purpose::STANDARD.decode(enc_key).map_err(|e| e.to_string())?;
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    // Encrypt password
    let password_nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
    let enc_password = cipher.encrypt(&password_nonce, entry.password.as_bytes())
        .map_err(|_| "Encryption failed".to_string())?;
    
    // Encrypt note
    let note_nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
    let enc_note = cipher.encrypt(&note_nonce, entry.note.as_bytes())
        .map_err(|_| "Encryption failed".to_string())?;
    
    conn.execute(
        "INSERT INTO entries (user_id, service, login, enc_password, password_nonce, enc_note, note_nonce)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            user_id,
            &entry.service,
            &entry.login,
            &*enc_password,
            &*password_nonce,
            &*enc_note,
            &*note_nonce
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}