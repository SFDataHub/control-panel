type PageHeaderProps = {
  title: string;
  subtitle?: string;
  hintRight?: string;
};

export default function PageHeader({ title, subtitle, hintRight }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__left">
        <p className="content-shell__eyebrow">SFDataHub</p>
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {hintRight && <p className="page-header__hint">{hintRight}</p>}
    </div>
  );
}
