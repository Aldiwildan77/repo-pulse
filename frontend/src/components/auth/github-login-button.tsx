import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/utils/constants";

export function GitHubLoginButton() {
  return (
    <Button asChild size="lg" className="w-full">
      <a href={`${API_URL}/api/auth/github`}>
        <Github className="mr-2 h-5 w-5" />
        Login with GitHub
      </a>
    </Button>
  );
}
