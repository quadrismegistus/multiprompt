#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod embedded_server;

use embedded_server::start_embedded_server;

fn main() {
  start_embedded_server();
  
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}