import clsx from 'clsx';

interface Props {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: Props) {
  return (
    <div className={clsx('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p className="mb-3 text-sm font-bold tracking-[0.14em] text-secondary uppercase">
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className="font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl"
      >
        {title}
      </h2>
      {description && <p className="mt-4 text-lg leading-relaxed text-fg-muted">{description}</p>}
    </div>
  );
}
