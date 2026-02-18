import { defineConfig, type ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Cross-Origin Isolation plugin.
 *
 * Sets the headers required for SharedArrayBuffer, which ONNX Runtime
 * needs for multi-threaded WASM execution.
 *
 * This is the ROOT CAUSE of the CORS error: once COEP is set to
 * 'require-corp', ALL cross-origin sub-resources must carry a
 * Cross-Origin-Resource-Policy header — but CDN-served ORT files don't.
 */
function crossOriginIsolation() {
    return {
        name: 'cross-origin-isolation',
        configureServer(server: ViteDevServer) {
            server.middlewares.use((_req: IncomingMessage, res: ServerResponse, next: () => void) => {
                res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                next();
            });
        },
    };
}

export default defineConfig({
    plugins: [
        crossOriginIsolation(),
    ],
    server: {
        port: 5175,
    },
});
