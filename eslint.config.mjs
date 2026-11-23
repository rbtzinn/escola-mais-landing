import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Skill de design de terceiros (impeccable) e seus artefatos.
    '.claude/**',
    '.impeccable/**',
    // Formulário de matrícula: projeto próprio, com lint próprio.
    'matricula/**',
  ]),
]);

export default eslintConfig;
