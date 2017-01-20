(function (window) {
  "use strict"

  QUnit.test("test encode & decode", function ( assert ) {
    const sphinx = new Sphinx
    const data = '我爱这个世界ABC123˙©ƒ'
    const result = sphinx.encode(data)
    const done = assert.async()

    sphinx.decode(result).then( (text) => {
      assert.equal(sphinx.decodeUTF8(text), data, 'encode-string is equal to decode-string')
      done()
    });

  })

})(window)
