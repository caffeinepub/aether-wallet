import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Shield,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Transaction } from "./backend";
import { TransactionStatus, TransactionType } from "./backend";
import { LoginPage, useAuth } from "./components/auth";
import { useActor } from "./hooks/useActor";
import {
  useBalance,
  usePrincipal,
  useSeedDemoData,
  useSendICP,
  useToggleVisibility,
  useTransactions,
} from "./hooks/useQueries";

// ── Helpers ──────────────────────────────────────────────────────────────────

function truncateTxId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

function formatTimestamp(ts: bigint) {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const SPARKLINE_POINTS: [number, number][] = [
  [0, 60],
  [10, 48],
  [20, 55],
  [30, 38],
  [40, 42],
  [50, 30],
  [60, 35],
  [70, 22],
  [80, 28],
  [90, 15],
  [100, 20],
];

function Sparkline() {
  const pts = SPARKLINE_POINTS.map(([x, y]) => `${x},${y}`).join(" ");
  const fillPts = `0,70 ${pts} 100,70`;
  return (
    <svg
      viewBox="0 0 100 70"
      width="120"
      height="44"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="oklch(0.72 0.13 195)"
            stopOpacity="0.35"
          />
          <stop
            offset="100%"
            stopColor="oklch(0.72 0.13 195)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#sparkFill)" />
      <polyline
        points={pts}
        fill="none"
        stroke="oklch(0.72 0.13 195)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Static asset data ──────────────────────────────────────────────────────

const ASSETS = [
  {
    symbol: "ICP",
    name: "Internet Computer",
    amount: null,
    usd: null,
    color: "oklch(0.72 0.13 195)",
  },
  {
    symbol: "ckBTC",
    name: "Chain-key Bitcoin",
    amount: 0.00412,
    usd: 284.5,
    color: "oklch(0.72 0.15 55)",
  },
  {
    symbol: "ckETH",
    name: "Chain-key Ethereum",
    amount: 0.185,
    usd: 612.3,
    color: "oklch(0.6 0.12 280)",
  },
];

// ── Transaction row component ─────────────────────────────────────────────────

function TxRow({
  tx,
  index,
  onToggle,
  isToggling,
}: {
  tx: Transaction;
  index: number;
  onToggle: () => void;
  isToggling: boolean;
}) {
  const hidden = tx.isHidden;
  const isStealthSend = tx.txType === TransactionType.stealthSend;

  const typeLabel = hidden
    ? "Hidden"
    : isStealthSend
      ? "Stealth Send"
      : tx.txType === TransactionType.receive
        ? "Receive"
        : "Send";

  const amountColor =
    tx.txType === TransactionType.receive
      ? "oklch(0.72 0.18 155)"
      : "oklch(0.62 0.2 20)";

  const amountPrefix = tx.txType === TransactionType.receive ? "+" : "-";

  const statusColor: Record<string, string> = {
    [TransactionStatus.completed]: "oklch(0.72 0.18 155)",
    [TransactionStatus.pending]: "oklch(0.72 0.15 55)",
    [TransactionStatus.failed]: "oklch(0.62 0.2 20)",
  };

  return (
    <tr
      data-ocid={`transactions.item.${index}`}
      className="border-b border-border/50 hover:bg-muted/20 transition-colors group"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {isStealthSend && !hidden && (
            <Shield size={13} style={{ color: "oklch(0.72 0.13 195)" }} />
          )}
          <span
            className={`text-sm ${hidden ? "text-muted-foreground italic" : "text-foreground"}`}
          >
            {typeLabel}
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span
          className={`text-xs font-mono ${hidden ? "masked-text" : "text-muted-foreground"}`}
        >
          {hidden
            ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            : truncateTxId(tx.id)}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-muted-foreground">
          {hidden
            ? "\u2022\u2022\u2022 \u2022\u2022, \u2022\u2022\u2022\u2022"
            : formatTimestamp(tx.timestamp)}
        </span>
      </td>
      <td className="py-3 px-4">
        <span
          className="text-sm font-semibold"
          style={{ color: hidden ? "oklch(0.4 0.02 240)" : amountColor }}
        >
          {hidden
            ? "\u2022\u2022\u2022\u2022\u2022 ICP"
            : `${amountPrefix}${tx.amount.toFixed(4)} ICP`}
        </span>
      </td>
      <td className="py-3 px-4">
        {hidden ? (
          <span className="masked-text text-xs">
            \u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color: statusColor[tx.status],
              background: `${statusColor[tx.status]}20`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusColor[tx.status] }}
            />
            {tx.status}
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <button
          type="button"
          data-ocid={`transactions.toggle.${index}`}
          onClick={onToggle}
          disabled={isToggling}
          className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80 disabled:opacity-40"
          style={{
            color: hidden ? "oklch(0.72 0.13 195)" : "oklch(0.57 0.018 240)",
          }}
          title={hidden ? "Reveal transaction" : "Hide transaction"}
        >
          {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
          <span className="hidden sm:inline">{hidden ? "Reveal" : "Hide"}</span>
        </button>
      </td>
    </tr>
  );
}

// ── Send ICP Modal ────────────────────────────────────────────────────────────

function SendModal({
  open,
  onClose,
  defaultStealth = false,
}: {
  open: boolean;
  onClose: () => void;
  defaultStealth?: boolean;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [stealth, setStealth] = useState(defaultStealth);
  const send = useSendICP();

  const defaultStealthRef = useRef(defaultStealth);
  useEffect(() => {
    defaultStealthRef.current = defaultStealth;
  });
  useEffect(() => {
    if (open) setStealth(defaultStealthRef.current);
  }, [open]);

  const handleSubmit = async () => {
    const amt = Number.parseFloat(amount);
    if (!to.trim() || Number.isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid recipient and amount");
      return;
    }
    try {
      await send.mutateAsync({ to: to.trim(), amount: amt, stealth });
      toast.success(
        stealth ? "Stealth transaction sent!" : "ICP sent successfully!",
      );
      setTo("");
      setAmount("");
      onClose();
    } catch {
      toast.error("Transaction failed. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="send.dialog"
        className="max-w-md"
        style={{
          background: "oklch(0.15 0.012 240)",
          border: "1px solid oklch(0.28 0.015 240)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <ArrowUpRight size={18} style={{ color: "oklch(0.65 0.15 50)" }} />
            Send ICP
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="recipient"
              className="text-sm text-muted-foreground"
            >
              Recipient Address
            </Label>
            <Input
              id="recipient"
              data-ocid="send.input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="principal-id or address"
              className="bg-muted/30 border-border/60 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-sm text-muted-foreground">
              Amount (ICP)
            </Label>
            <Input
              id="amount"
              data-ocid="send.amount_input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0000"
              type="number"
              min="0"
              step="0.0001"
              className="bg-muted/30 border-border/60 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <button
            type="button"
            className="w-full flex items-start gap-3 p-3 rounded-lg cursor-pointer text-left"
            style={{
              background: stealth
                ? "oklch(0.72 0.13 195 / 0.1)"
                : "oklch(0.18 0.01 240)",
              border: `1px solid ${
                stealth ? "oklch(0.72 0.13 195 / 0.4)" : "oklch(0.28 0.015 240)"
              }`,
            }}
            onClick={() => setStealth((p) => !p)}
          >
            <Checkbox
              id="stealth"
              data-ocid="send.stealth_checkbox"
              checked={stealth}
              onCheckedChange={(v) => setStealth(!!v)}
              className="mt-0.5"
            />
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Shield size={13} style={{ color: "oklch(0.72 0.13 195)" }} />
                Make this a Stealth Send
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Transaction will be hidden from view automatically
              </p>
            </div>
          </button>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-ocid="send.cancel_button"
            className="border-border/60 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={send.isPending}
            data-ocid="send.submit_button"
            style={{
              background: stealth
                ? "oklch(0.72 0.13 195)"
                : "oklch(0.65 0.15 50)",
              color: "oklch(0.1 0.01 240)",
            }}
          >
            {send.isPending
              ? "Sending..."
              : stealth
                ? "Stealth Send"
                : "Send ICP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Receive Modal ─────────────────────────────────────────────────────────────

function ReceiveModal({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const { data: principal } = usePrincipal();

  const copyAddress = () => {
    if (principal) {
      navigator.clipboard.writeText(principal);
      toast.success("Address copied!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="receive.dialog"
        className="max-w-md"
        style={{
          background: "oklch(0.15 0.012 240)",
          border: "1px solid oklch(0.28 0.015 240)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <ArrowDownLeft
              size={18}
              style={{ color: "oklch(0.72 0.18 155)" }}
            />
            Receive ICP
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your wallet address to receive ICP tokens.
          </p>

          <div
            className="p-4 rounded-lg"
            style={{
              background: "oklch(0.12 0.01 240)",
              border: "1px solid oklch(0.28 0.015 240)",
            }}
          >
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
              Your Address
            </p>
            <p className="text-xs font-mono text-foreground break-all leading-relaxed">
              {principal ?? "Loading..."}
            </p>
          </div>

          <Button
            type="button"
            onClick={copyAddress}
            data-ocid="receive.copy_button"
            className="w-full"
            style={{
              background: "oklch(0.72 0.18 155)",
              color: "oklch(0.1 0.01 240)",
            }}
          >
            <Copy size={14} className="mr-2" />
            Copy Address
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

type TabKey = "dashboard" | "privacy" | "assets" | "accounts" | "support";

export default function App() {
  const { isAuthenticated, isInitializing, logout, identity } = useAuth();
  const { isFetching: actorFetching } = useActor();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [stealthDefault, setStealthDefault] = useState(false);
  const seededRef = useRef(false);

  const { data: balance, isLoading: balanceLoading } = useBalance();
  const { data: principal } = usePrincipal();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const seedMutation = useSeedDemoData();
  const toggleVisibility = useToggleVisibility();

  useEffect(() => {
    if (isAuthenticated && !actorFetching && !seededRef.current) {
      seededRef.current = true;
      seedMutation.mutate();
    }
  }, [isAuthenticated, actorFetching, seedMutation]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "oklch(0.72 0.13 195)" }}
          />
          <p className="text-muted-foreground text-sm">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  const initials =
    identity?.getPrincipal().toString().slice(0, 2).toUpperCase() ?? "JD";

  const hiddenTxs = transactions.filter((t) => t.isHidden);
  const visibleTxs = transactions.filter((t) => !t.isHidden);

  const openSend = (stealth = false) => {
    setStealthDefault(stealth);
    setSendOpen(true);
  };

  const navItems: Array<{ key: TabKey; label: string }> = [
    { key: "dashboard", label: "Dashboard" },
    { key: "privacy", label: "Privacy" },
    { key: "assets", label: "Assets" },
    { key: "accounts", label: "Accounts" },
    { key: "support", label: "Support" },
  ];

  const supportItems = [
    {
      title: "Privacy Guide",
      desc: "Learn how to use stealth transactions and hide sensitive activity.",
      Icon: Shield,
    },
    {
      title: "Transaction Help",
      desc: "Understand transaction types, fees, and confirmation times.",
      Icon: ArrowUpRight,
    },
    {
      title: "Account Security",
      desc: "Best practices for securing your Internet Identity.",
      Icon: Lock,
    },
    {
      title: "ICP Network",
      desc: "Learn about the Internet Computer Protocol and token standards.",
      Icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster />

      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "oklch(0.11 0.01 240 / 0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid oklch(0.25 0.015 240)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.72 0.13 195 / 0.15)",
                border: "1px solid oklch(0.72 0.13 195 / 0.4)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
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
            <span className="text-sm font-bold tracking-widest text-foreground hidden sm:inline">
              AETHER WALLET
            </span>
          </div>

          {/* Nav */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Main navigation"
          >
            {navItems.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                data-ocid={`nav.${key}.link`}
                onClick={() => setActiveTab(key)}
                className="relative px-4 py-2 text-sm font-medium transition-colors rounded-md"
                style={{
                  color:
                    activeTab === key
                      ? "oklch(0.93 0.01 240)"
                      : "oklch(0.57 0.018 240)",
                }}
              >
                {label}
                {activeTab === key && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ background: "oklch(0.72 0.13 195)" }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: "oklch(0.72 0.13 195 / 0.2)",
                color: "oklch(0.72 0.13 195)",
                border: "1px solid oklch(0.72 0.13 195 / 0.3)",
              }}
            >
              {initials}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-ocid="header.logout_button"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Log Out</span>
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto px-4 pb-2 gap-1">
          {navItems.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              data-ocid={`mobile_nav.${key}.link`}
              onClick={() => setActiveTab(key)}
              className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
              style={{
                background:
                  activeTab === key
                    ? "oklch(0.72 0.13 195 / 0.2)"
                    : "oklch(0.18 0.01 240)",
                color:
                  activeTab === key
                    ? "oklch(0.72 0.13 195)"
                    : "oklch(0.57 0.018 240)",
                border: `1px solid ${
                  activeTab === key
                    ? "oklch(0.72 0.13 195 / 0.3)"
                    : "oklch(0.25 0.015 240)"
                }`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Hero row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance card */}
                <div
                  className="lg:col-span-2 p-6 rounded-xl shadow-card relative overflow-hidden"
                  style={{
                    background: "oklch(0.14 0.015 240)",
                    border: "1px solid oklch(0.28 0.015 240)",
                    boxShadow:
                      "0 0 40px oklch(0.65 0.15 50 / 0.08), 0 4px 24px oklch(0 0 0 / 0.4)",
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at top left, oklch(0.65 0.15 50 / 0.06) 0%, transparent 60%)",
                    }}
                  />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                        Total Balance
                      </p>
                      {balanceLoading ? (
                        <Skeleton
                          className="h-12 w-48 mb-2"
                          data-ocid="balance.loading_state"
                        />
                      ) : (
                        <div className="text-5xl font-bold text-foreground tracking-tight">
                          {(balance ?? 0).toFixed(4)}
                          <span className="text-2xl font-medium text-muted-foreground ml-2">
                            ICP
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <TrendingUp
                          size={13}
                          style={{ color: "oklch(0.72 0.18 155)" }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "oklch(0.72 0.18 155)" }}
                        >
                          +2.4%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          24h change
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Shield
                          size={11}
                          style={{ color: "oklch(0.72 0.13 195 / 0.7)" }}
                        />
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.72 0.13 195 / 0.7)" }}
                        >
                          All transactions are hidden by default for your
                          privacy.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        Price chart
                      </p>
                      <Sparkline />
                    </div>
                  </div>
                  <div
                    className="mt-4 pt-4"
                    style={{ borderTop: "1px solid oklch(0.25 0.012 240)" }}
                  >
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {principal ? `${principal.slice(0, 20)}...` : ""}
                    </p>
                  </div>
                </div>

                {/* Assets card */}
                <div
                  className="p-6 rounded-xl shadow-card"
                  style={{
                    background: "oklch(0.14 0.015 240)",
                    border: "1px solid oklch(0.28 0.015 240)",
                  }}
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                    Assets
                  </p>
                  <div className="space-y-4">
                    {ASSETS.map((asset) => (
                      <div
                        key={asset.symbol}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              background: `${asset.color}20`,
                              color: asset.color,
                              border: `1px solid ${asset.color}30`,
                            }}
                          >
                            {asset.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {asset.symbol}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {asset.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {asset.symbol === "ICP"
                              ? balanceLoading
                                ? "..."
                                : `${(balance ?? 0).toFixed(4)}`
                              : asset.amount}
                          </p>
                          {asset.usd && (
                            <p className="text-xs text-muted-foreground">
                              ${asset.usd}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3" data-ocid="actions.section">
                <Button
                  type="button"
                  data-ocid="actions.send_button"
                  onClick={() => openSend(false)}
                  variant="outline"
                  className="rounded-pill px-6 h-10 text-sm font-medium gap-2 transition-all hover:shadow-glow-orange"
                  style={{
                    borderColor: "oklch(0.65 0.15 50 / 0.6)",
                    color: "oklch(0.72 0.15 55)",
                    background: "oklch(0.65 0.15 50 / 0.08)",
                  }}
                >
                  <ArrowUpRight size={15} />
                  Send ICP
                </Button>

                <Button
                  type="button"
                  data-ocid="actions.receive_button"
                  onClick={() => setReceiveOpen(true)}
                  variant="outline"
                  className="rounded-pill px-6 h-10 text-sm font-medium gap-2"
                  style={{
                    borderColor: "oklch(0.28 0.015 240)",
                    color: "oklch(0.75 0.01 240)",
                    background: "oklch(0.18 0.01 240)",
                  }}
                >
                  <ArrowDownLeft size={15} />
                  Receive
                </Button>

                <Button
                  type="button"
                  data-ocid="actions.stealth_button"
                  onClick={() => openSend(true)}
                  variant="outline"
                  className="rounded-pill px-6 h-10 text-sm font-medium gap-2 transition-all hover:shadow-glow-cyan"
                  style={{
                    borderColor: "oklch(0.72 0.13 195 / 0.6)",
                    color: "oklch(0.72 0.13 195)",
                    background: "oklch(0.72 0.13 195 / 0.08)",
                  }}
                >
                  <Shield size={15} />
                  Stealth Send
                </Button>
              </div>

              {/* Transactions table */}
              <div
                className="rounded-xl overflow-hidden shadow-card"
                style={{
                  background: "oklch(0.14 0.015 240)",
                  border: "1px solid oklch(0.28 0.015 240)",
                }}
              >
                <div
                  className="px-6 py-4 flex items-center justify-between"
                  style={{ borderBottom: "1px solid oklch(0.22 0.012 240)" }}
                >
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Recent Transactions
                  </h2>
                  <Badge
                    className="text-xs"
                    style={{
                      background: "oklch(0.72 0.13 195 / 0.15)",
                      color: "oklch(0.72 0.13 195)",
                      border: "1px solid oklch(0.72 0.13 195 / 0.3)",
                    }}
                  >
                    {transactions.length} total
                  </Badge>
                </div>

                {txLoading ? (
                  <div
                    className="p-6 space-y-3"
                    data-ocid="transactions.loading_state"
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div
                    className="p-12 text-center"
                    data-ocid="transactions.empty_state"
                  >
                    <Shield
                      size={32}
                      className="mx-auto mb-3"
                      style={{ color: "oklch(0.4 0.02 240)" }}
                    />
                    <p className="text-muted-foreground text-sm">
                      No transactions yet
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid oklch(0.22 0.012 240)",
                          }}
                        >
                          {[
                            "Type",
                            "Transaction ID",
                            "Date",
                            "Amount",
                            "Status",
                            "Privacy",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, i) => (
                          <TxRow
                            key={tx.id}
                            tx={tx}
                            index={i + 1}
                            onToggle={() => toggleVisibility.mutate(tx.id)}
                            isToggling={toggleVisibility.isPending}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === "privacy" && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold text-foreground">Privacy</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Hidden transactions are masked. Reveal them individually or
                  all at once.
                </p>
              </div>

              <div
                className="flex items-center justify-between gap-4 p-4 rounded-xl"
                style={{
                  background: "oklch(0.72 0.13 195 / 0.08)",
                  border: "1px solid oklch(0.72 0.13 195 / 0.2)",
                }}
              >
                <div className="flex items-center gap-3">
                  <Shield size={24} style={{ color: "oklch(0.72 0.13 195)" }} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {hiddenTxs.length} hidden transaction
                      {hiddenTxs.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {visibleTxs.length} revealed transaction
                      {visibleTxs.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {hiddenTxs.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    data-ocid="privacy.reveal_all_button"
                    disabled={toggleVisibility.isPending}
                    onClick={async () => {
                      for (const tx of hiddenTxs) {
                        await toggleVisibility.mutateAsync(tx.id);
                      }
                      toast.success("All transactions revealed");
                    }}
                    className="shrink-0 rounded-pill text-xs font-medium gap-1.5"
                    style={{
                      background: "oklch(0.72 0.13 195 / 0.15)",
                      color: "oklch(0.72 0.13 195)",
                      border: "1px solid oklch(0.72 0.13 195 / 0.4)",
                    }}
                  >
                    <Eye size={13} />
                    Reveal All
                  </Button>
                )}
              </div>

              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "oklch(0.14 0.015 240)",
                  border: "1px solid oklch(0.28 0.015 240)",
                }}
              >
                <div
                  className="px-6 py-4"
                  style={{ borderBottom: "1px solid oklch(0.22 0.012 240)" }}
                >
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Hidden Transactions
                  </h2>
                </div>

                {hiddenTxs.length === 0 ? (
                  <div
                    className="p-12 text-center"
                    data-ocid="privacy.empty_state"
                  >
                    <EyeOff
                      size={32}
                      className="mx-auto mb-3"
                      style={{ color: "oklch(0.4 0.02 240)" }}
                    />
                    <p className="text-muted-foreground text-sm">
                      All transactions are visible — no hidden transactions.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the "Hide" button on any transaction to mask it.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid oklch(0.22 0.012 240)",
                          }}
                        >
                          {[
                            "Type",
                            "Transaction ID",
                            "Date",
                            "Amount",
                            "Status",
                            "Privacy",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hiddenTxs.map((tx, i) => (
                          <TxRow
                            key={tx.id}
                            tx={tx}
                            index={i + 1}
                            onToggle={() => toggleVisibility.mutate(tx.id)}
                            isToggling={toggleVisibility.isPending}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ASSETS TAB */}
          {activeTab === "assets" && (
            <motion.div
              key="assets"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold text-foreground">Assets</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Your token portfolio on the Internet Computer.
                </p>
              </div>

              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                data-ocid="assets.list"
              >
                {ASSETS.map((asset, i) => (
                  <motion.div
                    key={asset.symbol}
                    data-ocid={`assets.item.${i + 1}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-6 rounded-xl"
                    style={{
                      background: "oklch(0.14 0.015 240)",
                      border: `1px solid ${asset.color}30`,
                      boxShadow: `0 0 24px ${asset.color}10`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{
                          background: `${asset.color}20`,
                          color: asset.color,
                          border: `1px solid ${asset.color}30`,
                        }}
                      >
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {asset.symbol}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asset.name}
                        </p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {asset.symbol === "ICP"
                        ? balanceLoading
                          ? "..."
                          : (balance ?? 0).toFixed(4)
                        : asset.amount}
                    </p>
                    {asset.usd && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ${asset.usd} USD
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ACCOUNTS TAB */}
          {activeTab === "accounts" && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Your connected wallet accounts.
                </p>
              </div>

              <div
                className="p-6 rounded-xl"
                style={{
                  background: "oklch(0.14 0.015 240)",
                  border: "1px solid oklch(0.28 0.015 240)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{
                      background: "oklch(0.72 0.13 195 / 0.2)",
                      color: "oklch(0.72 0.13 195)",
                    }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      Main Account
                    </p>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {principal ?? "Loading..."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (principal) {
                        navigator.clipboard.writeText(principal);
                        toast.success("Address copied!");
                      }
                    }}
                    className="shrink-0"
                    data-ocid="accounts.copy_button"
                    style={{
                      borderColor: "oklch(0.28 0.015 240)",
                      color: "oklch(0.57 0.018 240)",
                    }}
                  >
                    <Copy size={13} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SUPPORT TAB */}
          {activeTab === "support" && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold text-foreground">Support</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Get help with your Aether Wallet.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {supportItems.map(({ title, desc, Icon }, i) => (
                  <div
                    key={title}
                    data-ocid={`support.item.${i + 1}`}
                    className="p-5 rounded-xl"
                    style={{
                      background: "oklch(0.14 0.015 240)",
                      border: "1px solid oklch(0.28 0.015 240)",
                    }}
                  >
                    <Icon
                      size={20}
                      className="mb-3"
                      style={{ color: "oklch(0.72 0.13 195)" }}
                    />
                    <p className="font-semibold text-foreground text-sm mb-1">
                      {title}
                    </p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="py-6 px-4 text-center"
        style={{ borderTop: "1px solid oklch(0.2 0.01 240)" }}
      >
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <SendModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        defaultStealth={stealthDefault}
      />
      <ReceiveModal open={receiveOpen} onClose={() => setReceiveOpen(false)} />
    </div>
  );
}
