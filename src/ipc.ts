import { ipcMain } from 'electron';
import { CredentialStore, startDeviceFlow, pollAccessToken } from './auth';
import { GitHubClient } from './github';
import { GITHUB_CLIENT_ID, REPO_OWNER, REPO_NAME } from './config';

// IPCハンドラーを登録する
export function registerIpcHandlers() {
  const creds = new CredentialStore();

  // 認証状態を返す
  ipcMain.handle('auth:getStatus', async () => {
    const token = await creds.getToken();
    if (!token) return { authenticated: false };
    try {
      const client = GitHubClient.fromToken(token);
      const user = await client.getAuthenticatedUser();
      return { authenticated: true, login: user.login };
    } catch {
      return { authenticated: false };
    }
  });

  // デバイスフローを開始する
  ipcMain.handle('auth:startDeviceFlow', async () => startDeviceFlow(GITHUB_CLIENT_ID));

  // アクセストークンをポーリングして保存する
  ipcMain.handle('auth:pollToken', async (_e, deviceCode: string, intervalSec: number) => {
    try {
      const result = await pollAccessToken(GITHUB_CLIENT_ID, deviceCode, intervalSec, 900);
      await creds.saveToken(result.access_token);
      return { success: true };
    } catch (e) {
      // Sanitize — don't leak deviceCode/clientId in error messages
      const safeMessage = (e as Error).message.includes('Cancelled')
        ? 'Cancelled'
        : (e as Error).message.includes('timed out')
          ? 'Device flow timed out'
          : 'Authentication failed';
      throw new Error(safeMessage);
    }
  });

  // PATを保存する
  ipcMain.handle('auth:savePat', async (_e, pat: string) => {
    await creds.saveToken(pat);
    return { success: true };
  });

  // トークンを削除してログアウトする
  ipcMain.handle('auth:logout', async () => {
    await creds.clearToken();
    return { success: true };
  });

  // GitHubからファイルを取得する
  ipcMain.handle('github:fetchFile', async (_e, path: string) => {
    const token = await creds.getToken();
    if (!token) throw new Error('Not authenticated');
    const client = GitHubClient.fromToken(token);
    return client.fetchFile(REPO_OWNER, REPO_NAME, path);
  });

  // GitHubへファイルを書き込む
  ipcMain.handle('github:putFile', async (_e, args: { path: string; content: string; sha: string; message: string }) => {
    const token = await creds.getToken();
    if (!token) throw new Error('Not authenticated');
    const client = GitHubClient.fromToken(token);
    await client.putFile({ owner: REPO_OWNER, repo: REPO_NAME, ...args });
    return { success: true };
  });
}
