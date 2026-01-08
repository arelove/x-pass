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
// otp.rs - updated version

use totp_rs::{Algorithm, TOTP};
use rusqlite::{params, OptionalExtension};
use base32::Alphabet;
use rand::Rng;
use std::time::SystemTime;
use log::{error, info};

// OTP secret and QR-code generation
#[tauri::command]
pub fn generate_otp_secret(username: String) -> Result<(String, String), String> {
    info!("Generating OTP secret for username: {}", username);
    let conn = match super::password_manager::get_conn() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Failed to connect to database: {}", e);
            return Err(format!("Failed to connect to database: {}", e));
        }
    };
    
    let existing_secret: Option<String> = match conn.query_row(
        "SELECT otp_secret FROM users WHERE username = ?1",
        params![username],
        |row| row.get::<_, Option<String>>(0),
    ).optional() {
        Ok(secret) => secret,
        Err(e) => {
            error!("Failed to query otp_secret for username {}: {}", username, e);
            return Err(format!("Failed to query otp_secret: {}", e));
        }
    }.flatten();
    
    let secret_bytes: Vec<u8>;
    let secret_base32: String;
    
    if let Some(secret) = existing_secret {
        info!("Reusing existing OTP secret for username: {}", username);
        secret_base32 = secret;
        secret_bytes = match base32::decode(Alphabet::RFC4648 { padding: false }, &secret_base32) {
            Some(bytes) => bytes,
            None => {
                error!("Invalid Base32 secret for username: {}", username);
                return Err("Invalid Base32 secret".to_string());
            }
        };
    } else {
        secret_bytes = rand::thread_rng().gen::<[u8; 20]>().to_vec();
        secret_base32 = base32::encode(Alphabet::RFC4648 { padding: false }, &secret_bytes);
        info!("Generated new secret (Base32) for username {}: {}", username, secret_base32);
        match conn.execute(
            "UPDATE users SET otp_secret = ?1 WHERE username = ?2",
            params![secret_base32, username],
        ) {
            Ok(rows_affected) => {
                if rows_affected == 0 {
                    error!("No user found with username: {}", username);
                    return Err("User not found".to_string());
                }
                info!("Updated otp_secret for username: {}", username);
            }
            Err(e) => {
                error!("Failed to update otp_secret in database: {}", e);
                return Err(format!("Failed to update database: {}", e));
            }
        };
    }
    
    let totp = match TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
    ) {
        Ok(totp) => totp,
        Err(e) => {
            error!("Failed to create TOTP: {}", e);
            return Err(format!("Failed to create TOTP: {}", e));
        }
    };
    
    let qr_code = format!(
        "otpauth://totp/PasswordManager:{}?secret={}&issuer=PasswordManager&algorithm=SHA1&digits=6&period=30",
        username, secret_base32
    );
    
    Ok((secret_base32, qr_code))
}

// Reset OTP secret (also clears recovery key)
#[tauri::command]
pub fn reset_otp_secret(username: String) -> Result<(String, String), String> {
    info!("Resetting OTP secret for username: {}", username);
    let conn = match super::password_manager::get_conn() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Failed to connect to database: {}", e);
            return Err(format!("Failed to connect to database: {}", e));
        }
    };
    
    // Clear OTP secret and recovery key
    match conn.execute(
        "UPDATE users SET otp_secret = NULL, otp_recovery_key = NULL, otp_recovery_nonce = NULL, otp_recovery_salt = NULL WHERE username = ?1",
        params![username],
    ) {
        Ok(rows_affected) => {
            if rows_affected == 0 {
                error!("No user found with username: {}", username);
                return Err("User not found".to_string());
            }
            info!("Cleared otp_secret and recovery key for username: {}", username);
        }
        Err(e) => {
            error!("Failed to clear otp_secret in database: {}", e);
            return Err(format!("Failed to clear otp_secret: {}", e));
        }
    };
    
    // Generate new OTP secret
    generate_otp_secret(username)
}

// OTP code verification
#[tauri::command]
pub fn verify_otp(username: String, otp_code: String) -> Result<bool, String> {
    info!("Verifying OTP for username: {}", username);
    let conn = match super::password_manager::get_conn() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Failed to connect to database: {}", e);
            return Err(format!("Failed to connect to database: {}", e));
        }
    };
    
    let otp_secret: String = match conn.query_row(
        "SELECT otp_secret FROM users WHERE username = ?1",
        params![username],
        |row| row.get(0),
    ) {
        Ok(secret) => secret,
        Err(e) => {
            error!("User or OTP secret not found for username: {}: {}", username, e);
            return Err("User or OTP secret not found".to_string());
        }
    };
    
    let secret_bytes = match base32::decode(Alphabet::RFC4648 { padding: false }, &otp_secret) {
        Some(bytes) => bytes,
        None => {
            error!("Invalid Base32 secret for username: {}", username);
            return Err("Invalid Base32 secret".to_string());
        }
    };
    
    let totp = match TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
    ) {
        Ok(totp) => totp,
        Err(e) => {
            error!("Failed to create TOTP: {}", e);
            return Err(format!("Failed to create TOTP: {}", e));
        }
    };
    
    let current_time = match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
        Ok(time) => time.as_secs(),
        Err(e) => {
            error!("Failed to get current time: {}", e);
            return Err(format!("Failed to get current time: {}", e));
        }
    };
    
    let is_valid = totp.check(&otp_code, current_time);
    info!("OTP verification result for username {}: {}", username, is_valid);
    Ok(is_valid)
}

// Check if OTP secret exists
#[tauri::command]
pub fn has_otp_secret(username: String) -> Result<bool, String> {
    info!("Checking OTP secret existence for username: {}", username);
    let conn = match super::password_manager::get_conn() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Failed to connect to database: {}", e);
            return Err(format!("Failed to connect to database: {}", e));
        }
    };
    
    let otp_secret: Option<String> = match conn.query_row(
        "SELECT otp_secret FROM users WHERE username = ?1",
        params![username],
        |row| row.get::<_, Option<String>>(0),
    ).optional() {
        Ok(secret) => secret,
        Err(e) => {
            error!("Failed to query otp_secret: {}", e);
            return Err(format!("Failed to query otp_secret: {}", e));
        }
    }.flatten();
    
    Ok(otp_secret.is_some())
}