use std::process::{Command, Stdio, Child};
use std::thread;
use std::io::{BufRead, BufReader};
use std::sync::{mpsc, Arc, Mutex};
use colored::*;

pub fn start_embedded_server() -> (mpsc::Receiver<String>, Arc<Mutex<Child>>) {
    let (tx, rx) = mpsc::channel();

    let mut command = Command::new("python")
        .arg("../run_server.py")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start Python backend");

    let stdout = command.stdout.take().expect("Failed to capture stdout");
    let stderr = command.stderr.take().expect("Failed to capture stderr");

    let child_process = Arc::new(Mutex::new(command));
    let child_process_clone = Arc::clone(&child_process);

    thread::spawn(move || {
        let tx_clone = tx.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    // println!("{}", format!("{}", line).blue());
                    // tx_clone.send(format!("{}", line)).unwrap();
                }
            }
        });

        let tx_clone = tx.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    eprintln!("{}", format!("{}", line).red());
                    tx_clone.send(format!("{}", line)).unwrap();
                }
            }
        });

        match child_process_clone.lock().unwrap().wait() {
            Ok(status) => {
                let msg = format!("Python backend exited with status: {:?}", status);
                println!("{}", msg.yellow());
                tx.send(msg).unwrap();
            },
            Err(e) => {
                let msg = format!("Failed to wait for Python backend: {}", e);
                eprintln!("{}", msg.red());
                // tx.send(msg).unwrap();
            },
        }
    });

    (rx, child_process)
}