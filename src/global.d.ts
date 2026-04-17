declare global {
  interface Window {
    api: {
      auth: {
        getStatus(): Promise<{ authenticated: boolean; login?: string }>;
        startDeviceFlow(): Promise<{
          device_code: string;
          user_code: string;
          verification_uri: string;
          interval: number;
          expires_in: number;
        }>;
        pollToken(deviceCode: string, intervalSec: number): Promise<{ success: boolean }>;
        savePat(pat: string): Promise<{ success: boolean }>;
        logout(): Promise<{ success: boolean }>;
      };
      github: {
        fetchFile(path: string): Promise<{ content: string; sha: string }>;
        putFile(args: {
          path: string;
          content: string;
          sha: string;
          message: string;
        }): Promise<{ success: boolean }>;
      };
      onEditRequest(cb: (r: { action: string; path: string }) => void): () => void;
    };
  }
}
export {};
