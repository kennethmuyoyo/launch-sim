"use client";

const PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-pink-500",
];

function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function initials(seed: string): string {
  const cleaned = seed.replace(/^@/, "").replace(/[_\-.]/g, " ").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const SIZE_CLASSES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

export function Avatar({
  seed,
  size = "sm",
  ring = false,
}: {
  seed: string;
  size?: keyof typeof SIZE_CLASSES;
  ring?: boolean;
}) {
  const h = hashString(seed || "anon");
  const color = PALETTE[h % PALETTE.length];
  return (
    <div
      className={[
        "inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 select-none",
        SIZE_CLASSES[size],
        color,
        ring ? "ring-2 ring-white/20" : "",
      ].join(" ")}
      title={seed}
    >
      {initials(seed)}
    </div>
  );
}
