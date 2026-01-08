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
use tauri::Emitter;
use tauri::Manager;
use tauri::{AppHandle, Window};

#[tauri::command]
pub fn minimize_window(app: AppHandle, window: Window) {
    if let Err(e) = window.minimize() {
        app.emit("log", format!("Failed to minimize window: {}", e))
            .unwrap();
    }
}

#[tauri::command]
pub fn toggle_maximize(app: AppHandle, window: Window) {
    if let Ok(is_maximized) = window.is_maximized() {
        if is_maximized {
            if let Err(e) = window.unmaximize() {
                app.emit("log", format!("Failed to unmaximize window: {}", e))
                    .unwrap();
            }
        } else {
            if let Err(e) = window.maximize() {
                app.emit("log", format!("Failed to maximize window: {}", e))
                    .unwrap();
            }
        }
    }
}

#[tauri::command]
pub fn close_window(app: AppHandle, window: Window) {
    app.remove_tray_by_id("main")
        .expect("Failed to remove tray on close");
    if let Err(e) = window.close() {
        app.emit("log", format!("Failed to close window: {}", e))
            .unwrap();
    }
    app.exit(0); // Completely terminate the application
}

#[tauri::command]
pub fn toggle_fullscreen(app: AppHandle, window: Window) {
    if let Ok(is_fullscreen) = window.is_fullscreen() {
        if is_fullscreen {
            if let Err(e) = window.set_fullscreen(false) {
                app.emit("log", format!("Failed to exit fullscreen: {}", e))
                    .unwrap();
            }
        } else {
            if let Err(e) = window.set_fullscreen(true) {
                app.emit("log", format!("Failed to enter fullscreen: {}", e))
                    .unwrap();
            }
        }
    }
}

#[tauri::command]
pub fn refresh_app(app: AppHandle, _window: Window) {
    // Example command for reload (can be replaced with your own logic)
    let webview = app.get_webview_window("main").unwrap();
    if let Err(e) = webview.eval("window.location.reload()") {
        app.emit("log", format!("Failed to refresh app: {}", e))
            .unwrap();
    }
}