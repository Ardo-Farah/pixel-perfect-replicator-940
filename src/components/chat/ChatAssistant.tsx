import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { Link } from "@tanstack/react-router";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { getChatHistory, clearChatHistory } from "@/lib/chat-history";

type Disease = "mpox" | "measles" | "anthrax" | "floods" | "nutrition";

const diseaseRoute: Record<Disease, string> = {
  mpox: "/mpox",
  measles: "/measles",
  anthrax: "/anthrax",
  floods: "/floods",
  nutrition: "/nutrition",
};

const QUICK_PROMPTS = [
  "Mpox trend last 6 weeks",
  "Flood deaths by region",
  "Measles cases by county",
  "Show Mpox map for Nairobi",
];

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [initial, setInitial] = useState<UIMessage[]>([]);
  const loadHistory = getChatHistory;
  const clearHistory = clearChatHistory;

  // Chat runs as a Supabase Edge Function so the Anthropic key lives only as a
  // Supabase secret — the app host (Lovable) needs no LLM key. We call the
  // function directly with the signed-in user's JWT (+ anon apikey for the
  // gateway); data is read under that user's RLS.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${SUPABASE_URL}/functions/v1/chat`,
        prepareSendMessagesRequest: async ({ api, body, headers, messages }) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return {
            api,
            headers: {
              ...(headers ?? {}),
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: { ...(body ?? {}), messages },
          };
        },
      }),
    [],
  );

  // Load history once before mounting useChat so initial messages seed correctly.
  // Always falls through within 4s so the UI never stays stuck on "Loading…".
  useEffect(() => {
    if (!open || seeded) return;
    let cancelled = false;
    const fallback = window.setTimeout(() => {
      if (!cancelled) setSeeded(true);
    }, 4000);
    loadHistory({})
      .then((res) => {
        if (cancelled) return;
        setInitial((res?.messages ?? []) as unknown as UIMessage[]);
        setSeeded(true);
      })
      .catch((err) => {
        console.error("getChatHistory failed", err);
        if (!cancelled) setSeeded(true);
      })
      .finally(() => window.clearTimeout(fallback));
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [open, seeded, loadHistory]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Clinical Assistant"
        className="fixed bottom-4 right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl ring-4 ring-primary/15 transition hover:opacity-90 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
          smart_toy
        </span>
      </button>
    );
  }

  return (
    <ChatPanel
      key={seeded ? "ready" : "loading"}
      initial={initial}
      ready={seeded}
      transport={transport}
      onClose={() => setOpen(false)}
      onClear={async () => {
        await clearHistory({});
        setInitial([]);
        // remount panel to reset useChat state
        setSeeded(false);
        setTimeout(() => setSeeded(true), 0);
      }}
    />
  );
}

function ChatPanel({
  initial,
  ready,
  transport,
  onClose,
  onClear,
}: {
  initial: UIMessage[];
  ready: boolean;
  transport: DefaultChatTransport<UIMessage>;
  onClose: () => void;
  onClear: () => void | Promise<void>;
}) {
  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: initial,
  });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const isBusy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const t = text.trim();
    if (!t || isBusy) return;
    void sendMessage({ text: t });
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div
      role="dialog"
      aria-label="Clinical Assistant"
      className="fixed inset-x-3 bottom-3 z-[60] flex max-w-[400px] flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[calc(100vw-2rem)]"
      style={{ height: "min(620px, calc(100vh - 1.5rem))" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 bg-primary px-4 py-3 text-on-primary">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-on-primary/15">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            smart_toy
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-md font-semibold leading-tight">Clinical Assistant</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider opacity-90">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
            Online
          </p>
        </div>
        <button
          onClick={onClear}
          title="Clear conversation"
          aria-label="Clear conversation"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-on-primary/15"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            delete
          </span>
        </button>
        <button
          onClick={onClose}
          title="Close"
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-on-primary/15"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            close
          </span>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-surface-container-lowest px-4 py-4">
        {!ready ? (
          <p className="text-body-sm text-on-surface-variant">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <EmptyState onPick={send} />
        ) : (
          messages.map((m) => <MessageRow key={m.id} message={m} />)
        )}

        {status === "submitted" ? (
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            Thinking…
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container">
            {error.message || "Something went wrong. Please try again."}
          </div>
        ) : null}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex min-w-0 items-center gap-2 border-t border-outline-variant bg-surface px-3 py-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your query…"
          disabled={!ready}
          className="min-w-0 flex-1 rounded-full bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={!ready || isBusy || !input.trim()}
          aria-label="Send"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary transition hover:opacity-90 disabled:opacity-40"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            send
          </span>
        </button>
      </form>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-surface px-3 py-3 text-body-sm text-on-surface shadow-sm">
        Hello Dr. Richard, how can I assist with your regional data analysis today?
      </div>
      <p className="pt-1 text-label-caps text-on-surface-variant">Try asking</p>
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="rounded-full border border-outline-variant bg-surface px-3 py-1.5 text-body-sm text-on-surface hover:bg-surface-container-low"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

type AnyPart = { type: string; text?: string; state?: string; output?: unknown };

function MessageRow({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const parts = message.parts as AnyPart[];

  if (isUser) {
    const text = parts
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-body-sm text-on-primary">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {parts.map((p, i) => {
        if (p.type === "text") {
          return (
            <div key={i} className="prose prose-sm max-w-none text-body-sm text-on-surface">
              <ReactMarkdown>{p.text ?? ""}</ReactMarkdown>
            </div>
          );
        }
        if (p.type.startsWith("tool-") && p.state === "output-available") {
          return <DataWidget key={i} output={p.output} />;
        }
        if (p.type.startsWith("tool-")) {
          return (
            <div key={i} className="text-label-caps text-on-surface-variant">
              Running {p.type.replace("tool-", "")}…
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

type WidgetOutput =
  | { type: "bar_by_county"; title: string; items: { label: string; value: number }[]; callout?: string }
  | { type: "bar_by_region"; title: string; items: { label: string; value: number }[]; callout?: string }
  | { type: "trend_line"; title: string; series: { week: string; value: number }[]; callout?: string }
  | { type: "map_hint"; title: string; area: string; note: string; disease?: Disease };

function DataWidget({ output }: { output: unknown }) {
  const data = output as WidgetOutput | undefined;
  if (!data || typeof data !== "object" || !("type" in data)) return null;

  if (data.type === "bar_by_county" || data.type === "bar_by_region") {
    const tone = data.type === "bar_by_region" ? "bg-error" : "bg-primary";
    return (
      <Card title={data.title} callout={data.callout}>
        <BarList items={data.items} tone={tone} />
      </Card>
    );
  }

  if (data.type === "trend_line") {
    return (
      <Card title={data.title} callout={data.callout}>
        <Sparkline series={data.series} />
        <div className="mt-2 flex justify-between text-[11px] text-on-surface-variant">
          {data.series.map((s) => (
            <span key={s.week}>{s.week}</span>
          ))}
        </div>
      </Card>
    );
  }

  if (data.type === "map_hint") {
    // try to infer disease from title
    const lower = data.title.toLowerCase();
    const disease = (Object.keys(diseaseRoute) as Disease[]).find((d) => lower.includes(d));
    return (
      <div className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface px-3 py-3">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>
          map
        </span>
        <div className="flex-1">
          <p className="text-body-sm font-semibold text-on-surface">{data.title}</p>
          <p className="mt-0.5 text-body-sm text-on-surface-variant">{data.note}</p>
          {disease ? (
            <Link
              to={diseaseRoute[disease] as "/mpox"}
              className="mt-1 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:underline"
            >
              View on map
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}

function Card({
  title,
  callout,
  children,
}: {
  title: string;
  callout?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface px-3 py-3">
      <p className="text-label-caps text-on-surface-variant">{title}</p>
      <div className="mt-2">{children}</div>
      {callout ? <p className="mt-2 text-body-sm text-on-surface">{callout}</p> : null}
    </div>
  );
}

function BarList({
  items,
  tone,
}: {
  items: { label: string; value: number }[];
  tone: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-1.5">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2">
          <span className="w-20 shrink-0 truncate text-[12px] text-on-surface-variant">
            {i.label}
          </span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-container-low">
            <div
              className={`absolute inset-y-0 left-0 ${tone}`}
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-[12px] font-semibold text-on-surface">
            {i.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ series }: { series: { week: string; value: number }[] }) {
  const w = 260;
  const h = 60;
  const max = Math.max(...series.map((s) => s.value));
  const min = Math.min(...series.map((s) => s.value));
  const range = Math.max(1, max - min);
  const step = series.length > 1 ? w / (series.length - 1) : w;
  const pts = series.map((s, i) => {
    const x = i * step;
    const y = h - ((s.value - min) / range) * h;
    return `${x},${y}`;
  });
  const path = `M ${pts.join(" L ")}`;
  const area = `M 0,${h} L ${pts.join(" L ")} L ${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full">
      <path d={area} fill="currentColor" className="text-primary/15" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} className="text-primary" />
      {series.map((s, i) => (
        <circle key={i} cx={i * step} cy={h - ((s.value - min) / range) * h} r={2.5} className="fill-primary" />
      ))}
    </svg>
  );
}
