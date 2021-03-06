'use strict';

module.exports = function(grunt) {
	require('jit-grunt')(grunt);

	// Unified Watch Object
	var watchFiles = {
		clientViews: ['public/modules/**/views/**/*.html'],
		clientJS: ['public/js/*.js', 'public/modules/**/*.js'],
		clientCSS: ['public/modules/**/*.css'],
		clientTests: ['public/modules/**/tests/*.js']
	};

	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			clientViews: {
				files: watchFiles.clientViews,
				tasks: ['html2js:main'],
				options: {
					livereload: true,
					spawn: false
				}
			},
			clientJS: {
				files: watchFiles.clientJS,
				tasks: ['newer:jshint'],
				options: {
					livereload: true,
					spawn: false
				}
			},
			clientCSS: {
				files: watchFiles.clientCSS,
				tasks: ['newer:csslint'],
				options: {
					livereload: true,
					spawn: false
				}
			}
		},
		jshint: {
			all: {
				src: watchFiles.clientJS,
				options: {
					jshintrc: true
				}
			},
			allTests: {
				src: watchFiles.clientTests,
				options: {
					jshintrc: true
				}
			}
		},
		csslint: {
			options: {
				csslintrc: '.csslintrc'
			},
			all: {
				src: watchFiles.clientCSS
			}
		},
		uglify: {
			production: {
				options: {
					mangle: false
				},
				files: {
					'public/dist/application.min.js': 'public/dist/application.js'
				}
			}
		},
		cssmin: {
			combine: {
				files: {
					'public/dist/application.min.css': '<%= applicationCSSFiles %>'
				}
			}
		},
		ngAnnotate: {
			production: {
				files: {
					'public/dist/application.js': '<%= applicationJavaScriptFiles %>'
				}
			}
		},
		env: {
			test: {
				NODE_ENV: 'test',
                src: '/opt/deploy/.env'
			},
			secure: {
				NODE_ENV: 'secure',
			},
			production: {
				NODE_ENV: 'production'
			},
			src: '/opt/deploy/.env'
		},
		mochaTest: {
			src: watchFiles.serverTests,
			options: {
				reporter: 'spec',
				quiet: false,
				require: 'server.js',
				ui: 'bdd'
			}
		},
		karma: {
			unit: {
				configFile: 'karma.conf.js',
			    singleRun: true
            }
		},
	    mocha_istanbul: {
            coverage: {
                src: watchFiles.clientTests, // specifying file patterns works as well
                options: {
                    coverageFolder: 'coverage',
                    mask: '*.test.js'
                }
            }
        },
        istanbul_check_coverage: {
          default: {
            options: {
              coverageFolder: 'coverage*', // will check both coverage folders and merge the coverage results
              check: {
                lines: 80,
                statements: 80
              }
            }
          }
        },
        html2js: {
		  options: {
		    base: 'NodeForm',
		    watch: true,
			module: 'NodeForm.templates',
		    singleModule: true,
		    useStrict: true,
		    htmlmin: {
		      collapseBooleanAttributes: true,
		      collapseWhitespace: true,
		      removeAttributeQuotes: true,
		      removeComments: true,
		      removeEmptyAttributes: true,
		      removeRedundantAttributes: true,
		    }
		  },
		  main: {
		    src: ['public/modules/**/views/**.html', 'public/modules/**/views/**/*.html'],
		    dest: 'public/populate_template_cache.js'
		  }
		}
	});

	grunt.event.on('coverage', function(lcov, done){
	    var coveralls = require('coveralls');
	    coveralls.handleInput(lcov, function(err){
	        if (err) {
	        	grunt.log.error('Failed to submit lcov file to coveralls: ' + err);
	            return done(err);
	        }
	        grunt.verbose.ok('Successfully submitted lcov file to coveralls');
	        done();
	    });
	});

	// Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	// A Task for loading the configuration object
	grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option.', function() {
		var init = require('./config/init')();
		var config = require('./config/config');

		grunt.config.set('applicationJavaScriptFiles', config.assets.js);
		grunt.config.set('applicationCSSFiles', config.assets.css);
	});


	// Code coverage tasks.
    grunt.registerTask('coverage', ['env:test', 'mocha_istanbul:coverage']);

	// Lint task(s).
	grunt.registerTask('lint', ['jshint', 'csslint']);
	grunt.registerTask('lint:tests', ['jshint:allTests']);

	// Build task(s).
	grunt.registerTask('default', ['lint', 'loadConfig', 'cssmin', 'ngAnnotate', 'uglify', 'html2js:main']);

	// Test task.
	grunt.registerTask('test', ['lint:tests', 'html2js:main', 'env:test', 'karma:unit']);
};
