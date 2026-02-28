import { Button } from "@/components/ui/button";
import { API_URL } from "@/utils/constants";

function GitLabIcon() {
  return (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.65 14.39 12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51a.42.42 0 0 1 .82 0l2.44 7.51h8.06l2.44-7.51a.42.42 0 0 1 .82 0l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94Z"
        fill="#E24329"
      />
      <path d="M12 22.13 17.97 10.16H6.03L12 22.13Z" fill="#FC6D26" />
      <path
        d="m6.03 10.16-1.22 3.78a.84.84 0 0 0 .3.94L12 22.13 6.03 10.16Z"
        fill="#FCA326"
      />
      <path
        d="m17.97 10.16 1.22 3.78a.84.84 0 0 1-.3.94L12 22.13l5.97-11.97Z"
        fill="#FCA326"
      />
    </svg>
  );
}

export function GitLabLoginButton() {
  return (
    <Button asChild size="lg" variant="outline" className="w-full">
      <a href={`${API_URL}/api/auth/gitlab`}>
        <GitLabIcon />
        Login with GitLab
      </a>
    </Button>
  );
}
