// ============================================================================
// X-PASS Password Manager - Library Entry Point
// ============================================================================
// Prevent console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// ============================================================================
// Core Modules
// ============================================================================
mod password_manager;      // Password vault CRUD operations
mod backup;                // Encrypted backup/restore
mod otp;                   // Two-Factor Authentication (TOTP)
mod pseudo_mode;           // Duress password functionality
mod fake_data_generator;   // Generate fake vault entries

// UI & Security
mod titlebar_events;       // Custom window controls
mod activity_logger;       // Activity logging & security monitoring
mod flags;                 // Feature flags system

use std::sync::{Arc, Mutex};

// ============================================================================
// Global State - Network Toggle
// ============================================================================
lazy_static::lazy_static! {
    /// Controls network access for the application (offline mode)
    static ref NETWORK_ENABLED: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

/// Toggle network connectivity for the application
#[tauri::command]
async fn toggle_network(enable: bool) -> bool {
    let mut network_enabled = NETWORK_ENABLED.lock().unwrap();
    *network_enabled = enable;
    enable
}

// ============================================================================
// Application Entry Point
// ============================================================================
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::init();
    
    tauri::Builder::default()
        // ========================================
        // Plugins
        // ========================================
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_opener::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        
        // ========================================
        // Command Handlers
        // ========================================
        .invoke_handler(tauri::generate_handler![
            // --- Network Control ---
            toggle_network,
            
            // --- Window Management ---
            titlebar_events::minimize_window,
            titlebar_events::toggle_maximize,
            titlebar_events::close_window,
            titlebar_events::toggle_fullscreen,
            titlebar_events::refresh_app,
            
            // --- Password Manager Core ---
            password_manager::list_users,
            password_manager::create_user,
            password_manager::login,
            password_manager::add_entry,
            password_manager::update_entry,
            password_manager::get_entries,
            password_manager::delete_entry,
            password_manager::delete_user,
            password_manager::verify_user_password,
            password_manager::login_with_otp,
            password_manager::login,
            
            password_manager::setup_otp_recovery,  // ← Добавьте
            password_manager::has_otp_recovery,  // ← Добавьте
            
            // --- Two-Factor Authentication ---
            otp::generate_otp_secret,
            otp::verify_otp,
            otp::has_otp_secret,
            otp::reset_otp_secret,
            
            // --- Activity Logging & Security ---
            activity_logger::get_activity_logs,
            activity_logger::get_activity_stats,
            activity_logger::get_activity_trend,
            activity_logger::clear_activity_logs,
            activity_logger::get_activity_count,
            activity_logger::cleanup_old_logs,
            activity_logger::export_activity_logs,
            activity_logger::schedule_logs_deletion,
            activity_logger::check_pending_deletion,
            activity_logger::cancel_logs_deletion,
            
            // --- Failed Login Photo Capture ---
            activity_logger::save_failed_login_photo,
            activity_logger::get_failed_login_photos,
            activity_logger::delete_failed_login_photo,
            activity_logger::update_photo_setting,
            activity_logger::get_photo_setting,
            activity_logger::is_photo_setting_enabled_for_username,
            
            // --- Pseudo/Duress Mode ---
            pseudo_mode::add_pseudo_password,
            pseudo_mode::delete_all_pseudo_passwords,
            pseudo_mode::get_pseudo_passwords_count,
            pseudo_mode::save_pseudo_mode_settings,
            pseudo_mode::get_pseudo_mode_settings,
            pseudo_mode::is_pseudo_mode_active,
            pseudo_mode::delete_pseudo_password,
            
            // --- Backup & Restore ---
            backup::export_vault_encrypted,
            backup::import_vault_with_password,
            
            // --- Feature Flags ---
            flags::get_flag,
            flags::get_all_flags,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}