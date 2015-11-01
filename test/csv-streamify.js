/* global describe, it */
'use strict'

const assert = require('assert')
const csv = require('../csv-streamify')
const fs = require('fs')
const path = require('path')
const fixture = path.join(__dirname, 'fixtures', 'quote.csv')

describe('without callback', function () {
  it('should emit a buffer per line (non-flowing-mode)', function (done) {
    const parser = csv()
    const fstream = fs.createReadStream(fixture)

    let count = 0
    parser.on('readable', function () {
      let chunk
      while ((chunk = parser.read()) !== null) {
        assert(Buffer.isBuffer(chunk))
        assert(Array.isArray(JSON.parse(chunk)))

        assert.equal(parser.lineNo, count)
        count += 1
      }
    })

    parser.on('end', function () {
      assert.equal(parser.body.length, 0, 'should not buffer')
      assert.equal(count, 13)
      assert.equal(parser.lineNo, 13)
      done()
    })

    fstream.pipe(parser)
  })

  it('should emit a buffer per line (flowing-mode)', function (done) {
    const parser = csv()
    const fstream = fs.createReadStream(fixture)

    let count = 0
    parser.on('data', function (chunk) {
      assert(Buffer.isBuffer(chunk))
      assert(Array.isArray(JSON.parse(chunk)))

      assert.equal(parser.lineNo, count)
      count += 1
    })

    parser.on('end', function () {
      assert.equal(count, 13)
      assert.equal(parser.lineNo, 13)
      done()
    })

    fstream.pipe(parser)
  })

  it('should emit a string containing one line', function (done) {
    const parser = csv({ encoding: 'utf8' })
    const fstream = fs.createReadStream(fixture)

    let count = 0
    parser.on('data', function (chunk) {
      assert(typeof chunk === 'string')
      assert(Array.isArray(JSON.parse(chunk)))
      assert.equal(parser.lineNo, count)
      count += 1
    })

    parser.on('end', function () {
      assert.equal(count, 13)
      assert.equal(parser.lineNo, 13)
      done()
    })

    fstream.pipe(parser)
  })
})

describe('with callback', function () {
  it('should callback with entire parsed document', function (done) {
    const parser = csv(cb)
    const fstream = fs.createReadStream(fixture)

    function cb (err, doc) {
      if (err) return done(err)
      assert(Array.isArray(doc))

      // test for crazy quoted sequences
      assert.equal(doc[1].length, 2)
      assert.deepEqual(doc[1], [
        'Job Description:', '"Etiketten", "Borthener Obst" - A4 (Neutral)'
      ])

      assert.equal(doc.length, 13)
      done()
    }

    fstream.pipe(parser)
  })
})

describe('newline', function () {
  it('should respect options.newline', function (done) {
    const parser = csv({ newline: '\r\n' })
    const fstream = fs.createReadStream(path.join(__dirname, 'fixtures', 'quote_crlf.csv'))

    let count = 0
    parser.on('data', function (chunk) {
      assert(Buffer.isBuffer(chunk))
      assert(Array.isArray(JSON.parse(chunk)))
      assert.equal(parser.lineNo, count)
      count += 1
    })

    parser.on('end', function () {
      assert.equal(count, 13)
      assert.equal(parser.lineNo, 13)
      done()
    })

    fstream.pipe(parser)
  })
})

describe('object mode', function () {
  it('should emit one array per line', function (done) {
    const parser = csv({ objectMode: true })
    const fstream = fs.createReadStream(fixture)

    let count = 0
    parser.on('data', function (chunk) {
      assert(Array.isArray(chunk))
      assert.equal(parser.lineNo, count)
      count += 1
    })

    parser.on('end', function () {
      assert.equal(count, 13)
      assert.equal(parser.lineNo, 13)
      done()
    })

    fstream.pipe(parser)
  })
})

describe('edge cases', function () {
  it('should handle line breaks spanning multiple chunks', function () {
    var parser = csv({ newline: '\r\n' }, function () {})
    parser.parse('hey,yo\r')
    parser.parse('\nfoo,bar')
    parser._flush(function () {})

    assert.deepEqual(parser.body, [ [ 'hey', 'yo' ], ['foo', 'bar'] ])
  })

  it('should handle quotes spanning multiple chunks', function () {
    var parser = csv(function () {})
    parser.parse('"""hey,yo"')
    parser.parse('"",foo,bar')
    parser._flush(function () {})

    assert.deepEqual(parser.body, [ [ '"hey,yo"', 'foo', 'bar' ] ])
  })
})
