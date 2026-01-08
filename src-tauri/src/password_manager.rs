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

use rusqlite::{Connection, Result as RusqliteResult};
use rusqlite::params;
use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2
};
use totp_rs::TOTP;
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit},
    Aes256Gcm,
    Nonce,
};
use base64::{engine::general_purpose, Engine as _};
use serde::{Serialize, Deserialize};
use log::info;
use crate::pseudo_mode;
use crate::fake_data_generator::generate_fake_entries_for_user;

#[derive(Serialize, Deserialize)]
pub struct Entry {
    pub id: i64,
    pub service: String,
    pub login: String,
    pub password: String,
    pub note: String,
}

pub fn get_conn() -> RusqliteResult<Connection> {
    let conn = Connection::open("./passwords.db")?;
    
    // Создаем таблицу пользователей
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            salt TEXT NOT NULL,
            hash TEXT NOT NULL,
            otp_secret TEXT
        )",
        [],
    )?;
    
    // Создаем таблицу записей
    conn.execute(
        "CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            service TEXT NOT NULL,
            login TEXT NOT NULL,
            enc_password BLOB NOT NULL,
            password_nonce BLOB NOT NULL,
            enc_note BLOB NOT NULL,
            note_nonce BLOB NOT NULL
        )",
        [],
    )?;
    
    // Создаем таблицу псевдо-паролей
    conn.execute(
        "CREATE TABLE IF NOT EXISTS pseudo_passwords (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            salt TEXT NOT NULL,
            hash TEXT NOT NULL
        )",
        [],
    )?;
    
    // ✅ Создаем таблицу фото неудачных входов
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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            salt TEXT NOT NULL,
            hash TEXT NOT NULL,
            otp_secret TEXT,
            otp_recovery_key BLOB,
            otp_recovery_nonce BLOB,
            otp_recovery_salt TEXT
        )",
        [],
    )?;

    // Миграция: добавляем колонки если их нет
    conn.execute_batch("
        ALTER TABLE users ADD COLUMN otp_recovery_key BLOB;
        ALTER TABLE users ADD COLUMN otp_recovery_nonce BLOB;
        ALTER TABLE users ADD COLUMN otp_recovery_salt TEXT;
    ").ok(); // ok() игнорирует ошибку если колонки уже существуют
    
    // Инициализируем таблицу логов активности
    crate::activity_logger::init_activity_table(&conn)?;
    pseudo_mode::init_pseudo_mode_table(&conn)?;
    crate::activity_logger::init_security_tables(&conn)?;
    
    // ❌ Удаляем эту строку полностью
    // crate::database_migration::recreate_photos_table(&conn).ok();
    
    Ok(conn)
}

// Добавьте эту функцию после get_conn():
#[tauri::command] 
pub fn verify_user_password(user_id: i64, password: String) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    let (_salt_str, hash): (String, String) = conn.query_row(
        "SELECT salt, hash FROM users WHERE id = ?1",
        params![user_id],
        |row| Ok((row.get(0)?, row.get(1)?))
    ).map_err(|_| "User not found".to_string())?;
    
    let parsed_hash = PasswordHash::new(&hash).map_err(|_| "Invalid hash")?;
    let argon2 = Argon2::default();
    
    argon2.verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|_| "Invalid password".to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn list_users() -> Result<Vec<String>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT username FROM users ORDER BY username").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| row.get(0)).map_err(|e| e.to_string())?;
    let users: Vec<String> = rows.map(|r| r.map_err(|e| e.to_string())).collect::<Result<_, _>>()?;
    Ok(users)
}

#[tauri::command]
pub fn create_user(username: String, master_pass: String) -> Result<i64, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2.hash_password(master_pass.as_bytes(), &salt).map_err(|e| e.to_string())?.to_string();
    
    conn.execute(
        "INSERT INTO users (username, salt, hash) VALUES (?1, ?2, ?3)",
        params![username, salt.as_str(), hash],
    ).map_err(|e| e.to_string())?;
    
    // Получаем ID созданного пользователя
    let user_id = conn.last_insert_rowid();
    
    // Логируем создание аккаунта
    crate::activity_logger::log_activity(
        &conn,
        user_id,
        "account_created",
        &format!("Account created for user: {}", username)
    ).map_err(|e| e.to_string())?;
    
    Ok(user_id)
}

#[tauri::command]
pub fn login(username: String, master_pass: String) -> Result<(i64, String, bool), String> {
    info!("Attempting login for username: {}", username);
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, salt, hash FROM users WHERE username = ?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query_map(params![&username], |row| {
        Ok((row.get(0)?, row.get::<_, String>(1)?, row.get(2)?))
    }).map_err(|e| e.to_string())?;

    let row = rows.next().ok_or("User not found")?.map_err(|e| e.to_string())?;
    let (id, salt_str, hash): (i64, String, String) = row;

    let mut output_key_material = [0u8; 32];
    let argon2 = Argon2::default();
    let mut verified = false;
    let mut login_method = "password";
    let mut is_pseudo = false;

    if !master_pass.is_empty() {
        let salt = SaltString::from_b64(&salt_str).map_err(|_| "Invalid salt")?;
        let parsed_hash = PasswordHash::new(&hash).map_err(|_| "Invalid hash")?;
        
        // Проверяем реальный пароль
        if argon2.verify_password(master_pass.as_bytes(), &parsed_hash).is_ok() {
            verified = true;
            is_pseudo = false;
        }
        
        // Проверяем псевдо-пароли всегда (даже если реальный пароль уже подошел)
        if !verified {
            let mut pseudo_stmt = conn.prepare("SELECT salt, hash FROM pseudo_passwords WHERE user_id = ?1")
                .map_err(|e| e.to_string())?;
            let mut pseudo_rows = pseudo_stmt.query_map(params![id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            }).map_err(|e| e.to_string())?;
            
            while let Some(pseudo_row_result) = pseudo_rows.next() {
                let (pseudo_salt_str, pseudo_hash_str) = pseudo_row_result.map_err(|e| e.to_string())?;
                let pseudo_salt = SaltString::from_b64(&pseudo_salt_str).map_err(|_| "Invalid pseudo salt")?;
                let pseudo_parsed_hash = PasswordHash::new(&pseudo_hash_str).map_err(|_| "Invalid pseudo hash")?;
                
                if argon2.verify_password(master_pass.as_bytes(), &pseudo_parsed_hash).is_ok() {
                    verified = true;
                    login_method = "pseudo_password";
                    is_pseudo = true;
                    info!("Pseudo password login successful for username: {}", username);
                    break;
                }
            }
        }
        
        if verified {
            argon2
                .hash_password_into(master_pass.as_bytes(), salt.as_str().as_bytes(), &mut output_key_material)
                .map_err(|e| e.to_string())?;
        }
    } else {
        // Пустой пароль - не разрешен
        return Err("Password cannot be empty".to_string());
    }

    if !verified {
        // Логируем неудачную попытку входа
        crate::activity_logger::log_activity(
            &conn,
            id,
            "login_failed",
            &format!("Failed login attempt for user: {}", username)
        ).ok();
        
        return Err("Invalid password".to_string());
    }

    let enc_key = general_purpose::STANDARD.encode(output_key_material);
    
    // Логируем успешный вход
    crate::activity_logger::log_activity(
        &conn,
        id,
        if is_pseudo { "pseudo_login_access" } else { "login" },
        &format!("Successful login via {} for user: {}", login_method, username)
    ).map_err(|e| e.to_string())?;
    
    info!("Login successful for username: {} (pseudo: {})", username, is_pseudo);
    
    Ok((id, enc_key, is_pseudo))
}


#[tauri::command]
pub fn add_entry(user_id: i64, service: String, login: String, password: String, note: String, enc_key: String) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let key_bytes = general_purpose::STANDARD.decode(enc_key).map_err(|e| e.to_string())?;
    if key_bytes.len() != 32 {
        return Err("Invalid key length".to_string());
    }
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let password_nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
    let enc_password = cipher.encrypt(&password_nonce, password.as_bytes().as_ref()).map_err(|_| "Encryption failed".to_string())?;

    let note_nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
    let enc_note = cipher.encrypt(&note_nonce, note.as_bytes().as_ref()).map_err(|_| "Encryption failed".to_string())?;

    conn.execute(
        "INSERT INTO entries (user_id, service, login, enc_password, password_nonce, enc_note, note_nonce)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![user_id, service, login, &*enc_password, &*password_nonce, &*enc_note, &*note_nonce],
    ).map_err(|e| e.to_string())?;

    // Логируем добавление записи
    crate::activity_logger::log_activity(
        &conn,
        user_id,
        "add_entry",
        &format!("Added entry for service: {}", service)
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn update_entry(
    entry_id: i64,
    user_id: i64,
    service: String,
    login: String,
    password: String,
    note: String,
    enc_key: String
) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let key_bytes = general_purpose::STANDARD.decode(enc_key).map_err(|e| e.to_string())?;
    if key_bytes.len() != 32 {
        return Err("Invalid key length".to_string());
    }
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let password_nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
    let enc_password = cipher.encrypt(&password_nonce, password.as_bytes().as_ref())
        .map_err(|_| "Encryption failed".to_string())?;

    let note_nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
    let enc_note = cipher.encrypt(&note_nonce, note.as_bytes().as_ref())
        .map_err(|_| "Encryption failed".to_string())?;

    let count = conn.execute(
        "UPDATE entries 
         SET service = ?1, login = ?2, enc_password = ?3, password_nonce = ?4, enc_note = ?5, note_nonce = ?6
         WHERE id = ?7 AND user_id = ?8",
        params![service, login, &*enc_password, &*password_nonce, &*enc_note, &*note_nonce, entry_id, user_id],
    ).map_err(|e| e.to_string())?;

    if count == 0 {
        return Err("Entry not found or not authorized".to_string());
    }

    // Логируем обновление записи
    crate::activity_logger::log_activity(
        &conn,
        user_id,
        "edit_entry",
        &format!("Updated entry for service: {}", service)
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Debug)]
struct RawEntry {
    id: i64,
    service: String,
    login: String,
    enc_password: Vec<u8>,
    password_nonce: Vec<u8>,
    enc_note: Vec<u8>,
    note_nonce: Vec<u8>,
}

#[tauri::command]
pub fn get_entries(user_id: i64, enc_key: String) -> Result<Vec<Entry>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let key_bytes = general_purpose::STANDARD.decode(enc_key).map_err(|e| e.to_string())?;
    
    if key_bytes.len() != 32 {
        return Err("Invalid key length".to_string());
    }
    
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    let mut stmt = conn.prepare(
        "SELECT id, service, login, enc_password, password_nonce, enc_note, note_nonce 
         FROM entries WHERE user_id = ?1"
    ).map_err(|e| e.to_string())?;
    
    let raw_entries: Vec<RawEntry> = stmt.query_map(params![user_id], |row| {
        Ok(RawEntry {
            id: row.get(0)?,
            service: row.get(1)?,
            login: row.get(2)?,
            enc_password: row.get(3)?,
            password_nonce: row.get(4)?,
            enc_note: row.get(5)?,
            note_nonce: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    
    if raw_entries.is_empty() {
        return Ok(vec![]);
    }
    
    // Проверяем дешифровку первой записи
    let test_nonce = Nonce::from_slice(&raw_entries[0].password_nonce);
    match cipher.decrypt(test_nonce, raw_entries[0].enc_password.as_ref()) {
        Ok(_) => {
            // Реальные данные: дешифруем все
            let mut entries = Vec::new();
            for raw in raw_entries {
                let password_nonce = Nonce::from_slice(&raw.password_nonce);
                let dec_password = cipher.decrypt(password_nonce, raw.enc_password.as_ref())
                    .map_err(|_| "Decryption failed".to_string())?;
                let password = String::from_utf8(dec_password)
                    .map_err(|_| "Invalid UTF-8".to_string())?;
                
                let note_nonce = Nonce::from_slice(&raw.note_nonce);
                let dec_note = cipher.decrypt(note_nonce, raw.enc_note.as_ref())
                    .map_err(|_| "Decryption failed".to_string())?;
                let note = String::from_utf8(dec_note)
                    .map_err(|_| "Invalid UTF-8".to_string())?;
                
                entries.push(Entry {
                    id: raw.id,
                    service: raw.service,
                    login: raw.login,
                    password,
                    note,
                });
            }
            Ok(entries)
        }
        Err(_) => {
            // Псевдо-логин: проверяем настройки и возвращаем соответствующие данные
            info!("Pseudo login detected, checking settings for fake data");
            
            // Получаем настройки псевдо-режима
            let show_fake_entries: bool = conn.query_row(
                "SELECT COALESCE(show_fake_entries, 1) 
                 FROM pseudo_mode_settings 
                 WHERE user_id = ?1",
                params![user_id],
                |row| row.get(0)
            ).unwrap_or(true);
            
            // Логируем попытку доступа с неверным ключом
            crate::activity_logger::log_activity(
                &conn,
                user_id,
                "pseudo_login_access",
                if show_fake_entries {
                    "Accessed vault with pseudo password - fake data shown"
                } else {
                    "Accessed vault with pseudo password - empty vault shown"
                }
            ).ok();
            
            if show_fake_entries {
                // Возвращаем реалистичные фейковые данные
                Ok(generate_fake_entries_for_user(user_id, true, 31))
            } else {
                // Возвращаем пустой список (пустое хранилище)
                Ok(vec![])
            }
        }
    }
}

#[tauri::command]
pub fn delete_entry(entry_id: i64, user_id: i64) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // Получаем информацию о записи перед удалением для логирования
    let service: String = conn.query_row(
        "SELECT service FROM entries WHERE id = ?1 AND user_id = ?2",
        params![entry_id, user_id],
        |row| row.get(0)
    ).map_err(|_| "Entry not found".to_string())?;
    
    let count = conn.execute(
        "DELETE FROM entries WHERE id = ?1 AND user_id = ?2",
        params![entry_id, user_id],
    ).map_err(|e| e.to_string())?;
    
    if count == 0 {
        return Err("Entry not found or not authorized".to_string());
    }
    
    // Логируем удаление записи
    crate::activity_logger::log_activity(
        &conn,
        user_id,
        "delete_entry",
        &format!("Deleted entry for service: {}", service)
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn delete_user(user_id: i64, master_pass: String) -> Result<(), String> {
    let mut conn = get_conn().map_err(|e| e.to_string())?;
    
    // Получаем соль и хеш
    let (salt_str, hash): (String, String) = {
        let mut stmt = conn.prepare("SELECT salt, hash FROM users WHERE id = ?1").map_err(|e| e.to_string())?;
        let row = stmt.query_row(params![user_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        }).map_err(|_| "User not found".to_string())?;
        row
    };

    let salt = SaltString::from_b64(&salt_str).map_err(|_| "Invalid salt")?;
    let parsed_hash = PasswordHash::new(&hash).map_err(|_| "Invalid hash")?;
    let argon2 = Argon2::default();
    argon2.verify_password(master_pass.as_bytes(), &parsed_hash).map_err(|_| "Invalid password")?;

    // Логируем удаление аккаунта
    crate::activity_logger::log_activity(
        &conn,
        user_id,
        "account_deleted",
        "User account deleted"
    ).ok();

    // Начинаем транзакцию для удаления пользователя и его данных
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM entries WHERE user_id = ?1", params![user_id]).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM activity_logs WHERE user_id = ?1", params![user_id]).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM pseudo_passwords WHERE user_id = ?1", params![user_id]).map_err(|e| e.to_string())?;
    let count = tx.execute("DELETE FROM users WHERE id = ?1", params![user_id]).map_err(|e| e.to_string())?;
    
    if count == 0 {
        return Err("User not found".to_string());
    }
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}


/// Сохраняет ключ восстановления для OTP (вызывается при настройке OTP)
#[tauri::command]
pub fn setup_otp_recovery(user_id: i64, master_pass: String) -> Result<(), String> {
    info!("Setting up OTP recovery for user_id: {}", user_id);
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // 1. Проверяем мастер-пароль и получаем данные
    let (salt_str, hash, username): (String, String, String) = conn.query_row(
        "SELECT salt, hash, username FROM users WHERE id = ?1",
        params![user_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?))
    ).map_err(|_| "User not found".to_string())?;
    
    let parsed_hash = PasswordHash::new(&hash).map_err(|_| "Invalid hash")?;
    let argon2 = Argon2::default();
    
    // Проверяем мастер-пароль
    argon2.verify_password(master_pass.as_bytes(), &parsed_hash)
        .map_err(|_| "Invalid password".to_string())?;
    
    // 2. Генерируем ключ шифрования из мастер-пароля (тот же, что используется для записей)
    let mut encryption_key = [0u8; 32];
    let salt = SaltString::from_b64(&salt_str).map_err(|_| "Invalid salt")?;
    argon2
        .hash_password_into(master_pass.as_bytes(), salt.as_str().as_bytes(), &mut encryption_key)
        .map_err(|e| e.to_string())?;
    
    // 3. Генерируем случайный ключ для шифрования recovery key
    let otp_recovery_salt = SaltString::generate(&mut OsRng);
    let mut otp_derived_key = [0u8; 32];
    
    // Используем OTP secret как основу для ключа шифрования
    let otp_secret: String = conn.query_row(
        "SELECT otp_secret FROM users WHERE id = ?1",
        params![user_id],
        |row| row.get(0)
    ).map_err(|_| "OTP secret not found. Please generate OTP first.".to_string())?;
    
    argon2
        .hash_password_into(otp_secret.as_bytes(), otp_recovery_salt.as_str().as_bytes(), &mut otp_derived_key)
        .map_err(|e| e.to_string())?;
    
    // 4. Шифруем ключ шифрования с помощью производного ключа от OTP secret
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&otp_derived_key);
    let cipher = Aes256Gcm::new(key);
    let nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
    
    let encrypted_key = cipher.encrypt(&nonce, encryption_key.as_ref())
        .map_err(|_| "Failed to encrypt recovery key".to_string())?;
    
    // 5. Сохраняем зашифрованный ключ восстановления
    conn.execute(
        "UPDATE users SET otp_recovery_key = ?1, otp_recovery_nonce = ?2, otp_recovery_salt = ?3 WHERE id = ?4",
        params![&encrypted_key, &*nonce, otp_recovery_salt.as_str(), user_id],
    ).map_err(|e| e.to_string())?;
    
    // Логируем настройку OTP recovery
    crate::activity_logger::log_activity(
        &conn,
        user_id,
        "otp_recovery_setup",
        &format!("OTP recovery key configured for user: {}", username)
    ).ok();
    
    info!("OTP recovery setup successful for user_id: {}", user_id);
    Ok(())
}

/// Проверяет, настроен ли OTP recovery для пользователя
#[tauri::command]
pub fn has_otp_recovery(username: String) -> Result<bool, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    let has_recovery: bool = conn.query_row(
        "SELECT otp_recovery_key IS NOT NULL FROM users WHERE username = ?1",
        params![username],
        |row| row.get(0)
    ).unwrap_or(false);
    
    Ok(has_recovery)
}

/// Вход с помощью OTP (использует recovery key)
#[tauri::command]
pub fn login_with_otp(username: String, otp_code: String) -> Result<(i64, String, bool), String> {
    info!("OTP login attempt for username: {}", username);
    let conn = get_conn().map_err(|e| e.to_string())?;
    
    // 1. Проверяем OTP код
    let otp_secret: String = conn.query_row(
        "SELECT otp_secret FROM users WHERE username = ?1",
        params![&username],
        |row| row.get(0)
    ).map_err(|_| "User or OTP secret not found".to_string())?;
    
    let secret_bytes = base32::decode(base32::Alphabet::RFC4648 { padding: false }, &otp_secret)
        .ok_or("Invalid Base32 secret".to_string())?;
    
    let totp = TOTP::new(
        totp_rs::Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
    ).map_err(|e| format!("Failed to create TOTP: {}", e))?;
    
    let current_time = std::time::SystemTime::now()
        .duration_since(std::time::SystemTime::UNIX_EPOCH)
        .map_err(|e| format!("Failed to get current time: {}", e))?
        .as_secs();
    
    if !totp.check(&otp_code, current_time) {
        return Err("Invalid OTP code".to_string());
    }
    
    // 2. Получаем зашифрованный recovery key
    let (id, encrypted_key, nonce, otp_recovery_salt): (i64, Vec<u8>, Vec<u8>, String) = conn.query_row(
        "SELECT id, otp_recovery_key, otp_recovery_nonce, otp_recovery_salt FROM users WHERE username = ?1",
        params![&username],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
    ).map_err(|_| "OTP recovery not set up. Please contact support or use master password.".to_string())?;
    
    // 3. Генерируем ключ из OTP secret для расшифровки
    let argon2 = Argon2::default();
    let mut otp_derived_key = [0u8; 32];
    argon2
        .hash_password_into(otp_secret.as_bytes(), otp_recovery_salt.as_bytes(), &mut otp_derived_key)
        .map_err(|e| e.to_string())?;
    
    // 4. Расшифровываем ключ шифрования
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&otp_derived_key);
    let cipher = Aes256Gcm::new(key);
    let nonce_aead = Nonce::from_slice(&nonce);
    
    let decrypted_key = cipher.decrypt(nonce_aead, encrypted_key.as_ref())
        .map_err(|_| "Failed to decrypt recovery key. OTP recovery may be corrupted.".to_string())?;
    
    let enc_key = general_purpose::STANDARD.encode(decrypted_key);
    
    // 5. Логируем успешный вход
    crate::activity_logger::log_activity(
        &conn,
        id,
        "login",
        &format!("Successful login via OTP for user: {}", username)
    ).map_err(|e| e.to_string())?;
    
    info!("OTP login successful for username: {}", username);
    
    // is_pseudo = false, так как это настоящий вход через OTP
    Ok((id, enc_key, false))
}