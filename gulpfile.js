const gulp = require('gulp');
const file_include = require('gulp-file-include');
const cache = require('gulp-cache');
const rename = require("gulp-rename");
const del = require('del');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const panini = require('panini');

// html
const htmlmin = require('gulp-htmlmin');

// style
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const csso = require('gulp-csso');
const tildeImporter = require('node-sass-tilde-importer');

// img, icons
const imagemin = require('gulp-imagemin');
const mozjpeg = require('imagemin-mozjpeg')
const pngquant = require('imagemin-pngquant');
const imageminWebp = require('imagemin-webp');
const webpHTML = require('gulp-webp-html');
const webpcss = require("gulp-webp-css");
const svgSprite = require('gulp-svg-sprite');

// fonts
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

// scripts
const uglify = require('gulp-uglify-es').default;

// debug
const debug = require('gulp-debug');

const lib_js = [ 
    'node_modules/jquery/dist/jquery.min.js',
];

function html() {
    panini.refresh();
    return gulp.src(['src/index.html', 'src/*.html'])
            // .pipe(file_include())
            .pipe(panini({
                root:       'src/',
                layouts:    'src/layouts/',
                partials:   'src/components/',
                helpers:    'src/helpers/',
                data:       'src/data/'
            }))
            // .pipe(webpHTML())
            .pipe(htmlmin({
                collapseWhitespace: true,
                removeComments: true
            }))
            .pipe(gulp.dest('dist'))
            .pipe(browserSync.stream());
}

function css() {
    return gulp.src('src/scss/main.scss')
            .pipe(sourcemaps.init())
            .pipe(sass({
                importer: tildeImporter
            })) // expanded - красивый с отступами; compressed - minify
            .pipe(gcmq())
            .pipe(webpcss())
            .pipe(csso())
            .pipe(autoprefixer({
                overrideBrowserslist: ['last 10 versions']
            }))
            .pipe(sourcemaps.write('./maps'))
            .pipe(gulp.dest('dist/css/'))
            .pipe(browserSync.stream());
}

function css_build() {
    return gulp.src('src/scss/main.scss')
            .pipe(sass()) // expanded - красивый с отступами; compressed - minify
            .pipe(gcmq())
            .pipe(csso())
            .pipe(autoprefixer({
                overrideBrowserslist: ['last 10 versions']
            }))
            .pipe(gulp.dest('dist/css/'))
            .pipe(browserSync.stream());
}

function images() {
    return gulp.src('src/img/**/*.+(png|jpg|jpeg|gif|svg)')
            .pipe(cache(
                imagemin(
                    [
                        pngquant({quality: [0.5, 0.7]}),
                        mozjpeg({quality: 70}),
                        imagemin.svgo()
                    ]
                ),
                {
                    name: 'images'
                }
            ))
            .pipe(gulp.dest('dist/img/'));
}

function images_to_webp() {
    return gulp.src('src/img/**/*.+(png|jpg|jpeg)')
            .pipe(cache(
                    imagemin(
                        [
                            imageminWebp({quality: 80}),
                        ]
                    ),
                    {
                        name: 'webp'
                    }
                )       
            )
            .pipe(rename({
                extname: '.webp',
            }))
            .pipe(gulp.dest('dist/img/'));
}

function spriteMono() {
    return gulp.src('src/icons/mono/**/*.svg')
            .pipe(svgSprite({
                mode: {
                    symbol:{
                        sprite: '../sprites/sprite-mono.svg'
                    },
                },
                shape: {
                    transform: [
                        {
                            svgo: {
                                plugins: [
                                   {
                                       removeAttrs: {
                                            attrs: ['class', 'data-name', 'fill.*', 'stroke.*']
                                       }
                                   } 
                                ],
                            }
                        }
                    ]
                }
            }))
            .pipe(gulp.dest('dist/img/'))
}

function spriteMulti() {
    return gulp.src('src/icons/multi/**/*.svg')
            .pipe(svgSprite({
                mode: {
                    symbol:{
                        sprite: '../sprites/sprite-multi.svg'
                    },
                },
                shape: {
                    transform: [
                        {
                            svgo: {
                                plugins: [
                                   {
                                        removeAttrs: {
                                            attrs: ['class', 'data-name'],
                                       }
                                   },
                                   {
                                        removeUselessStrokeAndFill: false,
                                   },
                                   {
                                        inlineStyles: true,
                                   },
                                ],
                            }
                        }
                    ]
                }
            }))
            .pipe(gulp.dest('dist/img/'))
}

function fonts() { // если будет нужен otf, использовать fonter для otf2ttf и кидать ttf в src
            gulp.src('src/fonts/**/*.ttf')
            .pipe(gulp.dest('dist/fonts/'));

            gulp.src('src/fonts/**/*.ttf')
            .pipe(cache(ttf2woff(), {name: 'woff'}))
            .pipe(gulp.dest('dist/fonts/'));

    return gulp.src('src/fonts/**/*.ttf')
            .pipe(cache(ttf2woff2(), {name: 'woff2'}))
            .pipe(gulp.dest('dist/fonts/'));
            
}

function scripts() {
     gulp.src('src/js/main.js')
        .pipe(cache(uglify(), {name: 'my js'}))
        .pipe(gulp.dest('dist/js/'))
        .pipe(browserSync.stream());

    return gulp.src(lib_js)
            .pipe(concat('lib.js'))
            .pipe(cache(uglify(), {name: 'lib js'}))
            .pipe(gulp.dest('dist/js/'));
}

function watch() {
    browserSync.init({
        server: {
            baseDir: "./dist/",
        },
        notify: false
    });

    gulp.watch('src/fonts/**/*', fonts);
    
    gulp.watch('src/icons/mono/**/*.svg', spriteMono);
    gulp.watch('src/icons/multi/**/*.svg', spriteMulti);

    gulp.watch('src/img/**/*.+(png|jpg|jpeg|gif|svg)', images);
    gulp.watch('src/img/**/*.+(png|jpg|jpeg)', images_to_webp);
    
    gulp.watch('src/js/**/*.js', scripts);


    gulp.watch('src/**/*.html', html);
    gulp.watch('src/scss/**/*.scss', css);
};

gulp.task('clean', function clean() {
    return del('dist');
})

gulp.task('cache:clear', function (callback) {
    return cache.clearAll(callback)
})

exports.build = gulp.series('clean', images, images_to_webp, spriteMono, spriteMulti, fonts, scripts, html, css_build);

exports.default = gulp.series('clean', images, images_to_webp, spriteMono, spriteMulti, fonts, scripts, html, css, watch);