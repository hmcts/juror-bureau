;(function(){
  'use strict';
  var path = require('path');
  var config = {
      EXPRESS_PORT: 3000,
    }
    , sass = require('sass');

  module.exports = function(grunt){

    // Using jit-grunt means that we don't need to use  grunt.loadNpmTask
    require('jit-grunt')(grunt, {
      'scsslint': 'grunt-scss-lint',
      'express': 'grunt-express-server',
      'istanbul_check_coverage': 'grunt-mocha-istanbul',
      'protractor': 'grunt-protractor-runner',
    });

    // Output the build times after tasks have run
    require('time-grunt')(grunt);

    grunt.initConfig({

      config: config,

      // Empties folders to start fresh
      clean: {
        all: {
          files: [{
            dot: true,
            src: ['coverage/']
          }]
        },
        accessibility: {
          files: [{
            dot: true,
            src: ['reports/accessibility']
          }]
        },
        dev: {
          files: [{
            dot: true,
            src: ['tmp/']
          }]
        },
        dist: {
          files: [{
            dot: true,
            src: ['dist/']
          }]
        },
      },

      // Templates
      sync: {
        dist: {
          files: [
            {expand: true, src: ['client/**/*.html', 'client/**/*.njk'], dest: 'dist'},
            {expand: true, src: ['server/**/*.js'], dest: 'dist'},
            {expand: true, src: ['sessions/'], dest: 'dist'},
            {expand: true, src: ['package.json', 'Dockerfile', 'bureau-portal-run.sh', 'runDockerContainer.sh', 'stopDockerContainer.sh'], dest: 'dist'},
            {expand: true, cwd: 'client/js/', src: [
              'jquery.min.js',
              'html5shiv.min.js',
              'respond.min.js',
              'svgxuse.min.js',
              'ds-datepicker.js',
              'show-hide-content.js',
              'attendance.js',
              'deferral-maintenance.js',
              'dismiss-jurors.js',
              'pool-overview.js',
              'uncomplete-service.js',
              'document-letters.js',
              'messaging-juror-select.js',
              'expenses-summary.js',
              'certificate-of-exemption-list.js',
            ], dest: 'dist/client/js'},
            {expand: true, cwd: 'client/js/i18n/cy/', src: ['PDF.json'], dest: 'dist/client/js/i18n/cy/' },
            {expand: true, cwd: 'client/js/i18n/en/', src: ['PDF.json'], dest: 'dist/client/js/i18n/en/' },

            {expand: true, cwd: 'client/assets/fonts/', src: ['boldFont.ttf', 'lightFont.ttf', 'OpenSans-Regular.ttf', 'OpenSans-Bold.ttf'], dest: 'dist/client/assets/fonts' },

            {expand: true, cwd: 'node_modules/chart.js/dist', src: ['*.js'], dest: 'dist/client/js/chart.js'},
            {expand: true, cwd: 'node_modules/chart.js/dist', src: ['*.css'], dest: 'dist/client/css'},

            {expand: true, cwd: 'node_modules/govuk-frontend/govuk/', src: ['all.js', 'all.js.map'], dest: 'dist/client/js/govuk'},
            {expand: true, cwd: 'node_modules/@ministryofjustice/frontend/moj/', src: ['all.js'], dest: 'dist/client/js/moj'},

            {expand: true, cwd: 'node_modules/accessible-autocomplete/dist/', src: ['accessible-autocomplete.min.js'], dest: 'dist/client/js'},
            {expand: true, cwd: 'node_modules/accessible-autocomplete/dist/', src: ['accessible-autocomplete.min.js.map'], dest: 'dist/client/js'},
            {expand: true, cwd: 'node_modules/accessible-autocomplete/dist/', src: ['accessible-autocomplete.min.css'], dest: 'dist/client/css'},

            {expand: true, cwd: 'config/', src: ['*.*'], dest: 'dist/config'}
          ]
        },
        dev: {
          files: [
            {expand: true, src: ['client/**/*.html', 'client/**/*.njk'], dest: 'tmp'},
            {expand: true, src: ['server/**/*.js'], dest: 'tmp'},
            {expand: true, src: ['sessions/'], dest: 'tmp'},
            {expand: true, src: ['package.json', 'Dockerfile', 'bureau-portal-run.sh', 'runDockerContainer.sh', 'stopDockerContainer.sh'], dest: 'tmp'},
            {expand: true, cwd: 'client/js/', src: [
              'jquery.min.js',
              'html5shiv.min.js',
              'respond.min.js',
              'svgxuse.min.js',
              'ds-datepicker.js',
              'show-hide-content.js',
              'attendance.js',
              'deferral-maintenance.js',
              'dismiss-jurors.js',
              'pool-overview.js',
              'uncomplete-service.js',
              'document-letters.js',
              'messaging-juror-select.js',
              'expenses-summary.js',
              'certificate-of-exemption-list.js',
            ], dest: 'tmp/client/js'},
            {expand: true, cwd: 'client/js/i18n/cy/', src: ['PDF.json'], dest: 'tmp/client/js/i18n/cy/' },
            {expand: true, cwd: 'client/js/i18n/en/', src: ['PDF.json'], dest: 'tmp/client/js/i18n/en/' },

            {expand: true, cwd: 'client/assets/fonts/', src: ['boldFont.ttf', 'lightFont.ttf', 'OpenSans-Regular.ttf', 'OpenSans-Bold.ttf'], dest: 'tmp/client/assets/fonts' },

            {expand: true, cwd: 'node_modules/chart.js/dist', src: ['*.js'], dest: 'tmp/client/js/chart.js'},
            {expand: true, cwd: 'node_modules/chart.js/dist', src: ['*.css'], dest: 'tmp/client/css'},

            {expand: true, cwd: 'node_modules/govuk-frontend/govuk/', src: ['all.js', 'all.js.map'], dest: 'tmp/client/js/govuk'},
            {expand: true, cwd: 'node_modules/@ministryofjustice/frontend/moj/', src: ['all.js'], dest: 'tmp/client/js/moj'},

            {expand: true, cwd: 'node_modules/accessible-autocomplete/dist/', src: ['accessible-autocomplete.min.js'], dest: 'tmp/client/js'},
            {expand: true, cwd: 'node_modules/accessible-autocomplete/dist/', src: ['accessible-autocomplete.min.js.map'], dest: 'tmp/client/js'},
            {expand: true, cwd: 'node_modules/accessible-autocomplete/dist/', src: ['accessible-autocomplete.min.css'], dest: 'tmp/client/css'},

            {expand: true, cwd: 'config/', src: ['*.*'], dest: 'tmp/config'}
          ]
        },
      },


      accessibility: {
        options: {
          accessibilityLevel: 'WCAG2A',
          reportType: 'json',
          reportLocation: 'reports/accessibility',
          reportLevels: {
            notice: false,
            warning: true,
            error: true
          },
          force: true
        },
        all: {
          options: {
            urls: [
              'http://localhost:'+(process.env.PORT || config.EXPRESS_PORT),
              'http://localhost:'+(process.env.PORT || config.EXPRESS_PORT) + '/inbox',
              'http://localhost:'+(process.env.PORT || config.EXPRESS_PORT) + '/refresh',
              'http://localhost:'+(process.env.PORT || config.EXPRESS_PORT) + '/pending',
              'http://localhost:'+(process.env.PORT || config.EXPRESS_PORT) + '/completed',
              'http://localhost:'+(process.env.PORT || config.EXPRESS_PORT) + '/response/1'
            ]
          }
        }
      },


      // Styles
      scsslint: {
        allFiles: [ 'client/scss/**/*.scss' ],
        options: {
          config: '.scss-lint.yml',
          quiet: true
        }
      },

      sass: {
        options: {
          includePaths: [
            'node_modules/@scottish-government'
          ],
          implementation: sass,
        },
        dist: {
          options: { sourceMaps: false },
          files: {
            'client/css/style.css': 'client/scss/main.scss',
            'client/css/report-print.css': 'client/scss/report-print.scss',
          }
        },
        dev: {
          options: { sourceMaps: true },
          files: {
            'client/css/style.css': 'client/scss/main.scss',
            'client/css/report-print.css': 'client/scss/report-print.scss',
          }
        },
      },

      autoprefixer: {
        options: {
          browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1'] // Default.
        },
        all: {
          src: 'client/css/style.css'
        }
      },

      cssmin: {
        options: {
          shorthandCompacting: false,
          roundingPrecision: -1
        },
        dist: {
          files: [
            {expand: true, cwd: 'client/css', src: ['*.css', '!*.min.css'], dest: 'dist/client/css', ext: '.css'},
          ],
          options: {sourceMap: false}
        },
        dev: {
          files: [
            {expand: true, cwd: 'client/css', src: ['*.css', '!*.min.css'], dest: 'tmp/client/css', ext: '.css'}
          ],
          options: {sourceMap: true}
        },
      },


      // Scripts
      eslint: {
        options: {
          quiet: true
        },
        ignorePath: path.resolve(__dirname, '.eslintignore'),
        default: ['client/**/*.js', 'server/**/*.js']
      },

      browserify: {
        default: {
          files: {
            'client/js/bundle.js': ['./client/js/main.js']
          }
        }
      },

      uglify: {
        dist: {
          files: {
            'dist/client/js/bundle.js': ['client/js/bundle.js']
          },
          option: {sourceMap: false}
        },
        dev: {
          files: {
            'tmp/client/js/bundle.js': ['client/js/bundle.js']
          },
          option: {sourceMap: false}
        },
      },


      // Check code against SonarQube
      sonarRunner: {
      	analysis: {
      		options: {
      			debug: true,
      			separator: '\n',
      			dryRun: false,
            projectHome: './',
      			sonar: {}
      		}
      	}
      },


      // Images
      imagemin: {
        dist: {
          files: [
            { expand: true, cwd: 'client/assets/images/', src: '**/*.{png,jpg,jpeg,gif,svg}', dest: 'dist/client/assets/images' },
            { expand: true, cwd: 'node_modules/govuk-frontend/govuk/assets/images/', src: ['**/**.*'], dest: 'dist/client/assets/images' },
            { expand: true, cwd: 'node_modules/@ministryofjustice/frontend/moj/assets/images/', src: ['icon-arrow*.*'], dest: 'dist/client/assets/images' },
            { expand: true, cwd: 'node_modules/@scottish-government/pattern-library/dist/images/icons/', src: ['**/**.*'], dest: 'dist/client/assets/images/icons' }
          ]
        },
        dev: {
          files: [
            { expand: true, cwd: 'client/assets/images/', src: '**/*.{png,jpg,jpeg,gif,svg}', dest: 'tmp/client/assets/images' },
            { expand: true, cwd: 'node_modules/govuk-frontend/govuk/assets/images/', src: ['**/**.*'], dest: 'tmp/client/assets/images' },
            { expand: true, cwd: 'node_modules/@ministryofjustice/frontend/moj/assets/images/', src: ['icon-arrow*.*'], dest: 'tmp/client/assets/images' },
            { expand: true, cwd: 'node_modules/@scottish-government/pattern-library/dist/images/icons/', src: ['**/**.*'], dest: 'tmp/client/assets/images/icons' }
          ]
        },
      },

      // Run server
      express: {
        options: {
          port: process.env.PORT || config.EXPRESS_PORT
        },
        dev: {
          options: {
            script: './tmp/server/index.js',
            node_env: 'development'
          }
        },
        dist: {
          options: {
            script: './dist/server/index.js',
            node_env: 'production',
            USE_AUTH: false,
            background: false
          }
        },
        jenkins: {
          options: {
            script: './test/server/index.js',
            node_env: 'test',
            debug: 5858
          }
        }
      },


      // Reload express when changes made
      nodemon: {
        dev: {
          script: 'tmp/server/index.js',
          options: {
            watch: ['tmp/server/'],
            delay: 1000,
          }
        }
      },


      // Watch
      watch: {
        sync: {
          files: ['client/**/*.html', 'client/**/*.njk', 'server/**/*.js'],
          tasks: ['build-files:dev'],
          options: {
            spawn: false
          }
        },
        styles: {
          files: ['client/scss/**/*.scss'],
          tasks: ['build-styles:dev'],
          options: {
            spawn: false
          }
        },
        images: {
          files: ['client/img/**/*.{png,jpg,jpeg,gif,svg}'],
          tasks: ['build-images:dev'],
          options: {
            spawn: false
          }
        },
        scripts: {
          files: ['client/**/*.js'],
          tasks: ['build-scripts:dev'],
          options: {
            spawn: false
          }
        },
      },


      // Use concurrent to run nodemon and watch at same time
      // Concurrent tasks
      concurrent: {
        dev: ['nodemon', 'watch'],
        test: ['express:test'],
        options: { logConcurrentOutput: true }
      },

      env: {
        test: { NODE_ENV: 'test' },
        dev: { NODE_ENV: 'development' },
        prod: { NODE_ENV: 'production' }
      },

      // Documentation
      jsdoc : {
        dist : {
          src: ['client/**/*.js', 'server/**/*.js'],
          options: {
            destination: 'reports/documentation',
            template: 'node_modules/docdash',
            readme: 'README.md'
          }
        }
      },

      // Security Scan
      nsp: {
        package: grunt.file.readJSON('package.json')
      }

    });




    // Maintain code quality from command line
    grunt.registerTask('code-lint', ['scsslint', 'eslint']);

    // Maintain accessibility standards
    grunt.registerTask('accessibility-check', 'Remove old reports and run accessibility checks generating a report. Will start server itself so either run as single task or with PORT environment variable set', function() {
      return grunt.task.run([
        'serve:jenkins',
        'clean:accessibility',
        'accessibility'
      ]);
    });


    // Package app

    grunt.registerTask('build-files', 'Copy application files to output folder using either; :dev or :dist', function(env) {
      //return grunt.task.run(['sync:govuk', 'sync:'+env]);
      return grunt.task.run(['sync:'+env]);
    });


    grunt.registerTask('build-styles', 'Compile SASS to output folder using either; :dev or :dist', function(env) {
      return grunt.task.run(['sass', 'autoprefixer', 'cssmin:'+env]);
    });

    grunt.registerTask('build-scripts', 'Compile JS to output folder using either; :dev or :dist', function(env) {
      return grunt.task.run(['browserify', 'uglify:'+env]);
    });

    grunt.registerTask('build-images', 'Compress images to output folder using either; :dev or :dist', function(env) {
      return grunt.task.run(['imagemin:'+env]);
    });

    grunt.registerTask('build', 'Build the application using either; :dev, :dist or :test', function(env) {
      if(env === 'dist') {
        return grunt.task.run([
          'clean:dist',
          'build-files:dist',
          'build-styles:dist',
          'build-scripts:dist',
          'build-images:dist'
        ]);
      }

      return grunt.task.run([
        'clean:dev',
        'build-files:dev',
        'build-styles:dev',
        'build-scripts:dev',
        'build-images:dev',
      ]);
    });




    // Serve packaged app
    grunt.registerTask('serve', 'Serve the application using either; :dev or :dist', function(env) {
      if (env === 'jenkins') {
        return grunt.task.run([
          'env:test',
          'build:test',
          'express:jenkins'
        ]);
      }

      if (env === 'dist') {
        return grunt.task.run([
          'env:prod',
          'build:dist',
          'express:dist'
        ]);
      }

      return grunt.task.run([
        'env:dev',
        'build:dev',
        'concurrent:dev'
      ]);
    });

  };

})();
