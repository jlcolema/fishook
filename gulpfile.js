
/*-------------------------------------------
	Title
-------------------------------------------*/

// Notes...


var gulp = require('gulp');


/*-------------------------------------------
	Title
-------------------------------------------*/

// Notes...


var concat = require('gulp-concat');

var uglify = require('gulp-uglify');

// var rename = require('gulp-rename');

var sass = require('gulp-sass');

var autoprefixer = require('gulp-autoprefixer');

var imagemin = require('gulp-imagemin');

var cache = require('gulp-cache');

var notify = require('gulp-notify');

var livereload = require('gulp-livereload');


/*-------------------------------------------
	Title
-------------------------------------------*/

// Notes...


gulp.task('js', function() {

	return gulp.src([

		'src/js/jquery.js',
		'src/js/modernizr.js',
		'src/js/picturefill.js',
		'src/js/flexslider.js',
		'src/js/scroll.js',
		'src/js/functions.js'

	])

	.pipe(concat('scripts.js'))

	// .pipe(rename({suffix: '.min'}))

	.pipe(uglify())

	.pipe(gulp.dest('dist/public/assets/js'));

});


/*-------------------------------------------
	Title
-------------------------------------------*/

// Notes...


gulp.task('sass', function() {

	return gulp.src('src/scss/**/*.scss')

	.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))

	.pipe(autoprefixer({

		browsers: ['last 2 versions'],
		cascade: false

	}))

	.pipe(gulp.dest('dist/public/assets/css'))

	.pipe(livereload());

});


/*-------------------------------------------
	Title
-------------------------------------------*/

// Notes...


gulp.task('img', function() {

	return gulp.src('src/img/**/*')

	.pipe(imagemin({

		optimizationLevel: 5,
		progressive: true,
		interlaced: true

	}))

	.pipe(gulp.dest('dist/public/assets/img'));

});


/*-------------------------------------------
	Title
-------------------------------------------*/

// Notes...


gulp.task('fonts', function() {

	return gulp.src('src/fonts/**/*')

	.pipe(gulp.dest('dist/public/assets/fonts'));

});


/*-------------------------------------------
	Title
-------------------------------------------*/

// Notes...


gulp.task('watch', function() {

	livereload.listen();

	// Notes...

	gulp.watch('dist/public/system/user/templates/fishook/**/*.html').on('change', function(file) {

		livereload.changed(file.path);

	});

	// Notes...

	gulp.watch('src/js/*.js', ['js']);

	// Notes...

	gulp.watch('src/scss/**/*.scss', ['sass']);

	// Notes...

	gulp.watch('src/img/**/*', ['img']);

	// Notes...

	gulp.watch('src/fonts/**/*', ['fonts']);

});


/*-------------------------------------------
	Title
-------------------------------------------*/

// Notes...


gulp.task('default', ['js', 'sass', 'img', 'fonts', 'watch']);
