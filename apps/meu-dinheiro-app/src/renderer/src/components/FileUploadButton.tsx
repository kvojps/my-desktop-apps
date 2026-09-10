import { Button } from '@mui/material';
import { ReactNode } from 'react';

interface FileUploadButtonProps {
  label: ReactNode;
  accept?: string;
  disabled?: boolean;
  startIcon?: ReactNode;
  onFileSelected: (file: File) => void;
}

export function FileUploadButton({
  label,
  accept,
  disabled,
  startIcon,
  onFileSelected,
}: FileUploadButtonProps) {
  return (
    <Button variant="outlined" component="label" disabled={disabled} startIcon={startIcon}>
      {label}
      <input
        type="file"
        hidden
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = '';
        }}
      />
    </Button>
  );
}
