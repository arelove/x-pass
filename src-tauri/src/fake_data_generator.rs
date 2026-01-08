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

// src-tauri/src/fake_data_generator.rs
use crate::password_manager::Entry;
use rand::Rng;

/// Generates realistic fake entries for pseudo-mode / panic mode
pub fn generate_fake_entries(count: usize) -> Vec<Entry> {
    let services = vec![
        // Major tech & email
        ("Google", "michael.j.rivers87@gmail.com", "SunnyHills2023!", "Main email"),
        ("Apple ID", "michael.rivers@icloud.com", "iCloud!Vault2024", "iPhone & Mac"),
        ("Microsoft", "m.rivers@outlook.com", "Office365!2025", "Work & personal"),
        ("Yahoo Mail", "mike_rivers2000@yahoo.com", "OldMail!Secure22", "Backup email"),

        // Social networks & messengers
        ("Facebook", "michael.rivers.39", "FamilyMoments2024", "Friends & family"),
        ("Instagram", "mike.rivers.adventures", "InstaVibes!2025", "Travel photos"),
        ("TikTok", "@mikeriverslife", "TikTokTrendz24!", "Short videos"),
        ("Snapchat", "m.rivers.snap", "SnapBack2024!", "Daily snaps"),
        ("WhatsApp", "+1 (716) 555-0192", "ChatSecure!2025", "Primary messenger"),
        ("Telegram", "@MikeRiversReal", "TG!Secret2024", "Private groups"),
        ("Discord", "MikeRivers#7482", "Discord!Gaming25", "Gaming & friends"),

        // Banking & finance (US popular)
        ("Chase", "m.rivers85", "ChaseSecure!2025", "Checking + Savings"),
        ("Bank of America", "mriversboa", "BoA!Vault2024", "Main account"),
        ("Wells Fargo", "michael.wf", "Wells!Safe2023", "Mortgage"),
        ("Capital One", "mikerivers.cap", "VentureX!2025", "Credit card"),
        ("American Express", "m.rivers.amex", "Platinum!Rewards24", "Premium card"),
        ("PayPal", "michael.rivers@paypal.com", "PaySafe!2025", "Online payments"),
        ("Venmo", "mikerivers", "Venmo!Quick24", "Friends payments"),
        ("Cash App", "$MikeRivers87", "CashTag!2025", "Quick transfers"),

        // Shopping & delivery
        ("Amazon", "mikeriversprime", "PrimeMember!2026", "Prime account"),
        ("Walmart", "m.rivers.walmart", "Walmart+2025", "Online grocery"),
        ("Target", "michael.target", "RedCard!Rewards24", "Circle rewards"),
        ("eBay", "mikerivers.seller", "eBayPro!2024", "Selling account"),
        ("Etsy", "rivershandmade", "EtsyShop!2025", "Handmade purchases"),
        ("DoorDash", "m.rivers.dash", "DashPass!2025", "Food delivery"),
        ("Uber Eats", "michael.ubereats", "EatsPass!2024", "Food orders"),

        // Streaming & entertainment
        ("Netflix", "rivers.family", "WatchParty2025!", "Family profile"),
        ("Disney+", "mikerivers.disney", "MagicKingdom!24", "Disney content"),
        ("Hulu", "michael.hulu", "NoAds2025!", "Live TV + streaming"),
        ("YouTube Premium", "m.rivers.yt", "NoAdsTube!2025", "Ad-free viewing"),
        ("Spotify", "michaelrivers.music", "FamilyPlan!2026", "Music + podcasts"),
        ("Twitch", "mikerivers_tv", "Sub4Life!2024", "Streaming follows"),

        // Travel & transportation
        ("Delta Airlines", "m.rivers.delta", "SkyMiles!Elite25", "Frequent flyer"),
        ("United Airlines", "mrivers.united", "MileagePlus2025", "Travel rewards"),
        ("Airbnb", "mikerivers.host", "HostPro!2025", "Hosting & stays"),
        ("Uber", "m.rivers.uber", "UberOne!2025", "Rides & eats"),
        ("Lyft", "michael.lyft", "PinkPass!2024", "Alternative rides"),

        // Work & productivity
        ("LinkedIn", "michael-rivers-mba", "CareerPath!2025", "Professional network"),
        ("Work Email", "michael.rivers@techsolutions.io", "Corp!Secure2026", "Office 365"),
        ("Slack", "m.rivers", "TeamChat!2025", "Work communication"),
        ("Notion", "mikerivers.notion", "LifeOS!2025", "All-in-one workspace"),
        ("Zoom", "m.rivers.zoom", "MeetingPro!2025", "Video conferencing"),

        // Gaming & hobbies
        ("Steam", "MikeRivers87", "SteamDeck!2025", "Game library"),
        ("PlayStation Network", "MikeRivers_PS5", "PSPlus!Extra24", "PS5 account"),
        ("Xbox Live", "MikeRivers_Xbox", "GamePass!Ultimate25", "Xbox gaming"),
        ("Epic Games", "mikerivers.epic", "Fortnite!2025", "Fortnite & Unreal"),

        // Other popular services
        ("Reddit", "u/mikerivers_tech", "Lurker!2025", "Tech & memes"),
        ("GitHub", "mikerivers-dev", "CodeSafe!2025", "Personal projects"),
        ("Dropbox", "michael.rivers", "FamilyBackup!24", "File storage"),
        ("1Password", "m.rivers.1pw", "MetaPassword!2025", "Irony password manager :D"),
        ("Coinbase", "mikerivers.crypto", "HODL2025!", "Crypto wallet"),
    ];

    let mut rng = rand::thread_rng();
    let max_entries = services.len().min(count);

    // Select random services
    let mut selected_indices: Vec<usize> = (0..services.len()).collect();
    for i in 0..max_entries {
        let j = rng.gen_range(i..services.len());
        selected_indices.swap(i, j);
    }

    selected_indices.truncate(max_entries);

    selected_indices
        .iter()
        .enumerate()
        .map(|(idx, &i)| {
            let (service, login, password, note) = &services[i];
            Entry {
                id: -(idx as i64 + 1), // Negative IDs for fake entries
                service: service.to_string(),
                login: login.to_string(),
                password: password.to_string(),
                note: note.to_string(),
            }
        })
        .collect()
}

/// Alternative generator with very generic/empty-looking entries (maximum plausible deniability)
pub fn generate_empty_fake_entries(count: usize) -> Vec<Entry> {
    (0..count)
        .map(|i| Entry {
            id: -(i as i64 + 1),
            service: format!("Service {}", i + 1),
            login: format!("user{}@example.com", i + 1),
            password: format!("password{}", i + 1),
            note: String::from("No real data stored here"),
        })
        .collect()
}

/// Generates fake entries depending on user settings
pub fn generate_fake_entries_for_user(
    _user_id: i64,
    show_realistic: bool,
    count: usize,
) -> Vec<Entry> {

    if show_realistic {
        generate_fake_entries(count)
    } else {
        generate_empty_fake_entries(count)
    }
}