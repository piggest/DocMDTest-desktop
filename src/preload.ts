import { contextBridge, ipcRenderer } from 'electron';

// レンダラープロセスへ安全なAPIを公開する
contextBridge.exposeInMainWorld('api', {
  auth: {
    getStatus: () => ipcRenderer.invoke('auth:getStatus'),
    startDeviceFlow: () => ipcRenderer.invoke('auth:startDeviceFlow'),
    pollToken: (deviceCode: string, intervalSec: number) =>
      ipcRenderer.invoke('auth:pollToken', deviceCode, intervalSec),
    savePat: (pat: string) => ipcRenderer.invoke('auth:savePat', pat),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  github: {
    fetchFile: (path: string) => ipcRenderer.invoke('github:fetchFile', path),
    putFile: (args: { path: string; content: string; sha: string; message: string }) =>
      ipcRenderer.invoke('github:putFile', args),
  },
  onEditRequest: (cb: (r: { action: string; path: string }) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, r: { action: string; path: string }) => cb(r);
    ipcRenderer.on('edit-request', handler);
    return () => ipcRenderer.removeListener('edit-request', handler);
  },
});
