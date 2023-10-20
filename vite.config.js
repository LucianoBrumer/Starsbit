import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src',
    build: {
        minify: 'terser',
        outDir: '../public',
    },
});