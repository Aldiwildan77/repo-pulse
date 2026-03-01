import { useState } from "react";
import { useParams } from "react-router";
import { Pencil, UserPlus, Trash2, Check, X } from "lucide-react";
import {
  useWorkspaceDetail,
  useWorkspaceMutations,
} from "@/hooks/use-workspaces";
import type { WorkspaceMember } from "@/hooks/use-workspaces";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "owner":
      return "default" as const;
    case "admin":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

export function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: workspace, isLoading, error, refetch } = useWorkspaceDetail(workspaceId);
  const { updateWorkspace, inviteMember, updateMemberRole, removeMember } = useWorkspaceMutations();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviteLoading, setInviteLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workspace" />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error ?? "Workspace not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    await updateWorkspace(workspace.id, { name: editName.trim() });
    setEditing(false);
    refetch();
  };

  const handleInvite = async () => {
    if (!inviteUsername.trim()) return;
    setInviteLoading(true);
    try {
      await inviteMember(workspace.id, inviteUsername.trim(), inviteRole);
      setInviteOpen(false);
      setInviteUsername("");
      setInviteRole("member");
      refetch();
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (member: WorkspaceMember, role: string) => {
    await updateMemberRole(workspace.id, member.id, role);
    refetch();
  };

  const handleRemove = async (member: WorkspaceMember) => {
    await removeMember(workspace.id, member.id);
    refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Workspace Details" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-64"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button size="icon" variant="ghost" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle>{workspace.name}</CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditName(workspace.name);
                    setEditing(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <CardDescription>
            Created {new Date(workspace.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {workspace.members.length} member{workspace.members.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>

          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogDescription>
                  Invite a user by their username. They must have signed in to the app first.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    placeholder="GitHub, Discord, or Slack username"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleInvite}
                  disabled={!inviteUsername.trim() || inviteLoading}
                >
                  {inviteLoading ? "Inviting..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspace.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.username ?? `User #${member.userId}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === "accepted" ? "secondary" : "outline"}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.acceptedAt
                      ? new Date(member.acceptedAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Select
                        value={member.role}
                        onValueChange={(role) => handleRoleChange(member, role)}
                      >
                        <SelectTrigger className="w-24" size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
