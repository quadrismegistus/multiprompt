import { invoke } from '@tauri-apps/api/tauri';

export function log(...args) {
  console.log(...args);
  invoke('log_to_backend', { message: args.map(String).join(' ') });
}

export function error(...args) {
  console.error(...args);
  invoke('error_to_backend', { message: args.map(String).join(' ') });
}