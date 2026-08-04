import { createReadStream, existsSync, realpathSync, statSync } from 'fs';
import { app, net } from 'electron';
import { isAbsolute, resolve, sep } from 'path';
import { pathToFileURL } from 'url';
import mime from 'mime';

import logger from './logger';
import { getAllFolderStructures } from '@main/db/queries/folders';

const getApprovedRoots = async (): Promise<string[]> => {
  const roots = new Set<string>();

  try {
    const folders = await getAllFolderStructures();
    for (const folder of folders) {
      roots.add(folder.path);
      for (const sub of folder.subFolders) roots.add(sub.path);
    }
  } catch (error) {
    logger.error('Failed to read music folder roots for nora:// confinement', { error });
  }

  // Cached artwork and other app-generated assets live under userData.
  try {
    roots.add(app.getPath('userData'));
  } catch {
    // app.getPath can throw before the app is fully ready; ignore.
  }

  return [...roots];
};

export const handleFileProtocol = async (req: GlobalRequest) => {
  try {
    const { pathname } = new URL(req.url);
    const decodedPath = decodeURIComponent(pathname);
    const filePath =
      process.platform === 'darwin' ? decodedPath : decodedPath.replace(/^[/\\]{1,2}/gm, '');

    if (!isAbsolute(filePath)) {
      logger.warn('Rejected relative path in nora:// protocol', { url: req.url, filePath });
      return new Response('Forbidden', { status: 403 });
    }

    // Confine the request to approved roots. `realpathSync` resolves symlinks and
    // `..` segments, so the check below cannot be bypassed by a crafted path such
    // as `/music/../../etc/passwd`. `path.resolve` alone would strip the `..` and
    // hide the traversal from a naive string check.
    let realPath: string;
    try {
      realPath = realpathSync(filePath);
    } catch {
      logger.warn('File not found via nora:// protocol', { url: req.url, filePath });
      return new Response('File not found', { status: 404 });
    }

    const approvedRoots = await getApprovedRoots();
    // Normalize separators on both sides so the prefix check is separator-agnostic
    // (realpathSync returns OS-native separators; DB-stored roots may use a
    // different slash style). `resolve` also strips any trailing separator.
    const normalizedRealPath = resolve(realPath);
    const isAllowed = approvedRoots.some((root) => {
      // Canonicalize the approved root too, so a selected root that is a symlink
      // (e.g. /home/user/MusicLink -> /mnt/music) still authorizes files beneath
      // its real target. Skip roots that no longer exist on disk.
      let realRoot: string;
      try {
        realRoot = realpathSync(root);
      } catch {
        return false;
      }
      const normalizedRoot = resolve(realRoot);
      return (
        normalizedRealPath === normalizedRoot ||
        normalizedRealPath.startsWith(`${normalizedRoot}${sep}`)
      );
    });
    if (!isAllowed) {
      logger.warn('Rejected nora:// request outside approved roots', {
        url: req.url,
        realPath,
        approvedRoots
      });
      return new Response('Forbidden', { status: 403 });
    }

    if (!existsSync(realPath)) {
      logger.warn('File not found via nora:// protocol', { url: req.url, realPath });
      return new Response('File not found', { status: 404 });
    }

    const mimeType = mime.getType(realPath) || 'application/octet-stream';
    const stat = statSync(realPath);
    const fileSize = stat.size;
    const range = req.headers.get('range');
    logger.silly('Serving file from nora://', { url: req.url, range, realPath, mimeType });

    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    };

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new Response(null, {
          status: 416,
          headers: { ...headers, 'Content-Range': `bytes */${fileSize}` }
        });
      }

      const chunksize = end - start + 1;

      const fileStream = createReadStream(realPath, { start, end });

      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => {
            try {
              const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
              controller.enqueue(new Uint8Array(bufferChunk));
            } catch (error) {
              if (controller.desiredSize !== null) {
                controller.error(error);
              }
            }
          });

          fileStream.on('end', () => {
            try {
              controller.close();
            } catch {
              // Stream may already be closed
            }
          });

          fileStream.on('error', (error) => {
            try {
              controller.error(error);
            } catch {
              // Stream may already be closed
            }
          });
        },

        cancel() {
          fileStream.destroy();
        }
      });

      headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
      headers['Content-Length'] = chunksize.toString();

      return new Response(webStream, {
        status: 206,
        headers
      });
    } else {
      const asFileUrl = pathToFileURL(realPath).toString();
      const response = await net.fetch(asFileUrl);
      return response;
    }
  } catch (error) {
    logger.error('Error handling media protocol:', { error }, error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
