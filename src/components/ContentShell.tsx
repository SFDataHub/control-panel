import type { ReactNode } from "react";

type ContentShellProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export default function ContentShell({ title, description, children }: ContentShellProps) {
  return (
    <section className="content-shell">
      <div className="content-shell__header">
        <div>
          <p className="content-shell__eyebrow">SFDataHub</p>
          <h1>{title}</h1>
          {description && <p className="content-shell__description">{description}</p>}
        </div>
      </div>
      <div className="content-shell__body">{children}</div>
    </section>
  );
}
