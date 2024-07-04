#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
  )]
  
  mod embedded_server;
  
  use embedded_server::start_embedded_server;
  use tauri::Manager;
  use std::sync::Arc;
  use colored::*;
  
  #[tauri::command]
  fn log_to_backend(message: String) {
      println!("{}", format!("[Frontend] {}", message).green());
  }
  
  #[tauri::command]
  fn error_to_backend(message: String) {
      eprintln!("{}", format!("[Frontend Error] {}", message).red());
  }
  
  fn main() {
      let (backend_rx, child_process) = start_embedded_server();
  
      tauri::Builder::default()
          .setup(move |app| {
              // Handle Python backend messages
              tauri::async_runtime::spawn(async move {
                  while let Ok(message) = backend_rx.recv() {
                      println!("{}", message.blue());
                  }
              });
  
              // Set up a handler for window close event
              let child_process_clone = Arc::clone(&child_process);
              let window = app.get_window("main").unwrap();
              window.on_window_event(move |event| {
                  if let tauri::WindowEvent::CloseRequested { .. } = event {
                      println!("{}", "Window is closing. Terminating Python backend...".yellow());
                      if let Ok(mut child) = child_process_clone.lock() {
                          match child.kill() {
                              Ok(_) => println!("{}", "Python backend terminated successfully".green()),
                              Err(e) => eprintln!("{}", format!("Failed to terminate Python backend: {}", e).red()),
                          }
                      }
                  }
              });
  
              Ok(())
          })
          .invoke_handler(tauri::generate_handler![log_to_backend, error_to_backend])
          .run(tauri::generate_context!())
          .expect("error while running tauri application");
  }