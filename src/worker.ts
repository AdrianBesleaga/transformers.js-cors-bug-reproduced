/**
 * v3 comparison test for https://github.com/huggingface/transformers.js/issues/1527
 *
 * Testing whether v3 works with COEP headers + same model/pipeline.
 * v3 did NOT set wasmPaths to CDN — it let ORT resolve WASM files
 * relative to the importing script (bundler output).
 */

import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

console.log('[Worker] v3 Config:');
console.log('  env:', JSON.stringify({
    allowLocalModels: env.allowLocalModels,
    useBrowserCache: env.useBrowserCache,
    // @ts-ignore v3 may not have backends
    backends: env.backends,
}));
console.log('  crossOriginIsolated:', self.crossOriginIsolated);

self.postMessage({
    type: 'config',
    version: env.version,
    // @ts-ignore
    wasmPaths: env.backends?.onnx?.wasm?.wasmPaths ?? 'not set (v3 default)',
    // @ts-ignore
    proxy: env.backends?.onnx?.wasm?.proxy ?? 'not set',
    crossOriginIsolated: self.crossOriginIsolated,
});

console.log('[Worker] Loading sentiment-analysis pipeline...');

try {
    const classifier = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'wasm' },
    );

    const result = await classifier('This is a test');
    console.log('[Worker] Result:', result);
    self.postMessage({ type: 'success', message: JSON.stringify(result) });
} catch (error: any) {
    console.error('[Worker] Error:', error);
    self.postMessage({ type: 'error', message: error.message || String(error) });
}
