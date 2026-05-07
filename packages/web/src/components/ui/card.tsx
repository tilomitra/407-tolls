export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`surface-amex relative ${className}`}>
      {/* etched gold corner accents */}
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-amex-gold-lo" />
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r border-t border-amex-gold-lo" />
      <span aria-hidden className="pointer-events-none absolute left-0 bottom-0 h-2 w-2 border-l border-b border-amex-gold-lo" />
      <span aria-hidden className="pointer-events-none absolute right-0 bottom-0 h-2 w-2 border-r border-b border-amex-gold-lo" />
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-b border-amex-line px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}
