const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

gulp.src([
    './babel_js/js/modules/variables.js',
    './babel_js/js/modules/getLocation.js',
    './babel_js/js/modules/fillInData.js',
    './babel_js/js/modules/ui.js',
    './babel_js/js/script.js'
])
    .pipe(uglify())
    .pipe(concat('script.js'))
    .pipe(gulp.dest('./static/'))