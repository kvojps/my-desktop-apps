import {
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  cloneElement,
  isValidElement,
  useId,
} from 'react';

interface FieldProps {
  label: string;
  /**
   * Apoio ("Deixe em branco para valor variável") ou recusa ("Nome é
   * obrigatório"). É texto medido, nunca um cinza desabilitado (§1.4), e a
   * recusa troca a cor pelo `danger` além de marcar o campo.
   */
  note?: string;
  invalid?: boolean;
  /** Estreita o campo na barra de filtros, onde o espaço é orçado. */
  narrow?: boolean;
  children: ReactNode;
}

/**
 * Rótulo, controle e mensagem de um campo.
 *
 * O `<label>` embrulha o **controle**, e não o campo inteiro: sem id a
 * inventar, não há como um campo ficar sem rótulo por descuido, e o clique no
 * texto continua levando o foco para dentro. A mensagem fica de fora, apontada
 * por `aria-describedby` — dentro do rótulo ela viraria parte do **nome** do
 * controle, e o leitor de tela anunciaria "Valor (R$) Deixe em branco para
 * valor variável" como se fosse o nome do campo.
 */
export function Field({ label, note, invalid, narrow, children }: FieldProps) {
  const noteId = useId();

  const control =
    note && isValidElement(children)
      ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': noteId,
        })
      : children;

  return (
    <div className={`money-field${narrow ? ' money-field-narrow' : ''}`}>
      <label>
        <span>{label}</span>
        {control}
      </label>
      {note && (
        <span id={noteId} className="money-field-note" data-invalid={!!invalid}>
          {note}
        </span>
      )}
    </div>
  );
}

/**
 * O mesmo campo para um grupo de controles — o anexo, que é um botão, um nome
 * de arquivo e um "remover".
 *
 * Existe porque um `<label>` não pode embrulhar outro: o `FileUploadButton` já
 * é um, e aninhá-los faria o clique no rótulo "Comprovante" abrir o seletor de
 * arquivo. Aqui o nome do grupo é dado por `aria-labelledby`, que é o que
 * substitui o rótulo implícito quando não há um controle só para rotular.
 */
export function FieldGroup({ label, note, children }: Omit<FieldProps, 'invalid' | 'narrow'>) {
  const labelId = useId();
  const noteId = useId();

  return (
    <div className="money-field">
      <span id={labelId}>{label}</span>
      <div role="group" aria-labelledby={labelId} aria-describedby={note ? noteId : undefined}>
        {children}
      </div>
      {note && (
        <span id={noteId} className="money-field-note">
          {note}
        </span>
      )}
    </div>
  );
}

/**
 * Os três controles de texto da base. São finos de propósito — o que eles
 * carregam é a classe, e é ela que traz altura, borda e tipografia do tema.
 * O `ref` atravessa porque quem os usa é o `register` do react-hook-form.
 */
export function TextInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input className={`money-input ${className}`} {...props} />;
}

export function TextArea({
  className = '',
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return <textarea className={`money-textarea ${className}`} rows={rows} {...props} />;
}

export function SelectInput({
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return <select className={`money-select ${className}`} {...props} />;
}
