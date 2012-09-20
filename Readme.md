csv-stream
===

Parses csv files. That's all.

## Usage

```javascript
var csv = require('csv-stream'),
    fs = require('fs')

var fstream = fs.createReadStream('/path/to/file'),
    parser = csv(options /* optional */, callback /* optional */)

// emits each row as an array of fields and it's number
parser.on('data', function (row, rowNo) {
  // do stuff with data as it comes in
})

// AND/OR
function callback(err, doc) {
  if (err) throw err

  // doc is an array of row arrays
  doc.forEach(function (row) {})
}

// now pump some data into it
fstream.pipe(parser)

```
__Note:__ If you pass a callback to ```csv-stream``` it will buffer the parsed data for you and pass it to the callback when it's done. Unscientific tests showed a dramatic (2x) slowdown when using this on large documents.

### Options

The parser can optionally take some options. Here they are with their defaults.

```javascript
{
  delimiter: ',', // comma, semicolon, whatever
  newline: '\n', // newline character
  quote: '\"', // what's considered a quote
  empty: '' // empty fields are replaced by this
}
```

## Performance

The unscientific tests mentioned above showed a throughput of ~20mb/s on a Macbook Pro 13" (mid 2010) when reading from disk.

## TODO

- actual tests
- maybe support weird encodings
- publish to npm
