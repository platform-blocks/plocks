import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import MagicString from 'magic-string';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, posix, relative, resolve as resolvePath, sep } from 'path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const externalPackages = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
];

// Subpaths of external packages remain external too.
const external = (id) =>
  externalPackages.some((name) => id === name || id.startsWith(`${name}/`));

// ---------------------------------------------------------------------------
// Platform-specific files (foo.web.tsx, foo.native.ts, foo.ios.ts, foo.android.ts)
//
// These are resolved by the *consumer's* bundler — Metro for native, webpack /
// Vite / Metro-web with react-native-web for web — never here. resolve() below
// lists no platform extensions, so `./foo` always binds to foo.tsx at build
// time and web code can't leak into the native output (or vice versa). For the
// consumer's bundler to swap a variant in, the output has to:
//
//  1. contain every variant as its own module. Rollup only emits modules
//     reachable from an entry and nothing imports `foo.web.tsx` by name, so
//     each variant is added as an entry of the preserved build below;
//  2. import a module that has variants by an extensionless specifier
//     (`./foo`, not `./foo.js`): bundlers try platform extensions only when
//     the specifier has none. platformImports() rewrites those imports.
//     (Plain Node ESM can't resolve such a specifier; platform-split modules
//     are for bundlers, which is where platform variants mean anything.)
//
// Verified with a fixture (foo.ts + foo.web.ts imported as './foo'): both
// builds emit foo.js and foo.web.js, and importers reference './foo'.
// ---------------------------------------------------------------------------
const PLATFORM_FILE = /\.(web|native|ios|android)\.(tsx?|jsx?)$/;
const SKIP_DIRS = new Set(['__tests__', '__web_tests__', '__mocks__', '__test-utils__', 'demos', '__examples__']);

const findPlatformFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : findPlatformFiles(path);
    return PLATFORM_FILE.test(entry.name) && !entry.name.endsWith('.d.ts') ? [path] : [];
  });

const platformFiles = findPlatformFiles('src');

/** Output paths (relative to the build dir, no extension) of modules that have platform variants. */
const platformSplitModules = new Set(
  platformFiles.map((file) => relative('src', file).split(sep).join('/').replace(PLATFORM_FILE, ''))
);

// Rollup tree-shakes against the base implementation it bound `./foo` to, so a
// native stub that ignores its parameters (or returns a constant) gets its
// call sites rewritten — arguments dropped, results inlined — and the web
// variant the consumer's bundler swaps in later receives nothing. Keeping
// imports of platform-split modules external stops that cross-module
// analysis; each base module is an entry of its own so it is still emitted.
const platformBaseFiles = [...platformSplitModules].flatMap((base) =>
  ['.tsx', '.ts', '.jsx', '.js'].map((ext) => join('src', `${base}${ext}`)).filter((file) => existsSync(file))
);

function platformExternals() {
  const srcRoot = resolvePath('src');
  return {
    name: 'platform-externals',
    async resolveId(source, importer, options) {
      if (!importer || !source.startsWith('.')) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved || resolved.external) return null;
      const target = relative(srcRoot, resolved.id).split(sep).join('/').replace(/\.(tsx?|jsx?)$/, '');
      if (!platformSplitModules.has(target)) return null;
      return { id: join(srcRoot, target), external: 'relative' };
    },
  };
}

function platformImports() {
  const RELATIVE_JS_SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)(['"])(\.{1,2}\/[^'"]+?)\.js\2/g;
  return {
    name: 'platform-imports',
    renderChunk(code, chunk) {
      if (platformSplitModules.size === 0) return null;
      const fromDir = posix.dirname(chunk.fileName);
      const magic = new MagicString(code);
      let changed = false;
      for (const match of code.matchAll(RELATIVE_JS_SPECIFIER)) {
        const [, lead, quote, specifier] = match;
        const target = posix.normalize(posix.join(fromDir, specifier));
        if (!platformSplitModules.has(target)) continue;
        const start = match.index + lead.length;
        magic.overwrite(start, start + match[0].length - lead.length, `${quote}${specifier}${quote}`);
        changed = true;
      }
      return changed ? { code: magic.toString(), map: magic.generateMap({ hires: true }) } : null;
    },
  };
}

const commonConfig = {
  external,
  plugins: [
    peerDepsExternal(),
    resolve({
      preferBuiltins: false,
      browser: true,
      // No `.web.*` / `.native.*` here — see "Platform-specific files" above.
      extensions: ['.tsx', '.ts', '.js', '.json'],
    }),
    commonjs({
      include: ['node_modules/**'],
    }),
    json(),
  ],
};

// Same build as @plocks/ui (see packages/ui/rollup.config.js): the source module
// graph is preserved and platform variants stay swappable by the consumer's bundler.
const preserved = { preserveModules: true, preserveModulesRoot: 'src' };

const mainInputs = ['src/index.ts', ...platformFiles, ...platformBaseFiles];

// No source maps: the source files are not part of the published package.
export default {
  ...commonConfig,
  input: mainInputs,
  output: {
    dir: './lib/esm',
    ...preserved,
    format: 'esm',
    sourcemap: false,
  },
  plugins: [
    platformExternals(),
    ...commonConfig.plugins,
    typescript({
      tsconfig: './tsconfig.esm.json',
      declaration: false,
      declarationMap: false,
      jsx: 'react-jsx',
      outDir: './lib/esm',
      rootDir: './src',
    }),
    platformImports(),
  ],
};
