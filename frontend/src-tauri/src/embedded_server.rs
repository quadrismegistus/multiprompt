use std::process::{Command, Stdio};
use std::thread;

pub fn start_embedded_server() {
    thread::spawn(|| {
        let mut command = Command::new("python")
            .arg("backend/app.py")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("Failed to start Python backend");

        let status = command.wait().expect("Failed to wait for Python backend");
        println!("Python backend exited with status: {:?}", status);
    });
}