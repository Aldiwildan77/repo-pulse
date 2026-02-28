export class GitHubApiClient {
  async listUserRepos(
    accessToken: string,
  ): Promise<Array<{ id: number; fullName: string; name: string }>> {
    const allRepos: Array<{ id: number; fullName: string; name: string }> = [];
    let page = 1;

    while (true) {
      const res = await fetch(
        `https://api.github.com/user/repos?per_page=100&sort=full_name&page=${page}`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: "application/vnd.github+json",
          },
        },
      );

      if (!res.ok) {
        throw new Error(`GitHub API error listing repos: ${res.status}`);
      }

      const repos = (await res.json()) as Array<{
        id: number;
        full_name: string;
        name: string;
      }>;

      if (repos.length === 0) break;

      for (const repo of repos) {
        allRepos.push({
          id: repo.id,
          fullName: repo.full_name,
          name: repo.name,
        });
      }

      if (repos.length < 100) break;
      page++;
    }

    return allRepos;
  }
}
