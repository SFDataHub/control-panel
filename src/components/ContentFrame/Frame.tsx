import type { ReactNode } from "react";

type FrameProps = {
  rounded?: string;
  padded?: boolean;
  children: ReactNode;
};

/**
 * Lightweight replacement for the main repo's Frame component.
 * Keeps the same API signature used by ContentShell without pulling extra deps.
 */
export default function Frame({
  rounded = "rounded-3xl",
  padded = true,
  children,
}: FrameProps) {
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
