import type { ReactNode } from "react";

type ContentShellProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  headerContent?: ReactNode;
};

export default function ContentShell({ title, description, children, headerContent }: ContentShellProps) {
  return (
    <section className="content-shell">
      <div className="content-shell__header">
        {headerContent ?? (
          <div>
            <p className="content-shell__eyebrow">SFDataHub</p>
            <h1>{title}</h1>
            {description && <p className="content-shell__description">{description}</p>}
          </div>
        )}
      </div>
      <div className="content-shell__body">{children}</div>
    </section>
  );
}
