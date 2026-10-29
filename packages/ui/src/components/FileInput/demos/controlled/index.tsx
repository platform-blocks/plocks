import { useState } from 'react';
import { Button, Column, FileInput, type FileInputFile } from '@plocks/ui';

export function Demo() {
  const [files, setFiles] = useState<FileInputFile[]>([]);

  return (
    <Column gap="sm" fullWidth>
      <FileInput label="Attachments" multiple maxFiles={3} value={files} onChange={setFiles} fullWidth />
      <Button variant="outline" disabled={files.length === 0} onPress={() => setFiles([])}>
        Remove all
      </Button>
    </Column>
  );
}
