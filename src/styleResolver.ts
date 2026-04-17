import { GitHubClient } from './github';

/**
 * docs階層のカスケードアルゴリズムに従い、対象ドキュメントに適用すべきCSSを解決する。
 * サイトのプラグインと同じロジックを使用する。
 */
export async function resolveCssForDoc(
  client: GitHubClient,
  owner: string,
  repo: string,
  docPath: string // 例: 'docs/ガイド/カレーの作り方.md'
): Promise<string | null> {
  const docName = docPath.split('/').pop()!.replace(/\.md$/, '');
  let dir = docPath.substring(0, docPath.lastIndexOf('/'));
  const docsRoot = docPath.startsWith('docs/') ? 'docs' : dir.split('/')[0];

  while (true) {
    const entries = await listDir(client, owner, repo, dir);
    if (entries === null) return null;
    const cssFiles = entries.filter(n => n.endsWith('.css'));
    const mdNames = new Set(entries.filter(n => n.endsWith('.md')).map(n => n.replace(/\.md$/, '')));

    // 1. ドキュメント固有CSS
    if (cssFiles.includes(`${docName}.css`)) {
      return fetchFile(client, owner, repo, `${dir}/${docName}.css`);
    }
    // 2. フォルダデフォルトCSS（MD名と一致しないCSSを昇順で最初のものを選ぶ）
    const defaults = cssFiles.filter(n => !mdNames.has(n.replace(/\.css$/, ''))).sort();
    if (defaults.length > 0) {
      return fetchFile(client, owner, repo, `${dir}/${defaults[0]}`);
    }
    // 3. docsルートに達したら終了する
    if (dir === docsRoot || !dir.includes('/')) return null;
    // 4. 親ディレクトリへ再帰する
    const parent = dir.substring(0, dir.lastIndexOf('/'));
    if (parent === dir || parent === '') return null;
    dir = parent;
  }
}

// ディレクトリ内のファイル名一覧を返す
async function listDir(
  client: GitHubClient,
  owner: string,
  repo: string,
  dir: string
): Promise<string[] | null> {
  try {
    const res = await (client as any).octokit.rest.repos.getContent({ owner, repo, path: dir });
    if (!Array.isArray(res.data)) return null;
    return res.data.map((e: any) => e.name as string);
  } catch {
    return null;
  }
}

// ファイル内容を取得する
async function fetchFile(
  client: GitHubClient,
  owner: string,
  repo: string,
  filePath: string
): Promise<string | null> {
  try {
    const result = await client.fetchFile(owner, repo, filePath);
    return result.content;
  } catch {
    return null;
  }
}
