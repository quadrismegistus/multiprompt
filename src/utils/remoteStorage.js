import { io } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../constants';

class RemoteStorage {
  constructor() {
    this.socket = io(SOCKET_SERVER_URL);
    this.connected = false;
    this.pendingRequests = new Map();

    this.socket.on('connect', () => {
      console.log('Connected to remote storage');
      this.connected = true;
      this.processPendingRequests();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from remote storage');
      this.connected = false;
    });

    this.socket.on('storageResponse', (response) => {
      const { requestId, data, error } = response;
      const pendingRequest = this.pendingRequests.get(requestId);
      if (pendingRequest) {
        if (error) {
          pendingRequest.reject(error);
        } else {
          pendingRequest.resolve(data);
        }
        this.pendingRequests.delete(requestId);
      }
    });
  }

  generateRequestId() {
    return Math.random().toString(36).substr(2, 9);
  }

  processPendingRequests() {
    for (const [requestId, { action, key, value }] of this.pendingRequests) {
      this.socket.emit(action, { requestId, key, value });
    }
  }

  async getItem(key) {
    return this.sendRequest('getItem', key);
  }

  async setItem(key, value) {
    return this.sendRequest('setItem', key, value);
  }

  sendRequest(action, key, value = null) {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const request = { action, key, value };
      
      if (this.connected) {
        this.socket.emit(action, { requestId, key, value });
      }
      
      this.pendingRequests.set(requestId, {
        ...request,
        resolve,
        reject,
      });

      if (!this.connected) {
        console.log(`Not connected. Request ${requestId} added to pending queue.`);
      }
    });
  }
}

export const remoteStorage = new RemoteStorage();