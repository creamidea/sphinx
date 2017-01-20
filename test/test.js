(function (window) {
  "use strict"

  QUnit.test("test encode & decode", function ( assert ) {
    const sphinx = new Sphinx
    const data = '我爱这个世界ABC123˙©ƒ'
    const done = assert.async()

    sphinx.decode(
      sphinx.encode(data)
    ).then( (text) => {
      assert.equal(text, data, 'encode-string is equal to decode-string')
      done()
    });

  })

})(window)
