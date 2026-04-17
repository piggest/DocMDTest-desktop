import { useEffect, useState } from 'react';
import LoginScreen from './LoginScreen';

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [editRequest, setEditRequest] = useState<{ path: string } | null>(null);

  useEffect(() => {
    window.api.auth.getStatus().then(s => setAuthed(s.authenticated));
    const unsubscribe = window.api.onEditRequest(r => setEditRequest({ path: r.path }));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await window.api.auth.logout();
    setAuthed(false);
    setEditRequest(null);
  };

  if (authed === null) return <div style={{ padding: 24 }}>読み込み中...</div>;
  if (!authed) return <LoginScreen onAuthenticated={() => setAuthed(true)} />;
  if (!editRequest) return (
    <div style={{ padding: 24 }}>
      <p>サイトの編集ボタンを押してください</p>
      <button onClick={handleLogout}>ログアウト</button>
    </div>
  );
  return (
    <div style={{ padding: 24 }}>
      <p>編集対象: {editRequest.path}</p>
      <button onClick={handleLogout}>ログアウト</button>
    </div>
  );
}
