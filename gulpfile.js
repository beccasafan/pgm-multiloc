var browserify = require('browserify')
var buffer = require('vinyl-buffer')
var concat = require('gulp-concat')
var gulp = require('gulp')
var gutil = require('gutil')
var htmlmin = require('gulp-htmlmin')
var plumber = require('gulp-plumber')
var rename = require('gulp-rename')
var sass = require('gulp-sass')
var source = require('vinyl-source-stream')
var sourcemaps = require('gulp-sourcemaps')
var tsify = require('tsify')
var uglify = require('gulp-uglify')
var watchify = require('watchify')

var config = {
  'nodeModules': './node_modules/',
  'src': {
    'html': 'src/',
    'styles': {
      'app': 'src/styles/app/',
      'vendor': 'src/styles/vendor/'
    },
    'scripts': {
      'app': 'src/scripts/app/',
      'vendor': 'src/scripts/vendor/'
    }
  },
  'output': {
    'html': 'dist/',
    'styles': 'dist/styles/',
    'scripts': 'dist/scripts/'
  },
  'externalLibs': require('./package.json')['browserify-shim']
}

var onError = function (err) {
  gutil.log(err.message)
  this.emit('end')
}

gulp.task('styles/lib', function () {
  return gulp
    .src([`${config.src.styles.vendor}*.scss`])
    .pipe(plumber({ 'errorHandler': onError }))
    .pipe(sourcemaps.init())
    .pipe(sass({
      'includePaths': [`${config.nodeModules}foundation-sites/scss/`],
      'outputStyle': 'compressed',
      'errorHandler': onError
    }))
    .pipe(concat('vendor.css'))
    .pipe(rename({ 'suffix': '.min' }))
     .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(`${config.output.styles}`))
})
gulp.task('styles/lib-watch', ['styles/lib'], function () {
  gulp.watch(`${config.src.styles.vendor}*.scss`, [ 'styles/lib' ])
})

gulp.task('styles', function () {
  return gulp
    .src([`${config.src.styles.app}app.scss`])
    .pipe(plumber({ 'errorHandler': onError }))
    .pipe(sourcemaps.init())
    .pipe(sass({
      'includePaths': [`${config.src.styles.app}`],
      'outputStyle': 'compressed'
    }))
    .pipe(rename({ 'suffix': '.min' }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(`${config.output.styles}`))
})
gulp.task('styles-watch', ['styles'], function () {
  gulp.watch(`${config.src.styles.app}*.scss`, [ 'styles' ])
})

gulp.task('scripts/lib', function () {
  return buildLibScripts(false)
})
gulp.task('scripts/lib-watch', function () {
  return buildLibScripts(true)
})

function buildLibScripts (watch) {
  var b = browserify({
    basedir: __dirname,
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: watch
  })

  for (var lib in config.externalLibs) {
    b.require(lib, { 'expose': lib })
  }

  return buildScripts(b, 'vendor', watch)
}

gulp.task('scripts', function () {
  return buildAppScripts(false)
})
gulp.task('scripts-watch', function () {
  return buildAppScripts(true)
})

function buildAppScripts (watch) {
  var b = browserify({
    basedir: __dirname,
    debug: true,
    entries: [`${config.src.scripts.app}app.ts`],
    cache: {},
    packageCache: {},
    standalone: 'App',
    fullPaths: watch
  })
  for (var lib in config.externalLibs) {
    b.external(lib)
  }

  return buildScripts(b.plugin(tsify), 'app', watch)
}

function buildScripts (bundle, name, watch) {
  if (watch) {
    bundle = watchify(bundle)
  }

  function process () {
    bundle
      .transform('babelify', { 'presets': [ 'es2015' ] })
      .bundle()
      .on('error', onError)
      .on('log', gutil.log)
      .pipe(source(`${name}.js`))
      .pipe(buffer())
      .pipe(sourcemaps.init({ 'loadMaps': true }))
      .pipe(uglify())
      .pipe(rename({ 'suffix': '.min' }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(`${config.output.scripts}`))
  }

  bundle.on('update', process)
  return process()
}

gulp.task('html', function () {
  return gulp
    .src(`${config.src.html}index.html`)
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(`${config.output.html}`))
})

gulp.task('html-watch', ['html'], function () {
  gulp.watch(`${config.src.html}*.html`, [ 'html' ])
})

gulp.task('default', ['styles/lib', 'styles', 'scripts/lib', 'scripts', 'html'])
gulp.task('watch', ['styles/lib-watch', 'styles-watch', 'scripts/lib-watch', 'scripts-watch', 'html-watch'])
