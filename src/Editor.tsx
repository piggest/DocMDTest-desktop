import { useEffect, useState } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/mantine/style.css';
import { normalizeMd } from './mdConverter';

type Props = { path: string; onLogout: () => void };

export default function Editor({ path, onLogout }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const editor = useCreateBlockNote();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { content, sha: fileSha } = await window.api.github.fetchFile(path);
        if (cancelled) return;
        const blocks = await editor.tryParseMarkdownToBlocks(content);
        editor.replaceBlocks(editor.document, blocks);
        setSha(fileSha);
        setDirty(false);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [path, editor]);

  const handleChange = () => setDirty(true);

  const handleSave = async () => {
    if (!sha) return;
    setSaving(true);
    setError(null);
    try {
      const md = normalizeMd(await editor.blocksToMarkdownLossy(editor.document));
      await window.api.github.putFile({
        path,
        content: md,
        sha,
        message: `docs: ${path} を更新`,
      });
      setDirty(false);
      // 新しいshaを取得するため再フェッチ
      const fresh = await window.api.github.fetchFile(path);
      setSha(fresh.sha);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>読み込み中: {path}</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', padding: 12, borderBottom: '1px solid #ddd', gap: 12, alignItems: 'center' }}>
        <strong style={{ flex: 1 }}>{path}{dirty && ' *'}</strong>
        <button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? '保存中...' : '編集完了（保存）'}
        </button>
        <button onClick={onLogout}>ログアウト</button>
      </div>
      {error && <div style={{ padding: 12, color: 'red', background: '#fee' }}>エラー: {error}</div>}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <BlockNoteView editor={editor} onChange={handleChange} />
      </div>
    </div>
  );
}
