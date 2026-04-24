const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;

  return (
    <div className="w-full bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 text-center text-xs font-mono text-yellow-300">
      ⚠ TEST MODE — All payments in preview are simulated.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-yellow-200"
      >
        Learn more
      </a>
    </div>
  );
}