import { app, BrowserWindow } from 'electron';
// ForgeのWebpackプラグインが自動生成するマジック定数を参照するための型宣言
// （開発・本番それぞれのWebpackバンドル先パスを解決するために必要）
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Windowsでのインストール・アンインストール時にショートカットを作成・削除する処理
if (require('electron-squirrel-startup')) {
  app.quit();
}

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
};

// Electronの初期化完了後に呼び出されるイベント
// このイベント以降でのみ使用可能なAPIがある
app.on('ready', createWindow);

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
