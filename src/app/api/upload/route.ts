import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { uploadFileToGithub } from '@/lib/github/upload-file-to-github';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx'] as const;
const TARGET_DIRECTORY = 'uploads/incoming/manual';

function hasAllowedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
}

function sanitizeBaseName(fileName: string): string {
  const stripped = fileName.replace(/\.[^/.]+$/, '');
  const safe = stripped.toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return safe.length > 0 ? safe : 'building_cases_upload';
}

function createUploadFileName(originalName: string): string {
  const extension = originalName.toLowerCase().endsWith('.xlsx') ? '.xlsx' : '.csv';
  const timestamp = formatTimestamp(new Date());
  const randomSuffix = randomUUID().slice(0, 8);
  const baseName = sanitizeBaseName(originalName);

  return `${timestamp}_${randomSuffix}_${baseName}${extension}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sharedSecret = formData.get('sharedSecret');
    const file = formData.get('file');

    if (typeof sharedSecret !== 'string' || sharedSecret.length === 0) {
      return NextResponse.json({ ok: false, error: 'Opplastingskode mangler.' }, { status: 400 });
    }

    if (sharedSecret !== process.env.UPLOAD_SHARED_SECRET) {
      return NextResponse.json({ ok: false, error: 'Ugyldig opplastingskode.' }, { status: 401 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Fil mangler.' }, { status: 400 });
    }

    if (!hasAllowedExtension(file.name)) {
      return NextResponse.json({ ok: false, error: 'Ugyldig filtype. Kun CSV/XLSX er tillatt.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: 'Filen er for stor. Maks 20MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const generatedName = createUploadFileName(file.name);
    const destinationPath = `${TARGET_DIRECTORY}/${generatedName}`;

    const result = await uploadFileToGithub({
      fileBuffer: buffer,
      filePath: destinationPath,
      commitMessage: `Upload weekly building case extract: ${generatedName}`,
    });

    return NextResponse.json({ ok: true, filePath: result.path }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ ok: false, error: 'Kunne ikke laste opp fil til GitHub.' }, { status: 500 });
  }
}

// TODO(steg-2): Valider forventede kolonner i opplastet fil før prosessering.
// TODO(steg-2): Normaliser data og sett "Ufordelt" ved manglende Avgj.kode.
// TODO(steg-2): Generer snapshots, metrics og latest-artefakter basert på opplastet fil.
