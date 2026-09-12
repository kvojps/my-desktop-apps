import type { ReactNode } from 'react';

interface FileUploadButtonProps {
  label: ReactNode;
  accept?: string;
  disabled?: boolean;
  icon?: ReactNode;
  onFileSelected: (file: File) => void;
}

/**
 * Anexo: um `<label>` com a cara de botão em volta de um `input[type=file]`.
 *
 * O input continua no DOM e alcançável pelo teclado — escondê-lo com `hidden`
 * o tiraria da ordem de tabulação, e o botão deixaria de existir para quem não
 * usa ponteiro. Ele fica visualmente oculto, e o rótulo o veste.
 */
export function FileUploadButton({
  label,
  accept,
  disabled,
  icon,
  onFileSelected,
}: FileUploadButtonProps) {
  return (
    <label className="money-button money-button-secondary" data-disabled={!!disabled}>
      {icon}
      {label}
      <input
        type="file"
        className="money-visually-hidden"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
          // Escolher o mesmo arquivo duas vezes seguidas não dispara `change`
          // se o valor continuar lá.
          event.target.value = '';
        }}
      />
    </label>
  );
}
