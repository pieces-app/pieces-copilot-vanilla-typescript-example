const esbuild = require('esbuild');

const prod = process.argv[2] === 'production';

const configs = [
  {
    target: 'chrome114',
    entryPoints: ['./src/index.ts'],
    outfile: './dist/index.js',
    logLevel: 'info',
    treeShaking: true,
    bundle: true,
    platform: 'browser',
    sourcemap: prod ? false : 'inline',
    loader: {
      '.ts': 'ts',
    },
    resolveExtensions: ['.ts', '.js'],
    minify: prod,
  },
];

(async () => {
  let i = 0;
  for (const config of configs) {
    const context = await esbuild.context(config);
    if (prod) {
      await context.rebuild();
      i++;
      if (i == 2) process.exit(0);
    } else {
      await context.watch();
    }
  }
})();