import { createReadStream, existsSync, statSync } from 'fs';
import logger from './logger';
import mime from 'mime';
import { net } from 'electron';
import { pathToFileURL } from 'url';

export const handleFileProtocol = async (req: GlobalRequest) => {
  try {
    const { pathname } = new URL(req.url);
    const decodedPath = decodeURI(pathname);
    const filePath =
      process.platform === 'darwin' ? decodedPath : decodedPath.replace(/^[/\\]{1,2}/gm, '');

    if (!existsSync(filePath)) {
      return new Response('File not found', { status: 404 });
    }

    const mimeType = mime.getType(filePath) || 'application/octet-stream';
    const stat = statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.get('range');
    logger.debug('Serving file from nora://', { url: req.url, range, filePath, mimeType });

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

      // Create a proper ReadableStream from the file stream
      const fileStream = createReadStream(filePath, { start, end });

      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => {
            try {
              // Ensure chunk is a Buffer before converting to Uint8Array
              const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
              controller.enqueue(new Uint8Array(bufferChunk));
            } catch (error) {
              // Stream might be closed, ignore the error
              if (controller.desiredSize !== null) {
                controller.error(error);
              }
            }
          });

          fileStream.on('end', () => {
            try {
              controller.close();
            } catch (error) {
              // Stream might already be closed, ignore the error
            }
          });

          fileStream.on('error', (error) => {
            try {
              controller.error(error);
            } catch (err) {
              // Stream might already be closed, ignore the error
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
      const asFileUrl = pathToFileURL(filePath).toString();
      const response = await net.fetch(asFileUrl);
      return response;
    }
  } catch (error) {
    logger.error('Error handling media protocol:', { error }, error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

