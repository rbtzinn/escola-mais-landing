import type { SVGProps } from 'react';

export type IconName =
  | 'sheet'
  | 'paper'
  | 'box'
  | 'file'
  | 'check'
  | 'chart'
  | 'utensils'
  | 'wrench'
  | 'message'
  | 'shield'
  | 'menu'
  | 'close'
  | 'sun'
  | 'moon'
  | 'chevron'
  | 'arrow'
  | 'search'
  | 'quote'
  | 'users'
  | 'link'
  | 'school'
  | 'info'
  | 'calendar'
  | 'inbox';

const PATHS: Record<IconName, string> = {
  sheet: 'M4 5h16v14H4zM4 10h16M9 5v14',
  paper: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
  box: 'M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10',
  file: 'M6 3h9l4 4v14H6zM9 12h7M9 16h5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
  utensils: 'M7 3v8M4 3v5a3 3 0 006 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10',
  wrench: 'M14.5 6.5a4 4 0 005 5L10 21a2.1 2.1 0 01-3-3zM14.5 6.5l3 3',
  message: 'M4 5h16v11H9l-5 4z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5L16 9.5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  chevron: 'M6 9l6 6 6-6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  quote: 'M5 17c0-4 1-7 4-9M13 17c0-4 1-7 4-9M5 17h4v-4H5zM13 17h4v-4h-4z',
  users:
    'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 010 6.5M18 14.8c2 .7 3.2 2.4 3.5 5.2',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1',
  school: 'M3 10l9-6 9 6M5 10v9h14v-9M10 19v-5h4v5M12 4V2',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 8h.01',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  inbox: 'M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5a3 3 0 006 0h5',
};

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
