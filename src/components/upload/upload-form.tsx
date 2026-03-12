'use client';

import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from 'react';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

type ApiSuccessResponse = {
  ok: true;
  filePath: string;
};

type ApiErrorResponse = {
  ok: false;
  error: string;
};

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx'] as const;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function isAcceptedFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [sharedSecret, setSharedSecret] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState('');

  const canUpload = useMemo(() => {
    return Boolean(file) && sharedSecret.trim().length > 0 && status !== 'uploading';
  }, [file, sharedSecret, status]);

  function validateFile(nextFile: File): string | null {
    if (!isAcceptedFile(nextFile)) {
      return 'Kun CSV- og XLSX-filer støttes.';
    }

    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      return 'Filen er for stor. Maks filstørrelse er 20MB.';
    }

    return null;
  }

  function applySelectedFile(nextFile: File | null) {
    if (!nextFile) {
      setFile(null);
      return;
    }

    const validationError = validateFile(nextFile);
    if (validationError) {
      setFile(null);
      setStatus('error');
      setMessage(validationError);
      return;
    }

    setFile(nextFile);
    setStatus('idle');
    setMessage('');
  }

  function onFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    applySelectedFile(nextFile);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const nextFile = event.dataTransfer.files?.[0] ?? null;
    applySelectedFile(nextFile);
  }

  function onDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus('error');
      setMessage('Velg en fil før du laster opp.');
      return;
    }

    setStatus('uploading');
    setMessage('Laster opp fil...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sharedSecret', sharedSecret);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as ApiSuccessResponse | ApiErrorResponse;

      if (!response.ok || !result.ok) {
        setStatus('error');
        setMessage(result.ok ? 'Opplasting feilet.' : result.error);
        return;
      }

      setStatus('success');
      setMessage('Fil lastet opp. Prosessering starter automatisk.');
      setFile(null);
    } catch (_error) {
      setStatus('error');
      setMessage('Kunne ikke fullføre opplasting. Prøv igjen.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Last opp ukentlig byggesaksuttrekk</h1>
        <p className="mt-1 text-sm text-slate-600">Last opp CSV eller XLSX (maks 20MB) og angi delt opplastingskode.</p>
      </div>

      <label
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
      >
        <span className="text-sm font-medium text-slate-700">Dra fil hit, eller klikk for å velge fil</span>
        <span className="mt-1 text-xs text-slate-500">Støtter .csv og .xlsx</span>
        <input
          type="file"
          accept=".csv,.xlsx"
          className="sr-only"
          onChange={onFileInputChange}
          disabled={status === 'uploading'}
        />
      </label>

      {file ? (
        <p className="text-sm text-slate-700">
          Valgt fil: <span className="font-medium">{file.name}</span>
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="sharedSecret" className="block text-sm font-medium text-slate-700">
          Delt opplastingskode
        </label>
        <input
          id="sharedSecret"
          type="password"
          autoComplete="off"
          value={sharedSecret}
          onChange={(event) => setSharedSecret(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600 transition focus:ring-2"
          placeholder="Skriv inn kode"
          disabled={status === 'uploading'}
        />
      </div>

      <button
        type="submit"
        disabled={!canUpload}
        className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'uploading' ? 'Laster opp...' : 'Last opp fil'}
      </button>

      <p
        className={[
          'min-h-6 text-sm',
          status === 'error' ? 'text-red-700' : '',
          status === 'success' ? 'text-emerald-700' : '',
          status === 'uploading' ? 'text-slate-700' : '',
        ].join(' ')}
        role="status"
      >
        {message}
      </p>
    </form>
  );
}
