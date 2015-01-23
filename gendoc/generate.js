(function(_fs, _path) {
  var OUTDIR = _path.join(__dirname, 'output');

  var files = JSON.parse(_fs.readFileSync('pages.json'));
  var tpl = _fs.readFileSync('_template.html').toString('utf8');

  Object.keys(files).forEach(function(f) {
    var title = files[f].title;
    var content = _fs.readFileSync(f);
    var dest = _path.join(OUTDIR, f);
    var dir = _path.dirname(dest);

    if ( dir !== '' && dir !== '.' ) {
      if ( !_fs.existsSync(dir) ) {
        _fs.mkdirSync(dir);
      }
    }

    var data = tpl;
    data = data.replace(/\%TITLE\%/g, title);
    data = data.replace("%REL%", f);
    data = data.replace("%CONTENT%", content);

    console.log("Writing", f, "=>", dest);
    _fs.writeFileSync(dest, data);
  });

})(
  require("node-fs-extra"),
  require("path")
);
