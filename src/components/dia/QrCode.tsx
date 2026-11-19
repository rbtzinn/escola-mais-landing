'use client';

import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

/** QR desenhado em SVG (sem imagem nem HTML injetado). Cores pelos tokens, dentro de `.qr-light`. */
export function QrCode({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const { n, d } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
    return { n, d };
  }, [value]);

  return (
    <svg
      viewBox={`-2 -2 ${n + 4} ${n + 4}`}
      role="img"
      aria-label={label}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect x={-2} y={-2} width={n + 4} height={n + 4} fill="var(--surface)" />
      <path d={d} fill="var(--text)" />
    </svg>
  );
}
