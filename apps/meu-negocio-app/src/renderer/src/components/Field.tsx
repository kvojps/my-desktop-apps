import type {
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cloneElement, isValidElement, useId } from 'react';

interface FieldProps {
  label: string;
  note?: string;
  invalid?: boolean;
  children: ReactNode;
}
export function Field({ label, note, invalid, children }: FieldProps) {
  const noteId = useId();
  const control =
    note && isValidElement(children)
      ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': noteId,
        })
      : children;
  return (
    <div className="negocio-field">
      <label>
        <span>{label}</span>
        {control}
      </label>
      {note && (
        <span id={noteId} className="negocio-field-note" data-invalid={invalid}>
          {note}
        </span>
      )}
    </div>
  );
}
export function TextInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input className={`negocio-input ${className}`} {...props} />;
}
export function TextArea({
  className = '',
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return <textarea className={`negocio-textarea ${className}`} rows={rows} {...props} />;
}
export function SelectInput({
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return <select className={`negocio-select ${className}`} {...props} />;
}
