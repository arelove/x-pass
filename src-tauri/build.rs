// ============================================================================
// X-PASS Password Manager - Build Script
// ============================================================================
// This script runs at compile time to:
// - Parse tauri.conf.json
// - Generate Rust code from configuration
// - Embed platform-specific resources (icons, manifests)
// ============================================================================

fn main() {
    // Generate Tauri context from tauri.conf.json
    tauri_build::build()
}