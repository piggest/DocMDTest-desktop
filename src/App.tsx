import { useEffect, useRef, useState } from 'react';
import LoginScreen from './LoginScreen';
import Editor from './Editor';

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [editRequest, setEditRequest] = useState<{ path: string } | null>(null);

  // メニューからのログアウトに対応するためrefで最新の関数を保持
  const handleLogoutRef = useRef<(() => Promise<void>) | undefined>(undefined);
  handleLogoutRef.current = async () => {
    await window.api.auth.logout();
    setAuthed(false);
    setEditRequest(null);
  };

  useEffect(() => {
    window.api.auth.getStatus().then(s => setAuthed(s.authenticated));
    const unsubEdit = window.api.onEditRequest(r => setEditRequest({ path: r.path }));
    const unsubLogout = window.api.onMenuLogout(() => { void handleLogoutRef.current?.(); });
    return () => { unsubEdit(); unsubLogout(); };
  }, []);

  if (authed === null) return <div style={{ padding: 24 }}>読み込み中...</div>;
  if (!authed) return <LoginScreen onAuthenticated={() => setAuthed(true)} />;
  if (!editRequest) return (
    <div style={{ padding: 24 }}>
      <p>サイトの編集ボタンを押してください</p>
    </div>
  );
  return <Editor path={editRequest.path} />;
}
