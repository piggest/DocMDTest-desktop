import { describe, it, expect, vi } from 'vitest';
import { GitHubClient } from '../src/github';

describe('GitHubClient', () => {
  it('fetches file content and returns decoded text + sha', async () => {
    const mockOctokit: any = {
      rest: {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            data: {
              type: 'file',
              content: Buffer.from('# Hello\n', 'utf8').toString('base64'),
              sha: 'abc123',
              encoding: 'base64',
            },
          }),
        },
      },
    };
    const client = new GitHubClient(mockOctokit);
    const result = await client.fetchFile('piggest', 'DocMDTest', 'docs/test.md');
    expect(result).toEqual({ content: '# Hello\n', sha: 'abc123' });
  });

  it('putFile sends PUT with base64 content and message', async () => {
    const putSpy = vi.fn().mockResolvedValue({ data: { commit: { sha: 'newsha' } } });
    const mockOctokit: any = { rest: { repos: { createOrUpdateFileContents: putSpy } } };
    const client = new GitHubClient(mockOctokit);
    await client.putFile({
      owner: 'piggest',
      repo: 'DocMDTest',
      path: 'docs/test.md',
      content: '# Hello',
      sha: 'abc123',
      message: 'docs: update',
    });
    expect(putSpy).toHaveBeenCalledWith({
      owner: 'piggest',
      repo: 'DocMDTest',
      path: 'docs/test.md',
      message: 'docs: update',
      content: Buffer.from('# Hello', 'utf8').toString('base64'),
      sha: 'abc123',
    });
  });

  it('getAuthenticatedUser returns login', async () => {
    const mockOctokit: any = {
      rest: { users: { getAuthenticated: vi.fn().mockResolvedValue({ data: { login: 'alice' } }) } },
    };
    const client = new GitHubClient(mockOctokit);
    expect(await client.getAuthenticatedUser()).toEqual({ login: 'alice' });
  });

  it('fetchFile throws when data is a directory', async () => {
    const mockOctokit: any = {
      rest: {
        repos: {
          getContent: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    };
    const client = new GitHubClient(mockOctokit);
    await expect(client.fetchFile('o', 'r', 'dir')).rejects.toThrow(/Not a file/);
  });
});
