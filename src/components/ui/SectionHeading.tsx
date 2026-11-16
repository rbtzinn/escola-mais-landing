import clsx from 'clsx';

interface Props {
  id?: string;
  /** Número da seção, como em um sumário ("01"). */
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  id,
  index,
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: Props) {
  return (
    <div className={clsx('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p
          className={clsx(
            'eyebrow mb-5 flex items-center gap-3 text-fg-muted',
            align === 'center' && 'justify-center',
          )}
        >
          {index && (
            <>
              <span className="text-primary">{index}</span>
              <span aria-hidden="true" className="h-px w-8 bg-fg/40" />
            </>
          )}
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className="font-display text-[2rem] leading-[1.08] font-medium text-balance sm:text-[2.75rem]"
      >
        {title}
      </h2>
      {description && <p className="mt-5 text-lg leading-relaxed text-fg-muted">{description}</p>}
    </div>
  );
}
