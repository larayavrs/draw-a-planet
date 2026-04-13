"use client";

import { useTranslations } from "next-intl";
import { useCanvasStore, type DrawTool } from "@/stores/canvasStore";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const TOOLS: { id: DrawTool; label: string; icon: React.ReactNode }[] = [
  { id: "brush", label: "tool_brush", icon: <BrushIcon /> },
  { id: "fill", label: "tool_fill", icon: <FillIcon /> },
  { id: "eraser", label: "tool_eraser", icon: <EraserIcon /> },
];

const BRUSH_SIZES = [4, 8, 12, 20, 32];

export function BrushToolbar() {
  const t = useTranslations("draw");
  const { tool, setTool, brushSize, setBrushSize, actions } = useCanvasStore();

  return (
    <div className="flex flex-col gap-3">
      {/* Tools group */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/70 px-0.5">
          {t("tools") || "Tools"}
        </p>
        <div className="flex items-center gap-1.5">
          {TOOLS.map((tool_) => (
            <button
              key={tool_.id}
              onClick={() => setTool(tool_.id)}
              title={t(tool_.label)}
              aria-label={t(tool_.label)}
              className={cn(
                "relative rounded-xl flex items-center justify-center transition-all duration-150",
                "w-11 h-11 text-lg",
                "hover:scale-105 active:scale-95",
                tool === tool_.id
                  ? "bg-sentry-purple text-white shadow-[0_0_12px_rgba(106,95,193,0.4)] ring-1 ring-sentry-purple/50"
                  : "bg-border-purple/30 border border-border-purple/50 text-text-muted hover:bg-border-purple/50 hover:text-white",
              )}
            >
              {tool_.icon}
              {tool === tool_.id && (
                <span className="absolute -right-0.5 -top-0.5 w-2 h-2 bg-lime rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border-purple/40" />

      {/* Undo / Redo / Clear */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/70 px-0.5">
          {t("actions") || "Actions"}
        </p>
        <div className="flex items-center gap-1.5">
          <ActionButton
            onClick={() => actions?.undo()}
            disabled={!actions}
            title={t("tool_undo")}
            icon={<UndoIcon />}
          />
          <ActionButton
            onClick={() => actions?.clear()}
            disabled={!actions}
            title={t("tool_clear")}
            icon={<ClearIcon />}
          />
        </div>
      </div>

      <Separator className="bg-border-purple/40" />

      {/* Brush size */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/70 px-0.5">
          {t("brush_size") || "Brush Size"}
        </p>
        <div className="flex items-center justify-center gap-3 py-1">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setBrushSize(s)}
              title={`${s}px`}
              aria-label={`Brush size ${s} pixels`}
              className={cn(
                "rounded-full border shrink-0 transition-all duration-150 hover:scale-110",
                brushSize === s
                  ? "border-sentry-purple bg-sentry-purple/40 shadow-[0_0_8px_rgba(106,95,193,0.3)]"
                  : "border-border-purple/50 bg-border-purple/20 hover:border-border-purple/70",
              )}
              style={{ width: Math.max(10, s / 2), height: Math.max(10, s / 2) }}
            />
          ))}
        </div>
        <p className="text-center text-[10px] text-text-muted/60">
          {brushSize}px
        </p>
      </div>
    </div>
  );
}

// ─── Action Button Subcomponent ───────────────────────────────────────────────

function ActionButton({
  onClick,
  disabled,
  title,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "rounded-lg flex items-center justify-center transition-all duration-150",
        "w-11 h-11 text-sm",
        "hover:scale-105 active:scale-95",
        "bg-border-purple/30 border border-border-purple/50 text-text-muted",
        "hover:bg-border-purple/50 hover:text-white",
        "disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed",
      )}
    >
      {icon}
    </button>
  );
}

// ─── Icon Components ──────────────────────────────────────────────────────────

function BrushIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
      <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
    </svg>
  );
}

function FillIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
      <path d="m5 2 5 5" />
      <path d="M2 13h15" />
      <path d="M22 20a2 2 0 1 1-4 0c0-1.6 2-3 2-3s2 1.4 2 3Z" />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}
