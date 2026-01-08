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

// src-tauri/src/flags.rs

use tauri::command;

// Embed SVG flags directly into the binary
const FLAG_GB: &str = include_str!("../assets/flags/gb.svg");
const FLAG_RU: &str = include_str!("../assets/flags/ru.svg");
const FLAG_CN: &str = include_str!("../assets/flags/cn.svg");
const FLAG_ES: &str = include_str!("../assets/flags/es.svg");
const FLAG_BR: &str = include_str!("../assets/flags/br.svg");
const FLAG_FR: &str = include_str!("../assets/flags/fr.svg");
const FLAG_DE: &str = include_str!("../assets/flags/de.svg");
const FLAG_JP: &str = include_str!("../assets/flags/jp.svg");
const FLAG_KR: &str = include_str!("../assets/flags/kr.svg");
const FLAG_IT: &str = include_str!("../assets/flags/it.svg");
const FLAG_SA: &str = include_str!("../assets/flags/sa.svg");
const FLAG_IN: &str = include_str!("../assets/flags/in.svg");
const FLAG_ID: &str = include_str!("../assets/flags/id.svg");

#[command]
pub fn get_flag(country_code: String) -> Result<String, String> {
    let flag = match country_code.to_uppercase().as_str() {
        "GB" => FLAG_GB,    // United Kingdom
        "RU" => FLAG_RU,    // Russia
        "CN" => FLAG_CN,    // China
        "ES" => FLAG_ES,    // Spain
        "BR" => FLAG_BR,    // Brazil
        "FR" => FLAG_FR,    // France
        "DE" => FLAG_DE,    // Germany
        "JP" => FLAG_JP,    // Japan
        "KR" => FLAG_KR,    // South Korea
        "IT" => FLAG_IT,    // Italy
        "SA" => FLAG_SA,    // Saudi Arabia
        "IN" => FLAG_IN,    // India
        "ID" => FLAG_ID,    // Indonesia
        _ => return Err(format!("Flag not found for code: {}", country_code)),
    };
    
    Ok(flag.to_string())
}

#[command]
pub fn get_all_flags() -> std::collections::HashMap<String, String> {
    let mut flags = std::collections::HashMap::new();
    flags.insert("GB".to_string(), FLAG_GB.to_string());
    flags.insert("RU".to_string(), FLAG_RU.to_string());
    flags.insert("CN".to_string(), FLAG_CN.to_string());
    flags.insert("ES".to_string(), FLAG_ES.to_string());
    flags.insert("BR".to_string(), FLAG_BR.to_string());
    flags.insert("FR".to_string(), FLAG_FR.to_string());
    flags.insert("DE".to_string(), FLAG_DE.to_string());
    flags.insert("JP".to_string(), FLAG_JP.to_string());
    flags.insert("KR".to_string(), FLAG_KR.to_string());
    flags.insert("IT".to_string(), FLAG_IT.to_string());
    flags.insert("SA".to_string(), FLAG_SA.to_string());
    flags.insert("IN".to_string(), FLAG_IN.to_string());
    flags.insert("ID".to_string(), FLAG_ID.to_string());
    flags
}