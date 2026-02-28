import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/utils/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck, ShieldAlert, KeyRound, QrCode, AlertTriangle } from "lucide-react";

interface SetupData {
  qrCodeDataUrl: string;
  manualSecret: string;
  backupCodes: string[];
}

type State =
  | { step: "idle" }
  | { step: "loading" }
  | { step: "setup"; data: SetupData }
  | { step: "disabling" };

export function TotpSection() {
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState<State>({ step: "idle" });
  const [confirmCode, setConfirmCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totpEnabled = user?.totpEnabled ?? false;

  const handleBeginSetup = async () => {
    setState({ step: "loading" });
    setError(null);
    try {
      const data = await apiClient<SetupData>("/api/auth/totp/setup", {
        method: "POST",
        body: JSON.stringify({ username: user?.providerUsername ?? undefined }),
      });
      setState({ step: "setup", data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start setup");
      setState({ step: "idle" });
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient("/api/auth/totp/confirm", {
        method: "POST",
        body: JSON.stringify({ code: confirmCode.trim() }),
      });
      setConfirmCode("");
      setState({ step: "idle" });
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient("/api/auth/totp/disable", {
        method: "POST",
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      setDisableCode("");
      setState({ step: "idle" });
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    }
  };

  // Setup flow: show QR code and confirmation
  if (state.step === "setup") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <img src={state.data.qrCodeDataUrl} alt="TOTP QR Code" className="rounded-lg" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Scan this with your authenticator app to add the account
            </TooltipContent>
          </Tooltip>

          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Manual entry key
            </Label>
            <code className="block rounded bg-muted px-3 py-2 text-sm break-all">
              {state.data.manualSecret}
            </code>
          </div>

          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Backup codes
            </Label>
            <p className="text-xs text-muted-foreground">
              Save these codes in a safe place. Each can be used once if you lose access to your authenticator.
            </p>
            <div className="grid grid-cols-2 gap-1 rounded bg-muted p-3">
              {state.data.backupCodes.map((code) => (
                <code key={code} className="text-sm">{code}</code>
              ))}
            </div>
          </div>

          <form onSubmit={handleConfirm} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="confirm-code">Enter a code from your authenticator to confirm</Label>
              <Input
                id="confirm-code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={!confirmCode.trim()}>
                Confirm & Enable
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setState({ step: "idle" }); setError(null); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Enabled state: show badge and disable option
  if (totpEnabled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <CardTitle>Two-Factor Authentication</CardTitle>
            <Badge variant="default">Enabled</Badge>
          </div>
          <CardDescription>
            Your account is protected with two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.step === "disabling" ? (
            <form onSubmit={handleDisable} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="disable-code">Enter your TOTP code to disable 2FA</Label>
                <Input
                  id="disable-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={8}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" variant="destructive" disabled={!disableCode.trim()}>
                  Disable 2FA
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setState({ step: "idle" }); setError(null); setDisableCode(""); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="outline"
              onClick={() => setState({ step: "disabling" })}
            >
              Disable 2FA
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Not enabled: show enable button
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          Add an extra layer of security to your account with a TOTP authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
        <Button onClick={handleBeginSetup} disabled={state.step === "loading"}>
          {state.step === "loading" ? "Setting up..." : "Enable 2FA"}
        </Button>
      </CardContent>
    </Card>
  );
}
