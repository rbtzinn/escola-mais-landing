import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';

/**
 * O painel desenhado por código sobre a tela em branco do celular da foto.
 * Medidas em % da foto (assets/plates/coordenadora.png, 1856×2304): a tela tem centro em
 * (510, 1000), 601×1198 px e está inclinada 6,1° para a esquerda. Números de exemplo.
 */
export function PhoneScreen() {
  return (
    <div
      aria-hidden="true"
      className="[container-type:inline-size] absolute"
      style={{
        left: '11.29%',
        top: '17.4%',
        width: '32.4%',
        height: '52%',
        transform: 'rotate(-6.1deg)',
      }}
    >
      <div className="flex h-full flex-col items-center px-[7cqw] pt-[15cqw] text-center text-ink">
        <p className="font-sans text-[10cqw] leading-none font-bold text-blue">Escola+</p>
        <span className="hero-badge mt-[12cqw] rounded-full bg-yellow px-[6cqw] py-[2cqw] font-sans text-[7.6cqw] leading-none font-bold">
          Atenção
        </span>
        <p className="mt-[4cqw] font-sans text-[10.4cqw] leading-[1.12] font-semibold">
          3 turmas precisam de atenção hoje
        </p>
        <p className="mt-[3cqw] font-sans text-[5.1cqw] leading-tight text-ink/70">
          142/144 presentes · 5 atrasos · 133 refeições
        </p>
        <span className="mt-[6cqw] inline-flex items-center gap-[2cqw] rounded-full bg-green px-[6cqw] py-[3cqw] font-sans text-[6.2cqw] leading-none font-semibold text-cream">
          <WhatsAppIcon size={14} className="size-[6.8cqw]" />
          Avisar no WhatsApp
        </span>
      </div>
    </div>
  );
}
