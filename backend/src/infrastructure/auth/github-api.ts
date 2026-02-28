export class GitHubApiClient {
  async listUserInstallationRepos(
    accessToken: string,
  ): Promise<Array<{ id: number; fullName: string; name: string }>> {
    // Get all installations accessible to this user
    const installationsRes = await fetch(
      "https://api.github.com/user/installations?per_page=100",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!installationsRes.ok) {
      throw new Error(`GitHub API error listing installations: ${installationsRes.status}`);
    }

    const installationsData = (await installationsRes.json()) as {
      installations: Array<{ id: number }>;
    };

    // For each installation, fetch accessible repos
    const allRepos: Array<{ id: number; fullName: string; name: string }> = [];

    for (const installation of installationsData.installations) {
      const reposRes = await fetch(
        `https://api.github.com/user/installations/${installation.id}/repositories?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
          },
        },
      );

      if (!reposRes.ok) continue;

      const reposData = (await reposRes.json()) as {
        repositories: Array<{ id: number; full_name: string; name: string }>;
      };

      for (const repo of reposData.repositories) {
        allRepos.push({
          id: repo.id,
          fullName: repo.full_name,
          name: repo.name,
        });
      }
    }

    return allRepos;
  }
}
