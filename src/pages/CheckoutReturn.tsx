import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const { isActive, refetch } = useSubscription();

  useEffect(() => {
    // Poll briefly for the webhook to land
    const interval = setInterval(() => refetch(), 2000);
    const stop = setTimeout(() => clearInterval(interval), 30000);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [refetch]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        {isActive ? (
          <>
            <CheckCircle2 className="text-primary mx-auto" size={64} />
            <h1 className="text-2xl font-bold font-mono">CORE ACTIVATED</h1>
            <p className="text-muted-foreground">
              Welcome to NAVI Core, Operator. All features are unlocked.
            </p>
            <Button onClick={() => navigate("/")} size="lg" className="font-mono">
              ENTER COMMAND DECK
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="text-primary mx-auto animate-spin" size={48} />
            <h1 className="text-xl font-bold font-mono">PROCESSING...</h1>
            <p className="text-sm text-muted-foreground">
              Activating your subscription. {sessionId && `Session: ${sessionId.slice(0, 12)}…`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}