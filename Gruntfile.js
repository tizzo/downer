module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify2: {
      compile: {
        entry: './client.js',
        compile: './static/bundle.js'
      }
    },
    watch: {
      scripts: {
        files: [
          '**/*.js',
          '*.js'
        ],
        tasks: ['browserify2'],
        options: {
          nospawn: true
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-browserify2');
  grunt.loadNpmTasks('grunt-contrib-watch');
  // Default task(s).
  grunt.registerTask('default', ['browserify2']);
};