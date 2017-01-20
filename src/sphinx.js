/**
 * Author: Jrain Lau
 * E-mail: jrainlau@163.com
 * Version: 0.0.4
 */
;(() => {

  const encodeUTF8 = Symbol('encodeUTF8')
  const decodeUTF8 = Symbol('decodeUTF8')
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
      return unescape(encodeURIComponent(str))
    }

    [decodeUTF8] (code) {
      return decodeURIComponent(escape(code))
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
	  let canvas,
              ctx,
              imgData,
              decodeArr = []

          canvas = document.createElement('canvas')
	  canvas.width = img.width
	  canvas.height = img.height

	  ctx = canvas.getContext("2d")
	  ctx.drawImage(img, 0, 0)

	  imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data

          resolve(
            this[decodeUTF8](
              String.fromCharCode.apply(
                null,
                imgData.filter( (v, i) => {
                  return ( i + 1) % 4 !== 0
                })
              )
            )
          )
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
