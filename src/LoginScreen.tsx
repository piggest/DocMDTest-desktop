import { useState } from 'react';

type Props = { onAuthenticated: () => void };

export default function LoginScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'choose' | 'oauth' | 'pat'>('choose');
  const [userCode, setUserCode] = useState('');
  const [verificationUri, setVerificationUri] = useState('');
  const [pat, setPat] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startOAuth = async () => {
    setMode('oauth');
    setError(null);
    try {
      const { device_code, user_code, verification_uri, interval } = await window.api.auth.startDeviceFlow();
      setUserCode(user_code);
      setVerificationUri(verification_uri);
      window.open(verification_uri, '_blank');
      await window.api.auth.pollToken(device_code, interval);
      onAuthenticated();
    } catch (e: any) {
      setError(e.message);
      setMode('choose');
    }
  };

  const submitPat = async () => {
    setError(null);
    try {
      await window.api.auth.savePat(pat);
      onAuthenticated();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>ConiferFruitsEditor</h1>
      <p>GitHub で認証してください。</p>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      {mode === 'choose' && (
        <>
          <button onClick={startOAuth} style={{ display: 'block', marginBottom: 12, padding: 12, width: '100%' }}>
            GitHub でログイン (OAuth)
          </button>
          <button onClick={() => setMode('pat')} style={{ display: 'block', padding: 12, width: '100%' }}>
            Personal Access Token で設定
          </button>
        </>
      )}

      {mode === 'oauth' && (
        <div>
          <p>ブラウザが開きます。以下のコードを入力してください:</p>
          <h2 style={{ letterSpacing: 4 }}>{userCode}</h2>
          <p>URL: <a href={verificationUri} target="_blank" rel="noreferrer">{verificationUri}</a></p>
          <p>認可後、自動でこのアプリに戻ります。</p>
        </div>
      )}

      {mode === 'pat' && (
        <div>
          <p>GitHub → Settings → Developer settings → Personal access tokens で <code>repo</code> スコープの PAT を作成し、下に貼り付けてください。</p>
          <input
            type="password"
            value={pat}
            onChange={e => setPat(e.target.value)}
            placeholder="ghp_..."
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
          <button onClick={submitPat} disabled={!pat} style={{ padding: 12, width: '100%' }}>保存</button>
          <button onClick={() => setMode('choose')} style={{ marginTop: 8, padding: 8, width: '100%' }}>戻る</button>
        </div>
      )}
    </div>
  );
}
