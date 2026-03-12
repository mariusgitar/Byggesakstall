const GITHUB_API_BASE = 'https://api.github.com';

export type UploadFileToGithubInput = {
  fileBuffer: Buffer;
  filePath: string;
  commitMessage: string;
};

type GithubContentCreateRequest = {
  message: string;
  content: string;
  branch: string;
};

type GithubContentCreateResponse = {
  content?: {
    path: string;
  };
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Mangler påkrevd env-var: ${name}`);
  }
  return value;
}

export async function uploadFileToGithub(input: UploadFileToGithubInput): Promise<{ path: string }> {
  const token = getEnv('GITHUB_TOKEN');
  const owner = getEnv('GITHUB_OWNER');
  const repo = getEnv('GITHUB_REPO');
  const branch = getEnv('GITHUB_BRANCH');

  const requestBody: GithubContentCreateRequest = {
    message: input.commitMessage,
    content: input.fileBuffer.toString('base64'),
    branch,
  };

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(input.filePath)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub upload feilet (${response.status}): ${errorText}`);
  }

  const result = (await response.json()) as GithubContentCreateResponse;

  if (!result.content?.path) {
    throw new Error('GitHub upload mangler path i responsen.');
  }

  return { path: result.content.path };
}

// TODO(steg-2): Koble filopplastinger til GitHub Actions-workflow for videre behandling.
// TODO(steg-2): Støtt historisk backfill-import under uploads/incoming/backfill/.
