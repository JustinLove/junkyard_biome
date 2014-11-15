var spec = require('./lib/spec')
var prompt = require('prompt')
prompt.start()

var modPath = '../../server_mods/com.wondible.pa.junkyard_biome.server/'
var stream = 'stable'
var media = require('./lib/path').media(stream)

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    copy: {
      biome: {
        files: [
          {
            src: media + 'pa/terrain/metal.json',
            dest: 'pa/terrain/devastated_metal.json',
          },
          {
            src: media + 'pa/terrain/metal/metal.json',
            dest: 'pa/terrain/metal/devastated_metal.json',
          },
        ],
      },
      mod: {
        files: [
          {
            src: [
              'modinfo.json',
              'LICENSE.txt',
              'README.md',
              'CHANGELOG.md',
              'ui/**',
              'pa/**'],
            dest: modPath,
          },
        ],
      },
      modinfo: {
        files: [
          {
            src: ['modinfo.json'],
            dest: modPath,
          },
        ],
        options: {
          process: function(content, srcpath) {
            var info = JSON.parse(content)
            info.date = require('dateformat')(new Date(), 'yyyy/mm/dd')
            info.identifier = info.identifier.replace('client', 'server')
            info.context = 'server'
            info.category = ['biome', 'metal', 'reclaim']
            delete(info.scenes)
            delete(info.priority)
            console.log(info.identifier, info.version, info.date)
            return JSON.stringify(info, null, 2)
          }
        }
      },
    },
    clean: ['pa', modPath],
    jsonlint: {
      all: {
        src: [
          'pa/terrain/**/*.json',
          'modinfo.json',
        ]
      },
    },
    // copy files from PA, transform, and put into mod
    proc: {
      junkyard_biome_type: {
        src: [
          'pa/terrain/desert.json'
        ],
        cwd: media,
        dest: 'pa/terrain/junkyard.json',
        process: function(spec) {
          spec.name = 'junkyard'
          spec.biomes[0].spec = "/pa/terrain/junkyard/sand.json"
          spec.biomes[1].spec = "/pa/terrain/junkyard/desert.json"
          spec.biomes[2].spec = "/pa/terrain/junkyard/mountain.json"
          return spec
        }
      },
      dump_biome_type: {
        src: [
          'pa/terrain/moon.json'
        ],
        cwd: media,
        dest: 'pa/terrain/dump.json',
        process: function(spec) {
          spec.name = 'dump'
          spec.biomes[0].spec = "/pa/terrain/junkyard/moon.json"
          return spec
        }
      },
      junkyard_sand: {
        src: [
          'pa/terrain/sand/sand.json'
        ],
        cwd: media,
        dest: 'pa/terrain/junkyard/sand.json',
        process: function(spec) {
          spec.name = 'junkyard_sand'
          return spec
        }
      },
      junkyard_desert: {
        src: [
          'pa/terrain/desert/desert.json'
        ],
        cwd: media,
        dest: 'pa/terrain/junkyard/desert.json',
        process: function(spec) {
          spec.name = 'junkyard_desert'
          return spec
        }
      },
      junkyard_mountain: {
        src: [
          'pa/terrain/mountain/mountain.json'
        ],
        cwd: media,
        dest: 'pa/terrain/junkyard/mountain.json',
        process: function(spec) {
          spec.name = 'junkyard_mountain'
          return spec
        }
      },
      junkyard_moon: {
        src: [
          'pa/terrain/moon/moon.json',
          'pa/terrain/metal/metal.json'
        ],
        cwd: media,
        dest: 'pa/terrain/junkyard/moon.json',
        process: function(spec, metal) {
          spec.name = 'junkyard_moon'
          spec.features = spec.features.concat(metal.features)
          return spec
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-jsonlint');

  grunt.registerMultiTask('proc', 'Process unit files into the mod', function() {
    if (this.data.targets) {
      var specs = spec.copyPairs(grunt, this.data.targets, media)
      spec.copyUnitFiles(grunt, specs, this.data.process)
    } else {
      var specs = this.filesSrc.map(function(s) {return grunt.file.readJSON(media + s)})
      var out = this.data.process.apply(this, specs)
      grunt.file.write(this.data.dest, JSON.stringify(out, null, 2))
    }
  })

  grunt.registerTask('client', ['proc', 'jsonlint']);
  grunt.registerTask('server', ['copy:mod', 'copy:modinfo']);

  // Default task(s).
  grunt.registerTask('default', ['client']);
};

