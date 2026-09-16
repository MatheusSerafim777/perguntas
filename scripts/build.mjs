import { build } from 'esbuild';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';
import { publicConfig } from './config.mjs';
try { loadEnvFile('.env'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const config = publicConfig(process.env);
await mkdir('dist', { recursive: true });
await Promise.all(['index.html', 'styles.css', 'favicon.svg'].map(name => copyFile(`public/${name}`, `dist/${name}`)));
await writeFile('dist/config.json', JSON.stringify(config));
await build({ entryPoints: ['public/app.js'], outfile: 'dist/app.js', bundle: true, format: 'esm', platform: 'browser', target: ['es2022'], minify: true });
console.log(config.url ? 'Build pronto com Supabase configurado.' : 'Build pronto em modo local. Configure o .env para ativar o Supabase.');
