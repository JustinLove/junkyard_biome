var spec = require('./lib/spec')
var prompt = require('prompt')
prompt.start()

var modPath = '../../server_mods/com.wondible.pa.junkyard_biome.server/'
var stream = 'stable'
var media = require('./lib/path').media(stream)


module.exports = function(grunt) {
  var litter = function(spec, metal, writeFeatures) {
    var feature_sizes = [
      0, // n/a
      1, // two boxes
      1, // slope on one side
      6, // right angle
      2, // two long skewed
      4, // long, ends sloped
      5, // handle/pipe
      11, // pipe, fat at one end
      4, // U, slopedon bottom
      5, // rock hand; two arms
      10, // flat, possible door
      11, // two stacked pieces, extensions at right angle
      12, // box with double pipe
      10, // boxy; robot torso
      14, // box with two ramps on either side
      15, // panel, center with three elements
      2, // spike
    ]

    var baseLayer = spec.layers.length
    spec.layers[baseLayer] = {
      "note": baseLayer.toString(),
      "noise": {
        "scale": 4,
        "zoom": 10,
        "type": "simplex"
      }
    }
    metal.features.forEach(function(feature) {
      delete feature.rotation
      delete feature.latitude_snap
      delete feature.longitude_snap
      delete feature.fixed_orient
      feature.elevation_range = [ -1, 1 ]

      var name = feature.feature_spec.replace('metal/features/metal_feature', 'junkyard/features/junkyard_feature')
      var number = parseInt(name.match(/\d\d/)[0], 10)
      var size = feature_sizes[number]

      if (writeFeatures) {
        var fspec = grunt.file.readJSON(media+feature.feature_spec)
        fspec.base_spec = '/pa/terrain/junkyard/features/base_junkyard_feature.json'
        fspec.placement_size = [size, size]
        fspec.max_health = size * 10
        fspec.metal_value = size * 10 * fspec.max_health * 10
        fspec.burnable = {
          "burn_duration": 30 + Math.floor(size/15 * 90),
          "damage": 20, 
          "damage_radius": size, 
          "resistance": 100 + Math.floor(size/15 * 600), 
          "spread_chance": 0.1
        }
        grunt.file.write('.'+name, JSON.stringify(fspec, null, 2))
      }

      var spam = (16 - number) / 2
      feature.cluster_count_range = [Math.floor(spam/2), Math.max(1, Math.floor(spam))]
      feature.cluster_size = 15
      var range = 0.4 / number
      feature.noise_range = [0.5 - range, 0.5 + range ]

      var layer = baseLayer + number
      spec.layers[layer] = {
        "note": layer.toString(),
        "inherit_noise": true
      }
      feature.layer = layer
      feature.feature_spec = name
    })
    spec.features = spec.features.concat(metal.features)

    var uc = JSON.parse(JSON.stringify(spec.features[spec.features.length-1]))
    delete uc.burnable
    uc.cluster_count_range = [0, 1]
    uc.noise_range = [0.5, 0.51]
    uc.base_spec = '/pa/terrain/dump/features/base_dump_feature.json'
    uc.feature_spec = "/pa/terrain/dump/features/unit_cannon_wreckage.json"
    spec.features.push(uc)

    var cp = JSON.parse(JSON.stringify(spec.features[spec.features.length-1]))
    cp.base_spec = '/pa/terrain/dump/features/base_dump_feature.json'
    cp.feature_spec = "/pa/terrain/dump/features/control_point_01.json"
    spec.features.push(cp)
  }
  // Project configuration.
  grunt.initConfig({
    copy: {
      static: {
        files: [
          {
            expand: true,
            src: '**',
            dest: './',
            cwd: 'static/'
          }
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
      junkyard_sand: {
        src: [
          'pa/terrain/sand/sand.json',
          'pa/terrain/metal/metal.json'
        ],
        cwd: media,
        dest: 'pa/terrain/junkyard/sand.json',
        process: function(spec, metal) {
          spec.name = 'junkyard_sand'
          litter(spec, metal, true)
          return spec
        }
      },
      junkyard_desert: {
        src: [
          'pa/terrain/desert/desert.json',
          'pa/terrain/metal/metal.json'
        ],
        cwd: media,
        dest: 'pa/terrain/junkyard/desert.json',
        process: function(spec, metal) {
          spec.name = 'junkyard_desert'
          spec.brushes = spec.brushes.filter(function(brush) {
            return brush.brush_spec != "/pa/terrain/generic/brushes/unit_cannon_wreckage.json"
          })
          litter(spec, metal, false)
          return spec
        }
      },
      junkyard_mountain: {
        src: [
          'pa/terrain/mountain/mountain.json',
          'pa/terrain/metal/metal.json'
        ],
        cwd: media,
        dest: 'pa/terrain/junkyard/mountain.json',
        process: function(spec, metal) {
          spec.name = 'junkyard_mountain'
          spec.brushes = spec.brushes.filter(function(brush) {
            return brush.brush_spec != "/pa/terrain/generic/brushes/unit_cannon_wreckage.json"
          })
          litter(spec, metal, false)
          return spec
        }
      },
      junkyard_feature: {
        src: [
          'pa/terrain/metal/features/base_metal_feature.json'
        ],
        cwd: media,
        dest: 'pa/terrain/junkyard/features/base_junkyard_feature.json',
        process: function(spec) {
          spec.reclaimable = true
          spec.damageable = true // required for reclaim
          spec.path_cost = 10
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
          spec.biomes[0].spec = "/pa/terrain/dump/moon.json"
          return spec
        }
      },
      junkyard_moon: {
        src: [
          'pa/terrain/moon/moon.json',
          'pa/terrain/metal/metal.json'
        ],
        cwd: media,
        dest: 'pa/terrain/dump/moon.json',
        process: function(spec, metal) {
          var feature_sizes = [
            0, // n/a
            1, // two boxes
            2, // slope on one side
            12, // right angle
            4, // two long skewed
            7, // long, ends sloped
            10, // handle/pipe
            21, // pipe, fat at one end
            8, // U, slopedon bottom
            9, // rock hand; two arms
            20, // flat, possible door
            22, // two stacked pieces, extensions at right angle
            24, // box with double pipe
            20, // boxy; robot torso
            28, // box with two ramps on either side
            30, // panel, center with three elements
            4, // spike
          ]
          spec.name = 'dump_moon'
          spec.brushes = spec.brushes.filter(function(brush) {
            return brush.brush_spec != "/pa/terrain/generic/brushes/unit_cannon_wreckage.json"
          })
          metal.features.forEach(function(feature) {
            feature.scale = [1.5, 1.5, 1.5]
            delete feature.rotation
            delete feature.latitude_snap
            delete feature.longitude_snap
            delete feature.fixed_orient
            
            var name = feature.feature_spec.replace('metal/features/metal_feature', 'dump/features/dump_feature')
            var number = parseInt(name.match(/\d\d/)[0], 10)
            var size = feature_sizes[number]

            var fspec = grunt.file.readJSON(media+feature.feature_spec)
            fspec.base_spec = '/pa/terrain/dump/features/base_dump_feature.json'
            fspec.placement_size = [size, size]
            fspec.max_health = size * 100
            fspec.metal_value = size * 100 * fspec.max_health * 10
            grunt.file.write('.'+name, JSON.stringify(fspec, null, 2))

            feature.feature_spec = name
          })
          spec.features = spec.features.concat(metal.features)

          var uc = JSON.parse(JSON.stringify(spec.features[spec.features.length-1]))
          uc.scale = [1, 1, 1]
          uc.noise_range = [0.77, 0.8]
          uc.feature_spec = "/pa/terrain/dump/features/unit_cannon_wreckage.json"
          spec.features.push(uc)

          var cp = JSON.parse(JSON.stringify(spec.features[spec.features.length-1]))
          cp.scale = [1, 1, 1]
          cp.feature_spec = "/pa/terrain/dump/features/control_point_01.json"
          spec.features.push(cp)
          return spec
        }
      },
      dump_feature: {
        src: [
          'pa/terrain/metal/features/base_metal_feature.json'
        ],
        cwd: media,
        dest: 'pa/terrain/dump/features/base_dump_feature.json',
        process: function(spec) {
          spec.reclaimable = true
          spec.damageable = true // required for reclaim
          spec.path_cost = 500
          return spec
        }
      },
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

  grunt.registerTask('client', ['copy:static', 'proc', 'jsonlint']);
  grunt.registerTask('server', ['copy:mod', 'copy:modinfo']);

  // Default task(s).
  grunt.registerTask('default', ['client']);
};

