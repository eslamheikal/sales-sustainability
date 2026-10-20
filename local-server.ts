import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/ping', (_req, res) => {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
});

type ApiHandler = (req: Request, res: Response) => void | Promise<void>;
const handlerCache = new Map<string, ApiHandler>();

function getHandler(modulePath: string, file: string): ApiHandler {
  if (handlerCache.has(modulePath)) {
    return handlerCache.get(modulePath)!;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const handler = require(modulePath).default as ApiHandler | undefined;
  if (typeof handler !== 'function') {
    throw new Error(`No default export found in ${file}`);
  }

  handlerCache.set(modulePath, handler);
  return handler;
}

function runHandler(handler: ApiHandler, req: Request, res: Response): void {
  Promise.resolve(handler(req, res)).catch((error) => {
    console.error(`Unhandled API error for ${req.path}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}

const apiDirectory = path.join(__dirname, 'api');

if (fs.existsSync(apiDirectory)) {
  const routeFiles = fs
    .readdirSync(apiDirectory)
    .filter((file) => file.endsWith('.ts') && file !== 'product.ts');

  for (const file of routeFiles) {
    const routeName = file.replace('.ts', '');
    const routePath = `/api/${routeName}`;
    const modulePath = path.join(apiDirectory, file);

    app.all(routePath, (req, res) => {
      try {
        const handler = getHandler(modulePath, file);
        runHandler(handler, req, res);
      } catch (error) {
        console.error(`Error loading handler for ${routePath}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    console.log(`✔️  Mapped route ${routePath} to ${file}`);
  }

  const productModulePath = path.join(apiDirectory, 'product.ts');
  if (fs.existsSync(productModulePath)) {
    app.get('/api/product/:id', (req, res) => {
      try {
        const handler = getHandler(productModulePath, 'product.ts');
        runHandler(handler, req, res);
      } catch (error) {
        console.error('Error loading handler for /api/product/:id:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    console.log('✔️  Mapped route /api/product/:id to product.ts');
  }
} else {
  console.warn('⚠️  `api` directory not found. No API routes loaded.');
}

app.listen(PORT, () => {
  console.log(`\n🚀 Local Express server is running at http://localhost:${PORT}`);
}).on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Stop the other API process and run npm run start:api again.`);
  } else {
    console.error('\n❌ Failed to start API server:', error.message);
  }
  process.exit(1);
});
