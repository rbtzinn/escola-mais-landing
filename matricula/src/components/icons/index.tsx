import type { SVGProps } from 'react';

const PATHS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  logout: 'M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  key: 'M14 4a6 6 0 11-4.6 9.8L4 19v-3h3v-3h2.2A6 6 0 0114 4zM16 8h.01',
  close: 'M6 6l12 12M18 6L6 18',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  chevron: 'M6 9l6 6 6-6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 8h.01',
  alert: 'M12 3l10 18H2zM12 10v4M12 17.5h.01',
  user: 'M12 11a4 4 0 100-8 4 4 0 000 8zM4 21c.7-4 3.8-6.5 8-6.5s7.3 2.5 8 6.5',
  users:
    'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 010 6.5M18 14.8c2 .7 3.2 2.4 3.5 5.2',
  file: 'M6 3h9l4 4v14H6zM9 12h7M9 16h5',
  pin: 'M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12zM12 6.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  heart: 'M12 20s-8-4.6-8-10.5A4.5 4.5 0 0112 6a4.5 4.5 0 018 3.5C20 15.4 12 20 12 20z',
  school: 'M3 10l9-6 9 6M5 10v9h14v-9M10 19v-5h4v5M12 4V2',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M8 7h7',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  send: 'M4 12l16-8-6 16-2.5-6.5z',
  refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5L16 9.5',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

/** Ícone SVG inline (traço de 1,75px, herda a cor do texto). Decorativo por padrão. */
export function Icon({ name, size = 24, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
