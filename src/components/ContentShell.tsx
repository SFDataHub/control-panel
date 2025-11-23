import React from "react";

type CSS = React.CSSProperties;

type ContentShellProps = {
  title: string;
  description?: string;
  subtitle?: string;
  children?: React.ReactNode;
  headerContent?: React.ReactNode;
  actions?: React.ReactNode;
  subheader?: React.ReactNode;
  hex?: React.ReactNode;

  left?: React.ReactNode;
  right?: React.ReactNode;

  rounded?: string;
  padded?: boolean;
  centerFramed?: boolean;
  leftWidth?: number | string;
  rightWidth?: number | string;
  stickyRails?: boolean;

  mode?: "page" | "card";
  outerPadding?: string;
  leftPlacement?: "inside" | "bleed";

  stickyTopbar?: boolean;
  stickySubheader?: boolean;
  shellViewportOffset?: string;
  topbarHeight?: number;
};

const SURFACE: CSS = { borderColor: "#2B4C73", background: "#1A2F4A" };
const RAIL: CSS = { borderColor: "#2B4C73", background: "#152A42" };

function Frame({
  rounded = "rounded-3xl",
  padded = true,
  children,
}: {
  rounded?: string;
  padded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`relative w-full overflow-hidden border ${rounded}`}
      style={{
        borderColor: "#2B4C73",
        background: "#1A2F4A",
        boxShadow: "0 10px 24px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.35)",
      }}
    >
      <div className={`relative ${padded ? "p-4 md:p-6" : ""}`}>{children}</div>
    </section>
  );
}

export default function ContentShell({
  title,
  description,
  subtitle,
  headerContent,
  actions,
  subheader,
  hex,
  left,
  right,
  children,

  rounded = "rounded-3xl",
  padded = true,
  centerFramed = false,
  leftWidth = 0,
  rightWidth = 0,
  stickyRails = true,

  mode = "card",
  outerPadding = "px-4 py-3",
  leftPlacement = "inside",

  stickyTopbar = false,
  stickySubheader = false,
  shellViewportOffset = "var(--app-topbar-h,72px)",
  topbarHeight = 56,
}: ContentShellProps) {
  const subtitleText = subtitle ?? description;

  const cssVars: CSS = {
    // @ts-ignore
    "--left": typeof leftWidth === "number" ? `${leftWidth}px` : leftWidth,
    // @ts-ignore
    "--right": typeof rightWidth === "number" ? `${rightWidth}px` : rightWidth,
  };

  const TopArea = headerContent ? (
    <div className={stickyTopbar ? "sticky top-0 z-30" : ""}>{headerContent}</div>
  ) : (
    <>
      {hex && (
        <div className="mb-3 rounded-2xl border px-4 py-2" style={SURFACE}>
          {hex}
        </div>
      )}

      {(title || subtitleText || actions) && (
        <div
          className={[
            stickyTopbar ? "sticky top-0 z-30" : "",
            "mb-3 flex items-center justify-between rounded-2xl border px-5 py-3",
          ].join(" ")}
          style={SURFACE}
        >
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-[#8AA5C4]">SFDataHub</p>
            <div className="truncate text-sm font-semibold" style={{ color: "#F5F9FF" }}>
              {title}
            </div>
            {subtitleText && (
              <div className="truncate text-[11px]" style={{ color: "#B0C4D9" }}>
                {subtitleText}
              </div>
            )}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      )}

      {subheader && (
        <div
          className={[
            stickySubheader ? "sticky z-20" : "",
            "mb-3 rounded-2xl border px-4 py-3",
          ].join(" ")}
          style={{
            ...(stickySubheader ? { top: stickyTopbar ? `${topbarHeight}px` : 0 } : {}),
            ...SURFACE,
          }}
        >
          {subheader}
        </div>
      )}
    </>
  );

  const Wrap: React.FC<{ children: React.ReactNode }> =
    mode === "card"
      ? ({ children }) => <Frame rounded={rounded} padded={padded}>{children}</Frame>
      : ({ children }) => <div className={`w-full ${outerPadding}`}>{children}</div>;

  const Body = (
    <div className="relative min-h-0 h-full" style={cssVars}>
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[var(--left)_minmax(0,1fr)_var(--right)]">
        {left ? (
          <aside
            className="rounded-2xl border p-3 md:p-4"
            style={{
              ...RAIL,
              position: stickyRails ? ("sticky" as const) : "static",
              top: stickyRails ? "1rem" : undefined,
              alignSelf: "start",
              height: "fit-content",
            }}
          >
            {left}
          </aside>
        ) : (
          (leftWidth ? <div /> : <div className="hidden md:block" />)
        )}

        {centerFramed ? (
          <main
            className="rounded-2xl border p-3 md:p-4 min-w-0 h-full overflow-y-auto no-scrollbar"
            style={RAIL}
          >
            {children}
          </main>
        ) : (
          <main className="min-w-0 h-full overflow-y-auto no-scrollbar">
            {children}
          </main>
        )}

        {right ? (
          <aside
            className="rounded-2xl border p-3 md:p-4"
            style={{
              ...RAIL,
              position: stickyRails ? ("sticky" as const) : "static",
              top: stickyRails ? "1rem" : undefined,
              alignSelf: "start",
              height: "fit-content",
            }}
          >
            {right}
          </aside>
        ) : (
          (rightWidth ? <div /> : <div className="hidden md:block" />)
        )}
      </div>
    </div>
  );

  if (leftPlacement === "bleed" && mode === "card") {
    return (
      <div className={`w-full ${outerPadding}`}>
        <div className="flex flex-col h-[calc(100vh_-_var(--app-topbar-h,72px))] min-h-0">
          {TopArea}
          <div className="flex-1 min-h-0" style={cssVars}>
            <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[var(--left)_minmax(0,1fr)]">
              {left ? (
                <aside
                  className="rounded-2xl border p-3 md:p-4"
                  style={{
                    ...RAIL,
                    position: stickyRails ? ("sticky" as const) : "static",
                    top: stickyRails ? "1rem" : undefined,
                    alignSelf: "start",
                    height: "fit-content",
                  }}
                >
                  {left}
                </aside>
              ) : (leftWidth ? <div /> : <div className="hidden md:block" />)}

              <Frame rounded={rounded} padded={padded}>
                <div className="flex-1 min-h-0 h-full">{Body}</div>
              </Frame>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Wrap>
      <div
        className="flex flex-col min-h-0"
        style={{ height: `calc(100vh - ${shellViewportOffset})` }}
      >
        {TopArea}
        <div className="flex-1 min-h-0">{Body}</div>
      </div>
    </Wrap>
  );
}
