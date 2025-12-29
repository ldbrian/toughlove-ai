import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-xs font-mono text-cyan-500/50 animate-pulse">
          ACCESSING STORE...
        </p>
      </div>
    </div>
  );
}