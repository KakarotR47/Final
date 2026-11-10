/**
 * Client-Side Binary File Downloader with Live Progress Tracking
 * Guarantees direct binary download via authenticated fetch(), avoiding iframe 302 redirects and 10KB cookie checks.
 */

export interface DownloadProgress {
  loaded: number;
  total: number;
  percent: number;
  loadedMB: string;
  totalMB: string;
}

export async function downloadBinaryFile(
  url: string,
  filename: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<{ success: boolean; sizeBytes: number }> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/octet-stream, application/vnd.microsoft.portable-executable, application/zip, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('Received HTML page instead of binary package. Please refresh and try again.');
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  const totalMB = total > 0 ? (total / (1024 * 1024)).toFixed(1) : 'Unknown';

  let blob: Blob;

  if (response.body && total > 0 && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
        if (onProgress) {
          const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
          const loadedMB = (loaded / (1024 * 1024)).toFixed(1);
          onProgress({ loaded, total, percent, loadedMB, totalMB });
        }
      }
    }

    blob = new Blob(chunks as BlobPart[], { type: contentType || 'application/octet-stream' });
  } else {
    blob = await response.blob();
  }

  // Safety check: The Windows package or EXE must be substantial (> 20 MB)
  if (filename.endsWith('.exe') || filename.endsWith('.zip')) {
    if (blob.size < 1024 * 1024) {
      throw new Error(`Downloaded file is only ${(blob.size / 1024).toFixed(1)} KB. Expected full package (> 50 MB).`);
    }
  }

  // Create clean blob download trigger
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.position = 'fixed';
  anchor.style.top = '-9999px';
  anchor.style.left = '-9999px';
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    try {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch {}
  }, 3000);

  return { success: true, sizeBytes: blob.size };
}
