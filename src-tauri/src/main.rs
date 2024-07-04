#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod embedded_server;

use embedded_server::start_embedded_server;
use tauri::Manager;

fn main() {
    let backend_rx = start_embedded_server();

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                while let Ok(message) = backend_rx.recv() {
                    println!("Received from Python backend: {}", message);
                    // You can emit this message to your frontend if needed
                    // app_handle.emit_all("backend-log", message).unwrap();
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}