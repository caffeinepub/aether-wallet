import { Button } from "@/components/ui/button";
import { Lock, Shield, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function useAuth() {
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = loginStatus === "success" && !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  return {
    login,
    logout: clear,
    isAuthenticated,
    isLoggingIn,
    isInitializing,
    identity,
    principal: identity?.getPrincipal().toString() ?? null,
  };
}

const SUPPORTED_ASSETS = [
  {
    ticker: "ICP",
    name: "Internet Computer",
    color: "oklch(0.72 0.13 195)",
    bg: "oklch(0.72 0.13 195 / 0.12)",
    border: "oklch(0.72 0.13 195 / 0.35)",
  },
  {
    ticker: "ckBTC",
    name: "Chain-Key Bitcoin",
    color: "oklch(0.75 0.16 55)",
    bg: "oklch(0.75 0.16 55 / 0.12)",
    border: "oklch(0.75 0.16 55 / 0.35)",
  },
  {
    ticker: "ckETH",
    name: "Chain-Key Ethereum",
    color: "oklch(0.68 0.14 300)",
    bg: "oklch(0.68 0.14 300 / 0.12)",
    border: "oklch(0.68 0.14 300 / 0.35)",
  },
];

export function LoginPage() {
  const { login, isLoggingIn } = useAuth();

  const features = [
    { Icon: Shield, text: "End-to-end privacy controls" },
    { Icon: Lock, text: "Stealth send technology" },
    { Icon: Wallet, text: "Non-custodial multi-asset wallet" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background network illustration */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          width="100%"
          height="100%"
          className="opacity-5"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="netglow" cx="70%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor="oklch(0.72 0.13 195)"
                stopOpacity="0.4"
              />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#netglow)" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <circle
              key={`node-${i}`}
              cx={`${10 + (i % 4) * 28}%`}
              cy={`${15 + Math.floor(i / 4) * 35}%`}
              r="3"
              fill="oklch(0.72 0.13 195)"
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <line
              key={`line-${i}`}
              x1={`${10 + (i % 4) * 28}%`}
              y1={`${15 + Math.floor(i / 4) * 35}%`}
              x2={`${10 + ((i + 2) % 4) * 28}%`}
              y2={`${15 + Math.floor((i + 1) / 4) * 35}%`}
              stroke="oklch(0.72 0.13 195)"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="card-surface p-8 shadow-card">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.72 0.13 195 / 0.15)",
                border: "1px solid oklch(0.72 0.13 195 / 0.4)",
                boxShadow: "0 0 20px oklch(0.72 0.13 195 / 0.25)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2C8 2 4 6 4 10C4 16 8 20 12 22C16 20 20 16 20 10C20 6 16 2 12 2Z"
                  stroke="oklch(0.72 0.13 195)"
                  strokeWidth="1.5"
                  fill="oklch(0.72 0.13 195 / 0.1)"
                />
                <path
                  d="M7 12 L12 7 L17 12 L12 17 Z"
                  stroke="oklch(0.72 0.13 195)"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold tracking-widest text-foreground">
                DINGO WALLET
              </div>
              <div className="text-xs text-muted-foreground">
                Multi-Asset Privacy Wallet
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Connect your identity to access your private wallet. Your
            transactions stay yours.
          </p>

          <div className="space-y-3 mb-6">
            {features.map(({ Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <Icon
                  size={14}
                  style={{ color: "oklch(0.72 0.13 195)" }}
                  className="shrink-0"
                />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Supported Assets */}
          <div className="mb-8">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
              Supported Assets
            </p>
            <div className="flex gap-2 flex-wrap">
              {SUPPORTED_ASSETS.map((asset) => (
                <div
                  key={asset.ticker}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{
                    background: asset.bg,
                    border: `1px solid ${asset.border}`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: asset.color }}
                  />
                  <span
                    className="text-xs font-bold tracking-wide"
                    style={{ color: asset.color }}
                  >
                    {asset.ticker}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {asset.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="button"
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="login.primary_button"
            className="w-full h-12 text-sm font-semibold tracking-wide rounded-pill"
            style={{
              background: "oklch(0.72 0.13 195)",
              color: "oklch(0.1 0.01 240)",
              boxShadow: "0 0 24px oklch(0.72 0.13 195 / 0.3)",
            }}
          >
            {isLoggingIn ? "Connecting..." : "Connect & Login"}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Powered by Internet Identity
          </p>
        </div>
      </motion.div>
    </div>
  );
}
