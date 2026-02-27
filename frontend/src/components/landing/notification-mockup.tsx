import { motion } from "framer-motion";

export function NotificationMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="mx-auto w-full max-w-sm rounded-xl border bg-card p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5865F2] text-white text-sm font-bold">
          RP
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-card-foreground">
              Repo Pulse
            </span>
            <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[10px] font-medium text-white">
              BOT
            </span>
            <span className="text-xs text-muted-foreground">Today at 10:42 AM</span>
          </div>
          <div className="mt-2 rounded-l-sm border-l-4 border-[#5865F2] bg-muted/50 p-3">
            <p className="text-sm font-semibold text-card-foreground">
              New Pull Request
            </p>
            <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-card-foreground">Repo:</span>{" "}
                acme/web-app
              </p>
              <p>
                <span className="font-medium text-card-foreground">Title:</span>{" "}
                Add dark mode support
              </p>
              <p>
                <span className="font-medium text-card-foreground">Author:</span>{" "}
                @developer
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
