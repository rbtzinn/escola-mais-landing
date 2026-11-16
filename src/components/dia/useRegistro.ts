'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { toOptions } from '@/components/demo/Thresholds';
import { useDemoStore } from '@/hooks/useDemoStore';
import { nowFor } from '@/lib/attendance/clock';
import { buildRoster } from '@/lib/attendance/codes';
import { applyLateRecords, pendingNotices } from '@/lib/attendance/records';
import { presenceByClass, presenceTotal } from '@/lib/daily/attendance';
import { mealCount, mealTotal, mealWindow } from '@/lib/daily/meals';
import { demoStore } from '@/lib/demoStore';
import { analyze } from '@/lib/spreadsheet/analyze';

/**
 * Dados comuns às telas de registro: escola (ou a de exemplo), alunos com matrícula,
 * atrasos do dia somados à planilha e a hora da demo (simulada ou real).
 */
export function useRegistro() {
  const state = useDemoStore();
  const { school, records, clock, optionsText, chamadas, meals, mealDeadline, faltaram } = state;

  // Sem planilha carregada na /demo, usa a escola de exemplo.
  useEffect(() => {
    demoStore.ensureSchool();
  }, []);

  const options = useMemo(() => toOptions(optionsText), [optionsText]);
  const analysis = useMemo(() => {
    if (!school) return null;
    const merged = applyLateRecords(school.table, school.mapping, records);
    return analyze(merged.table, merged.mapping, options);
  }, [school, records, options]);
  const roster = useMemo(() => (analysis ? buildRoster(analysis.students) : []), [analysis]);
  const turmas = useMemo(
    () =>
      [...new Set(roster.map((r) => r.turma))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR', { numeric: true }),
      ),
    [roster],
  );
  const now = useCallback(() => nowFor(clock, new Date()), [clock]);
  const presence = useMemo(
    () => presenceByClass(roster, chamadas, records),
    [roster, chamadas, records],
  );
  const mealsByClass = useMemo(
    () => mealCount(roster, chamadas, records, meals),
    [roster, chamadas, records, meals],
  );

  return {
    ...state,
    options,
    analysis,
    roster,
    turmas,
    now,
    pendentes: pendingNotices(records).length,
    presence,
    presenceTotal: presenceTotal(presence),
    mealsByClass,
    refeicoes: mealTotal(mealsByClass),
    merendaAberta: mealWindow(now(), mealDeadline) === 'aberto',
    faltando: faltaram.length,
  };
}
