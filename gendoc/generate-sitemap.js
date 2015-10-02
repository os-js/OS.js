(function(_fs, _path) {

  var output = {};
  var ignores = ['.', '..', '.gitignore', 'index.html'];
  var baseUrl = 'http://os.js.org/doc/';
  var timezone = '+02:00';
  var dirs = [
    'manuals',
    'tutorials',
    'client',
    'server'
  ];


  /**
   * Get all files in a dir
   */
  function getFiles(root, cb) {
    var dir = _path.join('output', root);
    console.log('...reading', root);

    _fs.readdir(dir, function(err, files) {
      if ( !err && files ) {
        files.forEach(function(f) {
          if ( ignores.indexOf(f) < 0 && f.match(/\.html$/) ) {
            var stat = _fs.statSync(_path.join(dir, f));

            output[_path.join(root, f)] = stat.mtime;
          }
        });
      }
      cb();
    });
  }

  /**
   * Read all directories
   */
  function readAllFiles(cb) {
    var index = 0;

    function _next() {
      if ( index >= (dirs.length - 1) ) {
        cb();
        return;
      }

      getFiles(dirs[index], function() {
        index++;

        _next();
      });
    }

    _next();
  }

  /**
   * Create XML entries
   */
  function createEntries(urls) {
    var entries = [];
    Object.keys(output).forEach(function(e) {
      var mtime = (new Date(output[e])).toISOString().split('.')[0] + timezone;
      var txt = '';
      txt += '<url>\n';
      txt += '  <loc>' + baseUrl + e + '</loc>\n';
      txt += '  <lastmod>' + mtime + '</lastmod>\n';
      txt += '  <changefreq>weekly</changefreq>\n';
      txt += '</url>\n';
      entries.push(txt);
    });

    return entries.join('\n\n');
  }

  //
  // MAIN
  //

  console.log('...loading template');
  _fs.readFile('sitemap.template.xml', function(err, tpl) {
    console.log('...loading file lists');

    readAllFiles(function(urls) {
      var result = tpl.toString().replace('%URLS%', createEntries());
      console.log('...writing sitemap.xml');
      _fs.writeFile('output/sitemap.xml', result, function() {
        console.log('Finished');
      });
    });

  });


})(require('fs'), require('path'));
