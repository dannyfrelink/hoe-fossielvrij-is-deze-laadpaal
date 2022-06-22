const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

gulp.src([
    './public/js/modules/variables.js',
    './public/js/modules/getLocation.js',
    './public/js/modules/fillInData.js',
    './public/js/modules/ui.js',
    './public/js/script.js'
])
    .pipe(uglify())
    .pipe(concat('script.js'))
    .pipe(gulp.dest('./static/'))