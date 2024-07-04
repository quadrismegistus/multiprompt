use std::process::{Command, Stdio};
use std::thread;
use std::io::{BufRead, BufReader};
use std::sync::mpsc;

pub fn start_embedded_server() -> mpsc::Receiver<String> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let mut command = Command::new("python")
            .arg("../backend/app.py")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("Failed to start Python backend");

        let stdout = command.stdout.take().expect("Failed to capture stdout");
        let stderr = command.stderr.take().expect("Failed to capture stderr");

        let tx_clone = tx.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    println!("Python backend stdout: {}", line);
                    tx_clone.send(format!("stdout: {}", line)).unwrap();
                }
            }
        });

        let tx_clone = tx.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    eprintln!("Python backend stderr: {}", line);
                    tx_clone.send(format!("stderr: {}", line)).unwrap();
                }
            }
        });

        let status = command.wait().expect("Failed to wait for Python backend");
        println!("Python backend exited with status: {:?}", status);
    });

    rx
}