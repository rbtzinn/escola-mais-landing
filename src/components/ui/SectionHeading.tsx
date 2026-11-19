import clsx from 'clsx';

interface Props {
  id?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  /** Sobre o azul, título e texto em creme; sobre o rosa, título creme e texto em tinta (contraste). */
  tone?: 'ink' | 'cream' | 'pink';
  className?: string;
}

/** Título de seção da landing: condensada pesada, sem rótulo acima (o título fala sozinho). */
export function SectionHeading({
  id,
  title,
  description,
  align = 'left',
  tone = 'ink',
  className,
}: Props) {
  return (
    <div className={clsx('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      <h2
        id={id}
        className={clsx(
          'font-display text-[2.6rem] leading-[0.95] font-extrabold text-balance sm:text-6xl',
          tone === 'ink' ? 'text-fg' : 'text-cream',
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={clsx(
            'mt-5 text-lg leading-relaxed',
            tone === 'cream' ? 'text-cream/85' : tone === 'pink' ? 'text-ink' : 'text-fg-muted',
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
