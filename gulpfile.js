'use strict';

var gulp = require('gulp');
var gulpIf = require('gulp-if');
var browserSync = require('browser-sync');
var size = require('gulp-size');

var reload = browserSync.reload;

gulp.task('jshint', function() {
  var jshint = require('gulp-jshint');

  return gulp.src('source/scripts/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(gulpIf(!browserSync.active, jshint.reporter('fail')));
});

gulp.task('images', function() {
  var cache = require('gulp-cache');
  var imagemin = require('gulp-imagemin');

  return gulp.src('source/images/**/*')
    .pipe(cache(imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('build/images'))
    .pipe(size({title: 'images'}));
});

gulp.task('styles', function() {
  var autoprefixer = require('gulp-autoprefixer');
  var csso = require('gulp-csso');
  var sass = require('gulp-ruby-sass');
  var sourcemaps = require('gulp-sourcemaps');

  return sass('source/styles/', {
      loadPath: 'bower_components',
      sourcemap: true
    })
    .on('error', console.error.bind(console))
    .pipe(autoprefixer({
      browsers: ['last 2 versions', 'IE 9'],
      cascade: false
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(gulpIf('*.css', csso()))
    .pipe(gulp.dest('build/styles'))
    .pipe(size({title: 'styles'}));
});

gulp.task('templates', function() {
  var fs = require('fs');
  var nunjucksRender = require('gulp-nunjucks-render');

  var data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

  nunjucksRender.nunjucks.configure(['source/']);

  return gulp.src('source/index.html')
    .pipe(nunjucksRender(data))
    .pipe(gulp.dest('.tmp'));
});

gulp.task('pym', function() {
  var rename = require('gulp-rename');
  var uglify = require('gulp-uglify');

  return gulp.src('bower_components/pym.js/src/pym.js')
    .pipe(rename('pym.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('build/scripts/libs/'));
});

gulp.task('html', ['templates'], function() {
  var csso = require('gulp-csso');
  var uglify = require('gulp-uglify');
  var uncss = require('gulp-uncss');
  var useref = require('gulp-useref');

  var assets = useref.assets({searchPath: '{.tmp,source}'});

  return gulp.src('.tmp/**/*.html')
    .pipe(assets)
    .pipe(gulpIf('*.js', uglify({preserveComments: 'some'})))
    .pipe(gulpIf('*.css', uncss({
      html: '.tmp/index.html'
    })))
    .pipe(gulpIf('*.css', csso()))
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(gulp.dest('build'))
    .pipe(size({title: 'html'}));
});

gulp.task('clean', function() {
  var del = require('del');

  del(['.tmp', 'build/*', '!build/.git']);
});

gulp.task('serve', ['styles', 'templates'], function() {
  browserSync({
    notify: false,
    logPrefix: 'NEWSAPPS',
    open: false,
    server: {
      baseDir: ['.tmp', 'source'],
      routes: {
        '/bower_components': './bower_components'
      }
    }
  });

  gulp.watch(['source/**/*.html'], ['html', reload]);
  gulp.watch(['data.json'], ['html', reload]);
  gulp.watch(['source/styles/**/*.scss'], ['styles', reload]);
  gulp.watch(['source/scripts/**/*.js'], ['jshint']);
  gulp.watch(['source/images/**/*'], reload);
});

gulp.task('serve:build', ['default'], function() {
  browserSync({
    notify: false,
    logPrefix: 'NEWSAPPS',
    open: true,
    server: ['build']
  });
});

gulp.task('default', ['clean'], function(cb) {
  var runSequence = require('run-sequence');

  runSequence('styles', ['html', 'images', 'pym'], cb);
});

gulp.task('build', ['default']);
