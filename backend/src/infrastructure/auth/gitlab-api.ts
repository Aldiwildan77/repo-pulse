export interface GitLabHook {
  id: number;
  url: string;
  project_id: number;
}

export class GitLabApiClient {
  async createProjectHook(
    accessToken: string,
    projectPath: string,
    webhookUrl: string,
    secret: string,
    events: {
      push_events?: boolean;
      merge_requests_events?: boolean;
      issues_events?: boolean;
      note_events?: boolean;
    } = {},
  ): Promise<number> {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${encodedPath}/hooks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: webhookUrl,
          token: secret,
          push_events: events.push_events ?? false,
          merge_requests_events: events.merge_requests_events ?? true,
          issues_events: events.issues_events ?? true,
          note_events: events.note_events ?? true,
          enable_ssl_verification: true,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitLab API error creating hook: ${response.status} ${text}`);
    }

    const data = (await response.json()) as GitLabHook;
    return data.id;
  }

  async deleteProjectHook(
    accessToken: string,
    projectPath: string,
    hookId: number,
  ): Promise<void> {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${encodedPath}/hooks/${hookId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok && response.status !== 404) {
      const text = await response.text();
      throw new Error(`GitLab API error deleting hook: ${response.status} ${text}`);
    }
  }

  async listUserProjects(
    accessToken: string,
  ): Promise<Array<{ id: number; pathWithNamespace: string; name: string }>> {
    const params = new URLSearchParams({
      membership: "true",
      min_access_level: "30",
      per_page: "100",
    });

    const response = await fetch(
      `https://gitlab.com/api/v4/projects?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new Error(`GitLab API error listing projects: ${response.status}`);
    }

    const data = (await response.json()) as Array<{
      id: number;
      path_with_namespace: string;
      name: string;
    }>;

    return data.map((p) => ({
      id: p.id,
      pathWithNamespace: p.path_with_namespace,
      name: p.name,
    }));
  }
}
