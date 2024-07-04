const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  port: 8989,
});
