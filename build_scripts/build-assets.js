const gulp = require('gulp');

gulp.src([
    './public/images/*.*'
])
    .pipe(gulp.dest('./static/'));