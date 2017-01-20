/**
 * Author: Jrain Lau
 * E-mail: jrainlau@163.com
 * Version: 0.0.4
 */
;(() => {

  const encodeUTF8 = Symbol('encodeUTF8')
  /**
   * Construct a new Sphinx instance by passing the configuration object
   *
   * @param {Object}	config    define the type of the image
   */
  class Sphinx {
    constructor (config = {img: 'png'}) {
      this.config = config
      this.canvas = document.createElement('canvas')
    }

    [encodeUTF8] (str) {
      return str
	.replace(/[\u0080-\u07ff]/g, (s) => {
	  let _s = s.charCodeAt(0)
	  return String.fromCharCode(0xc0 | _s >> 6, 0x80 | _s & 0x3f)
	})
	.replace(/[\u0800-\uffff]/g, (s) => {
	  let _s = s.charCodeAt(0)
	  return String.fromCharCode(0xe0 | _s >> 12, 0x80 | _s >> 6 & 0x3f, 0x80 | _s & 0x3f)
	})
    }

    decodeUTF8 (code) {
      // http://creamidea.github.io/static/html/articles/Unicode-And-UTF8.html#org5ae6e83
      let container = [], // 存储 unicode 的容器
          c, // 当前字节
          next, // 下一个字节
          i = -1 // 循环指示器

      while((c = code.charCodeAt(++i))) {
        // c = 255 时，不会进入这里
        // 所以也就不需要比较 i % 4 === 0
        if ( c < 128) {
          // 0XXXX XXXX
          c = 0x7f & c
        } else if (c < 224) {
          // 110X XXXX
          c = ((0x1f & c) << 6)
          // TODO: 这里也许有爆栈的可能
          while (isNaN(next = code.charCodeAt(++i))) continue
          c = c | (0x3f & next)
        } else if (c < 240) {
          // 1110 XXXX
          c = ((0x0f & c) << 12)
          while (isNaN(next = code.charCodeAt(++i))) continue
          c = c | ((0x3f & next) << 6)
          while (isNaN(next = code.charCodeAt(++i))) continue
          c = c | (0x3f & next)
        }
        container.push(c)
      }

      return String.fromCharCode.apply(null, container)
    }

    /**
     * @param {array} buffer
     * @return {CanvasRenderingContext2D} ctx
     */
    createContainer(buffer) {
      let pixelNum,
          canvas = this.canvas,
          ctx

      // buffer.length = 4 * width * height
      pixelNum = buffer.length / 4 // One pixel could store 4 bytes by its RGB+Alpha
      canvas.height = 1
      canvas.width = pixelNum
      ctx = canvas.getContext('2d')
      return ctx
    }

    /**
     * convert str from String to ImageData(Uint8ClampedArray)
     * @param {string} str
     *
     * @return {Uint8ClampedArray}
     */
    convertToImageData (text) {
      const padding = [[0, 0, 255], [0, 255], [255]]
      let code, // 当前字节
          counter = 0, // 计数器，用于记录数组长度,
          buffer = [], // 临时容器
          i = -1 // 循环指示器

      while((code = text.charCodeAt(++i))) {
        counter++
        if (counter % 4 === 0) {
          buffer.push(255)
          counter++
        }
        buffer.push(code)
      }

      if (buffer.length % 4) {
        buffer = buffer.concat(padding[buffer.length % 4 - 1])
      }
      return buffer
      // console.log(buffer)
    }

    encode (str) {
      let text = this[encodeUTF8](str),
          canvas = this.canvas,
          imagedata,
          ctx

      imagedata = this.convertToImageData(text)

      ctx = this.createContainer(imagedata)

      if (typeof ImageData === undefined) {
        let _imagedata
        _imagedata = ctx.createImageData(canvas.width, canvas.height)
        imagedata.forEach( (d, i) => _imagedata.data[i] = d)
        ctx.putImageData(_imagedata, 0, 0)
      } else {
        ctx.putImageData(
          new ImageData(Uint8ClampedArray.from(imagedata), canvas.width, canvas.height), 0, 0
        )
      }

      return canvas.toDataURL(`image/${this.config.img}`)
    }

    decode (url) {
      let img = document.createElement('img')

      img.crossOrigin = "anonymous"
      img.src = url

      return new Promise ((resolve, reject) => {
	img.onload = () => {
	  let canvas = document.createElement('canvas')
	  canvas.width = img.width
	  canvas.height = img.height

	  let ctx = canvas.getContext("2d")
	  ctx.drawImage(img, 0, 0)
	  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)

	  let decodeArr = []
	  for (let i = 0, l = imgData.data.length; i < l; i++) {
	    if (i % 4 == 3) continue
	    if (!imgData.data[i]) break
	    decodeArr.push(String.fromCharCode(imgData.data[i]))
	  }
	  resolve(decodeURIComponent(decodeArr.join('')))
	}
      })
    }
  }

  if (typeof module === 'object' && typeof module.exports === 'object') {
    // CommonJS
    module.exports = exports = Sphinx

  } else if (typeof define === 'function' && define.amd) {
    // AMD support
    define(() => Sphinx)

  } else if (typeof window === 'object') {
    // Normal way
    window.Sphinx = Sphinx
  }

})()
