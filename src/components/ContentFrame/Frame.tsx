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
        borderColor: "#1F3150",
        background: "linear-gradient(180deg, #0f1624 0%, #0b111d 100%)",
        boxShadow: "0 24px 60px rgba(5, 10, 24, 0.6)",
      }}
    >
      <div className={`relative ${padded ? "p-4 md:p-6" : ""}`}>{children}</div>
    </section>
  );
}
