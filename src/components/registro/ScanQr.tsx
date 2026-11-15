'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

type CamState = 'off' | 'starting' | 'on' | 'denied' | 'unsupported';

interface Props {
  /** Chamado com o texto do QR ou o código digitado. */
  onCode: (code: string) => void;
  /** Liga a câmera assim que aparece (totem). */
  autoStart?: boolean;
  id: string;
}

const REPEAT_MS = 2500;

/** Câmera só existe em navegador com getUserMedia e em HTTPS (ou localhost). */
const canUseCamera = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

/**
 * Leitor de carteirinha: câmera traseira + jsQR (carregado só aqui). Sem câmera, sem HTTPS
 * ou com permissão negada, sobra o campo para digitar o código. A câmera é desligada ao sair.
 */
export function ScanQr({ onCode, autoStart = false, id }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  const [cam, setCam] = useState<CamState>(() =>
    autoStart ? (canUseCamera() ? 'starting' : 'unsupported') : 'off',
  );
  const [typed, setTyped] = useState('');

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  // A câmera fica ligada enquanto 'starting' ou 'on'; mudar entre os dois não reinicia o efeito.
  const active = cam === 'starting' || cam === 'on';

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    let last = { text: '', at: 0 };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        const { default: jsQR } = await import('jsqr');
        const video = videoRef.current;
        if (stopped || !video) return;
        video.srcObject = stream;
        await video.play();
        setCam('on');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const tick = () => {
          if (stopped || !ctx) return;
          if (video.readyState >= 2 && video.videoWidth) {
            const scale = Math.min(1, 640 / video.videoWidth);
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const found = jsQR(img.data, img.width, img.height, {
              inversionAttempts: 'attemptBoth',
            });
            const now = Date.now();
            if (found?.data && (found.data !== last.text || now - last.at > REPEAT_MS)) {
              last = { text: found.data, at: now };
              onCodeRef.current(found.data);
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        if (!stopped) setCam('denied');
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typed.trim()) return;
    onCode(typed);
    setTyped('');
  };

  return (
    <div className="space-y-3">
      {active ? (
        <div className="relative overflow-hidden rounded-2xl bg-fg">
          <video
            ref={videoRef}
            muted
            playsInline
            aria-label="Imagem da câmera para ler a carteirinha"
            className="aspect-[4/3] w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[18%] rounded-2xl border-4 border-accent"
          />
          <p className="absolute inset-x-0 bottom-0 bg-fg/70 p-2 text-center text-sm font-semibold text-bg">
            {cam === 'starting' ? 'Ligando a câmera…' : 'Aponte para o QR da carteirinha'}
          </p>
          <Button
            variant="secondary"
            onClick={() => setCam('off')}
            className="absolute top-2 right-2 !min-h-9 !px-3 text-sm"
          >
            Desligar câmera
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-4 text-center">
          {cam === 'denied' && (
            <p role="alert" className="mb-2 text-sm text-danger">
              Não foi possível usar a câmera (permissão negada ou sem câmera). Digite o código
              abaixo.
            </p>
          )}
          {cam === 'unsupported' && (
            <p role="alert" className="mb-2 text-sm text-danger">
              Este navegador não libera a câmera aqui. Digite o código abaixo.
            </p>
          )}
          <Button
            variant="secondary"
            onClick={() => setCam(canUseCamera() ? 'starting' : 'unsupported')}
          >
            <Icon name="camera" size={20} />
            Ler carteirinha com a câmera
          </Button>
        </div>
      )}

      <form onSubmit={submit} className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <TextField
            id={id}
            label="Ou digite o código da carteirinha"
            value={typed}
            onChange={setTyped}
            placeholder="EM-XXXXXX"
            autoComplete="off"
            autoCapitalize="characters"
          />
        </div>
        <Button type="submit" className="mb-0.5 shrink-0">
          Registrar
        </Button>
      </form>
    </div>
  );
}
