import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { parseEditUrl } from './protocol';
import type { EditRequest } from './types';
import { registerIpcHandlers } from './ipc';

// ForgeのWebpackプラグインが自動生成するマジック定数を参照するための型宣言
// （開発・本番それぞれのWebpackバンドル先パスを解決するために必要）
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Windowsでのインストール・アンインストール時にショートカットを作成・削除する処理
if (require('electron-squirrel-startup')) {
  app.quit();
}

// docmdtest:// URLスキームをデフォルトハンドラとして登録
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('docmdtest', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('docmdtest');
}

// シングルインスタンスロックを取得（2重起動防止）
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// 起動時に受け取った編集リクエストを保持する変数
let pendingEditRequest: EditRequest | null = null;
let mainWindowRef: BrowserWindow | null = null;

// URLを解析してレンダラーへ編集リクエストを送信する
function handleEditUrl(url: string) {
  const req = parseEditUrl(url);
  if (!req) return;
  if (mainWindowRef) {
    mainWindowRef.webContents.send('edit-request', req);
    if (mainWindowRef.isMinimized()) mainWindowRef.restore();
    mainWindowRef.focus();
  } else {
    pendingEditRequest = req;
  }
}

// 2つ目のインスタンスが起動しようとしたとき、URLを受け取って処理する
app.on('second-instance', (_event, argv) => {
  const urlArg = argv.find(a => a.startsWith('docmdtest://'));
  if (urlArg) handleEditUrl(urlArg);
});

// macOS: Finderなどからdocmdtest://リンクが開かれたとき
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleEditUrl(url);
});

const createWindow = (): void => {
  // ブラウザウィンドウを生成
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // アプリのindex.htmlを読み込む
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // 開発環境のみDevToolsを開く
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools();
  }

  // メインウィンドウの参照を保持
  mainWindowRef = mainWindow;

  // ロード完了後、保留中の編集リクエストがあれば送信
  mainWindow.webContents.once('did-finish-load', () => {
    if (pendingEditRequest) {
      mainWindow.webContents.send('edit-request', pendingEditRequest);
      pendingEditRequest = null;
    }
  });

  // ウィンドウが閉じられたら参照をクリア
  mainWindow.on('closed', () => { mainWindowRef = null; });
};

// Electronの初期化完了後に呼び出されるイベント
// このイベント以降でのみ使用可能なAPIがある
app.on('ready', () => {
  registerIpcHandlers();
  createWindow();
});

// 全ウィンドウが閉じられたときの処理（macOSを除く）
// macOSではCmd+Qで明示的に終了するまでアプリとメニューバーをアクティブに保つ
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOS: Dockアイコンクリック時、ウィンドウがなければ再生成
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// メインプロセスのその他のコードはここに追記するか、別ファイルに切り出してインポートする
