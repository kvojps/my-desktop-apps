import { InputAdornment, TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

/**
 * O campo em que uma medida se digita, nos três formulários da tela. Milímetro
 * é a unidade da digitação, e dizer isso é do campo, não de cada formulário —
 * é o que impede que um deles esqueça o adorno e passe a perguntar um número
 * sem unidade.
 */
export function MeasureField(props: Omit<TextFieldProps, 'slotProps'>) {
  return (
    <TextField
      required
      fullWidth
      inputMode="decimal"
      slotProps={{ input: { endAdornment: <InputAdornment position="end">mm</InputAdornment> } }}
      {...props}
    />
  );
}
