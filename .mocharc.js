module.exports = {
  // spec: [
  //   'src/**/*.{test,spec}.js',
  //   'test/**/*.{test,spec}.js'
  // ],
  extension: ['js'],
  recursive: false,
  require: 'esm',
  parallel: true,
  ui: 'bdd',
  color: true,
  reporter: 'spec',
  'inline-diffs': true,
  'check-leaks': false
};