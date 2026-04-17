import { Octokit } from '@octokit/rest';

export class GitHubClient {
  constructor(private readonly octokit: Octokit | any) {}

  static fromToken(token: string): GitHubClient {
    return new GitHubClient(new Octokit({ auth: token }));
  }

  async fetchFile(owner: string, repo: string, path: string): Promise<{ content: string; sha: string }> {
    const res = await this.octokit.rest.repos.getContent({ owner, repo, path });
    const data = res.data;
    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error(`Not a file: ${path}`);
    }
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return { content, sha: data.sha };
  }

  // 認証済みユーザーのログイン名を返す
  async getAuthenticatedUser(): Promise<{ login: string }> {
    const res = await this.octokit.rest.users.getAuthenticated();
    return { login: res.data.login };
  }

  async putFile(args: {
    owner: string; repo: string; path: string;
    content: string; sha: string; message: string;
  }): Promise<void> {
    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: args.owner,
      repo: args.repo,
      path: args.path,
      message: args.message,
      content: Buffer.from(args.content, 'utf8').toString('base64'),
      sha: args.sha,
    });
  }
}
