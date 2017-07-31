(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, function () { 'use strict';

	function SWRegister () {

	  if ('serviceWorker' in navigator) {

	    navigator.serviceWorker.register('/sw.js').then(function () {
	      console.log('Service worker successfully registered');
	    }).catch(function (err) {
	      console.error('Service worker failed to register', err);
	    });
	  } else {
	    console.log('Service workers not supported');
	  }
	}

	/**
	 * Show the colour input element if <input type="color"> is supported.
	 * There does not appear to be a good polyfill for it right now.
	 * (Not vanilla JS anyway. The recommended one from html5please.com is a JQuery plugin).
	 * For now, browsers without support will just get a placeholder and be limited to black. 
	 */
	function InputColourShim () {

	  var input = document.getElementById('input-colour');
	  var substitute = document.getElementById('input-colour-substitute');

	  // Unsupported browsers e.g. iOS Safari revert type to 'text'
	  if (input.type === 'color') {
	    input.style.display = 'block';
	    substitute.style.display = 'none';
	  }
	}

	/**
	 * Previously I was using webrtc-adapter, but this was using up nearly half the JS bundle size!
	 * This is a more lightweight shim based on the version here: 
	 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	 */
	function WebRTCShim () {

	  // Some browsers partially implement mediaDevices. We can't just assign an object
	  // with getUserMedia as it would overwrite existing properties.
	  if (navigator.mediaDevices === undefined || navigator.mediaDevices.getUserMedia === undefined) {

	    // First get hold of the legacy getUserMedia, if present
	    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	    // If there is no legacy getUserMedia either, do not attempt to shim, we'll check if
	    // navigator.mediaDevices.getUserMedia exists in order to display the button or not.
	    if (getUserMedia) {

	      if (navigator.mediaDevices === undefined) {
	        navigator.mediaDevices = {};
	      }

	      navigator.mediaDevices.getUserMedia = function (constraints) {
	        // Wrap the call to the old navigator.getUserMedia with a Promise
	        return new Promise(function (resolve, reject) {
	          getUserMedia.call(navigator, constraints, resolve, reject);
	        });
	      };
	    }
	  }
	}

	/**
	 * By Boris Smus.
	 * From: http://www.html5rocks.com/en/tutorials/webaudio/intro/
	 */
	function BufferLoader(context, urlList, callback) {
	  this.context = context;
	  this.urlList = urlList;
	  this.onload = callback;
	  this.bufferList = new Array();
	  this.loadCount = 0;
	}

	BufferLoader.prototype.loadBuffer = function (url, index) {
	  // Load buffer asynchronously
	  var request = new XMLHttpRequest();
	  request.open('GET', url, true);
	  request.responseType = 'arraybuffer';

	  var loader = this;

	  request.onload = function () {
	    // Asynchronously decode the audio file data in request.response
	    loader.context.decodeAudioData(request.response, function (buffer) {
	      if (!buffer) {
	        alert('error decoding file data: ' + url);
	        return;
	      }
	      loader.bufferList[index] = buffer;
	      if (++loader.loadCount == loader.urlList.length) loader.onload(loader.bufferList);
	    }, function (error) {
	      console.error('decodeAudioData error', error);
	    });
	  };

	  request.onerror = function () {
	    alert('BufferLoader: XHR error');
	  };

	  request.send();
	};

	BufferLoader.prototype.load = function () {
	  for (var i = 0; i < this.urlList.length; ++i) {
	    this.loadBuffer(this.urlList[i], i);
	  }
	};

	var context = void 0;
	var bufferLoader = void 0;
	var bufferList = null;

	function playCameraSound() {

	  if (!bufferList || bufferList.length < 1) {
	    // Not ready to play yet
	    return false;
	  }

	  try {

	    var source = context.createBufferSource();
	    source.buffer = bufferList[0];
	    source.connect(context.destination);
	    source.start(0);
	  } catch (ex) {
	    console.warn('Unable to play camera sound', ex);
	    return false;
	  }

	  return true;
	}

	function init() {
	  window.AudioContext = window.AudioContext || window.webkitAudioContext;
	  try {
	    context = new AudioContext();
	    bufferLoader = new BufferLoader(context, ['/sounds/camera.wav'], function (list) {
	      bufferList = list;
	    });
	    bufferLoader.load();
	  } catch (ex) {
	    console.warn('Unable to initialise audio bufferLoader', ex);
	  }
	}

	function interopDefault(ex) {
		return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var loadImage = createCommonjsModule(function (module) {
	/*
	 * JavaScript Load Image
	 * https://github.com/blueimp/JavaScript-Load-Image
	 *
	 * Copyright 2011, Sebastian Tschan
	 * https://blueimp.net
	 *
	 * Licensed under the MIT license:
	 * http://www.opensource.org/licenses/MIT
	 */

	/* global define, URL, webkitURL, FileReader */

	;(function ($) {
	  'use strict'

	  // Loads an image for a given File object.
	  // Invokes the callback with an img or optional canvas
	  // element (if supported by the browser) as parameter:
	  function loadImage (file, callback, options) {
	    var img = document.createElement('img')
	    var url
	    img.onerror = function (event) {
	      return loadImage.onerror(img, event, file, callback, options)
	    }
	    img.onload = function (event) {
	      return loadImage.onload(img, event, file, callback, options)
	    }
	    if (loadImage.isInstanceOf('Blob', file) ||
	      // Files are also Blob instances, but some browsers
	      // (Firefox 3.6) support the File API but not Blobs:
	      loadImage.isInstanceOf('File', file)) {
	      url = img._objectURL = loadImage.createObjectURL(file)
	    } else if (typeof file === 'string') {
	      url = file
	      if (options && options.crossOrigin) {
	        img.crossOrigin = options.crossOrigin
	      }
	    } else {
	      return false
	    }
	    if (url) {
	      img.src = url
	      return img
	    }
	    return loadImage.readFile(file, function (e) {
	      var target = e.target
	      if (target && target.result) {
	        img.src = target.result
	      } else if (callback) {
	        callback(e)
	      }
	    })
	  }
	  // The check for URL.revokeObjectURL fixes an issue with Opera 12,
	  // which provides URL.createObjectURL but doesn't properly implement it:
	  var urlAPI = (window.createObjectURL && window) ||
	                (window.URL && URL.revokeObjectURL && URL) ||
	                (window.webkitURL && webkitURL)

	  function revokeHelper (img, options) {
	    if (img._objectURL && !(options && options.noRevoke)) {
	      loadImage.revokeObjectURL(img._objectURL)
	      delete img._objectURL
	    }
	  }

	  loadImage.isInstanceOf = function (type, obj) {
	    // Cross-frame instanceof check
	    return Object.prototype.toString.call(obj) === '[object ' + type + ']'
	  }

	  loadImage.transform = function (img, options, callback, file, data) {
	    callback(loadImage.scale(img, options, data), data)
	  }

	  loadImage.onerror = function (img, event, file, callback, options) {
	    revokeHelper(img, options)
	    if (callback) {
	      callback.call(img, event)
	    }
	  }

	  loadImage.onload = function (img, event, file, callback, options) {
	    revokeHelper(img, options)
	    if (callback) {
	      loadImage.transform(img, options, callback, file, {})
	    }
	  }

	  // Transform image coordinates, allows to override e.g.
	  // the canvas orientation based on the orientation option,
	  // gets canvas, options passed as arguments:
	  loadImage.transformCoordinates = function () {
	    return
	  }

	  // Returns transformed options, allows to override e.g.
	  // maxWidth, maxHeight and crop options based on the aspectRatio.
	  // gets img, options passed as arguments:
	  loadImage.getTransformedOptions = function (img, options) {
	    var aspectRatio = options.aspectRatio
	    var newOptions
	    var i
	    var width
	    var height
	    if (!aspectRatio) {
	      return options
	    }
	    newOptions = {}
	    for (i in options) {
	      if (options.hasOwnProperty(i)) {
	        newOptions[i] = options[i]
	      }
	    }
	    newOptions.crop = true
	    width = img.naturalWidth || img.width
	    height = img.naturalHeight || img.height
	    if (width / height > aspectRatio) {
	      newOptions.maxWidth = height * aspectRatio
	      newOptions.maxHeight = height
	    } else {
	      newOptions.maxWidth = width
	      newOptions.maxHeight = width / aspectRatio
	    }
	    return newOptions
	  }

	  // Canvas render method, allows to implement a different rendering algorithm:
	  loadImage.renderImageToCanvas = function (
	    canvas,
	    img,
	    sourceX,
	    sourceY,
	    sourceWidth,
	    sourceHeight,
	    destX,
	    destY,
	    destWidth,
	    destHeight
	  ) {
	    canvas.getContext('2d').drawImage(
	      img,
	      sourceX,
	      sourceY,
	      sourceWidth,
	      sourceHeight,
	      destX,
	      destY,
	      destWidth,
	      destHeight
	    )
	    return canvas
	  }

	  // Determines if the target image should be a canvas element:
	  loadImage.hasCanvasOption = function (options) {
	    return options.canvas || options.crop || !!options.aspectRatio
	  }

	  // Scales and/or crops the given image (img or canvas HTML element)
	  // using the given options.
	  // Returns a canvas object if the browser supports canvas
	  // and the hasCanvasOption method returns true or a canvas
	  // object is passed as image, else the scaled image:
	  loadImage.scale = function (img, options, data) {
	    options = options || {}
	    var canvas = document.createElement('canvas')
	    var useCanvas = img.getContext ||
	                    (loadImage.hasCanvasOption(options) && canvas.getContext)
	    var width = img.naturalWidth || img.width
	    var height = img.naturalHeight || img.height
	    var destWidth = width
	    var destHeight = height
	    var maxWidth
	    var maxHeight
	    var minWidth
	    var minHeight
	    var sourceWidth
	    var sourceHeight
	    var sourceX
	    var sourceY
	    var pixelRatio
	    var downsamplingRatio
	    var tmp
	    function scaleUp () {
	      var scale = Math.max(
	        (minWidth || destWidth) / destWidth,
	        (minHeight || destHeight) / destHeight
	      )
	      if (scale > 1) {
	        destWidth *= scale
	        destHeight *= scale
	      }
	    }
	    function scaleDown () {
	      var scale = Math.min(
	        (maxWidth || destWidth) / destWidth,
	        (maxHeight || destHeight) / destHeight
	      )
	      if (scale < 1) {
	        destWidth *= scale
	        destHeight *= scale
	      }
	    }
	    if (useCanvas) {
	      options = loadImage.getTransformedOptions(img, options, data)
	      sourceX = options.left || 0
	      sourceY = options.top || 0
	      if (options.sourceWidth) {
	        sourceWidth = options.sourceWidth
	        if (options.right !== undefined && options.left === undefined) {
	          sourceX = width - sourceWidth - options.right
	        }
	      } else {
	        sourceWidth = width - sourceX - (options.right || 0)
	      }
	      if (options.sourceHeight) {
	        sourceHeight = options.sourceHeight
	        if (options.bottom !== undefined && options.top === undefined) {
	          sourceY = height - sourceHeight - options.bottom
	        }
	      } else {
	        sourceHeight = height - sourceY - (options.bottom || 0)
	      }
	      destWidth = sourceWidth
	      destHeight = sourceHeight
	    }
	    maxWidth = options.maxWidth
	    maxHeight = options.maxHeight
	    minWidth = options.minWidth
	    minHeight = options.minHeight
	    if (useCanvas && maxWidth && maxHeight && options.crop) {
	      destWidth = maxWidth
	      destHeight = maxHeight
	      tmp = sourceWidth / sourceHeight - maxWidth / maxHeight
	      if (tmp < 0) {
	        sourceHeight = maxHeight * sourceWidth / maxWidth
	        if (options.top === undefined && options.bottom === undefined) {
	          sourceY = (height - sourceHeight) / 2
	        }
	      } else if (tmp > 0) {
	        sourceWidth = maxWidth * sourceHeight / maxHeight
	        if (options.left === undefined && options.right === undefined) {
	          sourceX = (width - sourceWidth) / 2
	        }
	      }
	    } else {
	      if (options.contain || options.cover) {
	        minWidth = maxWidth = maxWidth || minWidth
	        minHeight = maxHeight = maxHeight || minHeight
	      }
	      if (options.cover) {
	        scaleDown()
	        scaleUp()
	      } else {
	        scaleUp()
	        scaleDown()
	      }
	    }
	    if (useCanvas) {
	      pixelRatio = options.pixelRatio
	      if (pixelRatio > 1) {
	        canvas.style.width = destWidth + 'px'
	        canvas.style.height = destHeight + 'px'
	        destWidth *= pixelRatio
	        destHeight *= pixelRatio
	        canvas.getContext('2d').scale(pixelRatio, pixelRatio)
	      }
	      downsamplingRatio = options.downsamplingRatio
	      if (downsamplingRatio > 0 && downsamplingRatio < 1 &&
	            destWidth < sourceWidth && destHeight < sourceHeight) {
	        while (sourceWidth * downsamplingRatio > destWidth) {
	          canvas.width = sourceWidth * downsamplingRatio
	          canvas.height = sourceHeight * downsamplingRatio
	          loadImage.renderImageToCanvas(
	            canvas,
	            img,
	            sourceX,
	            sourceY,
	            sourceWidth,
	            sourceHeight,
	            0,
	            0,
	            canvas.width,
	            canvas.height
	          )
	          sourceWidth = canvas.width
	          sourceHeight = canvas.height
	          img = document.createElement('canvas')
	          img.width = sourceWidth
	          img.height = sourceHeight
	          loadImage.renderImageToCanvas(
	            img,
	            canvas,
	            0,
	            0,
	            sourceWidth,
	            sourceHeight,
	            0,
	            0,
	            sourceWidth,
	            sourceHeight
	          )
	        }
	      }
	      canvas.width = destWidth
	      canvas.height = destHeight
	      loadImage.transformCoordinates(
	        canvas,
	        options
	      )
	      return loadImage.renderImageToCanvas(
	        canvas,
	        img,
	        sourceX,
	        sourceY,
	        sourceWidth,
	        sourceHeight,
	        0,
	        0,
	        destWidth,
	        destHeight
	      )
	    }
	    img.width = destWidth
	    img.height = destHeight
	    return img
	  }

	  loadImage.createObjectURL = function (file) {
	    return urlAPI ? urlAPI.createObjectURL(file) : false
	  }

	  loadImage.revokeObjectURL = function (url) {
	    return urlAPI ? urlAPI.revokeObjectURL(url) : false
	  }

	  // Loads a given File object via FileReader interface,
	  // invokes the callback with the event object (load or error).
	  // The result can be read via event.target.result:
	  loadImage.readFile = function (file, callback, method) {
	    if (window.FileReader) {
	      var fileReader = new FileReader()
	      fileReader.onload = fileReader.onerror = callback
	      method = method || 'readAsDataURL'
	      if (fileReader[method]) {
	        fileReader[method](file)
	        return fileReader
	      }
	    }
	    return false
	  }

	  if (typeof define === 'function' && define.amd) {
	    define(function () {
	      return loadImage
	    })
	  } else if (typeof module === 'object' && module.exports) {
	    module.exports = loadImage
	  } else {
	    $.loadImage = loadImage
	  }
	}(window))
	});

	var loadImage$1 = interopDefault(loadImage);


	var require$$0 = Object.freeze({
	  default: loadImage$1
	});

	var loadImageMeta = createCommonjsModule(function (module) {
	/*
	 * JavaScript Load Image Meta
	 * https://github.com/blueimp/JavaScript-Load-Image
	 *
	 * Copyright 2013, Sebastian Tschan
	 * https://blueimp.net
	 *
	 * Image meta data handling implementation
	 * based on the help and contribution of
	 * Achim Stöhr.
	 *
	 * Licensed under the MIT license:
	 * http://www.opensource.org/licenses/MIT
	 */

	/* global define, Blob */

	;(function (factory) {
	  'use strict'
	  if (typeof define === 'function' && define.amd) {
	    // Register as an anonymous AMD module:
	    define(['./load-image'], factory)
	  } else if (typeof module === 'object' && module.exports) {
	    factory(interopDefault(require$$0))
	  } else {
	    // Browser globals:
	    factory(window.loadImage)
	  }
	}(function (loadImage) {
	  'use strict'

	  var hasblobSlice = window.Blob && (Blob.prototype.slice ||
	  Blob.prototype.webkitSlice || Blob.prototype.mozSlice)

	  loadImage.blobSlice = hasblobSlice && function () {
	    var slice = this.slice || this.webkitSlice || this.mozSlice
	    return slice.apply(this, arguments)
	  }

	  loadImage.metaDataParsers = {
	    jpeg: {
	      0xffe1: [] // APP1 marker
	    }
	  }

	  // Parses image meta data and calls the callback with an object argument
	  // with the following properties:
	  // * imageHead: The complete image head as ArrayBuffer (Uint8Array for IE10)
	  // The options arguments accepts an object and supports the following properties:
	  // * maxMetaDataSize: Defines the maximum number of bytes to parse.
	  // * disableImageHead: Disables creating the imageHead property.
	  loadImage.parseMetaData = function (file, callback, options, data) {
	    options = options || {}
	    data = data || {}
	    var that = this
	    // 256 KiB should contain all EXIF/ICC/IPTC segments:
	    var maxMetaDataSize = options.maxMetaDataSize || 262144
	    var noMetaData = !(window.DataView && file && file.size >= 12 &&
	                      file.type === 'image/jpeg' && loadImage.blobSlice)
	    if (noMetaData || !loadImage.readFile(
	        loadImage.blobSlice.call(file, 0, maxMetaDataSize),
	        function (e) {
	          if (e.target.error) {
	            // FileReader error
	            console.log(e.target.error)
	            callback(data)
	            return
	          }
	          // Note on endianness:
	          // Since the marker and length bytes in JPEG files are always
	          // stored in big endian order, we can leave the endian parameter
	          // of the DataView methods undefined, defaulting to big endian.
	          var buffer = e.target.result
	          var dataView = new DataView(buffer)
	          var offset = 2
	          var maxOffset = dataView.byteLength - 4
	          var headLength = offset
	          var markerBytes
	          var markerLength
	          var parsers
	          var i
	          // Check for the JPEG marker (0xffd8):
	          if (dataView.getUint16(0) === 0xffd8) {
	            while (offset < maxOffset) {
	              markerBytes = dataView.getUint16(offset)
	              // Search for APPn (0xffeN) and COM (0xfffe) markers,
	              // which contain application-specific meta-data like
	              // Exif, ICC and IPTC data and text comments:
	              if ((markerBytes >= 0xffe0 && markerBytes <= 0xffef) ||
	                markerBytes === 0xfffe) {
	                // The marker bytes (2) are always followed by
	                // the length bytes (2), indicating the length of the
	                // marker segment, which includes the length bytes,
	                // but not the marker bytes, so we add 2:
	                markerLength = dataView.getUint16(offset + 2) + 2
	                if (offset + markerLength > dataView.byteLength) {
	                  console.log('Invalid meta data: Invalid segment size.')
	                  break
	                }
	                parsers = loadImage.metaDataParsers.jpeg[markerBytes]
	                if (parsers) {
	                  for (i = 0; i < parsers.length; i += 1) {
	                    parsers[i].call(
	                      that,
	                      dataView,
	                      offset,
	                      markerLength,
	                      data,
	                      options
	                    )
	                  }
	                }
	                offset += markerLength
	                headLength = offset
	              } else {
	                // Not an APPn or COM marker, probably safe to
	                // assume that this is the end of the meta data
	                break
	              }
	            }
	            // Meta length must be longer than JPEG marker (2)
	            // plus APPn marker (2), followed by length bytes (2):
	            if (!options.disableImageHead && headLength > 6) {
	              if (buffer.slice) {
	                data.imageHead = buffer.slice(0, headLength)
	              } else {
	                // Workaround for IE10, which does not yet
	                // support ArrayBuffer.slice:
	                data.imageHead = new Uint8Array(buffer)
	                  .subarray(0, headLength)
	              }
	            }
	          } else {
	            console.log('Invalid JPEG file: Missing JPEG marker.')
	          }
	          callback(data)
	        },
	        'readAsArrayBuffer'
	      )) {
	      callback(data)
	    }
	  }

	  // Determines if meta data should be loaded automatically:
	  loadImage.hasMetaOption = function (options) {
	    return options.meta
	  }

	  var originalTransform = loadImage.transform
	  loadImage.transform = function (img, options, callback, file, data) {
	    if (loadImage.hasMetaOption(options || {})) {
	      loadImage.parseMetaData(file, function (data) {
	        originalTransform.call(loadImage, img, options, callback, file, data)
	      }, options, data)
	    } else {
	      originalTransform.apply(loadImage, arguments)
	    }
	  }
	}))
	});

	var loadImageMeta$1 = interopDefault(loadImageMeta);


	var require$$0$2 = Object.freeze({
	  default: loadImageMeta$1
	});

	var loadImageExif = createCommonjsModule(function (module) {
	/*
	 * JavaScript Load Image Exif Parser
	 * https://github.com/blueimp/JavaScript-Load-Image
	 *
	 * Copyright 2013, Sebastian Tschan
	 * https://blueimp.net
	 *
	 * Licensed under the MIT license:
	 * http://www.opensource.org/licenses/MIT
	 */

	/* global define */

	;(function (factory) {
	  'use strict'
	  if (typeof define === 'function' && define.amd) {
	    // Register as an anonymous AMD module:
	    define(['./load-image', './load-image-meta'], factory)
	  } else if (typeof module === 'object' && module.exports) {
	    factory(interopDefault(require$$0), interopDefault(require$$0$2))
	  } else {
	    // Browser globals:
	    factory(window.loadImage)
	  }
	}(function (loadImage) {
	  'use strict'

	  loadImage.ExifMap = function () {
	    return this
	  }

	  loadImage.ExifMap.prototype.map = {
	    'Orientation': 0x0112
	  }

	  loadImage.ExifMap.prototype.get = function (id) {
	    return this[id] || this[this.map[id]]
	  }

	  loadImage.getExifThumbnail = function (dataView, offset, length) {
	    var hexData,
	      i,
	      b
	    if (!length || offset + length > dataView.byteLength) {
	      console.log('Invalid Exif data: Invalid thumbnail data.')
	      return
	    }
	    hexData = []
	    for (i = 0; i < length; i += 1) {
	      b = dataView.getUint8(offset + i)
	      hexData.push((b < 16 ? '0' : '') + b.toString(16))
	    }
	    return 'data:image/jpeg,%' + hexData.join('%')
	  }

	  loadImage.exifTagTypes = {
	    // byte, 8-bit unsigned int:
	    1: {
	      getValue: function (dataView, dataOffset) {
	        return dataView.getUint8(dataOffset)
	      },
	      size: 1
	    },
	    // ascii, 8-bit byte:
	    2: {
	      getValue: function (dataView, dataOffset) {
	        return String.fromCharCode(dataView.getUint8(dataOffset))
	      },
	      size: 1,
	      ascii: true
	    },
	    // short, 16 bit int:
	    3: {
	      getValue: function (dataView, dataOffset, littleEndian) {
	        return dataView.getUint16(dataOffset, littleEndian)
	      },
	      size: 2
	    },
	    // long, 32 bit int:
	    4: {
	      getValue: function (dataView, dataOffset, littleEndian) {
	        return dataView.getUint32(dataOffset, littleEndian)
	      },
	      size: 4
	    },
	    // rational = two long values, first is numerator, second is denominator:
	    5: {
	      getValue: function (dataView, dataOffset, littleEndian) {
	        return dataView.getUint32(dataOffset, littleEndian) /
	        dataView.getUint32(dataOffset + 4, littleEndian)
	      },
	      size: 8
	    },
	    // slong, 32 bit signed int:
	    9: {
	      getValue: function (dataView, dataOffset, littleEndian) {
	        return dataView.getInt32(dataOffset, littleEndian)
	      },
	      size: 4
	    },
	    // srational, two slongs, first is numerator, second is denominator:
	    10: {
	      getValue: function (dataView, dataOffset, littleEndian) {
	        return dataView.getInt32(dataOffset, littleEndian) /
	        dataView.getInt32(dataOffset + 4, littleEndian)
	      },
	      size: 8
	    }
	  }
	  // undefined, 8-bit byte, value depending on field:
	  loadImage.exifTagTypes[7] = loadImage.exifTagTypes[1]

	  loadImage.getExifValue = function (dataView, tiffOffset, offset, type, length, littleEndian) {
	    var tagType = loadImage.exifTagTypes[type]
	    var tagSize
	    var dataOffset
	    var values
	    var i
	    var str
	    var c
	    if (!tagType) {
	      console.log('Invalid Exif data: Invalid tag type.')
	      return
	    }
	    tagSize = tagType.size * length
	    // Determine if the value is contained in the dataOffset bytes,
	    // or if the value at the dataOffset is a pointer to the actual data:
	    dataOffset = tagSize > 4
	      ? tiffOffset + dataView.getUint32(offset + 8, littleEndian)
	      : (offset + 8)
	    if (dataOffset + tagSize > dataView.byteLength) {
	      console.log('Invalid Exif data: Invalid data offset.')
	      return
	    }
	    if (length === 1) {
	      return tagType.getValue(dataView, dataOffset, littleEndian)
	    }
	    values = []
	    for (i = 0; i < length; i += 1) {
	      values[i] = tagType.getValue(dataView, dataOffset + i * tagType.size, littleEndian)
	    }
	    if (tagType.ascii) {
	      str = ''
	      // Concatenate the chars:
	      for (i = 0; i < values.length; i += 1) {
	        c = values[i]
	        // Ignore the terminating NULL byte(s):
	        if (c === '\u0000') {
	          break
	        }
	        str += c
	      }
	      return str
	    }
	    return values
	  }

	  loadImage.parseExifTag = function (dataView, tiffOffset, offset, littleEndian, data) {
	    var tag = dataView.getUint16(offset, littleEndian)
	    data.exif[tag] = loadImage.getExifValue(
	      dataView,
	      tiffOffset,
	      offset,
	      dataView.getUint16(offset + 2, littleEndian), // tag type
	      dataView.getUint32(offset + 4, littleEndian), // tag length
	      littleEndian
	    )
	  }

	  loadImage.parseExifTags = function (dataView, tiffOffset, dirOffset, littleEndian, data) {
	    var tagsNumber,
	      dirEndOffset,
	      i
	    if (dirOffset + 6 > dataView.byteLength) {
	      console.log('Invalid Exif data: Invalid directory offset.')
	      return
	    }
	    tagsNumber = dataView.getUint16(dirOffset, littleEndian)
	    dirEndOffset = dirOffset + 2 + 12 * tagsNumber
	    if (dirEndOffset + 4 > dataView.byteLength) {
	      console.log('Invalid Exif data: Invalid directory size.')
	      return
	    }
	    for (i = 0; i < tagsNumber; i += 1) {
	      this.parseExifTag(
	        dataView,
	        tiffOffset,
	        dirOffset + 2 + 12 * i, // tag offset
	        littleEndian,
	        data
	      )
	    }
	    // Return the offset to the next directory:
	    return dataView.getUint32(dirEndOffset, littleEndian)
	  }

	  loadImage.parseExifData = function (dataView, offset, length, data, options) {
	    if (options.disableExif) {
	      return
	    }
	    var tiffOffset = offset + 10
	    var littleEndian
	    var dirOffset
	    var thumbnailData
	    // Check for the ASCII code for "Exif" (0x45786966):
	    if (dataView.getUint32(offset + 4) !== 0x45786966) {
	      // No Exif data, might be XMP data instead
	      return
	    }
	    if (tiffOffset + 8 > dataView.byteLength) {
	      console.log('Invalid Exif data: Invalid segment size.')
	      return
	    }
	    // Check for the two null bytes:
	    if (dataView.getUint16(offset + 8) !== 0x0000) {
	      console.log('Invalid Exif data: Missing byte alignment offset.')
	      return
	    }
	    // Check the byte alignment:
	    switch (dataView.getUint16(tiffOffset)) {
	      case 0x4949:
	        littleEndian = true
	        break
	      case 0x4D4D:
	        littleEndian = false
	        break
	      default:
	        console.log('Invalid Exif data: Invalid byte alignment marker.')
	        return
	    }
	    // Check for the TIFF tag marker (0x002A):
	    if (dataView.getUint16(tiffOffset + 2, littleEndian) !== 0x002A) {
	      console.log('Invalid Exif data: Missing TIFF marker.')
	      return
	    }
	    // Retrieve the directory offset bytes, usually 0x00000008 or 8 decimal:
	    dirOffset = dataView.getUint32(tiffOffset + 4, littleEndian)
	    // Create the exif object to store the tags:
	    data.exif = new loadImage.ExifMap()
	    // Parse the tags of the main image directory and retrieve the
	    // offset to the next directory, usually the thumbnail directory:
	    dirOffset = loadImage.parseExifTags(
	      dataView,
	      tiffOffset,
	      tiffOffset + dirOffset,
	      littleEndian,
	      data
	    )
	    if (dirOffset && !options.disableExifThumbnail) {
	      thumbnailData = {exif: {}}
	      dirOffset = loadImage.parseExifTags(
	        dataView,
	        tiffOffset,
	        tiffOffset + dirOffset,
	        littleEndian,
	        thumbnailData
	      )
	      // Check for JPEG Thumbnail offset:
	      if (thumbnailData.exif[0x0201]) {
	        data.exif.Thumbnail = loadImage.getExifThumbnail(
	          dataView,
	          tiffOffset + thumbnailData.exif[0x0201],
	          thumbnailData.exif[0x0202] // Thumbnail data length
	        )
	      }
	    }
	    // Check for Exif Sub IFD Pointer:
	    if (data.exif[0x8769] && !options.disableExifSub) {
	      loadImage.parseExifTags(
	        dataView,
	        tiffOffset,
	        tiffOffset + data.exif[0x8769], // directory offset
	        littleEndian,
	        data
	      )
	    }
	    // Check for GPS Info IFD Pointer:
	    if (data.exif[0x8825] && !options.disableExifGps) {
	      loadImage.parseExifTags(
	        dataView,
	        tiffOffset,
	        tiffOffset + data.exif[0x8825], // directory offset
	        littleEndian,
	        data
	      )
	    }
	  }

	  // Registers the Exif parser for the APP1 JPEG meta data segment:
	  loadImage.metaDataParsers.jpeg[0xffe1].push(loadImage.parseExifData)

	  // Adds the following properties to the parseMetaData callback data:
	  // * exif: The exif tags, parsed by the parseExifData method

	  // Adds the following options to the parseMetaData method:
	  // * disableExif: Disables Exif parsing.
	  // * disableExifThumbnail: Disables parsing of the Exif Thumbnail.
	  // * disableExifSub: Disables parsing of the Exif Sub IFD.
	  // * disableExifGps: Disables parsing of the Exif GPS Info IFD.
	}))
	});

	var loadImageExif$1 = interopDefault(loadImageExif);


	var require$$0$1 = Object.freeze({
	  default: loadImageExif$1
	});

	var loadImageExifMap = createCommonjsModule(function (module) {
	/*
	 * JavaScript Load Image Exif Map
	 * https://github.com/blueimp/JavaScript-Load-Image
	 *
	 * Copyright 2013, Sebastian Tschan
	 * https://blueimp.net
	 *
	 * Exif tags mapping based on
	 * https://github.com/jseidelin/exif-js
	 *
	 * Licensed under the MIT license:
	 * http://www.opensource.org/licenses/MIT
	 */

	/* global define */

	;(function (factory) {
	  'use strict'
	  if (typeof define === 'function' && define.amd) {
	    // Register as an anonymous AMD module:
	    define(['./load-image', './load-image-exif'], factory)
	  } else if (typeof module === 'object' && module.exports) {
	    factory(interopDefault(require$$0), interopDefault(require$$0$1))
	  } else {
	    // Browser globals:
	    factory(window.loadImage)
	  }
	}(function (loadImage) {
	  'use strict'

	  loadImage.ExifMap.prototype.tags = {
	    // =================
	    // TIFF tags (IFD0):
	    // =================
	    0x0100: 'ImageWidth',
	    0x0101: 'ImageHeight',
	    0x8769: 'ExifIFDPointer',
	    0x8825: 'GPSInfoIFDPointer',
	    0xA005: 'InteroperabilityIFDPointer',
	    0x0102: 'BitsPerSample',
	    0x0103: 'Compression',
	    0x0106: 'PhotometricInterpretation',
	    0x0112: 'Orientation',
	    0x0115: 'SamplesPerPixel',
	    0x011C: 'PlanarConfiguration',
	    0x0212: 'YCbCrSubSampling',
	    0x0213: 'YCbCrPositioning',
	    0x011A: 'XResolution',
	    0x011B: 'YResolution',
	    0x0128: 'ResolutionUnit',
	    0x0111: 'StripOffsets',
	    0x0116: 'RowsPerStrip',
	    0x0117: 'StripByteCounts',
	    0x0201: 'JPEGInterchangeFormat',
	    0x0202: 'JPEGInterchangeFormatLength',
	    0x012D: 'TransferFunction',
	    0x013E: 'WhitePoint',
	    0x013F: 'PrimaryChromaticities',
	    0x0211: 'YCbCrCoefficients',
	    0x0214: 'ReferenceBlackWhite',
	    0x0132: 'DateTime',
	    0x010E: 'ImageDescription',
	    0x010F: 'Make',
	    0x0110: 'Model',
	    0x0131: 'Software',
	    0x013B: 'Artist',
	    0x8298: 'Copyright',
	    // ==================
	    // Exif Sub IFD tags:
	    // ==================
	    0x9000: 'ExifVersion', // EXIF version
	    0xA000: 'FlashpixVersion', // Flashpix format version
	    0xA001: 'ColorSpace', // Color space information tag
	    0xA002: 'PixelXDimension', // Valid width of meaningful image
	    0xA003: 'PixelYDimension', // Valid height of meaningful image
	    0xA500: 'Gamma',
	    0x9101: 'ComponentsConfiguration', // Information about channels
	    0x9102: 'CompressedBitsPerPixel', // Compressed bits per pixel
	    0x927C: 'MakerNote', // Any desired information written by the manufacturer
	    0x9286: 'UserComment', // Comments by user
	    0xA004: 'RelatedSoundFile', // Name of related sound file
	    0x9003: 'DateTimeOriginal', // Date and time when the original image was generated
	    0x9004: 'DateTimeDigitized', // Date and time when the image was stored digitally
	    0x9290: 'SubSecTime', // Fractions of seconds for DateTime
	    0x9291: 'SubSecTimeOriginal', // Fractions of seconds for DateTimeOriginal
	    0x9292: 'SubSecTimeDigitized', // Fractions of seconds for DateTimeDigitized
	    0x829A: 'ExposureTime', // Exposure time (in seconds)
	    0x829D: 'FNumber',
	    0x8822: 'ExposureProgram', // Exposure program
	    0x8824: 'SpectralSensitivity', // Spectral sensitivity
	    0x8827: 'PhotographicSensitivity', // EXIF 2.3, ISOSpeedRatings in EXIF 2.2
	    0x8828: 'OECF', // Optoelectric conversion factor
	    0x8830: 'SensitivityType',
	    0x8831: 'StandardOutputSensitivity',
	    0x8832: 'RecommendedExposureIndex',
	    0x8833: 'ISOSpeed',
	    0x8834: 'ISOSpeedLatitudeyyy',
	    0x8835: 'ISOSpeedLatitudezzz',
	    0x9201: 'ShutterSpeedValue', // Shutter speed
	    0x9202: 'ApertureValue', // Lens aperture
	    0x9203: 'BrightnessValue', // Value of brightness
	    0x9204: 'ExposureBias', // Exposure bias
	    0x9205: 'MaxApertureValue', // Smallest F number of lens
	    0x9206: 'SubjectDistance', // Distance to subject in meters
	    0x9207: 'MeteringMode', // Metering mode
	    0x9208: 'LightSource', // Kind of light source
	    0x9209: 'Flash', // Flash status
	    0x9214: 'SubjectArea', // Location and area of main subject
	    0x920A: 'FocalLength', // Focal length of the lens in mm
	    0xA20B: 'FlashEnergy', // Strobe energy in BCPS
	    0xA20C: 'SpatialFrequencyResponse',
	    0xA20E: 'FocalPlaneXResolution', // Number of pixels in width direction per FPRUnit
	    0xA20F: 'FocalPlaneYResolution', // Number of pixels in height direction per FPRUnit
	    0xA210: 'FocalPlaneResolutionUnit', // Unit for measuring the focal plane resolution
	    0xA214: 'SubjectLocation', // Location of subject in image
	    0xA215: 'ExposureIndex', // Exposure index selected on camera
	    0xA217: 'SensingMethod', // Image sensor type
	    0xA300: 'FileSource', // Image source (3 == DSC)
	    0xA301: 'SceneType', // Scene type (1 == directly photographed)
	    0xA302: 'CFAPattern', // Color filter array geometric pattern
	    0xA401: 'CustomRendered', // Special processing
	    0xA402: 'ExposureMode', // Exposure mode
	    0xA403: 'WhiteBalance', // 1 = auto white balance, 2 = manual
	    0xA404: 'DigitalZoomRatio', // Digital zoom ratio
	    0xA405: 'FocalLengthIn35mmFilm',
	    0xA406: 'SceneCaptureType', // Type of scene
	    0xA407: 'GainControl', // Degree of overall image gain adjustment
	    0xA408: 'Contrast', // Direction of contrast processing applied by camera
	    0xA409: 'Saturation', // Direction of saturation processing applied by camera
	    0xA40A: 'Sharpness', // Direction of sharpness processing applied by camera
	    0xA40B: 'DeviceSettingDescription',
	    0xA40C: 'SubjectDistanceRange', // Distance to subject
	    0xA420: 'ImageUniqueID', // Identifier assigned uniquely to each image
	    0xA430: 'CameraOwnerName',
	    0xA431: 'BodySerialNumber',
	    0xA432: 'LensSpecification',
	    0xA433: 'LensMake',
	    0xA434: 'LensModel',
	    0xA435: 'LensSerialNumber',
	    // ==============
	    // GPS Info tags:
	    // ==============
	    0x0000: 'GPSVersionID',
	    0x0001: 'GPSLatitudeRef',
	    0x0002: 'GPSLatitude',
	    0x0003: 'GPSLongitudeRef',
	    0x0004: 'GPSLongitude',
	    0x0005: 'GPSAltitudeRef',
	    0x0006: 'GPSAltitude',
	    0x0007: 'GPSTimeStamp',
	    0x0008: 'GPSSatellites',
	    0x0009: 'GPSStatus',
	    0x000A: 'GPSMeasureMode',
	    0x000B: 'GPSDOP',
	    0x000C: 'GPSSpeedRef',
	    0x000D: 'GPSSpeed',
	    0x000E: 'GPSTrackRef',
	    0x000F: 'GPSTrack',
	    0x0010: 'GPSImgDirectionRef',
	    0x0011: 'GPSImgDirection',
	    0x0012: 'GPSMapDatum',
	    0x0013: 'GPSDestLatitudeRef',
	    0x0014: 'GPSDestLatitude',
	    0x0015: 'GPSDestLongitudeRef',
	    0x0016: 'GPSDestLongitude',
	    0x0017: 'GPSDestBearingRef',
	    0x0018: 'GPSDestBearing',
	    0x0019: 'GPSDestDistanceRef',
	    0x001A: 'GPSDestDistance',
	    0x001B: 'GPSProcessingMethod',
	    0x001C: 'GPSAreaInformation',
	    0x001D: 'GPSDateStamp',
	    0x001E: 'GPSDifferential',
	    0x001F: 'GPSHPositioningError'
	  }

	  loadImage.ExifMap.prototype.stringValues = {
	    ExposureProgram: {
	      0: 'Undefined',
	      1: 'Manual',
	      2: 'Normal program',
	      3: 'Aperture priority',
	      4: 'Shutter priority',
	      5: 'Creative program',
	      6: 'Action program',
	      7: 'Portrait mode',
	      8: 'Landscape mode'
	    },
	    MeteringMode: {
	      0: 'Unknown',
	      1: 'Average',
	      2: 'CenterWeightedAverage',
	      3: 'Spot',
	      4: 'MultiSpot',
	      5: 'Pattern',
	      6: 'Partial',
	      255: 'Other'
	    },
	    LightSource: {
	      0: 'Unknown',
	      1: 'Daylight',
	      2: 'Fluorescent',
	      3: 'Tungsten (incandescent light)',
	      4: 'Flash',
	      9: 'Fine weather',
	      10: 'Cloudy weather',
	      11: 'Shade',
	      12: 'Daylight fluorescent (D 5700 - 7100K)',
	      13: 'Day white fluorescent (N 4600 - 5400K)',
	      14: 'Cool white fluorescent (W 3900 - 4500K)',
	      15: 'White fluorescent (WW 3200 - 3700K)',
	      17: 'Standard light A',
	      18: 'Standard light B',
	      19: 'Standard light C',
	      20: 'D55',
	      21: 'D65',
	      22: 'D75',
	      23: 'D50',
	      24: 'ISO studio tungsten',
	      255: 'Other'
	    },
	    Flash: {
	      0x0000: 'Flash did not fire',
	      0x0001: 'Flash fired',
	      0x0005: 'Strobe return light not detected',
	      0x0007: 'Strobe return light detected',
	      0x0009: 'Flash fired, compulsory flash mode',
	      0x000D: 'Flash fired, compulsory flash mode, return light not detected',
	      0x000F: 'Flash fired, compulsory flash mode, return light detected',
	      0x0010: 'Flash did not fire, compulsory flash mode',
	      0x0018: 'Flash did not fire, auto mode',
	      0x0019: 'Flash fired, auto mode',
	      0x001D: 'Flash fired, auto mode, return light not detected',
	      0x001F: 'Flash fired, auto mode, return light detected',
	      0x0020: 'No flash function',
	      0x0041: 'Flash fired, red-eye reduction mode',
	      0x0045: 'Flash fired, red-eye reduction mode, return light not detected',
	      0x0047: 'Flash fired, red-eye reduction mode, return light detected',
	      0x0049: 'Flash fired, compulsory flash mode, red-eye reduction mode',
	      0x004D: 'Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected',
	      0x004F: 'Flash fired, compulsory flash mode, red-eye reduction mode, return light detected',
	      0x0059: 'Flash fired, auto mode, red-eye reduction mode',
	      0x005D: 'Flash fired, auto mode, return light not detected, red-eye reduction mode',
	      0x005F: 'Flash fired, auto mode, return light detected, red-eye reduction mode'
	    },
	    SensingMethod: {
	      1: 'Undefined',
	      2: 'One-chip color area sensor',
	      3: 'Two-chip color area sensor',
	      4: 'Three-chip color area sensor',
	      5: 'Color sequential area sensor',
	      7: 'Trilinear sensor',
	      8: 'Color sequential linear sensor'
	    },
	    SceneCaptureType: {
	      0: 'Standard',
	      1: 'Landscape',
	      2: 'Portrait',
	      3: 'Night scene'
	    },
	    SceneType: {
	      1: 'Directly photographed'
	    },
	    CustomRendered: {
	      0: 'Normal process',
	      1: 'Custom process'
	    },
	    WhiteBalance: {
	      0: 'Auto white balance',
	      1: 'Manual white balance'
	    },
	    GainControl: {
	      0: 'None',
	      1: 'Low gain up',
	      2: 'High gain up',
	      3: 'Low gain down',
	      4: 'High gain down'
	    },
	    Contrast: {
	      0: 'Normal',
	      1: 'Soft',
	      2: 'Hard'
	    },
	    Saturation: {
	      0: 'Normal',
	      1: 'Low saturation',
	      2: 'High saturation'
	    },
	    Sharpness: {
	      0: 'Normal',
	      1: 'Soft',
	      2: 'Hard'
	    },
	    SubjectDistanceRange: {
	      0: 'Unknown',
	      1: 'Macro',
	      2: 'Close view',
	      3: 'Distant view'
	    },
	    FileSource: {
	      3: 'DSC'
	    },
	    ComponentsConfiguration: {
	      0: '',
	      1: 'Y',
	      2: 'Cb',
	      3: 'Cr',
	      4: 'R',
	      5: 'G',
	      6: 'B'
	    },
	    Orientation: {
	      1: 'top-left',
	      2: 'top-right',
	      3: 'bottom-right',
	      4: 'bottom-left',
	      5: 'left-top',
	      6: 'right-top',
	      7: 'right-bottom',
	      8: 'left-bottom'
	    }
	  }

	  loadImage.ExifMap.prototype.getText = function (id) {
	    var value = this.get(id)
	    switch (id) {
	      case 'LightSource':
	      case 'Flash':
	      case 'MeteringMode':
	      case 'ExposureProgram':
	      case 'SensingMethod':
	      case 'SceneCaptureType':
	      case 'SceneType':
	      case 'CustomRendered':
	      case 'WhiteBalance':
	      case 'GainControl':
	      case 'Contrast':
	      case 'Saturation':
	      case 'Sharpness':
	      case 'SubjectDistanceRange':
	      case 'FileSource':
	      case 'Orientation':
	        return this.stringValues[id][value]
	      case 'ExifVersion':
	      case 'FlashpixVersion':
	        if (!value) return
	        return String.fromCharCode(value[0], value[1], value[2], value[3])
	      case 'ComponentsConfiguration':
	        if (!value) return
	        return this.stringValues[id][value[0]] +
	        this.stringValues[id][value[1]] +
	        this.stringValues[id][value[2]] +
	        this.stringValues[id][value[3]]
	      case 'GPSVersionID':
	        if (!value) return
	        return value[0] + '.' + value[1] + '.' + value[2] + '.' + value[3]
	    }
	    return String(value)
	  }

	  ;(function (exifMapPrototype) {
	    var tags = exifMapPrototype.tags
	    var map = exifMapPrototype.map
	    var prop
	    // Map the tag names to tags:
	    for (prop in tags) {
	      if (tags.hasOwnProperty(prop)) {
	        map[tags[prop]] = prop
	      }
	    }
	  }(loadImage.ExifMap.prototype))

	  loadImage.ExifMap.prototype.getAll = function () {
	    var map = {}
	    var prop
	    var id
	    for (prop in this) {
	      if (this.hasOwnProperty(prop)) {
	        id = this.tags[prop]
	        if (id) {
	          map[id] = this.getText(id)
	        }
	      }
	    }
	    return map
	  }
	}))
	});

	interopDefault(loadImageExifMap);

	var loadImageOrientation = createCommonjsModule(function (module) {
	/*
	 * JavaScript Load Image Orientation
	 * https://github.com/blueimp/JavaScript-Load-Image
	 *
	 * Copyright 2013, Sebastian Tschan
	 * https://blueimp.net
	 *
	 * Licensed under the MIT license:
	 * http://www.opensource.org/licenses/MIT
	 */

	/* global define */

	;(function (factory) {
	  'use strict'
	  if (typeof define === 'function' && define.amd) {
	    // Register as an anonymous AMD module:
	    define(['./load-image'], factory)
	  } else if (typeof module === 'object' && module.exports) {
	    factory(interopDefault(require$$0))
	  } else {
	    // Browser globals:
	    factory(window.loadImage)
	  }
	}(function (loadImage) {
	  'use strict'

	  var originalHasCanvasOption = loadImage.hasCanvasOption
	  var originalHasMetaOption = loadImage.hasMetaOption
	  var originalTransformCoordinates = loadImage.transformCoordinates
	  var originalGetTransformedOptions = loadImage.getTransformedOptions

	  // Determines if the target image should be a canvas element:
	  loadImage.hasCanvasOption = function (options) {
	    return !!options.orientation ||
	      originalHasCanvasOption.call(loadImage, options)
	  }

	  // Determines if meta data should be loaded automatically:
	  loadImage.hasMetaOption = function (options) {
	    return options.orientation === true ||
	      originalHasMetaOption.call(loadImage, options)
	  }

	  // Transform image orientation based on
	  // the given EXIF orientation option:
	  loadImage.transformCoordinates = function (canvas, options) {
	    originalTransformCoordinates.call(loadImage, canvas, options)
	    var ctx = canvas.getContext('2d')
	    var width = canvas.width
	    var height = canvas.height
	    var styleWidth = canvas.style.width
	    var styleHeight = canvas.style.height
	    var orientation = options.orientation
	    if (!orientation || orientation > 8) {
	      return
	    }
	    if (orientation > 4) {
	      canvas.width = height
	      canvas.height = width
	      canvas.style.width = styleHeight
	      canvas.style.height = styleWidth
	    }
	    switch (orientation) {
	      case 2:
	        // horizontal flip
	        ctx.translate(width, 0)
	        ctx.scale(-1, 1)
	        break
	      case 3:
	        // 180° rotate left
	        ctx.translate(width, height)
	        ctx.rotate(Math.PI)
	        break
	      case 4:
	        // vertical flip
	        ctx.translate(0, height)
	        ctx.scale(1, -1)
	        break
	      case 5:
	        // vertical flip + 90 rotate right
	        ctx.rotate(0.5 * Math.PI)
	        ctx.scale(1, -1)
	        break
	      case 6:
	        // 90° rotate right
	        ctx.rotate(0.5 * Math.PI)
	        ctx.translate(0, -height)
	        break
	      case 7:
	        // horizontal flip + 90 rotate right
	        ctx.rotate(0.5 * Math.PI)
	        ctx.translate(width, -height)
	        ctx.scale(-1, 1)
	        break
	      case 8:
	        // 90° rotate left
	        ctx.rotate(-0.5 * Math.PI)
	        ctx.translate(-width, 0)
	        break
	    }
	  }

	  // Transforms coordinate and dimension options
	  // based on the given orientation option:
	  loadImage.getTransformedOptions = function (img, opts, data) {
	    var options = originalGetTransformedOptions.call(loadImage, img, opts)
	    var orientation = options.orientation
	    var newOptions
	    var i
	    if (orientation === true && data && data.exif) {
	      orientation = data.exif.get('Orientation')
	    }
	    if (!orientation || orientation > 8 || orientation === 1) {
	      return options
	    }
	    newOptions = {}
	    for (i in options) {
	      if (options.hasOwnProperty(i)) {
	        newOptions[i] = options[i]
	      }
	    }
	    newOptions.orientation = orientation
	    switch (orientation) {
	      case 2:
	        // horizontal flip
	        newOptions.left = options.right
	        newOptions.right = options.left
	        break
	      case 3:
	        // 180° rotate left
	        newOptions.left = options.right
	        newOptions.top = options.bottom
	        newOptions.right = options.left
	        newOptions.bottom = options.top
	        break
	      case 4:
	        // vertical flip
	        newOptions.top = options.bottom
	        newOptions.bottom = options.top
	        break
	      case 5:
	        // vertical flip + 90 rotate right
	        newOptions.left = options.top
	        newOptions.top = options.left
	        newOptions.right = options.bottom
	        newOptions.bottom = options.right
	        break
	      case 6:
	        // 90° rotate right
	        newOptions.left = options.top
	        newOptions.top = options.right
	        newOptions.right = options.bottom
	        newOptions.bottom = options.left
	        break
	      case 7:
	        // horizontal flip + 90 rotate right
	        newOptions.left = options.bottom
	        newOptions.top = options.right
	        newOptions.right = options.top
	        newOptions.bottom = options.left
	        break
	      case 8:
	        // 90° rotate left
	        newOptions.left = options.bottom
	        newOptions.top = options.left
	        newOptions.right = options.top
	        newOptions.bottom = options.right
	        break
	    }
	    if (options.orientation > 4) {
	      newOptions.maxWidth = options.maxHeight
	      newOptions.maxHeight = options.maxWidth
	      newOptions.minWidth = options.minHeight
	      newOptions.minHeight = options.minWidth
	      newOptions.sourceWidth = options.sourceHeight
	      newOptions.sourceHeight = options.sourceWidth
	    }
	    return newOptions
	  }
	}))
	});

	interopDefault(loadImageOrientation);

	var index = createCommonjsModule(function (module) {
	module.exports = interopDefault(require$$0)
	});

	var LoadImage = interopDefault(index);

	var HEADER_HEIGHT = 72;

	var PAGES = {
	  HOME: 'home',
	  ANNOTATE: 'annotate',
	  SNAPSHOT: 'snapshot',
	  SHARE: 'share',
	  ABOUT: 'about'
	};

	var liveCamera = false;

	function isLiveCamera() {
	  return liveCamera;
	}

	function setLiveCamera(isLiveCamera) {
	  liveCamera = isLiveCamera;
	}

	var DEFAULT_POPUP_SHOW_TIME = 5000;

	var toolbars = document.getElementsByClassName('toolbar');
	var pages = document.getElementsByClassName('page');
	var prompts = document.getElementsByClassName('prompt');

	/**
	 * Thanks to: http://gorigins.com/posting-a-canvas-image-to-facebook-and-twitter/
	 */
	function dataURItoBlob(dataURI) {
	  var byteString = atob(dataURI.split(',')[1]);
	  var ab = new ArrayBuffer(byteString.length);
	  var ia = new Uint8Array(ab);
	  for (var i = 0; i < byteString.length; i++) {
	    ia[i] = byteString.charCodeAt(i);
	  }
	  return new Blob([ab], { type: 'image/png' });
	}

	function hide(elements) {
	  for (var i = 0; i < elements.length; i++) {
	    elements[i].style.display = 'none';
	  }
	}

	function updateToolbarVisibility(pageRef) {
	  hide(toolbars);
	  var toolbar = document.getElementById('toolbar-' + pageRef);
	  if (toolbar) {
	    toolbar.style.display = 'flex';
	  }
	}

	function updatePageVisibility(pageRef) {
	  hide(pages);
	  var page = document.getElementById('page-' + pageRef);
	  if (page) {
	    page.style.display = 'block';
	  }
	}

	function showPrompt(ref) {

	  hide(prompts);

	  var prompt = document.getElementById('prompt-' + ref);

	  if (prompt) {
	    prompt.classList.remove('fade-out');
	    prompt.style.display = 'block';

	    setTimeout(function () {
	      prompt.classList.add('fade-out');
	    }, DEFAULT_POPUP_SHOW_TIME);
	  }
	}

	function showPage(pageRef) {
	  updateToolbarVisibility(pageRef);
	  updatePageVisibility(pageRef);
	  showPrompt(pageRef);
	}

	var video = document.querySelector('video');
	var canvas = document.getElementById('canvas-camera');
	var context$1 = context$1 = canvas.getContext('2d');
	var isCanvasResized = false;

	function copyVideoToCanvas() {

	  // It takes a while for the video dimensions to be established, so keep checking until they have
	  if (!isCanvasResized && video.videoWidth) {
	    resizeCanvasToVideo();
	  }

	  context$1.fillRect(0, 0, video.videoWidth, video.videoHeight);
	  context$1.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

	  requestAnimationFrame(copyVideoToCanvas);
	}

	function showUnsupported() {
	  showPrompt('webrtc-unsupported');
	}

	/**
	 * The video should hopefully be the same as our canvas size, if our constraints were obeyed.
	 * But this fixes video being potentially stretched (e.g. Samsung Internet in standalone mode).
	 */
	function resizeCanvasToVideo() {
	  canvas.width = video.videoWidth;
	  canvas.height = video.videoHeight;
	  isCanvasResized = true;
	}

	function initCamera() {

	  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
	    showUnsupported();
	    return;
	  }

	  video.style.display = 'block';

	  var maxWidth = canvas.clientWidth;
	  var maxHeight = canvas.clientHeight;

	  var constraints = {
	    width: { ideal: maxWidth, max: maxWidth },
	    height: { ideal: maxHeight, max: maxHeight }
	  };

	  navigator.mediaDevices.getUserMedia({ audio: false, video: constraints }).then(function (stream) {

	    var videoTracks = stream.getVideoTracks();

	    console.log('Using video device: ' + videoTracks[0].label);

	    stream.oninactive = function () {
	      console.log('Stream inactive');
	    };

	    // Older browsers may not have srcObject
	    if ('srcObject' in video) {
	      video.srcObject = stream;
	    } else {
	      // Avoid using this in new browsers, as it is going away.
	      video.src = window.URL.createObjectURL(stream);
	    }

	    requestAnimationFrame(copyVideoToCanvas);
	  }).catch(function (err) {
	    console.error('getUserMedia error', err);
	    showUnsupported();
	  });
	}

	function init$1() {
	  initCamera();
	}

	var emojiImages = ["/images/emoji/f1.svg","/images/emoji/f10.svg","/images/emoji/f11.svg","/images/emoji/f12.svg","/images/emoji/f13.svg","/images/emoji/f14.svg","/images/emoji/f15.svg","/images/emoji/f16.svg","/images/emoji/f17.svg","/images/emoji/f18.svg","/images/emoji/f19.svg","/images/emoji/f2.svg","/images/emoji/f20.svg","/images/emoji/f21.svg","/images/emoji/f22.svg","/images/emoji/f23.svg","/images/emoji/f24.svg","/images/emoji/f25.svg","/images/emoji/f26.svg","/images/emoji/f27.svg","/images/emoji/f28.svg","/images/emoji/f29.svg","/images/emoji/f3.svg","/images/emoji/f30.svg","/images/emoji/f31.svg","/images/emoji/f32.svg","/images/emoji/f33.svg","/images/emoji/f34.svg","/images/emoji/f35.svg","/images/emoji/f36.svg","/images/emoji/f37.svg","/images/emoji/f38.svg","/images/emoji/f39.svg","/images/emoji/f4.svg","/images/emoji/f40.svg","/images/emoji/f5.svg","/images/emoji/f6.svg","/images/emoji/f7.svg","/images/emoji/f8.svg","/images/emoji/f9.svg","/images/emoji/g1.svg","/images/emoji/g10.svg","/images/emoji/g11.svg","/images/emoji/g12.svg","/images/emoji/g13.svg","/images/emoji/g14.svg","/images/emoji/g2.svg","/images/emoji/g3.svg","/images/emoji/g4.svg","/images/emoji/g5.svg","/images/emoji/g6.svg","/images/emoji/g7.svg","/images/emoji/g8.svg","/images/emoji/g9.svg","/images/emoji/h1.svg","/images/emoji/h10.svg","/images/emoji/h11.svg","/images/emoji/h12.svg","/images/emoji/h13.svg","/images/emoji/h14.svg","/images/emoji/h15.svg","/images/emoji/h16.svg","/images/emoji/h17.svg","/images/emoji/h18.svg","/images/emoji/h19.svg","/images/emoji/h2.svg","/images/emoji/h20.svg","/images/emoji/h21.svg","/images/emoji/h22.svg","/images/emoji/h23.svg","/images/emoji/h24.svg","/images/emoji/h3.svg","/images/emoji/h4.svg","/images/emoji/h5.svg","/images/emoji/h6.svg","/images/emoji/h7.svg","/images/emoji/h8.svg","/images/emoji/h9.svg","/images/emoji/i0.svg","/images/emoji/i1.svg","/images/emoji/i10.svg","/images/emoji/i11.svg","/images/emoji/i12.svg","/images/emoji/i13.svg","/images/emoji/i14.svg","/images/emoji/i2.svg","/images/emoji/i3.svg","/images/emoji/i4.svg","/images/emoji/i5.svg","/images/emoji/i6.svg","/images/emoji/i7.svg","/images/emoji/i8.svg","/images/emoji/k1.svg","/images/emoji/k10.svg","/images/emoji/k11.svg","/images/emoji/k12.svg","/images/emoji/k13_diego.svg","/images/emoji/k14.svg","/images/emoji/k15.svg","/images/emoji/k16.svg","/images/emoji/k17.svg","/images/emoji/k18.svg","/images/emoji/k19.svg","/images/emoji/k2.svg","/images/emoji/k20.svg","/images/emoji/k3.svg","/images/emoji/k3b.svg","/images/emoji/k4.svg","/images/emoji/k5.svg","/images/emoji/k6.svg","/images/emoji/k7.svg","/images/emoji/k8.svg","/images/emoji/k9.svg","/images/emoji/l1.svg","/images/emoji/l2.svg","/images/emoji/l3.svg","/images/emoji/l4.svg","/images/emoji/n1.svg","/images/emoji/n10.svg","/images/emoji/n11.svg","/images/emoji/n12.svg","/images/emoji/n2.svg","/images/emoji/n3.svg","/images/emoji/n4.svg","/images/emoji/n5.svg","/images/emoji/n6.svg","/images/emoji/n7.svg","/images/emoji/n8.svg","/images/emoji/n9.svg","/images/emoji/o1.svg","/images/emoji/o2.svg","/images/emoji/o3.svg","/images/emoji/o4.svg","/images/emoji/o5.svg","/images/emoji/o6.svg","/images/emoji/o7.svg","/images/emoji/o8.svg","/images/emoji/p1.svg","/images/emoji/p2.svg","/images/emoji/q1.svg","/images/emoji/q2.svg","/images/emoji/q3.svg","/images/emoji/q4.svg","/images/emoji/q5.svg","/images/emoji/q6.svg","/images/emoji/q7.svg","/images/emoji/s1.svg","/images/emoji/s2.svg","/images/emoji/s3.svg","/images/emoji/s4.svg","/images/emoji/s5.svg","/images/emoji/s6.svg","/images/emoji/u1.svg","/images/emoji/u2.svg","/images/emoji/u3.svg","/images/emoji/u4.svg","/images/emoji/u5.svg","/images/emoji/u6.svg","/images/emoji/u7.svg","/images/emoji/v1.svg","/images/emoji/v2.svg","/images/emoji/w1.svg","/images/emoji/w2.svg","/images/emoji/w3.svg","/images/emoji/w4.svg","/images/emoji/w5.svg","/images/emoji/w6.svg","/images/emoji/w7.svg"];

	var DEFAULT_COLOUR = '#000000';
	var DEFAULT_LINE_WIDTH = 2;

	var TOOL_PENCIL = 0;
	var TOOL_BRUSH = 1;
	var TOOL_EMOJI = 2;

	var canvasDraw = document.getElementById('canvas-draw');
	var canvasEmoji = document.getElementById('canvas-emoji');
	var ctxDraw = canvasDraw.getContext('2d');
	var ctxEmoji = canvasEmoji.getContext('2d');

	var chosenTool = TOOL_PENCIL;
	var toolsMenuButton = document.getElementById('btn-tools');
	var toolsModal = document.getElementById('modal-tools');
	var pencilButton = document.getElementById('btn-pencil');
	var brushButton = document.getElementById('btn-brush');
	var emojiMenuButton = document.getElementById('btn-emoji');
	var emojiModal = document.getElementById('modal-emoji');
	var optionsMenuButton = document.getElementById('btn-options');
	var optionsModal = document.getElementById('modal-options');
	var colourInputContainer = document.getElementById('input-colour-container');
	var colourInput = document.getElementById('input-colour');
	var sizeInput = document.getElementById('input-size');
	var sizeOutput = document.getElementById('size-output');
	var trashButton = document.getElementById('btn-trash');

	var touchedEmojiIndex = -1;
	var chosenEmoji = null;
	var resizeTouchDelta = null;
	var moveTouchDelta = null;
	var isDrawing = false;
	var isRedrawing = false;
	var isResizing = false;

	// Store emoji details so we can redraw them when moved/resized
	var stampedEmojis = [];

	/**
	 * Returns index of touched emoji in the stampedEmojis, or -1 if none touched.
	 */
	function indexOfSelectedEmoji(coords) {

	  // Go through in reverse order to select top-most if overlapping
	  for (var i = stampedEmojis.length - 1; i >= 0; i--) {

	    var emoji = stampedEmojis[i];

	    if (coords.x >= emoji.x - emoji.width / 2 && coords.x <= emoji.x + emoji.width / 2 && coords.y >= emoji.y - emoji.height / 2 && coords.y <= emoji.y + emoji.height / 2) {
	      return i;
	    }
	  }

	  return -1;
	}

	function drawEmoji(emoji, coords, width, height, isSelected) {

	  // Centre the image around tap/click coords
	  var x = coords.x - width / 2;
	  var y = coords.y - height / 2;

	  ctxEmoji.drawImage(emoji, x, y, width, height);

	  if (isSelected) {
	    // Highlight with a border
	    var prevStrokeStyle = ctxEmoji.strokeStyle;
	    var prevLineWidth = ctxEmoji.lineWidth;
	    ctxEmoji.strokeStyle = '#10f9e6';
	    ctxEmoji.lineWidth = 2;
	    ctxEmoji.setLineDash([5, 2]);
	    ctxEmoji.strokeRect(x - 2, y - 2, width + 4, height + 4);
	    ctxEmoji.strokeStyle = prevStrokeStyle;
	    ctxEmoji.lineWidth = prevLineWidth;
	    ctxEmoji.setLineDash([]);
	  }
	}

	function onDrawingMouseDown(coords) {

	  var x = coords.x;
	  var y = coords.y;

	  ctxDraw.beginPath();
	  ctxDraw.moveTo(x, y);

	  isDrawing = true;
	}

	function closeModals() {
	  optionsModal.classList.remove('show');
	  toolsModal.classList.remove('show');
	  emojiModal.classList.remove('show');
	}

	function onTouchStartOrMouseDown(e) {

	  e.preventDefault();

	  closeModals();

	  var touch = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : null;

	  var coords = touch ? { x: touch.pageX - canvasEmoji.offsetLeft, y: touch.pageY - canvasEmoji.offsetTop - HEADER_HEIGHT } : { x: e.clientX - canvasEmoji.offsetLeft, y: e.clientY - canvasEmoji.offsetTop - HEADER_HEIGHT };

	  touchedEmojiIndex = indexOfSelectedEmoji(coords);

	  if (touchedEmojiIndex > -1) {
	    // Selected an existing emoji - fall through
	    redrawEmojisOnNextFrame();
	    return;
	  }

	  if (chosenTool === TOOL_EMOJI) {

	    if (chosenEmoji) {

	      // Add new emoji
	      // Increase default SVG size
	      var width = chosenEmoji.width * 2.5;
	      var height = chosenEmoji.height * 2.5;

	      stampedEmojis.push({
	        image: chosenEmoji,
	        x: coords.x,
	        y: coords.y,
	        width: width,
	        height: height
	      });
	    }

	    // Reset chosen emoji. It only stamps once, to avoid accidental multiple taps.
	    chosenEmoji = null;
	    redrawEmojisOnNextFrame();
	  } else {

	    chosenEmoji = null;
	    redrawEmojisOnNextFrame();

	    onDrawingMouseDown(coords);
	  }
	}

	function onTouchMoveOrMouseMove(e) {

	  e.preventDefault();

	  var touches = e.changedTouches || [];
	  var touch1 = touches.length ? touches[0] : null;
	  var touch2 = touches.length > 1 ? touches[1] : null;

	  var coords1 = touch1 ? { x: touch1.pageX - canvasEmoji.offsetLeft, y: touch1.pageY - canvasEmoji.offsetTop - HEADER_HEIGHT } : { x: e.clientX - canvasEmoji.offsetLeft, y: e.clientY - canvasEmoji.offsetTop - HEADER_HEIGHT };

	  if (touchedEmojiIndex >= 0) {

	    var emoji = stampedEmojis[touchedEmojiIndex];

	    if (touch2) {

	      // Resize emoji
	      isResizing = true;

	      var coords2 = { x: touch2.pageX - canvasEmoji.offsetLeft, y: touch2.pageY - canvasEmoji.offsetTop - HEADER_HEIGHT };
	      var newResizeTouchDelta = { x: Math.abs(coords2.x - coords1.x),
	        y: Math.abs(coords2.y - coords1.y) };

	      if (resizeTouchDelta) {

	        emoji.width += newResizeTouchDelta.x - resizeTouchDelta.x;
	        emoji.height += newResizeTouchDelta.y - resizeTouchDelta.y;

	        redrawEmojisOnNextFrame();
	      }

	      resizeTouchDelta = newResizeTouchDelta;
	    } else if (!isResizing) {

	      if (moveTouchDelta) {

	        // Single touch - moving the emoji - update its position
	        emoji.x = coords1.x - moveTouchDelta.x;
	        emoji.y = coords1.y - moveTouchDelta.y;

	        redrawEmojisOnNextFrame();
	      } else {

	        moveTouchDelta = { x: coords1.x - emoji.x, y: coords1.y - emoji.y };
	      }
	    }
	  } else if (isDrawing) {

	    ctxDraw.lineTo(coords1.x, coords1.y);
	    ctxDraw.stroke();
	  }
	}

	function onTouchEndOrMouseUp(e) {
	  isDrawing = false;
	  isResizing = false;
	  touchedEmojiIndex = -1;
	  resizeTouchDelta = null;
	  moveTouchDelta = null;
	}

	function highlightSelectedTool(selectedButton) {
	  var toolButtons = toolsModal.getElementsByTagName('button');
	  for (var i = 0; i < toolButtons.length; i++) {
	    var button = toolButtons[i];
	    if (button === selectedButton) {
	      button.classList.add('selected');
	    } else {
	      button.classList.remove('selected');
	    }
	  }
	}

	function onNewEmojiClick(event) {

	  chosenTool = TOOL_EMOJI;
	  chosenEmoji = event.currentTarget;

	  emojiModal.classList.remove('show');

	  highlightSelectedTool(emojiMenuButton);
	}

	function redrawEmojisOnNextFrame() {
	  if (!isRedrawing) {
	    isRedrawing = true;
	    requestAnimationFrame(redrawEmojis);
	  }
	}

	function redrawEmojis() {

	  //console.log('start redraw', performance.now());

	  ctxEmoji.clearRect(0, 0, canvasEmoji.width, canvasEmoji.height);

	  for (var i = 0; i < stampedEmojis.length; i++) {
	    var emoji = stampedEmojis[i];
	    drawEmoji(emoji.image, { x: emoji.x, y: emoji.y }, emoji.width, emoji.height, i === touchedEmojiIndex);
	  }

	  //console.log('finish redraw', performance.now());

	  isRedrawing = false;
	}

	function clearDrawing() {
	  ctxDraw.clearRect(0, 0, canvasDraw.width, canvasDraw.height);
	}

	function clearEmojis() {
	  stampedEmojis = [];
	  redrawEmojis();
	}

	function clearCanvases() {
	  clearDrawing();
	  clearEmojis();
	}

	function onColourClickOrChange() {
	  updateCanvasDrawContext();
	  colourInputContainer.classList.add('selected');
	  emojiMenuButton.classList.remove('selected');
	}

	function onSizeChange(event) {
	  updateCanvasDrawContext();
	  sizeOutput.innerHTML = event.target.value;
	}

	function initCanvases() {

	  // Emoji canvas is on top so will receive the interaction events
	  canvasEmoji.addEventListener('touchstart', onTouchStartOrMouseDown, false);
	  canvasEmoji.addEventListener('touchmove', onTouchMoveOrMouseMove, false);
	  canvasEmoji.addEventListener('touchend', onTouchEndOrMouseUp, false);

	  canvasEmoji.addEventListener('mousedown', onTouchStartOrMouseDown, false);
	  canvasEmoji.addEventListener('mousemove', onTouchMoveOrMouseMove, false);
	  canvasEmoji.addEventListener('mouseup', onTouchEndOrMouseUp, false);

	  ctxDraw.strokeStyle = DEFAULT_COLOUR;
	  ctxDraw.lineWidth = DEFAULT_LINE_WIDTH;
	  ctxDraw.lineJoin = 'round';
	  ctxDraw.lineCap = 'round';
	  ctxDraw.shadowColor = DEFAULT_COLOUR;
	}

	function updateCanvasDrawContext() {
	  ctxDraw.strokeStyle = colourInput.value;
	  ctxDraw.lineWidth = sizeInput.value;
	  ctxDraw.shadowBlur = chosenTool === TOOL_BRUSH ? 2 : 0;
	  ctxDraw.shadowColor = colourInput.value;
	}

	function initEmojis() {

	  var html = '';

	  for (var i = 0; i < emojiImages.length; i++) {
	    var path = emojiImages[i];
	    html += '<img src="' + path + '" alt="Emoji"/>';
	  }

	  emojiModal.innerHTML = html;
	}

	function initControls$2() {

	  toolsMenuButton.addEventListener('click', function () {
	    toolsModal.classList.toggle('show');
	    emojiModal.classList.remove('show');
	    optionsModal.classList.remove('show');
	  });

	  // Add click handlers to emojis so you can select one
	  var availableEmojis = document.querySelectorAll('#modal-emoji img');
	  for (var i = 0; i < availableEmojis.length; i++) {
	    var emoji = availableEmojis[i];
	    emoji.addEventListener('click', onNewEmojiClick);
	  }

	  emojiMenuButton.addEventListener('click', function () {
	    emojiModal.classList.toggle('show');
	    toolsModal.classList.toggle('show');
	  });

	  pencilButton.addEventListener('click', function () {
	    chosenTool = TOOL_PENCIL;
	    updateCanvasDrawContext();
	    toolsModal.classList.remove('show');
	    highlightSelectedTool(pencilButton);
	  });

	  brushButton.addEventListener('click', function () {
	    chosenTool = TOOL_BRUSH;
	    updateCanvasDrawContext();
	    toolsModal.classList.remove('show');
	    highlightSelectedTool(brushButton);
	  });

	  optionsMenuButton.addEventListener('click', function () {
	    optionsModal.classList.toggle('show');
	    toolsModal.classList.remove('show');
	    emojiModal.classList.remove('show');
	  });

	  colourInput.addEventListener('input', onColourClickOrChange);
	  colourInput.addEventListener('click', onColourClickOrChange);

	  sizeInput.addEventListener('change', onSizeChange);
	  sizeInput.value = DEFAULT_LINE_WIDTH;
	  sizeOutput.innerHTML = DEFAULT_LINE_WIDTH;

	  trashButton.addEventListener('click', function () {
	    // TODO introduce confirmation prompt!
	    clearCanvases();
	  });
	}

	var Draw = {

	  init: function init() {
	    initCanvases();
	    initEmojis();
	    initControls$2();
	  },

	  show: function show() {

	    if (isLiveCamera()) {
	      // For live camera view, default to taking up the full space available
	      canvasDraw.width = window.innerWidth;
	      canvasDraw.height = window.innerHeight - HEADER_HEIGHT;
	      canvasEmoji.width = canvasDraw.width;
	      canvasEmoji.height = canvasDraw.height;
	    }

	    // Hacky fix for some browsers no longer observing the centred position with position: absolute
	    canvasDraw.setAttribute('style', 'left: calc(50% - ' + canvasDraw.width / 2 + 'px); top: calc(50% - ' + canvasDraw.height / 2 + 'px)');
	    canvasEmoji.setAttribute('style', 'left: calc(50% - ' + canvasEmoji.width / 2 + 'px); top: calc(50% - ' + canvasEmoji.height / 2 + 'px)');
	  },

	  snapshot: function snapshot() {
	    // Remove highlights ready to snapshot the canvas
	    touchedEmojiIndex = -1;
	    redrawEmojis();
	  }

	};

	var hello_all = createCommonjsModule(function (module) {
	/*! hellojs v1.13.4 | (c) 2012-2016 Andrew Dodson | MIT https://adodson.com/hello.js/LICENSE */
	// ES5 Object.create
	if (!Object.create) {

		// Shim, Object create
		// A shim for Object.create(), it adds a prototype to a new object
		Object.create = (function() {

			function F() {}

			return function(o) {

				if (arguments.length != 1) {
					throw new Error('Object.create implementation only accepts one parameter.');
				}

				F.prototype = o;
				return new F();
			};

		})();

	}

	// ES5 Object.keys
	if (!Object.keys) {
		Object.keys = function(o, k, r) {
			r = [];
			for (k in o) {
				if (r.hasOwnProperty.call(o, k))
					r.push(k);
			}

			return r;
		};
	}

	// ES5 [].indexOf
	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(s) {

			for (var j = 0; j < this.length; j++) {
				if (this[j] === s) {
					return j;
				}
			}

			return -1;
		};
	}

	// ES5 [].forEach
	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function(fun/*, thisArg*/) {

			if (this === void 0 || this === null) {
				throw new TypeError();
			}

			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun !== 'function') {
				throw new TypeError();
			}

			var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
			for (var i = 0; i < len; i++) {
				if (i in t) {
					fun.call(thisArg, t[i], i, t);
				}
			}

			return this;
		};
	}

	// ES5 [].filter
	if (!Array.prototype.filter) {
		Array.prototype.filter = function(fun, thisArg) {

			var a = [];
			this.forEach(function(val, i, t) {
				if (fun.call(thisArg || void 0, val, i, t)) {
					a.push(val);
				}
			});

			return a;
		};
	}

	// Production steps of ECMA-262, Edition 5, 15.4.4.19
	// Reference: http://es5.github.io/#x15.4.4.19
	if (!Array.prototype.map) {

		Array.prototype.map = function(fun, thisArg) {

			var a = [];
			this.forEach(function(val, i, t) {
				a.push(fun.call(thisArg || void 0, val, i, t));
			});

			return a;
		};
	}

	// ES5 isArray
	if (!Array.isArray) {

		// Function Array.isArray
		Array.isArray = function(o) {
			return Object.prototype.toString.call(o) === '[object Array]';
		};

	}

	// Test for location.assign
	if (typeof window === 'object' && typeof window.location === 'object' && !window.location.assign) {

		window.location.assign = function(url) {
			window.location = url;
		};

	}

	// Test for Function.bind
	if (!Function.prototype.bind) {

		// MDN
		// Polyfill IE8, does not support native Function.bind
		Function.prototype.bind = function(b) {

			if (typeof this !== 'function') {
				throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
			}

			function C() {}

			var a = [].slice;
			var f = a.call(arguments, 1);
			var _this = this;
			var D = function() {
				return _this.apply(this instanceof C ? this : b || window, f.concat(a.call(arguments)));
			};

			C.prototype = this.prototype;
			D.prototype = new C();

			return D;
		};

	}

	/**
	 * @hello.js
	 *
	 * HelloJS is a client side Javascript SDK for making OAuth2 logins and subsequent REST calls.
	 *
	 * @author Andrew Dodson
	 * @website https://adodson.com/hello.js/
	 *
	 * @copyright Andrew Dodson, 2012 - 2015
	 * @license MIT: You are free to use and modify this code for any use, on the condition that this copyright notice remains.
	 */

	var hello = function(name) {
		return hello.use(name);
	};

	hello.utils = {

		// Extend the first object with the properties and methods of the second
		extend: function(r /*, a[, b[, ...]] */) {

			// Get the arguments as an array but ommit the initial item
			Array.prototype.slice.call(arguments, 1).forEach(function(a) {
				if (Array.isArray(r) && Array.isArray(a)) {
					Array.prototype.push.apply(r, a);
				}
				else if (r instanceof Object && a instanceof Object && r !== a) {
					for (var x in a) {
						r[x] = hello.utils.extend(r[x], a[x]);
					}
				}
				else {

					if (Array.isArray(a)) {
						// Clone it
						a = a.slice(0);
					}

					r = a;
				}
			});

			return r;
		}
	};

	// Core library
	hello.utils.extend(hello, {

		settings: {

			// OAuth2 authentication defaults
			redirect_uri: window.location.href.split('#')[0],
			response_type: 'token',
			display: 'popup',
			state: '',

			// OAuth1 shim
			// The path to the OAuth1 server for signing user requests
			// Want to recreate your own? Checkout https://github.com/MrSwitch/node-oauth-shim
			oauth_proxy: 'https://auth-server.herokuapp.com/proxy',

			// API timeout in milliseconds
			timeout: 20000,

			// Popup Options
			popup: {
				resizable: 1,
				scrollbars: 1,
				width: 500,
				height: 550
			},

			// Default scope
			// Many services require atleast a profile scope,
			// HelloJS automatially includes the value of provider.scope_map.basic
			// If that's not required it can be removed via hello.settings.scope.length = 0;
			scope: ['basic'],

			// Scope Maps
			// This is the default module scope, these are the defaults which each service is mapped too.
			// By including them here it prevents the scope from being applied accidentally
			scope_map: {
				basic: ''
			},

			// Default service / network
			default_service: null,

			// Force authentication
			// When hello.login is fired.
			// (null): ignore current session expiry and continue with login
			// (true): ignore current session expiry and continue with login, ask for user to reauthenticate
			// (false): if the current session looks good for the request scopes return the current session.
			force: null,

			// Page URL
			// When 'display=page' this property defines where the users page should end up after redirect_uri
			// Ths could be problematic if the redirect_uri is indeed the final place,
			// Typically this circumvents the problem of the redirect_url being a dumb relay page.
			page_uri: window.location.href
		},

		// Service configuration objects
		services: {},

		// Use
		// Define a new instance of the HelloJS library with a default service
		use: function(service) {

			// Create self, which inherits from its parent
			var self = Object.create(this);

			// Inherit the prototype from its parent
			self.settings = Object.create(this.settings);

			// Define the default service
			if (service) {
				self.settings.default_service = service;
			}

			// Create an instance of Events
			self.utils.Event.call(self);

			return self;
		},

		// Initialize
		// Define the client_ids for the endpoint services
		// @param object o, contains a key value pair, service => clientId
		// @param object opts, contains a key value pair of options used for defining the authentication defaults
		// @param number timeout, timeout in seconds
		init: function(services, options) {

			var utils = this.utils;

			if (!services) {
				return this.services;
			}

			// Define provider credentials
			// Reformat the ID field
			for (var x in services) {if (services.hasOwnProperty(x)) {
				if (typeof (services[x]) !== 'object') {
					services[x] = {id: services[x]};
				}
			}}

			// Merge services if there already exists some
			utils.extend(this.services, services);

			// Update the default settings with this one.
			if (options) {
				utils.extend(this.settings, options);

				// Do this immediatly incase the browser changes the current path.
				if ('redirect_uri' in options) {
					this.settings.redirect_uri = utils.url(options.redirect_uri).href;
				}
			}

			return this;
		},

		// Login
		// Using the endpoint
		// @param network stringify       name to connect to
		// @param options object    (optional)  {display mode, is either none|popup(default)|page, scope: email,birthday,publish, .. }
		// @param callback  function  (optional)  fired on signin
		login: function() {

			// Create an object which inherits its parent as the prototype and constructs a new event chain.
			var _this = this;
			var utils = _this.utils;
			var error = utils.error;
			var promise = utils.Promise();

			// Get parameters
			var p = utils.args({network: 's', options: 'o', callback: 'f'}, arguments);

			// Local vars
			var url;

			// Get all the custom options and store to be appended to the querystring
			var qs = utils.diffKey(p.options, _this.settings);

			// Merge/override options with app defaults
			var opts = p.options = utils.merge(_this.settings, p.options || {});

			// Merge/override options with app defaults
			opts.popup = utils.merge(_this.settings.popup, p.options.popup || {});

			// Network
			p.network = p.network || _this.settings.default_service;

			// Bind callback to both reject and fulfill states
			promise.proxy.then(p.callback, p.callback);

			// Trigger an event on the global listener
			function emit(s, value) {
				hello.emit(s, value);
			}

			promise.proxy.then(emit.bind(this, 'auth.login auth'), emit.bind(this, 'auth.failed auth'));

			// Is our service valid?
			if (typeof (p.network) !== 'string' || !(p.network in _this.services)) {
				// Trigger the default login.
				// Ahh we dont have one.
				return promise.reject(error('invalid_network', 'The provided network was not recognized'));
			}

			var provider = _this.services[p.network];

			// Create a global listener to capture events triggered out of scope
			var callbackId = utils.globalEvent(function(str) {

				// The responseHandler returns a string, lets save this locally
				var obj;

				if (str) {
					obj = JSON.parse(str);
				}
				else {
					obj = error('cancelled', 'The authentication was not completed');
				}

				// Handle these response using the local
				// Trigger on the parent
				if (!obj.error) {

					// Save on the parent window the new credentials
					// This fixes an IE10 bug i think... atleast it does for me.
					utils.store(obj.network, obj);

					// Fulfill a successful login
					promise.fulfill({
						network: obj.network,
						authResponse: obj
					});
				}
				else {
					// Reject a successful login
					promise.reject(obj);
				}
			});

			var redirectUri = utils.url(opts.redirect_uri).href;

			// May be a space-delimited list of multiple, complementary types
			var responseType = provider.oauth.response_type || opts.response_type;

			// Fallback to token if the module hasn't defined a grant url
			if (/\bcode\b/.test(responseType) && !provider.oauth.grant) {
				responseType = responseType.replace(/\bcode\b/, 'token');
			}

			// Query string parameters, we may pass our own arguments to form the querystring
			p.qs = utils.merge(qs, {
				client_id: encodeURIComponent(provider.id),
				response_type: encodeURIComponent(responseType),
				redirect_uri: encodeURIComponent(redirectUri),
				state: {
					client_id: provider.id,
					network: p.network,
					display: opts.display,
					callback: callbackId,
					state: opts.state,
					redirect_uri: redirectUri
				}
			});

			// Get current session for merging scopes, and for quick auth response
			var session = utils.store(p.network);

			// Scopes (authentication permisions)
			// Ensure this is a string - IE has a problem moving Arrays between windows
			// Append the setup scope
			var SCOPE_SPLIT = /[,\s]+/;

			// Include default scope settings (cloned).
			var scope = _this.settings.scope ? [_this.settings.scope.toString()] : [];

			// Extend the providers scope list with the default
			var scopeMap = utils.merge(_this.settings.scope_map, provider.scope || {});

			// Add user defined scopes...
			if (opts.scope) {
				scope.push(opts.scope.toString());
			}

			// Append scopes from a previous session.
			// This helps keep app credentials constant,
			// Avoiding having to keep tabs on what scopes are authorized
			if (session && 'scope' in session && session.scope instanceof String) {
				scope.push(session.scope);
			}

			// Join and Split again
			scope = scope.join(',').split(SCOPE_SPLIT);

			// Format remove duplicates and empty values
			scope = utils.unique(scope).filter(filterEmpty);

			// Save the the scopes to the state with the names that they were requested with.
			p.qs.state.scope = scope.join(',');

			// Map scopes to the providers naming convention
			scope = scope.map(function(item) {
				// Does this have a mapping?
				return (item in scopeMap) ? scopeMap[item] : item;
			});

			// Stringify and Arrayify so that double mapped scopes are given the chance to be formatted
			scope = scope.join(',').split(SCOPE_SPLIT);

			// Again...
			// Format remove duplicates and empty values
			scope = utils.unique(scope).filter(filterEmpty);

			// Join with the expected scope delimiter into a string
			p.qs.scope = scope.join(provider.scope_delim || ',');

			// Is the user already signed in with the appropriate scopes, valid access_token?
			if (opts.force === false) {

				if (session && 'access_token' in session && session.access_token && 'expires' in session && session.expires > ((new Date()).getTime() / 1e3)) {
					// What is different about the scopes in the session vs the scopes in the new login?
					var diff = utils.diff((session.scope || '').split(SCOPE_SPLIT), (p.qs.state.scope || '').split(SCOPE_SPLIT));
					if (diff.length === 0) {

						// OK trigger the callback
						promise.fulfill({
							unchanged: true,
							network: p.network,
							authResponse: session
						});

						// Nothing has changed
						return promise;
					}
				}
			}

			// Page URL
			if (opts.display === 'page' && opts.page_uri) {
				// Add a page location, place to endup after session has authenticated
				p.qs.state.page_uri = utils.url(opts.page_uri).href;
			}

			// Bespoke
			// Override login querystrings from auth_options
			if ('login' in provider && typeof (provider.login) === 'function') {
				// Format the paramaters according to the providers formatting function
				provider.login(p);
			}

			// Add OAuth to state
			// Where the service is going to take advantage of the oauth_proxy
			if (!/\btoken\b/.test(responseType) ||
			parseInt(provider.oauth.version, 10) < 2 ||
			(opts.display === 'none' && provider.oauth.grant && session && session.refresh_token)) {

				// Add the oauth endpoints
				p.qs.state.oauth = provider.oauth;

				// Add the proxy url
				p.qs.state.oauth_proxy = opts.oauth_proxy;

			}

			// Convert state to a string
			p.qs.state = encodeURIComponent(JSON.stringify(p.qs.state));

			// URL
			if (parseInt(provider.oauth.version, 10) === 1) {

				// Turn the request to the OAuth Proxy for 3-legged auth
				url = utils.qs(opts.oauth_proxy, p.qs, encodeFunction);
			}

			// Refresh token
			else if (opts.display === 'none' && provider.oauth.grant && session && session.refresh_token) {

				// Add the refresh_token to the request
				p.qs.refresh_token = session.refresh_token;

				// Define the request path
				url = utils.qs(opts.oauth_proxy, p.qs, encodeFunction);
			}
			else {
				url = utils.qs(provider.oauth.auth, p.qs, encodeFunction);
			}

			// Broadcast this event as an auth:init
			emit('auth.init', p);

			// Execute
			// Trigger how we want self displayed
			if (opts.display === 'none') {
				// Sign-in in the background, iframe
				utils.iframe(url, redirectUri);
			}

			// Triggering popup?
			else if (opts.display === 'popup') {

				var popup = utils.popup(url, redirectUri, opts.popup);

				var timer = setInterval(function() {
					if (!popup || popup.closed) {
						clearInterval(timer);
						if (!promise.state) {

							var response = error('cancelled', 'Login has been cancelled');

							if (!popup) {
								response = error('blocked', 'Popup was blocked');
							}

							response.network = p.network;

							promise.reject(response);
						}
					}
				}, 100);
			}

			else {
				window.location = url;
			}

			return promise.proxy;

			function encodeFunction(s) {return s;}

			function filterEmpty(s) {return !!s;}
		},

		// Remove any data associated with a given service
		// @param string name of the service
		// @param function callback
		logout: function() {

			var _this = this;
			var utils = _this.utils;
			var error = utils.error;

			// Create a new promise
			var promise = utils.Promise();

			var p = utils.args({name:'s', options: 'o', callback: 'f'}, arguments);

			p.options = p.options || {};

			// Add callback to events
			promise.proxy.then(p.callback, p.callback);

			// Trigger an event on the global listener
			function emit(s, value) {
				hello.emit(s, value);
			}

			promise.proxy.then(emit.bind(this, 'auth.logout auth'), emit.bind(this, 'error'));

			// Network
			p.name = p.name || this.settings.default_service;
			p.authResponse = utils.store(p.name);

			if (p.name && !(p.name in _this.services)) {

				promise.reject(error('invalid_network', 'The network was unrecognized'));

			}
			else if (p.name && p.authResponse) {

				// Define the callback
				var callback = function(opts) {

					// Remove from the store
					utils.store(p.name, null);

					// Emit events by default
					promise.fulfill(hello.utils.merge({network:p.name}, opts || {}));
				};

				// Run an async operation to remove the users session
				var _opts = {};
				if (p.options.force) {
					var logout = _this.services[p.name].logout;
					if (logout) {
						// Convert logout to URL string,
						// If no string is returned, then this function will handle the logout async style
						if (typeof (logout) === 'function') {
							logout = logout(callback, p);
						}

						// If logout is a string then assume URL and open in iframe.
						if (typeof (logout) === 'string') {
							utils.iframe(logout);
							_opts.force = null;
							_opts.message = 'Logout success on providers site was indeterminate';
						}
						else if (logout === undefined) {
							// The callback function will handle the response.
							return promise.proxy;
						}
					}
				}

				// Remove local credentials
				callback(_opts);
			}
			else {
				promise.reject(error('invalid_session', 'There was no session to remove'));
			}

			return promise.proxy;
		},

		// Returns all the sessions that are subscribed too
		// @param string optional, name of the service to get information about.
		getAuthResponse: function(service) {

			// If the service doesn't exist
			service = service || this.settings.default_service;

			if (!service || !(service in this.services)) {
				return null;
			}

			return this.utils.store(service) || null;
		},

		// Events: placeholder for the events
		events: {}
	});

	// Core utilities
	hello.utils.extend(hello.utils, {

		// Error
		error: function(code, message) {
			return {
				error: {
					code: code,
					message: message
				}
			};
		},

		// Append the querystring to a url
		// @param string url
		// @param object parameters
		qs: function(url, params, formatFunction) {

			if (params) {

				// Set default formatting function
				formatFunction = formatFunction || encodeURIComponent;

				// Override the items in the URL which already exist
				for (var x in params) {
					var str = '([\\?\\&])' + x + '=[^\\&]*';
					var reg = new RegExp(str);
					if (url.match(reg)) {
						url = url.replace(reg, '$1' + x + '=' + formatFunction(params[x]));
						delete params[x];
					}
				}
			}

			if (!this.isEmpty(params)) {
				return url + (url.indexOf('?') > -1 ? '&' : '?') + this.param(params, formatFunction);
			}

			return url;
		},

		// Param
		// Explode/encode the parameters of an URL string/object
		// @param string s, string to decode
		param: function(s, formatFunction) {
			var b;
			var a = {};
			var m;

			if (typeof (s) === 'string') {

				formatFunction = formatFunction || decodeURIComponent;

				m = s.replace(/^[\#\?]/, '').match(/([^=\/\&]+)=([^\&]+)/g);
				if (m) {
					for (var i = 0; i < m.length; i++) {
						b = m[i].match(/([^=]+)=(.*)/);
						a[b[1]] = formatFunction(b[2]);
					}
				}

				return a;
			}
			else {

				formatFunction = formatFunction || encodeURIComponent;

				var o = s;

				a = [];

				for (var x in o) {if (o.hasOwnProperty(x)) {
					if (o.hasOwnProperty(x)) {
						a.push([x, o[x] === '?' ? '?' : formatFunction(o[x])].join('='));
					}
				}}

				return a.join('&');
			}
		},

		// Local storage facade
		store: (function() {

			var a = ['localStorage', 'sessionStorage'];
			var i = -1;
			var prefix = 'test';

			// Set LocalStorage
			var localStorage;

			while (a[++i]) {
				try {
					// In Chrome with cookies blocked, calling localStorage throws an error
					localStorage = window[a[i]];
					localStorage.setItem(prefix + i, i);
					localStorage.removeItem(prefix + i);
					break;
				}
				catch (e) {
					localStorage = null;
				}
			}

			if (!localStorage) {

				var cache = null;

				localStorage = {
					getItem: function(prop) {
						prop = prop + '=';
						var m = document.cookie.split(';');
						for (var i = 0; i < m.length; i++) {
							var _m = m[i].replace(/(^\s+|\s+$)/, '');
							if (_m && _m.indexOf(prop) === 0) {
								return _m.substr(prop.length);
							}
						}

						return cache;
					},

					setItem: function(prop, value) {
						cache = value;
						document.cookie = prop + '=' + value;
					}
				};

				// Fill the cache up
				cache = localStorage.getItem('hello');
			}

			function get() {
				var json = {};
				try {
					json = JSON.parse(localStorage.getItem('hello')) || {};
				}
				catch (e) {}

				return json;
			}

			function set(json) {
				localStorage.setItem('hello', JSON.stringify(json));
			}

			// Check if the browser support local storage
			return function(name, value, days) {

				// Local storage
				var json = get();

				if (name && value === undefined) {
					return json[name] || null;
				}
				else if (name && value === null) {
					try {
						delete json[name];
					}
					catch (e) {
						json[name] = null;
					}
				}
				else if (name) {
					json[name] = value;
				}
				else {
					return json;
				}

				set(json);

				return json || null;
			};

		})(),

		// Create and Append new DOM elements
		// @param node string
		// @param attr object literal
		// @param dom/string
		append: function(node, attr, target) {

			var n = typeof (node) === 'string' ? document.createElement(node) : node;

			if (typeof (attr) === 'object') {
				if ('tagName' in attr) {
					target = attr;
				}
				else {
					for (var x in attr) {if (attr.hasOwnProperty(x)) {
						if (typeof (attr[x]) === 'object') {
							for (var y in attr[x]) {if (attr[x].hasOwnProperty(y)) {
								n[x][y] = attr[x][y];
							}}
						}
						else if (x === 'html') {
							n.innerHTML = attr[x];
						}

						// IE doesn't like us setting methods with setAttribute
						else if (!/^on/.test(x)) {
							n.setAttribute(x, attr[x]);
						}
						else {
							n[x] = attr[x];
						}
					}}
				}
			}

			if (target === 'body') {
				(function self() {
					if (document.body) {
						document.body.appendChild(n);
					}
					else {
						setTimeout(self, 16);
					}
				})();
			}
			else if (typeof (target) === 'object') {
				target.appendChild(n);
			}
			else if (typeof (target) === 'string') {
				document.getElementsByTagName(target)[0].appendChild(n);
			}

			return n;
		},

		// An easy way to create a hidden iframe
		// @param string src
		iframe: function(src) {
			this.append('iframe', {src: src, style: {position:'absolute', left: '-1000px', bottom: 0, height: '1px', width: '1px'}}, 'body');
		},

		// Recursive merge two objects into one, second parameter overides the first
		// @param a array
		merge: function(/* Args: a, b, c, .. n */) {
			var args = Array.prototype.slice.call(arguments);
			args.unshift({});
			return this.extend.apply(null, args);
		},

		// Makes it easier to assign parameters, where some are optional
		// @param o object
		// @param a arguments
		args: function(o, args) {

			var p = {};
			var i = 0;
			var t = null;
			var x = null;

			// 'x' is the first key in the list of object parameters
			for (x in o) {if (o.hasOwnProperty(x)) {
				break;
			}}

			// Passing in hash object of arguments?
			// Where the first argument can't be an object
			if ((args.length === 1) && (typeof (args[0]) === 'object') && o[x] != 'o!') {

				// Could this object still belong to a property?
				// Check the object keys if they match any of the property keys
				for (x in args[0]) {if (o.hasOwnProperty(x)) {
					// Does this key exist in the property list?
					if (x in o) {
						// Yes this key does exist so its most likely this function has been invoked with an object parameter
						// Return first argument as the hash of all arguments
						return args[0];
					}
				}}
			}

			// Else loop through and account for the missing ones.
			for (x in o) {if (o.hasOwnProperty(x)) {

				t = typeof (args[i]);

				if ((typeof (o[x]) === 'function' && o[x].test(args[i])) || (typeof (o[x]) === 'string' && (
				(o[x].indexOf('s') > -1 && t === 'string') ||
				(o[x].indexOf('o') > -1 && t === 'object') ||
				(o[x].indexOf('i') > -1 && t === 'number') ||
				(o[x].indexOf('a') > -1 && t === 'object') ||
				(o[x].indexOf('f') > -1 && t === 'function')
				))
				) {
					p[x] = args[i++];
				}

				else if (typeof (o[x]) === 'string' && o[x].indexOf('!') > -1) {
					return false;
				}
			}}

			return p;
		},

		// Returns a URL instance
		url: function(path) {

			// If the path is empty
			if (!path) {
				return window.location;
			}

			// Chrome and FireFox support new URL() to extract URL objects
			else if (window.URL && URL instanceof Function && URL.length !== 0) {
				return new URL(path, window.location);
			}

			// Ugly shim, it works!
			else {
				var a = document.createElement('a');
				a.href = path;
				return a.cloneNode(false);
			}
		},

		diff: function(a, b) {
			return b.filter(function(item) {
				return a.indexOf(item) === -1;
			});
		},

		// Get the different hash of properties unique to `a`, and not in `b`
		diffKey: function(a, b) {
			if (a || !b) {
				var r = {};
				for (var x in a) {
					// Does the property not exist?
					if (!(x in b)) {
						r[x] = a[x];
					}
				}

				return r;
			}

			return a;
		},

		// Unique
		// Remove duplicate and null values from an array
		// @param a array
		unique: function(a) {
			if (!Array.isArray(a)) { return []; }

			return a.filter(function(item, index) {
				// Is this the first location of item
				return a.indexOf(item) === index;
			});
		},

		isEmpty: function(obj) {

			// Scalar
			if (!obj)
				return true;

			// Array
			if (Array.isArray(obj)) {
				return !obj.length;
			}
			else if (typeof (obj) === 'object') {
				// Object
				for (var key in obj) {
					if (obj.hasOwnProperty(key)) {
						return false;
					}
				}
			}

			return true;
		},

		//jscs:disable

		/*!
		 **  Thenable -- Embeddable Minimum Strictly-Compliant Promises/A+ 1.1.1 Thenable
		 **  Copyright (c) 2013-2014 Ralf S. Engelschall <http://engelschall.com>
		 **  Licensed under The MIT License <http://opensource.org/licenses/MIT>
		 **  Source-Code distributed on <http://github.com/rse/thenable>
		 */
		Promise: (function(){
			/*  promise states [Promises/A+ 2.1]  */
			var STATE_PENDING   = 0;                                         /*  [Promises/A+ 2.1.1]  */
			var STATE_FULFILLED = 1;                                         /*  [Promises/A+ 2.1.2]  */
			var STATE_REJECTED  = 2;                                         /*  [Promises/A+ 2.1.3]  */

			/*  promise object constructor  */
			var api = function (executor) {
				/*  optionally support non-constructor/plain-function call  */
				if (!(this instanceof api))
					return new api(executor);

				/*  initialize object  */
				this.id           = "Thenable/1.0.6";
				this.state        = STATE_PENDING; /*  initial state  */
				this.fulfillValue = undefined;     /*  initial value  */     /*  [Promises/A+ 1.3, 2.1.2.2]  */
				this.rejectReason = undefined;     /*  initial reason */     /*  [Promises/A+ 1.5, 2.1.3.2]  */
				this.onFulfilled  = [];            /*  initial handlers  */
				this.onRejected   = [];            /*  initial handlers  */

				/*  provide optional information-hiding proxy  */
				this.proxy = {
					then: this.then.bind(this)
				};

				/*  support optional executor function  */
				if (typeof executor === "function")
					executor.call(this, this.fulfill.bind(this), this.reject.bind(this));
			};

			/*  promise API methods  */
			api.prototype = {
				/*  promise resolving methods  */
				fulfill: function (value) { return deliver(this, STATE_FULFILLED, "fulfillValue", value); },
				reject:  function (value) { return deliver(this, STATE_REJECTED,  "rejectReason", value); },

				/*  "The then Method" [Promises/A+ 1.1, 1.2, 2.2]  */
				then: function (onFulfilled, onRejected) {
					var curr = this;
					var next = new api();                                    /*  [Promises/A+ 2.2.7]  */
					curr.onFulfilled.push(
						resolver(onFulfilled, next, "fulfill"));             /*  [Promises/A+ 2.2.2/2.2.6]  */
					curr.onRejected.push(
						resolver(onRejected,  next, "reject" ));             /*  [Promises/A+ 2.2.3/2.2.6]  */
					execute(curr);
					return next.proxy;                                       /*  [Promises/A+ 2.2.7, 3.3]  */
				}
			};

			/*  deliver an action  */
			var deliver = function (curr, state, name, value) {
				if (curr.state === STATE_PENDING) {
					curr.state = state;                                      /*  [Promises/A+ 2.1.2.1, 2.1.3.1]  */
					curr[name] = value;                                      /*  [Promises/A+ 2.1.2.2, 2.1.3.2]  */
					execute(curr);
				}
				return curr;
			};

			/*  execute all handlers  */
			var execute = function (curr) {
				if (curr.state === STATE_FULFILLED)
					execute_handlers(curr, "onFulfilled", curr.fulfillValue);
				else if (curr.state === STATE_REJECTED)
					execute_handlers(curr, "onRejected",  curr.rejectReason);
			};

			/*  execute particular set of handlers  */
			var execute_handlers = function (curr, name, value) {
				/* global process: true */
				/* global setImmediate: true */
				/* global setTimeout: true */

				/*  short-circuit processing  */
				if (curr[name].length === 0)
					return;

				/*  iterate over all handlers, exactly once  */
				var handlers = curr[name];
				curr[name] = [];                                             /*  [Promises/A+ 2.2.2.3, 2.2.3.3]  */
				var func = function () {
					for (var i = 0; i < handlers.length; i++)
						handlers[i](value);                                  /*  [Promises/A+ 2.2.5]  */
				};

				/*  execute procedure asynchronously  */                     /*  [Promises/A+ 2.2.4, 3.1]  */
				if (typeof process === "object" && typeof process.nextTick === "function")
					process.nextTick(func);
				else if (typeof setImmediate === "function")
					setImmediate(func);
				else
					setTimeout(func, 0);
			};

			/*  generate a resolver function  */
			var resolver = function (cb, next, method) {
				return function (value) {
					if (typeof cb !== "function")                            /*  [Promises/A+ 2.2.1, 2.2.7.3, 2.2.7.4]  */
						next[method].call(next, value);                      /*  [Promises/A+ 2.2.7.3, 2.2.7.4]  */
					else {
						var result;
						try { result = cb(value); }                          /*  [Promises/A+ 2.2.2.1, 2.2.3.1, 2.2.5, 3.2]  */
						catch (e) {
							next.reject(e);                                  /*  [Promises/A+ 2.2.7.2]  */
							return;
						}
						resolve(next, result);                               /*  [Promises/A+ 2.2.7.1]  */
					}
				};
			};

			/*  "Promise Resolution Procedure"  */                           /*  [Promises/A+ 2.3]  */
			var resolve = function (promise, x) {
				/*  sanity check arguments  */                               /*  [Promises/A+ 2.3.1]  */
				if (promise === x || promise.proxy === x) {
					promise.reject(new TypeError("cannot resolve promise with itself"));
					return;
				}

				/*  surgically check for a "then" method
					(mainly to just call the "getter" of "then" only once)  */
				var then;
				if ((typeof x === "object" && x !== null) || typeof x === "function") {
					try { then = x.then; }                                   /*  [Promises/A+ 2.3.3.1, 3.5]  */
					catch (e) {
						promise.reject(e);                                   /*  [Promises/A+ 2.3.3.2]  */
						return;
					}
				}

				/*  handle own Thenables    [Promises/A+ 2.3.2]
					and similar "thenables" [Promises/A+ 2.3.3]  */
				if (typeof then === "function") {
					var resolved = false;
					try {
						/*  call retrieved "then" method */                  /*  [Promises/A+ 2.3.3.3]  */
						then.call(x,
							/*  resolvePromise  */                           /*  [Promises/A+ 2.3.3.3.1]  */
							function (y) {
								if (resolved) return; resolved = true;       /*  [Promises/A+ 2.3.3.3.3]  */
								if (y === x)                                 /*  [Promises/A+ 3.6]  */
									promise.reject(new TypeError("circular thenable chain"));
								else
									resolve(promise, y);
							},

							/*  rejectPromise  */                            /*  [Promises/A+ 2.3.3.3.2]  */
							function (r) {
								if (resolved) return; resolved = true;       /*  [Promises/A+ 2.3.3.3.3]  */
								promise.reject(r);
							}
						);
					}
					catch (e) {
						if (!resolved)                                       /*  [Promises/A+ 2.3.3.3.3]  */
							promise.reject(e);                               /*  [Promises/A+ 2.3.3.3.4]  */
					}
					return;
				}

				/*  handle other values  */
				promise.fulfill(x);                                          /*  [Promises/A+ 2.3.4, 2.3.3.4]  */
			};

			/*  export API  */
			return api;
		})(),

		//jscs:enable

		// Event
		// A contructor superclass for adding event menthods, on, off, emit.
		Event: function() {

			var separator = /[\s\,]+/;

			// If this doesn't support getPrototype then we can't get prototype.events of the parent
			// So lets get the current instance events, and add those to a parent property
			this.parent = {
				events: this.events,
				findEvents: this.findEvents,
				parent: this.parent,
				utils: this.utils
			};

			this.events = {};

			// On, subscribe to events
			// @param evt   string
			// @param callback  function
			this.on = function(evt, callback) {

				if (callback && typeof (callback) === 'function') {
					var a = evt.split(separator);
					for (var i = 0; i < a.length; i++) {

						// Has this event already been fired on this instance?
						this.events[a[i]] = [callback].concat(this.events[a[i]] || []);
					}
				}

				return this;
			};

			// Off, unsubscribe to events
			// @param evt   string
			// @param callback  function
			this.off = function(evt, callback) {

				this.findEvents(evt, function(name, index) {
					if (!callback || this.events[name][index] === callback) {
						this.events[name][index] = null;
					}
				});

				return this;
			};

			// Emit
			// Triggers any subscribed events
			this.emit = function(evt /*, data, ... */) {

				// Get arguments as an Array, knock off the first one
				var args = Array.prototype.slice.call(arguments, 1);
				args.push(evt);

				// Handler
				var handler = function(name, index) {

					// Replace the last property with the event name
					args[args.length - 1] = (name === '*' ? evt : name);

					// Trigger
					this.events[name][index].apply(this, args);
				};

				// Find the callbacks which match the condition and call
				var _this = this;
				while (_this && _this.findEvents) {

					// Find events which match
					_this.findEvents(evt + ',*', handler);
					_this = _this.parent;
				}

				return this;
			};

			//
			// Easy functions
			this.emitAfter = function() {
				var _this = this;
				var args = arguments;
				setTimeout(function() {
					_this.emit.apply(_this, args);
				}, 0);

				return this;
			};

			this.findEvents = function(evt, callback) {

				var a = evt.split(separator);

				for (var name in this.events) {if (this.events.hasOwnProperty(name)) {

					if (a.indexOf(name) > -1) {

						for (var i = 0; i < this.events[name].length; i++) {

							// Does the event handler exist?
							if (this.events[name][i]) {
								// Emit on the local instance of this
								callback.call(this, name, i);
							}
						}
					}
				}}
			};

			return this;
		},

		// Global Events
		// Attach the callback to the window object
		// Return its unique reference
		globalEvent: function(callback, guid) {
			// If the guid has not been supplied then create a new one.
			guid = guid || '_hellojs_' + parseInt(Math.random() * 1e12, 10).toString(36);

			// Define the callback function
			window[guid] = function() {
				// Trigger the callback
				try {
					if (callback.apply(this, arguments)) {
						delete window[guid];
					}
				}
				catch (e) {
					console.error(e);
				}
			};

			return guid;
		},

		// Trigger a clientside popup
		// This has been augmented to support PhoneGap
		popup: function(url, redirectUri, options) {

			var documentElement = document.documentElement;

			// Multi Screen Popup Positioning (http://stackoverflow.com/a/16861050)
			// Credit: http://www.xtf.dk/2011/08/center-new-popup-window-even-on.html
			// Fixes dual-screen position                         Most browsers      Firefox

			if (options.height) {
				var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;
				var height = screen.height || window.innerHeight || documentElement.clientHeight;
				options.top = parseInt((height - options.height) / 2, 10) + dualScreenTop;
			}

			if (options.width) {
				var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
				var width = screen.width || window.innerWidth || documentElement.clientWidth;
				options.left = parseInt((width - options.width) / 2, 10) + dualScreenLeft;
			}

			// Convert options into an array
			var optionsArray = [];
			Object.keys(options).forEach(function(name) {
				var value = options[name];
				optionsArray.push(name + (value !== null ? '=' + value : ''));
			});

			// Call the open() function with the initial path
			//
			// OAuth redirect, fixes URI fragments from being lost in Safari
			// (URI Fragments within 302 Location URI are lost over HTTPS)
			// Loading the redirect.html before triggering the OAuth Flow seems to fix it.
			//
			// Firefox  decodes URL fragments when calling location.hash.
			//  - This is bad if the value contains break points which are escaped
			//  - Hence the url must be encoded twice as it contains breakpoints.
			if (navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1) {
				url = redirectUri + '#oauth_redirect=' + encodeURIComponent(encodeURIComponent(url));
			}

			var popup = window.open(
				url,
				'_blank',
				optionsArray.join(',')
			);

			if (popup && popup.focus) {
				popup.focus();
			}

			return popup;
		},

		// OAuth and API response handler
		responseHandler: function(window, parent) {

			var _this = this;
			var p;
			var location = window.location;

			// Is this an auth relay message which needs to call the proxy?
			p = _this.param(location.search);

			// OAuth2 or OAuth1 server response?
			if (p && p.state && (p.code || p.oauth_token)) {

				var state = JSON.parse(p.state);

				// Add this path as the redirect_uri
				p.redirect_uri = state.redirect_uri || location.href.replace(/[\?\#].*$/, '');

				// Redirect to the host
				var path = state.oauth_proxy + '?' + _this.param(p);

				location.assign(path);

				return;
			}

			// Save session, from redirected authentication
			// #access_token has come in?
			//
			// FACEBOOK is returning auth errors within as a query_string... thats a stickler for consistency.
			// SoundCloud is the state in the querystring and the token in the hashtag, so we'll mix the two together

			p = _this.merge(_this.param(location.search || ''), _this.param(location.hash || ''));

			// If p.state
			if (p && 'state' in p) {

				// Remove any addition information
				// E.g. p.state = 'facebook.page';
				try {
					var a = JSON.parse(p.state);
					_this.extend(p, a);
				}
				catch (e) {
					console.error('Could not decode state parameter');
				}

				// Access_token?
				if (('access_token' in p && p.access_token) && p.network) {

					if (!p.expires_in || parseInt(p.expires_in, 10) === 0) {
						// If p.expires_in is unset, set to 0
						p.expires_in = 0;
					}

					p.expires_in = parseInt(p.expires_in, 10);
					p.expires = ((new Date()).getTime() / 1e3) + (p.expires_in || (60 * 60 * 24 * 365));

					// Lets use the "state" to assign it to one of our networks
					authCallback(p, window, parent);
				}

				// Error=?
				// &error_description=?
				// &state=?
				else if (('error' in p && p.error) && p.network) {

					p.error = {
						code: p.error,
						message: p.error_message || p.error_description
					};

					// Let the state handler handle it
					authCallback(p, window, parent);
				}

				// API call, or a cancelled login
				// Result is serialized JSON string
				else if (p.callback && p.callback in parent) {

					// Trigger a function in the parent
					var res = 'result' in p && p.result ? JSON.parse(p.result) : false;

					// Trigger the callback on the parent
					parent[p.callback](res);
					closeWindow();
				}

				// If this page is still open
				if (p.page_uri) {
					location.assign(p.page_uri);
				}
			}

			// OAuth redirect, fixes URI fragments from being lost in Safari
			// (URI Fragments within 302 Location URI are lost over HTTPS)
			// Loading the redirect.html before triggering the OAuth Flow seems to fix it.
			else if ('oauth_redirect' in p) {

				location.assign(decodeURIComponent(p.oauth_redirect));
				return;
			}

			// Trigger a callback to authenticate
			function authCallback(obj, window, parent) {

				var cb = obj.callback;
				var network = obj.network;

				// Trigger the callback on the parent
				_this.store(network, obj);

				// If this is a page request it has no parent or opener window to handle callbacks
				if (('display' in obj) && obj.display === 'page') {
					return;
				}

				// Remove from session object
				if (parent && cb && cb in parent) {

					try {
						delete obj.callback;
					}
					catch (e) {}

					// Update store
					_this.store(network, obj);

					// Call the globalEvent function on the parent
					// It's safer to pass back a string to the parent,
					// Rather than an object/array (better for IE8)
					var str = JSON.stringify(obj);

					try {
						parent[cb](str);
					}
					catch (e) {
						// Error thrown whilst executing parent callback
					}
				}

				closeWindow();
			}

			function closeWindow() {

				if (window.frameElement) {
					// Inside an iframe, remove from parent
					parent.document.body.removeChild(window.frameElement);
				}
				else {
					// Close this current window
					try {
						window.close();
					}
					catch (e) {}

					// IOS bug wont let us close a popup if still loading
					if (window.addEventListener) {
						window.addEventListener('load', function() {
							window.close();
						});
					}
				}

			}
		}
	});

	// Events
	// Extend the hello object with its own event instance
	hello.utils.Event.call(hello);

	///////////////////////////////////
	// Monitoring session state
	// Check for session changes
	///////////////////////////////////

	(function(hello) {

		// Monitor for a change in state and fire
		var oldSessions = {};

		// Hash of expired tokens
		var expired = {};

		// Listen to other triggers to Auth events, use these to update this
		hello.on('auth.login, auth.logout', function(auth) {
			if (auth && typeof (auth) === 'object' && auth.network) {
				oldSessions[auth.network] = hello.utils.store(auth.network) || {};
			}
		});

		(function self() {

			var CURRENT_TIME = ((new Date()).getTime() / 1e3);
			var emit = function(eventName) {
				hello.emit('auth.' + eventName, {
					network: name,
					authResponse: session
				});
			};

			// Loop through the services
			for (var name in hello.services) {if (hello.services.hasOwnProperty(name)) {

				if (!hello.services[name].id) {
					// We haven't attached an ID so dont listen.
					continue;
				}

				// Get session
				var session = hello.utils.store(name) || {};
				var provider = hello.services[name];
				var oldSess = oldSessions[name] || {};

				// Listen for globalEvents that did not get triggered from the child
				if (session && 'callback' in session) {

					// To do remove from session object...
					var cb = session.callback;
					try {
						delete session.callback;
					}
					catch (e) {}

					// Update store
					// Removing the callback
					hello.utils.store(name, session);

					// Emit global events
					try {
						window[cb](session);
					}
					catch (e) {}
				}

				// Refresh token
				if (session && ('expires' in session) && session.expires < CURRENT_TIME) {

					// If auto refresh is possible
					// Either the browser supports
					var refresh = provider.refresh || session.refresh_token;

					// Has the refresh been run recently?
					if (refresh && (!(name in expired) || expired[name] < CURRENT_TIME)) {
						// Try to resignin
						hello.emit('notice', name + ' has expired trying to resignin');
						hello.login(name, {display: 'none', force: false});

						// Update expired, every 10 minutes
						expired[name] = CURRENT_TIME + 600;
					}

					// Does this provider not support refresh
					else if (!refresh && !(name in expired)) {
						// Label the event
						emit('expired');
						expired[name] = true;
					}

					// If session has expired then we dont want to store its value until it can be established that its been updated
					continue;
				}

				// Has session changed?
				else if (oldSess.access_token === session.access_token &&
				oldSess.expires === session.expires) {
					continue;
				}

				// Access_token has been removed
				else if (!session.access_token && oldSess.access_token) {
					emit('logout');
				}

				// Access_token has been created
				else if (session.access_token && !oldSess.access_token) {
					emit('login');
				}

				// Access_token has been updated
				else if (session.expires !== oldSess.expires) {
					emit('update');
				}

				// Updated stored session
				oldSessions[name] = session;

				// Remove the expired flags
				if (name in expired) {
					delete expired[name];
				}
			}}

			// Check error events
			setTimeout(self, 1000);
		})();

	})(hello);

	// EOF CORE lib
	//////////////////////////////////

	/////////////////////////////////////////
	// API
	// @param path    string
	// @param query   object (optional)
	// @param method  string (optional)
	// @param data    object (optional)
	// @param timeout integer (optional)
	// @param callback  function (optional)

	hello.api = function() {

		// Shorthand
		var _this = this;
		var utils = _this.utils;
		var error = utils.error;

		// Construct a new Promise object
		var promise = utils.Promise();

		// Arguments
		var p = utils.args({path: 's!', query: 'o', method: 's', data: 'o', timeout: 'i', callback: 'f'}, arguments);

		// Method
		p.method = (p.method || 'get').toLowerCase();

		// Headers
		p.headers = p.headers || {};

		// Query
		p.query = p.query || {};

		// If get, put all parameters into query
		if (p.method === 'get' || p.method === 'delete') {
			utils.extend(p.query, p.data);
			p.data = {};
		}

		var data = p.data = p.data || {};

		// Completed event callback
		promise.then(p.callback, p.callback);

		// Remove the network from path, e.g. facebook:/me/friends
		// Results in { network : facebook, path : me/friends }
		if (!p.path) {
			return promise.reject(error('invalid_path', 'Missing the path parameter from the request'));
		}

		p.path = p.path.replace(/^\/+/, '');
		var a = (p.path.split(/[\/\:]/, 2) || [])[0].toLowerCase();

		if (a in _this.services) {
			p.network = a;
			var reg = new RegExp('^' + a + ':?\/?');
			p.path = p.path.replace(reg, '');
		}

		// Network & Provider
		// Define the network that this request is made for
		p.network = _this.settings.default_service = p.network || _this.settings.default_service;
		var o = _this.services[p.network];

		// INVALID
		// Is there no service by the given network name?
		if (!o) {
			return promise.reject(error('invalid_network', 'Could not match the service requested: ' + p.network));
		}

		// PATH
		// As long as the path isn't flagged as unavaiable, e.g. path == false

		if (!(!(p.method in o) || !(p.path in o[p.method]) || o[p.method][p.path] !== false)) {
			return promise.reject(error('invalid_path', 'The provided path is not available on the selected network'));
		}

		// PROXY
		// OAuth1 calls always need a proxy

		if (!p.oauth_proxy) {
			p.oauth_proxy = _this.settings.oauth_proxy;
		}

		if (!('proxy' in p)) {
			p.proxy = p.oauth_proxy && o.oauth && parseInt(o.oauth.version, 10) === 1;
		}

		// TIMEOUT
		// Adopt timeout from global settings by default

		if (!('timeout' in p)) {
			p.timeout = _this.settings.timeout;
		}

		// Format response
		// Whether to run the raw response through post processing.
		if (!('formatResponse' in p)) {
			p.formatResponse = true;
		}

		// Get the current session
		// Append the access_token to the query
		p.authResponse = _this.getAuthResponse(p.network);
		if (p.authResponse && p.authResponse.access_token) {
			p.query.access_token = p.authResponse.access_token;
		}

		var url = p.path;
		var m;

		// Store the query as options
		// This is used to populate the request object before the data is augmented by the prewrap handlers.
		p.options = utils.clone(p.query);

		// Clone the data object
		// Prevent this script overwriting the data of the incoming object.
		// Ensure that everytime we run an iteration the callbacks haven't removed some data
		p.data = utils.clone(data);

		// URL Mapping
		// Is there a map for the given URL?
		var actions = o[{'delete': 'del'}[p.method] || p.method] || {};

		// Extrapolate the QueryString
		// Provide a clean path
		// Move the querystring into the data
		if (p.method === 'get') {

			var query = url.split(/[\?#]/)[1];
			if (query) {
				utils.extend(p.query, utils.param(query));

				// Remove the query part from the URL
				url = url.replace(/\?.*?(#|$)/, '$1');
			}
		}

		// Is the hash fragment defined
		if ((m = url.match(/#(.+)/, ''))) {
			url = url.split('#')[0];
			p.path = m[1];
		}
		else if (url in actions) {
			p.path = url;
			url = actions[url];
		}
		else if ('default' in actions) {
			url = actions['default'];
		}

		// Redirect Handler
		// This defines for the Form+Iframe+Hash hack where to return the results too.
		p.redirect_uri = _this.settings.redirect_uri;

		// Define FormatHandler
		// The request can be procesed in a multitude of ways
		// Here's the options - depending on the browser and endpoint
		p.xhr = o.xhr;
		p.jsonp = o.jsonp;
		p.form = o.form;

		// Make request
		if (typeof (url) === 'function') {
			// Does self have its own callback?
			url(p, getPath);
		}
		else {
			// Else the URL is a string
			getPath(url);
		}

		return promise.proxy;

		// If url needs a base
		// Wrap everything in
		function getPath(url) {

			// Format the string if it needs it
			url = url.replace(/\@\{([a-z\_\-]+)(\|.*?)?\}/gi, function(m, key, defaults) {
				var val = defaults ? defaults.replace(/^\|/, '') : '';
				if (key in p.query) {
					val = p.query[key];
					delete p.query[key];
				}
				else if (p.data && key in p.data) {
					val = p.data[key];
					delete p.data[key];
				}
				else if (!defaults) {
					promise.reject(error('missing_attribute', 'The attribute ' + key + ' is missing from the request'));
				}

				return val;
			});

			// Add base
			if (!url.match(/^https?:\/\//)) {
				url = o.base + url;
			}

			// Define the request URL
			p.url = url;

			// Make the HTTP request with the curated request object
			// CALLBACK HANDLER
			// @ response object
			// @ statusCode integer if available
			utils.request(p, function(r, headers) {

				// Is this a raw response?
				if (!p.formatResponse) {
					// Bad request? error statusCode or otherwise contains an error response vis JSONP?
					if (typeof headers === 'object' ? (headers.statusCode >= 400) : (typeof r === 'object' && 'error' in r)) {
						promise.reject(r);
					}
					else {
						promise.fulfill(r);
					}

					return;
				}

				// Should this be an object
				if (r === true) {
					r = {success:true};
				}
				else if (!r) {
					r = {};
				}

				// The delete callback needs a better response
				if (p.method === 'delete') {
					r = (!r || utils.isEmpty(r)) ? {success:true} : r;
				}

				// FORMAT RESPONSE?
				// Does self request have a corresponding formatter
				if (o.wrap && ((p.path in o.wrap) || ('default' in o.wrap))) {
					var wrap = (p.path in o.wrap ? p.path : 'default');
					var time = (new Date()).getTime();

					// FORMAT RESPONSE
					var b = o.wrap[wrap](r, headers, p);

					// Has the response been utterly overwritten?
					// Typically self augments the existing object.. but for those rare occassions
					if (b) {
						r = b;
					}
				}

				// Is there a next_page defined in the response?
				if (r && 'paging' in r && r.paging.next) {

					// Add the relative path if it is missing from the paging/next path
					if (r.paging.next[0] === '?') {
						r.paging.next = p.path + r.paging.next;
					}

					// The relative path has been defined, lets markup the handler in the HashFragment
					else {
						r.paging.next += '#' + p.path;
					}
				}

				// Dispatch to listeners
				// Emit events which pertain to the formatted response
				if (!r || 'error' in r) {
					promise.reject(r);
				}
				else {
					promise.fulfill(r);
				}
			});
		}
	};

	// API utilities
	hello.utils.extend(hello.utils, {

		// Make an HTTP request
		request: function(p, callback) {

			var _this = this;
			var error = _this.error;

			// This has to go through a POST request
			if (!_this.isEmpty(p.data) && !('FileList' in window) && _this.hasBinary(p.data)) {

				// Disable XHR and JSONP
				p.xhr = false;
				p.jsonp = false;
			}

			// Check if the browser and service support CORS
			var cors = this.request_cors(function() {
				// If it does then run this...
				return ((p.xhr === undefined) || (p.xhr && (typeof (p.xhr) !== 'function' || p.xhr(p, p.query))));
			});

			if (cors) {

				formatUrl(p, function(url) {

					var x = _this.xhr(p.method, url, p.headers, p.data, callback);
					x.onprogress = p.onprogress || null;

					// Windows Phone does not support xhr.upload, see #74
					// Feature detect
					if (x.upload && p.onuploadprogress) {
						x.upload.onprogress = p.onuploadprogress;
					}

				});

				return;
			}

			// Clone the query object
			// Each request modifies the query object and needs to be tared after each one.
			var _query = p.query;

			p.query = _this.clone(p.query);

			// Assign a new callbackID
			p.callbackID = _this.globalEvent();

			// JSONP
			if (p.jsonp !== false) {

				// Clone the query object
				p.query.callback = p.callbackID;

				// If the JSONP is a function then run it
				if (typeof (p.jsonp) === 'function') {
					p.jsonp(p, p.query);
				}

				// Lets use JSONP if the method is 'get'
				if (p.method === 'get') {

					formatUrl(p, function(url) {
						_this.jsonp(url, callback, p.callbackID, p.timeout);
					});

					return;
				}
				else {
					// It's not compatible reset query
					p.query = _query;
				}

			}

			// Otherwise we're on to the old school, iframe hacks and JSONP
			if (p.form !== false) {

				// Add some additional query parameters to the URL
				// We're pretty stuffed if the endpoint doesn't like these
				p.query.redirect_uri = p.redirect_uri;
				p.query.state = JSON.stringify({callback:p.callbackID});

				var opts;

				if (typeof (p.form) === 'function') {

					// Format the request
					opts = p.form(p, p.query);
				}

				if (p.method === 'post' && opts !== false) {

					formatUrl(p, function(url) {
						_this.post(url, p.data, opts, callback, p.callbackID, p.timeout);
					});

					return;
				}
			}

			// None of the methods were successful throw an error
			callback(error('invalid_request', 'There was no mechanism for handling this request'));

			return;

			// Format URL
			// Constructs the request URL, optionally wraps the URL through a call to a proxy server
			// Returns the formatted URL
			function formatUrl(p, callback) {

				// Are we signing the request?
				var sign;

				// OAuth1
				// Remove the token from the query before signing
				if (p.authResponse && p.authResponse.oauth && parseInt(p.authResponse.oauth.version, 10) === 1) {

					// OAUTH SIGNING PROXY
					sign = p.query.access_token;

					// Remove the access_token
					delete p.query.access_token;

					// Enfore use of Proxy
					p.proxy = true;
				}

				// POST body to querystring
				if (p.data && (p.method === 'get' || p.method === 'delete')) {
					// Attach the p.data to the querystring.
					_this.extend(p.query, p.data);
					p.data = null;
				}

				// Construct the path
				var path = _this.qs(p.url, p.query);

				// Proxy the request through a server
				// Used for signing OAuth1
				// And circumventing services without Access-Control Headers
				if (p.proxy) {
					// Use the proxy as a path
					path = _this.qs(p.oauth_proxy, {
						path: path,
						access_token: sign || '',

						// This will prompt the request to be signed as though it is OAuth1
						then: p.proxy_response_type || (p.method.toLowerCase() === 'get' ? 'redirect' : 'proxy'),
						method: p.method.toLowerCase(),
						suppress_response_codes: true
					});
				}

				callback(path);
			}
		},

		// Test whether the browser supports the CORS response
		request_cors: function(callback) {
			return 'withCredentials' in new XMLHttpRequest() && callback();
		},

		// Return the type of DOM object
		domInstance: function(type, data) {
			var test = 'HTML' + (type || '').replace(
				/^[a-z]/,
				function(m) {
					return m.toUpperCase();
				}

			) + 'Element';

			if (!data) {
				return false;
			}

			if (window[test]) {
				return data instanceof window[test];
			}
			else if (window.Element) {
				return data instanceof window.Element && (!type || (data.tagName && data.tagName.toLowerCase() === type));
			}
			else {
				return (!(data instanceof Object || data instanceof Array || data instanceof String || data instanceof Number) && data.tagName && data.tagName.toLowerCase() === type);
			}
		},

		// Create a clone of an object
		clone: function(obj) {
			// Does not clone DOM elements, nor Binary data, e.g. Blobs, Filelists
			if (obj === null || typeof (obj) !== 'object' || obj instanceof Date || 'nodeName' in obj || this.isBinary(obj) || (typeof FormData === 'function' && obj instanceof FormData)) {
				return obj;
			}

			if (Array.isArray(obj)) {
				// Clone each item in the array
				return obj.map(this.clone.bind(this));
			}

			// But does clone everything else.
			var clone = {};
			for (var x in obj) {
				clone[x] = this.clone(obj[x]);
			}

			return clone;
		},

		// XHR: uses CORS to make requests
		xhr: function(method, url, headers, data, callback) {

			var r = new XMLHttpRequest();
			var error = this.error;

			// Binary?
			var binary = false;
			if (method === 'blob') {
				binary = method;
				method = 'GET';
			}

			method = method.toUpperCase();

			// Xhr.responseType 'json' is not supported in any of the vendors yet.
			r.onload = function(e) {
				var json = r.response;
				try {
					json = JSON.parse(r.responseText);
				}
				catch (_e) {
					if (r.status === 401) {
						json = error('access_denied', r.statusText);
					}
				}

				var headers = headersToJSON(r.getAllResponseHeaders());
				headers.statusCode = r.status;

				callback(json || (method === 'GET' ? error('empty_response', 'Could not get resource') : {}), headers);
			};

			r.onerror = function(e) {
				var json = r.responseText;
				try {
					json = JSON.parse(r.responseText);
				}
				catch (_e) {}

				callback(json || error('access_denied', 'Could not get resource'));
			};

			var x;

			// Should we add the query to the URL?
			if (method === 'GET' || method === 'DELETE') {
				data = null;
			}
			else if (data && typeof (data) !== 'string' && !(data instanceof FormData) && !(data instanceof File) && !(data instanceof Blob)) {
				// Loop through and add formData
				var f = new FormData();
				for (x in data) if (data.hasOwnProperty(x)) {
					if (data[x] instanceof HTMLInputElement) {
						if ('files' in data[x] && data[x].files.length > 0) {
							f.append(x, data[x].files[0]);
						}
					}
					else if (data[x] instanceof Blob) {
						f.append(x, data[x], data.name);
					}
					else {
						f.append(x, data[x]);
					}
				}

				data = f;
			}

			// Open the path, async
			r.open(method, url, true);

			if (binary) {
				if ('responseType' in r) {
					r.responseType = binary;
				}
				else {
					r.overrideMimeType('text/plain; charset=x-user-defined');
				}
			}

			// Set any bespoke headers
			if (headers) {
				for (x in headers) {
					r.setRequestHeader(x, headers[x]);
				}
			}

			r.send(data);

			return r;

			// Headers are returned as a string
			function headersToJSON(s) {
				var r = {};
				var reg = /([a-z\-]+):\s?(.*);?/gi;
				var m;
				while ((m = reg.exec(s))) {
					r[m[1]] = m[2];
				}

				return r;
			}
		},

		// JSONP
		// Injects a script tag into the DOM to be executed and appends a callback function to the window object
		// @param string/function pathFunc either a string of the URL or a callback function pathFunc(querystringhash, continueFunc);
		// @param function callback a function to call on completion;
		jsonp: function(url, callback, callbackID, timeout) {

			var _this = this;
			var error = _this.error;

			// Change the name of the callback
			var bool = 0;
			var head = document.getElementsByTagName('head')[0];
			var operaFix;
			var result = error('server_error', 'server_error');
			var cb = function() {
				if (!(bool++)) {
					window.setTimeout(function() {
						callback(result);
						head.removeChild(script);
					}, 0);
				}

			};

			// Add callback to the window object
			callbackID = _this.globalEvent(function(json) {
				result = json;
				return true;

				// Mark callback as done
			}, callbackID);

			// The URL is a function for some cases and as such
			// Determine its value with a callback containing the new parameters of this function.
			url = url.replace(new RegExp('=\\?(&|$)'), '=' + callbackID + '$1');

			// Build script tag
			var script = _this.append('script', {
				id: callbackID,
				name: callbackID,
				src: url,
				async: true,
				onload: cb,
				onerror: cb,
				onreadystatechange: function() {
					if (/loaded|complete/i.test(this.readyState)) {
						cb();
					}
				}
			});

			// Opera fix error
			// Problem: If an error occurs with script loading Opera fails to trigger the script.onerror handler we specified
			//
			// Fix:
			// By setting the request to synchronous we can trigger the error handler when all else fails.
			// This action will be ignored if we've already called the callback handler "cb" with a successful onload event
			if (window.navigator.userAgent.toLowerCase().indexOf('opera') > -1) {
				operaFix = _this.append('script', {
					text: 'document.getElementById(\'' + callbackID + '\').onerror();'
				});
				script.async = false;
			}

			// Add timeout
			if (timeout) {
				window.setTimeout(function() {
					result = error('timeout', 'timeout');
					cb();
				}, timeout);
			}

			// TODO: add fix for IE,
			// However: unable recreate the bug of firing off the onreadystatechange before the script content has been executed and the value of "result" has been defined.
			// Inject script tag into the head element
			head.appendChild(script);

			// Append Opera Fix to run after our script
			if (operaFix) {
				head.appendChild(operaFix);
			}
		},

		// Post
		// Send information to a remote location using the post mechanism
		// @param string uri path
		// @param object data, key value data to send
		// @param function callback, function to execute in response
		post: function(url, data, options, callback, callbackID, timeout) {

			var _this = this;
			var error = _this.error;
			var doc = document;

			// This hack needs a form
			var form = null;
			var reenableAfterSubmit = [];
			var newform;
			var i = 0;
			var x = null;
			var bool = 0;
			var cb = function(r) {
				if (!(bool++)) {
					callback(r);
				}
			};

			// What is the name of the callback to contain
			// We'll also use this to name the iframe
			_this.globalEvent(cb, callbackID);

			// Build the iframe window
			var win;
			try {
				// IE7 hack, only lets us define the name here, not later.
				win = doc.createElement('<iframe name="' + callbackID + '">');
			}
			catch (e) {
				win = doc.createElement('iframe');
			}

			win.name = callbackID;
			win.id = callbackID;
			win.style.display = 'none';

			// Override callback mechanism. Triggger a response onload/onerror
			if (options && options.callbackonload) {
				// Onload is being fired twice
				win.onload = function() {
					cb({
						response: 'posted',
						message: 'Content was posted'
					});
				};
			}

			if (timeout) {
				setTimeout(function() {
					cb(error('timeout', 'The post operation timed out'));
				}, timeout);
			}

			doc.body.appendChild(win);

			// If we are just posting a single item
			if (_this.domInstance('form', data)) {
				// Get the parent form
				form = data.form;

				// Loop through and disable all of its siblings
				for (i = 0; i < form.elements.length; i++) {
					if (form.elements[i] !== data) {
						form.elements[i].setAttribute('disabled', true);
					}
				}

				// Move the focus to the form
				data = form;
			}

			// Posting a form
			if (_this.domInstance('form', data)) {
				// This is a form element
				form = data;

				// Does this form need to be a multipart form?
				for (i = 0; i < form.elements.length; i++) {
					if (!form.elements[i].disabled && form.elements[i].type === 'file') {
						form.encoding = form.enctype = 'multipart/form-data';
						form.elements[i].setAttribute('name', 'file');
					}
				}
			}
			else {
				// Its not a form element,
				// Therefore it must be a JSON object of Key=>Value or Key=>Element
				// If anyone of those values are a input type=file we shall shall insert its siblings into the form for which it belongs.
				for (x in data) if (data.hasOwnProperty(x)) {
					// Is this an input Element?
					if (_this.domInstance('input', data[x]) && data[x].type === 'file') {
						form = data[x].form;
						form.encoding = form.enctype = 'multipart/form-data';
					}
				}

				// Do If there is no defined form element, lets create one.
				if (!form) {
					// Build form
					form = doc.createElement('form');
					doc.body.appendChild(form);
					newform = form;
				}

				var input;

				// Add elements to the form if they dont exist
				for (x in data) if (data.hasOwnProperty(x)) {

					// Is this an element?
					var el = (_this.domInstance('input', data[x]) || _this.domInstance('textArea', data[x]) || _this.domInstance('select', data[x]));

					// Is this not an input element, or one that exists outside the form.
					if (!el || data[x].form !== form) {

						// Does an element have the same name?
						var inputs = form.elements[x];
						if (input) {
							// Remove it.
							if (!(inputs instanceof NodeList)) {
								inputs = [inputs];
							}

							for (i = 0; i < inputs.length; i++) {
								inputs[i].parentNode.removeChild(inputs[i]);
							}

						}

						// Create an input element
						input = doc.createElement('input');
						input.setAttribute('type', 'hidden');
						input.setAttribute('name', x);

						// Does it have a value attribute?
						if (el) {
							input.value = data[x].value;
						}
						else if (_this.domInstance(null, data[x])) {
							input.value = data[x].innerHTML || data[x].innerText;
						}
						else {
							input.value = data[x];
						}

						form.appendChild(input);
					}

					// It is an element, which exists within the form, but the name is wrong
					else if (el && data[x].name !== x) {
						data[x].setAttribute('name', x);
						data[x].name = x;
					}
				}

				// Disable elements from within the form if they weren't specified
				for (i = 0; i < form.elements.length; i++) {

					input = form.elements[i];

					// Does the same name and value exist in the parent
					if (!(input.name in data) && input.getAttribute('disabled') !== true) {
						// Disable
						input.setAttribute('disabled', true);

						// Add re-enable to callback
						reenableAfterSubmit.push(input);
					}
				}
			}

			// Set the target of the form
			form.setAttribute('method', 'POST');
			form.setAttribute('target', callbackID);
			form.target = callbackID;

			// Update the form URL
			form.setAttribute('action', url);

			// Submit the form
			// Some reason this needs to be offset from the current window execution
			setTimeout(function() {
				form.submit();

				setTimeout(function() {
					try {
						// Remove the iframe from the page.
						//win.parentNode.removeChild(win);
						// Remove the form
						if (newform) {
							newform.parentNode.removeChild(newform);
						}
					}
					catch (e) {
						try {
							console.error('HelloJS: could not remove iframe');
						}
						catch (ee) {}
					}

					// Reenable the disabled form
					for (var i = 0; i < reenableAfterSubmit.length; i++) {
						if (reenableAfterSubmit[i]) {
							reenableAfterSubmit[i].setAttribute('disabled', false);
							reenableAfterSubmit[i].disabled = false;
						}
					}
				}, 0);
			}, 100);
		},

		// Some of the providers require that only multipart is used with non-binary forms.
		// This function checks whether the form contains binary data
		hasBinary: function(data) {
			for (var x in data) if (data.hasOwnProperty(x)) {
				if (this.isBinary(data[x])) {
					return true;
				}
			}

			return false;
		},

		// Determines if a variable Either Is or like a FormInput has the value of a Blob

		isBinary: function(data) {

			return data instanceof Object && (
			(this.domInstance('input', data) && data.type === 'file') ||
			('FileList' in window && data instanceof window.FileList) ||
			('File' in window && data instanceof window.File) ||
			('Blob' in window && data instanceof window.Blob));

		},

		// Convert Data-URI to Blob string
		toBlob: function(dataURI) {
			var reg = /^data\:([^;,]+(\;charset=[^;,]+)?)(\;base64)?,/i;
			var m = dataURI.match(reg);
			if (!m) {
				return dataURI;
			}

			var binary = atob(dataURI.replace(reg, ''));
			var array = [];
			for (var i = 0; i < binary.length; i++) {
				array.push(binary.charCodeAt(i));
			}

			return new Blob([new Uint8Array(array)], {type: m[1]});
		}

	});

	// EXTRA: Convert FormElement to JSON for POSTing
	// Wrappers to add additional functionality to existing functions
	(function(hello) {

		// Copy original function
		var api = hello.api;
		var utils = hello.utils;

		utils.extend(utils, {

			// DataToJSON
			// This takes a FormElement|NodeList|InputElement|MixedObjects and convers the data object to JSON.
			dataToJSON: function(p) {

				var _this = this;
				var w = window;
				var data = p.data;

				// Is data a form object
				if (_this.domInstance('form', data)) {
					data = _this.nodeListToJSON(data.elements);
				}
				else if ('NodeList' in w && data instanceof NodeList) {
					data = _this.nodeListToJSON(data);
				}
				else if (_this.domInstance('input', data)) {
					data = _this.nodeListToJSON([data]);
				}

				// Is data a blob, File, FileList?
				if (('File' in w && data instanceof w.File) ||
					('Blob' in w && data instanceof w.Blob) ||
					('FileList' in w && data instanceof w.FileList)) {
					data = {file: data};
				}

				// Loop through data if it's not form data it must now be a JSON object
				if (!('FormData' in w && data instanceof w.FormData)) {

					for (var x in data) if (data.hasOwnProperty(x)) {

						if ('FileList' in w && data[x] instanceof w.FileList) {
							if (data[x].length === 1) {
								data[x] = data[x][0];
							}
						}
						else if (_this.domInstance('input', data[x]) && data[x].type === 'file') {
							continue;
						}
						else if (_this.domInstance('input', data[x]) ||
							_this.domInstance('select', data[x]) ||
							_this.domInstance('textArea', data[x])) {
							data[x] = data[x].value;
						}
						else if (_this.domInstance(null, data[x])) {
							data[x] = data[x].innerHTML || data[x].innerText;
						}
					}
				}

				p.data = data;
				return data;
			},

			// NodeListToJSON
			// Given a list of elements extrapolate their values and return as a json object
			nodeListToJSON: function(nodelist) {

				var json = {};

				// Create a data string
				for (var i = 0; i < nodelist.length; i++) {

					var input = nodelist[i];

					// If the name of the input is empty or diabled, dont add it.
					if (input.disabled || !input.name) {
						continue;
					}

					// Is this a file, does the browser not support 'files' and 'FormData'?
					if (input.type === 'file') {
						json[input.name] = input;
					}
					else {
						json[input.name] = input.value || input.innerHTML;
					}
				}

				return json;
			}
		});

		// Replace it
		hello.api = function() {

			// Get arguments
			var p = utils.args({path: 's!', method: 's', data:'o', timeout: 'i', callback: 'f'}, arguments);

			// Change for into a data object
			if (p.data) {
				utils.dataToJSON(p);
			}

			return api.call(this, p);
		};

	})(hello);

	/////////////////////////////////////
	//
	// Save any access token that is in the current page URL
	// Handle any response solicited through iframe hash tag following an API request
	//
	/////////////////////////////////////

	hello.utils.responseHandler(window, window.opener || window.parent);

	// Script to support ChromeApps
	// This overides the hello.utils.popup method to support chrome.identity.launchWebAuthFlow
	// See https://developer.chrome.com/apps/app_identity#non

	// Is this a chrome app?

	if (typeof chrome === 'object' && typeof chrome.identity === 'object' && chrome.identity.launchWebAuthFlow) {

		(function() {

			// Swap the popup method
			hello.utils.popup = function(url) {

				return _open(url, true);

			};

			// Swap the hidden iframe method
			hello.utils.iframe = function(url) {

				_open(url, false);

			};

			// Swap the request_cors method
			hello.utils.request_cors = function(callback) {

				callback();

				// Always run as CORS

				return true;
			};

			// Swap the storage method
			var _cache = {};
			chrome.storage.local.get('hello', function(r) {
				// Update the cache
				_cache = r.hello || {};
			});

			hello.utils.store = function(name, value) {

				// Get all
				if (arguments.length === 0) {
					return _cache;
				}

				// Get
				if (arguments.length === 1) {
					return _cache[name] || null;
				}

				// Set
				if (value) {
					_cache[name] = value;
					chrome.storage.local.set({hello: _cache});
					return value;
				}

				// Delete
				if (value === null) {
					delete _cache[name];
					chrome.storage.local.set({hello: _cache});
					return null;
				}
			};

			// Open function
			function _open(url, interactive) {

				// Launch
				var ref = {
					closed: false
				};

				// Launch the webAuthFlow
				chrome.identity.launchWebAuthFlow({
					url: url,
					interactive: interactive
				}, function(responseUrl) {

					// Did the user cancel this prematurely
					if (responseUrl === undefined) {
						ref.closed = true;
						return;
					}

					// Split appart the URL
					var a = hello.utils.url(responseUrl);

					// The location can be augmented in to a location object like so...
					// We dont have window operations on the popup so lets create some
					var _popup = {
						location: {

							// Change the location of the popup
							assign: function(url) {

								// If there is a secondary reassign
								// In the case of OAuth1
								// Trigger this in non-interactive mode.
								_open(url, false);
							},

							search: a.search,
							hash: a.hash,
							href: a.href
						},
						close: function() {}
					};

					// Then this URL contains information which HelloJS must process
					// URL string
					// Window - any action such as window relocation goes here
					// Opener - the parent window which opened this, aka this script

					hello.utils.responseHandler(_popup, window);
				});

				// Return the reference
				return ref;
			}

		})();
	}

	// Phonegap override for hello.phonegap.js
	(function() {

		// Is this a phonegap implementation?
		if (!(/^file:\/{3}[^\/]/.test(window.location.href) && window.cordova)) {
			// Cordova is not included.
			return;
		}

		// Augment the hidden iframe method
		hello.utils.iframe = function(url, redirectUri) {
			hello.utils.popup(url, redirectUri, {hidden: 'yes'});
		};

		// Augment the popup
		var utilPopup = hello.utils.popup;

		// Replace popup
		hello.utils.popup = function(url, redirectUri, options) {

			// Run the standard
			var popup = utilPopup.call(this, url, redirectUri, options);

			// Create a function for reopening the popup, and assigning events to the new popup object
			// PhoneGap support
			// Add an event listener to listen to the change in the popup windows URL
			// This must appear before popup.focus();
			try {
				if (popup && popup.addEventListener) {

					// Get the origin of the redirect URI

					var a = hello.utils.url(redirectUri);
					var redirectUriOrigin = a.origin || (a.protocol + '//' + a.hostname);

					// Listen to changes in the InAppBrowser window

					popup.addEventListener('loadstart', function(e) {

						var url = e.url;

						// Is this the path, as given by the redirectUri?
						// Check the new URL agains the redirectUriOrigin.
						// According to #63 a user could click 'cancel' in some dialog boxes ....
						// The popup redirects to another page with the same origin, yet we still wish it to close.

						if (url.indexOf(redirectUriOrigin) !== 0) {
							return;
						}

						// Split appart the URL
						var a = hello.utils.url(url);

						// We dont have window operations on the popup so lets create some
						// The location can be augmented in to a location object like so...

						var _popup = {
							location: {
								// Change the location of the popup
								assign: function(location) {

									// Unfourtunatly an app is may not change the location of a InAppBrowser window.
									// So to shim this, just open a new one.
									popup.executeScript({code: 'window.location.href = "' + location + ';"'});
								},

								search: a.search,
								hash: a.hash,
								href: a.href
							},
							close: function() {
								if (popup.close) {
									popup.close();
									try {
										popup.closed = true;
									}
									catch (_e) {}
								}
							}
						};

						// Then this URL contains information which HelloJS must process
						// URL string
						// Window - any action such as window relocation goes here
						// Opener - the parent window which opened this, aka this script

						hello.utils.responseHandler(_popup, window);

					});
				}
			}
			catch (e) {}

			return popup;
		};

	})();

	(function(hello) {

		// OAuth1
		var OAuth1Settings = {
			version: '1.0',
			auth: 'https://www.dropbox.com/1/oauth/authorize',
			request: 'https://api.dropbox.com/1/oauth/request_token',
			token: 'https://api.dropbox.com/1/oauth/access_token'
		};

		// OAuth2 Settings
		var OAuth2Settings = {
			version: 2,
			auth: 'https://www.dropbox.com/1/oauth2/authorize',
			grant: 'https://api.dropbox.com/1/oauth2/token'
		};

		// Initiate the Dropbox module
		hello.init({

			dropbox: {

				name: 'Dropbox',

				oauth: OAuth2Settings,

				login: function(p) {
					// OAuth2 non-standard adjustments
					p.qs.scope = '';

					// Should this be run as OAuth1?
					// If the redirect_uri is is HTTP (non-secure) then its required to revert to the OAuth1 endpoints
					var redirect = decodeURIComponent(p.qs.redirect_uri);
					if (redirect.indexOf('http:') === 0 && redirect.indexOf('http://localhost/') !== 0) {

						// Override the dropbox OAuth settings.
						hello.services.dropbox.oauth = OAuth1Settings;
					}
					else {
						// Override the dropbox OAuth settings.
						hello.services.dropbox.oauth = OAuth2Settings;
					}

					// The dropbox login window is a different size
					p.options.popup.width = 1000;
					p.options.popup.height = 1000;
				},

				/*
					Dropbox does not allow insecure HTTP URI's in the redirect_uri field
					...otherwise I'd love to use OAuth2

					Follow request https://forums.dropbox.com/topic.php?id=106505

					p.qs.response_type = 'code';
					oauth: {
						version: 2,
						auth: 'https://www.dropbox.com/1/oauth2/authorize',
						grant: 'https://api.dropbox.com/1/oauth2/token'
					}
				*/

				// API Base URL
				base: 'https://api.dropbox.com/1/',

				// Bespoke setting: this is states whether to use the custom environment of Dropbox or to use their own environment
				// Because it's notoriously difficult for Dropbox too provide access from other webservices, this defaults to Sandbox
				root: 'sandbox',

				// Map GET requests
				get: {
					me: 'account/info',

					// Https://www.dropbox.com/developers/core/docs#metadata
					'me/files': req('metadata/auto/@{parent|}'),
					'me/folder': req('metadata/auto/@{id}'),
					'me/folders': req('metadata/auto/'),

					'default': function(p, callback) {
						if (p.path.match('https://api-content.dropbox.com/1/files/')) {
							// This is a file, return binary data
							p.method = 'blob';
						}

						callback(p.path);
					}
				},

				post: {
					'me/files': function(p, callback) {

						var path = p.data.parent;
						var fileName = p.data.name;

						p.data = {
							file: p.data.file
						};

						// Does this have a data-uri to upload as a file?
						if (typeof (p.data.file) === 'string') {
							p.data.file = hello.utils.toBlob(p.data.file);
						}

						callback('https://api-content.dropbox.com/1/files_put/auto/' + path + '/' + fileName);
					},

					'me/folders': function(p, callback) {

						var name = p.data.name;
						p.data = {};

						callback('fileops/create_folder?root=@{root|sandbox}&' + hello.utils.param({
							path: name
						}));
					}
				},

				// Map DELETE requests
				del: {
					'me/files': 'fileops/delete?root=@{root|sandbox}&path=@{id}',
					'me/folder': 'fileops/delete?root=@{root|sandbox}&path=@{id}'
				},

				wrap: {
					me: function(o) {
						formatError(o);
						if (!o.uid) {
							return o;
						}

						o.name = o.display_name;
						var m = o.name.split(' ');
						o.first_name = m.shift();
						o.last_name = m.join(' ');
						o.id = o.uid;
						delete o.uid;
						delete o.display_name;
						return o;
					},

					'default': function(o, headers, req) {
						formatError(o);
						if (o.is_dir && o.contents) {
							o.data = o.contents;
							delete o.contents;

							o.data.forEach(function(item) {
								item.root = o.root;
								formatFile(item, headers, req);
							});
						}

						formatFile(o, headers, req);

						if (o.is_deleted) {
							o.success = true;
						}

						return o;
					}
				},

				// Doesn't return the CORS headers
				xhr: function(p) {

					// The proxy supports allow-cross-origin-resource
					// Alas that's the only thing we're using.
					if (p.data && p.data.file) {
						var file = p.data.file;
						if (file) {
							if (file.files) {
								p.data = file.files[0];
							}
							else {
								p.data = file;
							}
						}
					}

					if (p.method === 'delete') {
						p.method = 'post';
					}

					return true;
				},

				form: function(p, qs) {
					delete qs.state;
					delete qs.redirect_uri;
				}
			}
		});

		function formatError(o) {
			if (o && 'error' in o) {
				o.error = {
					code: 'server_error',
					message: o.error.message || o.error
				};
			}
		}

		function formatFile(o, headers, req) {

			if (typeof o !== 'object' ||
				(typeof Blob !== 'undefined' && o instanceof Blob) ||
				(typeof ArrayBuffer !== 'undefined' && o instanceof ArrayBuffer)) {
				// This is a file, let it through unformatted
				return;
			}

			if ('error' in o) {
				return;
			}

			var path = (o.root !== 'app_folder' ? o.root : '') + o.path.replace(/\&/g, '%26');
			path = path.replace(/^\//, '');
			if (o.thumb_exists) {
				o.thumbnail = req.oauth_proxy + '?path=' +
				encodeURIComponent('https://api-content.dropbox.com/1/thumbnails/auto/' + path + '?format=jpeg&size=m') + '&access_token=' + req.options.access_token;
			}

			o.type = (o.is_dir ? 'folder' : o.mime_type);
			o.name = o.path.replace(/.*\//g, '');
			if (o.is_dir) {
				o.files = path.replace(/^\//, '');
			}
			else {
				o.downloadLink = hello.settings.oauth_proxy + '?path=' +
				encodeURIComponent('https://api-content.dropbox.com/1/files/auto/' + path) + '&access_token=' + req.options.access_token;
				o.file = 'https://api-content.dropbox.com/1/files/auto/' + path;
			}

			if (!o.id) {
				o.id = o.path.replace(/^\//, '');
			}

			// O.media = 'https://api-content.dropbox.com/1/files/' + path;
		}

		function req(str) {
			return function(p, cb) {
				delete p.query.limit;
				cb(str);
			};
		}

	})(hello);

	(function(hello) {

		hello.init({

			facebook: {

				name: 'Facebook',

				// SEE https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/v2.1
				oauth: {
					version: 2,
					auth: 'https://www.facebook.com/dialog/oauth/',
					grant: 'https://graph.facebook.com/oauth/access_token'
				},

				// Authorization scopes
				scope: {
					basic: 'public_profile',
					email: 'email',
					share: 'user_posts',
					birthday: 'user_birthday',
					events: 'user_events',
					photos: 'user_photos',
					videos: 'user_videos',
					friends: 'user_friends',
					files: 'user_photos,user_videos',
					publish_files: 'user_photos,user_videos,publish_actions',
					publish: 'publish_actions',

					// Deprecated in v2.0
					// Create_event	: 'create_event',

					offline_access: ''
				},

				// Refresh the access_token
				refresh: true,

				login: function(p) {

					// Reauthenticate
					// https://developers.facebook.com/docs/facebook-login/reauthentication
					if (p.options.force) {
						p.qs.auth_type = 'reauthenticate';
					}

					// Set the display value
					p.qs.display = p.options.display || 'popup';
				},

				logout: function(callback, options) {
					// Assign callback to a global handler
					var callbackID = hello.utils.globalEvent(callback);
					var redirect = encodeURIComponent(hello.settings.redirect_uri + '?' + hello.utils.param({callback:callbackID, result: JSON.stringify({force:true}), state: '{}'}));
					var token = (options.authResponse || {}).access_token;
					hello.utils.iframe('https://www.facebook.com/logout.php?next=' + redirect + '&access_token=' + token);

					// Possible responses:
					// String URL	- hello.logout should handle the logout
					// Undefined	- this function will handle the callback
					// True - throw a success, this callback isn't handling the callback
					// False - throw a error
					if (!token) {
						// If there isn't a token, the above wont return a response, so lets trigger a response
						return false;
					}
				},

				// API Base URL
				base: 'https://graph.facebook.com/v2.4/',

				// Map GET requests
				get: {
					me: 'me?fields=email,first_name,last_name,name,timezone,verified',
					'me/friends': 'me/friends',
					'me/following': 'me/friends',
					'me/followers': 'me/friends',
					'me/share': 'me/feed',
					'me/like': 'me/likes',
					'me/files': 'me/albums',
					'me/albums': 'me/albums?fields=cover_photo,name',
					'me/album': '@{id}/photos?fields=picture',
					'me/photos': 'me/photos',
					'me/photo': '@{id}',
					'friend/albums': '@{id}/albums',
					'friend/photos': '@{id}/photos'

					// Pagination
					// Https://developers.facebook.com/docs/reference/api/pagination/
				},

				// Map POST requests
				post: {
					'me/share': 'me/feed',
					'me/photo': '@{id}'

					// Https://developers.facebook.com/docs/graph-api/reference/v2.2/object/likes/
				},

				wrap: {
					me: formatUser,
					'me/friends': formatFriends,
					'me/following': formatFriends,
					'me/followers': formatFriends,
					'me/albums': format,
					'me/photos': format,
					'me/files': format,
					'default': format
				},

				// Special requirements for handling XHR
				xhr: function(p, qs) {
					if (p.method === 'get' || p.method === 'post') {
						qs.suppress_response_codes = true;
					}

					// Is this a post with a data-uri?
					if (p.method === 'post' && p.data && typeof (p.data.file) === 'string') {
						// Convert the Data-URI to a Blob
						p.data.file = hello.utils.toBlob(p.data.file);
					}

					return true;
				},

				// Special requirements for handling JSONP fallback
				jsonp: function(p, qs) {
					var m = p.method;
					if (m !== 'get' && !hello.utils.hasBinary(p.data)) {
						p.data.method = m;
						p.method = 'get';
					}
					else if (p.method === 'delete') {
						qs.method = 'delete';
						p.method = 'post';
					}
				},

				// Special requirements for iframe form hack
				form: function(p) {
					return {
						// Fire the callback onload
						callbackonload: true
					};
				}
			}
		});

		var base = 'https://graph.facebook.com/';

		function formatUser(o) {
			if (o.id) {
				o.thumbnail = o.picture = 'https://graph.facebook.com/' + o.id + '/picture';
			}

			return o;
		}

		function formatFriends(o) {
			if ('data' in o) {
				o.data.forEach(formatUser);
			}

			return o;
		}

		function format(o, headers, req) {
			if (typeof o === 'boolean') {
				o = {success: o};
			}

			if (o && 'data' in o) {
				var token = req.query.access_token;

				if (!(o.data instanceof Array)) {
					var data = o.data;
					delete o.data;
					o.data = [data];
				}

				o.data.forEach(function(d) {

					if (d.picture) {
						d.thumbnail = d.picture;
					}

					d.pictures = (d.images || [])
						.sort(function(a, b) {
							return a.width - b.width;
						});

					if (d.cover_photo && d.cover_photo.id) {
						d.thumbnail = base + d.cover_photo.id + '/picture?access_token=' + token;
					}

					if (d.type === 'album') {
						d.files = d.photos = base + d.id + '/photos';
					}

					if (d.can_upload) {
						d.upload_location = base + d.id + '/photos';
					}
				});
			}

			return o;
		}

	})(hello);

	(function(hello) {

		hello.init({

			flickr: {

				name: 'Flickr',

				// Ensure that you define an oauth_proxy
				oauth: {
					version: '1.0a',
					auth: 'https://www.flickr.com/services/oauth/authorize?perms=read',
					request: 'https://www.flickr.com/services/oauth/request_token',
					token: 'https://www.flickr.com/services/oauth/access_token'
				},

				// API base URL
				base: 'https://api.flickr.com/services/rest',

				// Map GET resquests
				get: {
					me: sign('flickr.people.getInfo'),
					'me/friends': sign('flickr.contacts.getList', {per_page:'@{limit|50}'}),
					'me/following': sign('flickr.contacts.getList', {per_page:'@{limit|50}'}),
					'me/followers': sign('flickr.contacts.getList', {per_page:'@{limit|50}'}),
					'me/albums': sign('flickr.photosets.getList', {per_page:'@{limit|50}'}),
					'me/album': sign('flickr.photosets.getPhotos', {photoset_id: '@{id}'}),
					'me/photos': sign('flickr.people.getPhotos', {per_page:'@{limit|50}'})
				},

				wrap: {
					me: function(o) {
						formatError(o);
						o = checkResponse(o, 'person');
						if (o.id) {
							if (o.realname) {
								o.name = o.realname._content;
								var m = o.name.split(' ');
								o.first_name = m.shift();
								o.last_name = m.join(' ');
							}

							o.thumbnail = getBuddyIcon(o, 'l');
							o.picture = getBuddyIcon(o, 'l');
						}

						return o;
					},

					'me/friends': formatFriends,
					'me/followers': formatFriends,
					'me/following': formatFriends,
					'me/albums': function(o) {
						formatError(o);
						o = checkResponse(o, 'photosets');
						paging(o);
						if (o.photoset) {
							o.data = o.photoset;
							o.data.forEach(function(item) {
								item.name = item.title._content;
								item.photos = 'https://api.flickr.com/services/rest' + getApiUrl('flickr.photosets.getPhotos', {photoset_id: item.id}, true);
							});

							delete o.photoset;
						}

						return o;
					},

					'me/photos': function(o) {
						formatError(o);
						return formatPhotos(o);
					},

					'default': function(o) {
						formatError(o);
						return formatPhotos(o);
					}
				},

				xhr: false,

				jsonp: function(p, qs) {
					if (p.method == 'get') {
						delete qs.callback;
						qs.jsoncallback = p.callbackID;
					}
				}
			}
		});

		function getApiUrl(method, extraParams, skipNetwork) {
			var url = ((skipNetwork) ? '' : 'flickr:') +
				'?method=' + method +
				'&api_key=' + hello.services.flickr.id +
				'&format=json';
			for (var param in extraParams) {
				if (extraParams.hasOwnProperty(param)) {
					url += '&' + param + '=' + extraParams[param];
				}
			}

			return url;
		}

		// This is not exactly neat but avoid to call
		// The method 'flickr.test.login' for each api call

		function withUser(cb) {
			var auth = hello.getAuthResponse('flickr');
			cb(auth && auth.user_nsid ? auth.user_nsid : null);
		}

		function sign(url, params) {
			if (!params) {
				params = {};
			}

			return function(p, callback) {
				withUser(function(userId) {
					params.user_id = userId;
					callback(getApiUrl(url, params, true));
				});
			};
		}

		function getBuddyIcon(profile, size) {
			var url = 'https://www.flickr.com/images/buddyicon.gif';
			if (profile.nsid && profile.iconserver && profile.iconfarm) {
				url = 'https://farm' + profile.iconfarm + '.staticflickr.com/' +
					profile.iconserver + '/' +
					'buddyicons/' + profile.nsid +
					((size) ? '_' + size : '') + '.jpg';
			}

			return url;
		}

		// See: https://www.flickr.com/services/api/misc.urls.html
		function createPhotoUrl(id, farm, server, secret, size) {
			size = (size) ? '_' + size : '';
			return 'https://farm' + farm + '.staticflickr.com/' + server + '/' + id + '_' + secret + size + '.jpg';
		}

		function formatUser(o) {
		}

		function formatError(o) {
			if (o && o.stat && o.stat.toLowerCase() != 'ok') {
				o.error = {
					code: 'invalid_request',
					message: o.message
				};
			}
		}

		function formatPhotos(o) {
			if (o.photoset || o.photos) {
				var set = ('photoset' in o) ? 'photoset' : 'photos';
				o = checkResponse(o, set);
				paging(o);
				o.data = o.photo;
				delete o.photo;
				for (var i = 0; i < o.data.length; i++) {
					var photo = o.data[i];
					photo.name = photo.title;
					photo.picture = createPhotoUrl(photo.id, photo.farm, photo.server, photo.secret, '');
					photo.pictures = createPictures(photo.id, photo.farm, photo.server, photo.secret);
					photo.source = createPhotoUrl(photo.id, photo.farm, photo.server, photo.secret, 'b');
					photo.thumbnail = createPhotoUrl(photo.id, photo.farm, photo.server, photo.secret, 'm');
				}
			}

			return o;
		}

		// See: https://www.flickr.com/services/api/misc.urls.html
		function createPictures(id, farm, server, secret) {

			var NO_LIMIT = 2048;
			var sizes = [
				{id: 't', max: 100},
				{id: 'm', max: 240},
				{id: 'n', max: 320},
				{id: '', max: 500},
				{id: 'z', max: 640},
				{id: 'c', max: 800},
				{id: 'b', max: 1024},
				{id: 'h', max: 1600},
				{id: 'k', max: 2048},
				{id: 'o', max: NO_LIMIT}
			];

			return sizes.map(function(size) {
				return {
					source: createPhotoUrl(id, farm, server, secret, size.id),

					// Note: this is a guess that's almost certain to be wrong (unless square source)
					width: size.max,
					height: size.max
				};
			});
		}

		function checkResponse(o, key) {

			if (key in o) {
				o = o[key];
			}
			else if (!('error' in o)) {
				o.error = {
					code: 'invalid_request',
					message: o.message || 'Failed to get data from Flickr'
				};
			}

			return o;
		}

		function formatFriends(o) {
			formatError(o);
			if (o.contacts) {
				o = checkResponse(o, 'contacts');
				paging(o);
				o.data = o.contact;
				delete o.contact;
				for (var i = 0; i < o.data.length; i++) {
					var item = o.data[i];
					item.id = item.nsid;
					item.name = item.realname || item.username;
					item.thumbnail = getBuddyIcon(item, 'm');
				}
			}

			return o;
		}

		function paging(res) {
			if (res.page && res.pages && res.page !== res.pages) {
				res.paging = {
					next: '?page=' + (++res.page)
				};
			}
		}

	})(hello);

	(function(hello) {

		hello.init({

			foursquare: {

				name: 'Foursquare',

				oauth: {
					// See: https://developer.foursquare.com/overview/auth
					version: 2,
					auth: 'https://foursquare.com/oauth2/authenticate',
					grant: 'https://foursquare.com/oauth2/access_token'
				},

				// Refresh the access_token once expired
				refresh: true,

				base: 'https://api.foursquare.com/v2/',

				get: {
					me: 'users/self',
					'me/friends': 'users/self/friends',
					'me/followers': 'users/self/friends',
					'me/following': 'users/self/friends'
				},

				wrap: {
					me: function(o) {
						formatError(o);
						if (o && o.response) {
							o = o.response.user;
							formatUser(o);
						}

						return o;
					},

					'default': function(o) {
						formatError(o);

						// Format friends
						if (o && 'response' in o && 'friends' in o.response && 'items' in o.response.friends) {
							o.data = o.response.friends.items;
							o.data.forEach(formatUser);
							delete o.response;
						}

						return o;
					}
				},

				xhr: formatRequest,
				jsonp: formatRequest
			}
		});

		function formatError(o) {
			if (o.meta && (o.meta.code === 400 || o.meta.code === 401)) {
				o.error = {
					code: 'access_denied',
					message: o.meta.errorDetail
				};
			}
		}

		function formatUser(o) {
			if (o && o.id) {
				o.thumbnail = o.photo.prefix + '100x100' + o.photo.suffix;
				o.name = o.firstName + ' ' + o.lastName;
				o.first_name = o.firstName;
				o.last_name = o.lastName;
				if (o.contact) {
					if (o.contact.email) {
						o.email = o.contact.email;
					}
				}
			}
		}

		function formatRequest(p, qs) {
			var token = qs.access_token;
			delete qs.access_token;
			qs.oauth_token = token;
			qs.v = 20121125;
			return true;
		}

	})(hello);

	(function(hello) {

		hello.init({

			github: {

				name: 'GitHub',

				oauth: {
					version: 2,
					auth: 'https://github.com/login/oauth/authorize',
					grant: 'https://github.com/login/oauth/access_token',
					response_type: 'code'
				},

				scope: {
					email: 'user:email'
				},

				base: 'https://api.github.com/',

				get: {
					me: 'user',
					'me/friends': 'user/following?per_page=@{limit|100}',
					'me/following': 'user/following?per_page=@{limit|100}',
					'me/followers': 'user/followers?per_page=@{limit|100}',
					'me/like': 'user/starred?per_page=@{limit|100}'
				},

				wrap: {
					me: function(o, headers) {

						formatError(o, headers);
						formatUser(o);

						return o;
					},

					'default': function(o, headers, req) {

						formatError(o, headers);

						if (Array.isArray(o)) {
							o = {data:o};
						}

						if (o.data) {
							paging(o, headers, req);
							o.data.forEach(formatUser);
						}

						return o;
					}
				},

				xhr: function(p) {

					if (p.method !== 'get' && p.data) {

						// Serialize payload as JSON
						p.headers = p.headers || {};
						p.headers['Content-Type'] = 'application/json';
						if (typeof (p.data) === 'object') {
							p.data = JSON.stringify(p.data);
						}
					}

					return true;
				}
			}
		});

		function formatError(o, headers) {
			var code = headers ? headers.statusCode : (o && 'meta' in o && 'status' in o.meta && o.meta.status);
			if ((code === 401 || code === 403)) {
				o.error = {
					code: 'access_denied',
					message: o.message || (o.data ? o.data.message : 'Could not get response')
				};
				delete o.message;
			}
		}

		function formatUser(o) {
			if (o.id) {
				o.thumbnail = o.picture = o.avatar_url;
				o.name = o.login;
			}
		}

		function paging(res, headers, req) {
			if (res.data && res.data.length && headers && headers.Link) {
				var next = headers.Link.match(/<(.*?)>;\s*rel=\"next\"/);
				if (next) {
					res.paging = {
						next: next[1]
					};
				}
			}
		}

	})(hello);

	(function(hello) {

		var contactsUrl = 'https://www.google.com/m8/feeds/contacts/default/full?v=3.0&alt=json&max-results=@{limit|1000}&start-index=@{start|1}';

		hello.init({

			google: {

				name: 'Google Plus',

				// See: http://code.google.com/apis/accounts/docs/OAuth2UserAgent.html
				oauth: {
					version: 2,
					auth: 'https://accounts.google.com/o/oauth2/auth',
					grant: 'https://accounts.google.com/o/oauth2/token'
				},

				// Authorization scopes
				scope: {
					basic: 'https://www.googleapis.com/auth/plus.me profile',
					email: 'email',
					birthday: '',
					events: '',
					photos: 'https://picasaweb.google.com/data/',
					videos: 'http://gdata.youtube.com',
					friends: 'https://www.google.com/m8/feeds, https://www.googleapis.com/auth/plus.login',
					files: 'https://www.googleapis.com/auth/drive.readonly',
					publish: '',
					publish_files: 'https://www.googleapis.com/auth/drive',
					share: '',
					create_event: '',
					offline_access: ''
				},

				scope_delim: ' ',

				login: function(p) {

					if (p.qs.response_type === 'code') {

						// Let's set this to an offline access to return a refresh_token
						p.qs.access_type = 'offline';
					}

					// Reauthenticate
					// https://developers.google.com/identity/protocols/
					if (p.options.force) {
						p.qs.approval_prompt = 'force';
					}
				},

				// API base URI
				base: 'https://www.googleapis.com/',

				// Map GET requests
				get: {
					me: 'plus/v1/people/me',

					// Deprecated Sept 1, 2014
					//'me': 'oauth2/v1/userinfo?alt=json',

					// See: https://developers.google.com/+/api/latest/people/list
					'me/friends': 'plus/v1/people/me/people/visible?maxResults=@{limit|100}',
					'me/following': contactsUrl,
					'me/followers': contactsUrl,
					'me/contacts': contactsUrl,
					'me/share': 'plus/v1/people/me/activities/public?maxResults=@{limit|100}',
					'me/feed': 'plus/v1/people/me/activities/public?maxResults=@{limit|100}',
					'me/albums': 'https://picasaweb.google.com/data/feed/api/user/default?alt=json&max-results=@{limit|100}&start-index=@{start|1}',
					'me/album': function(p, callback) {
						var key = p.query.id;
						delete p.query.id;
						callback(key.replace('/entry/', '/feed/'));
					},

					'me/photos': 'https://picasaweb.google.com/data/feed/api/user/default?alt=json&kind=photo&max-results=@{limit|100}&start-index=@{start|1}',

					// See: https://developers.google.com/drive/v2/reference/files/list
					'me/file': 'drive/v2/files/@{id}',
					'me/files': 'drive/v2/files?q=%22@{parent|root}%22+in+parents+and+trashed=false&maxResults=@{limit|100}',

					// See: https://developers.google.com/drive/v2/reference/files/list
					'me/folders': 'drive/v2/files?q=%22@{id|root}%22+in+parents+and+mimeType+=+%22application/vnd.google-apps.folder%22+and+trashed=false&maxResults=@{limit|100}',

					// See: https://developers.google.com/drive/v2/reference/files/list
					'me/folder': 'drive/v2/files?q=%22@{id|root}%22+in+parents+and+trashed=false&maxResults=@{limit|100}'
				},

				// Map POST requests
				post: {

					// Google Drive
					'me/files': uploadDrive,
					'me/folders': function(p, callback) {
						p.data = {
							title: p.data.name,
							parents: [{id: p.data.parent || 'root'}],
							mimeType: 'application/vnd.google-apps.folder'
						};
						callback('drive/v2/files');
					}
				},

				// Map PUT requests
				put: {
					'me/files': uploadDrive
				},

				// Map DELETE requests
				del: {
					'me/files': 'drive/v2/files/@{id}',
					'me/folder': 'drive/v2/files/@{id}'
				},

				// Map PATCH requests
				patch: {
					'me/file': 'drive/v2/files/@{id}'
				},

				wrap: {
					me: function(o) {
						if (o.id) {
							o.last_name = o.family_name || (o.name ? o.name.familyName : null);
							o.first_name = o.given_name || (o.name ? o.name.givenName : null);

							if (o.emails && o.emails.length) {
								o.email = o.emails[0].value;
							}

							formatPerson(o);
						}

						return o;
					},

					'me/friends': function(o) {
						if (o.items) {
							paging(o);
							o.data = o.items;
							o.data.forEach(formatPerson);
							delete o.items;
						}

						return o;
					},

					'me/contacts': formatFriends,
					'me/followers': formatFriends,
					'me/following': formatFriends,
					'me/share': formatFeed,
					'me/feed': formatFeed,
					'me/albums': gEntry,
					'me/photos': formatPhotos,
					'default': gEntry
				},

				xhr: function(p) {

					if (p.method === 'post' || p.method === 'put') {
						toJSON(p);
					}
					else if (p.method === 'patch') {
						hello.utils.extend(p.query, p.data);
						p.data = null;
					}

					return true;
				},

				// Don't even try submitting via form.
				// This means no POST operations in <=IE9
				form: false
			}
		});

		function toInt(s) {
			return parseInt(s, 10);
		}

		function formatFeed(o) {
			paging(o);
			o.data = o.items;
			delete o.items;
			return o;
		}

		// Format: ensure each record contains a name, id etc.
		function formatItem(o) {
			if (o.error) {
				return;
			}

			if (!o.name) {
				o.name = o.title || o.message;
			}

			if (!o.picture) {
				o.picture = o.thumbnailLink;
			}

			if (!o.thumbnail) {
				o.thumbnail = o.thumbnailLink;
			}

			if (o.mimeType === 'application/vnd.google-apps.folder') {
				o.type = 'folder';
				o.files = 'https://www.googleapis.com/drive/v2/files?q=%22' + o.id + '%22+in+parents';
			}

			return o;
		}

		function formatImage(image) {
			return {
				source: image.url,
				width: image.width,
				height: image.height
			};
		}

		function formatPhotos(o) {
			o.data = o.feed.entry.map(formatEntry);
			delete o.feed;
		}

		// Google has a horrible JSON API
		function gEntry(o) {
			paging(o);

			if ('feed' in o && 'entry' in o.feed) {
				o.data = o.feed.entry.map(formatEntry);
				delete o.feed;
			}

			// Old style: Picasa, etc.
			else if ('entry' in o) {
				return formatEntry(o.entry);
			}

			// New style: Google Drive & Plus
			else if ('items' in o) {
				o.data = o.items.map(formatItem);
				delete o.items;
			}
			else {
				formatItem(o);
			}

			return o;
		}

		function formatPerson(o) {
			o.name = o.displayName || o.name;
			o.picture = o.picture || (o.image ? o.image.url : null);
			o.thumbnail = o.picture;
		}

		function formatFriends(o, headers, req) {
			paging(o);
			var r = [];
			if ('feed' in o && 'entry' in o.feed) {
				var token = req.query.access_token;
				for (var i = 0; i < o.feed.entry.length; i++) {
					var a = o.feed.entry[i];

					a.id	= a.id.$t;
					a.name	= a.title.$t;
					delete a.title;
					if (a.gd$email) {
						a.email	= (a.gd$email && a.gd$email.length > 0) ? a.gd$email[0].address : null;
						a.emails = a.gd$email;
						delete a.gd$email;
					}

					if (a.updated) {
						a.updated = a.updated.$t;
					}

					if (a.link) {

						var pic = (a.link.length > 0) ? a.link[0].href : null;
						if (pic && a.link[0].gd$etag) {
							pic += (pic.indexOf('?') > -1 ? '&' : '?') + 'access_token=' + token;
							a.picture = pic;
							a.thumbnail = pic;
						}

						delete a.link;
					}

					if (a.category) {
						delete a.category;
					}
				}

				o.data = o.feed.entry;
				delete o.feed;
			}

			return o;
		}

		function formatEntry(a) {

			var group = a.media$group;
			var photo = group.media$content.length ? group.media$content[0] : {};
			var mediaContent = group.media$content || [];
			var mediaThumbnail = group.media$thumbnail || [];

			var pictures = mediaContent
				.concat(mediaThumbnail)
				.map(formatImage)
				.sort(function(a, b) {
					return a.width - b.width;
				});

			var i = 0;
			var _a;
			var p = {
				id: a.id.$t,
				name: a.title.$t,
				description: a.summary.$t,
				updated_time: a.updated.$t,
				created_time: a.published.$t,
				picture: photo ? photo.url : null,
				pictures: pictures,
				images: [],
				thumbnail: photo ? photo.url : null,
				width: photo.width,
				height: photo.height
			};

			// Get feed/children
			if ('link' in a) {
				for (i = 0; i < a.link.length; i++) {
					var d = a.link[i];
					if (d.rel.match(/\#feed$/)) {
						p.upload_location = p.files = p.photos = d.href;
						break;
					}
				}
			}

			// Get images of different scales
			if ('category' in a && a.category.length) {
				_a = a.category;
				for (i = 0; i < _a.length; i++) {
					if (_a[i].scheme && _a[i].scheme.match(/\#kind$/)) {
						p.type = _a[i].term.replace(/^.*?\#/, '');
					}
				}
			}

			// Get images of different scales
			if ('media$thumbnail' in group && group.media$thumbnail.length) {
				_a = group.media$thumbnail;
				p.thumbnail = _a[0].url;
				p.images = _a.map(formatImage);
			}

			_a = group.media$content;

			if (_a && _a.length) {
				p.images.push(formatImage(_a[0]));
			}

			return p;
		}

		function paging(res) {

			// Contacts V2
			if ('feed' in res && res.feed.openSearch$itemsPerPage) {
				var limit = toInt(res.feed.openSearch$itemsPerPage.$t);
				var start = toInt(res.feed.openSearch$startIndex.$t);
				var total = toInt(res.feed.openSearch$totalResults.$t);

				if ((start + limit) < total) {
					res.paging = {
						next: '?start=' + (start + limit)
					};
				}
			}
			else if ('nextPageToken' in res) {
				res.paging = {
					next: '?pageToken=' + res.nextPageToken
				};
			}
		}

		// Construct a multipart message
		function Multipart() {

			// Internal body
			var body = [];
			var boundary = (Math.random() * 1e10).toString(32);
			var counter = 0;
			var lineBreak = '\r\n';
			var delim = lineBreak + '--' + boundary;
			var ready = function() {};

			var dataUri = /^data\:([^;,]+(\;charset=[^;,]+)?)(\;base64)?,/i;

			// Add file
			function addFile(item) {
				var fr = new FileReader();
				fr.onload = function(e) {
					addContent(btoa(e.target.result), item.type + lineBreak + 'Content-Transfer-Encoding: base64');
				};

				fr.readAsBinaryString(item);
			}

			// Add content
			function addContent(content, type) {
				body.push(lineBreak + 'Content-Type: ' + type + lineBreak + lineBreak + content);
				counter--;
				ready();
			}

			// Add new things to the object
			this.append = function(content, type) {

				// Does the content have an array
				if (typeof (content) === 'string' || !('length' in Object(content))) {
					// Converti to multiples
					content = [content];
				}

				for (var i = 0; i < content.length; i++) {

					counter++;

					var item = content[i];

					// Is this a file?
					// Files can be either Blobs or File types
					if (
						(typeof (File) !== 'undefined' && item instanceof File) ||
						(typeof (Blob) !== 'undefined' && item instanceof Blob)
					) {
						// Read the file in
						addFile(item);
					}

					// Data-URI?
					// Data:[<mime type>][;charset=<charset>][;base64],<encoded data>
					// /^data\:([^;,]+(\;charset=[^;,]+)?)(\;base64)?,/i
					else if (typeof (item) === 'string' && item.match(dataUri)) {
						var m = item.match(dataUri);
						addContent(item.replace(dataUri, ''), m[1] + lineBreak + 'Content-Transfer-Encoding: base64');
					}

					// Regular string
					else {
						addContent(item, type);
					}
				}
			};

			this.onready = function(fn) {
				ready = function() {
					if (counter === 0) {
						// Trigger ready
						body.unshift('');
						body.push('--');
						fn(body.join(delim), boundary);
						body = [];
					}
				};

				ready();
			};
		}

		// Upload to Drive
		// If this is PUT then only augment the file uploaded
		// PUT https://developers.google.com/drive/v2/reference/files/update
		// POST https://developers.google.com/drive/manage-uploads
		function uploadDrive(p, callback) {

			var data = {};

			// Test for DOM element
			if (p.data &&
				(typeof (HTMLInputElement) !== 'undefined' && p.data instanceof HTMLInputElement)
			) {
				p.data = {file: p.data};
			}

			if (!p.data.name && Object(Object(p.data.file).files).length && p.method === 'post') {
				p.data.name = p.data.file.files[0].name;
			}

			if (p.method === 'post') {
				p.data = {
					title: p.data.name,
					parents: [{id: p.data.parent || 'root'}],
					file: p.data.file
				};
			}
			else {

				// Make a reference
				data = p.data;
				p.data = {};

				// Add the parts to change as required
				if (data.parent) {
					p.data.parents = [{id: p.data.parent || 'root'}];
				}

				if (data.file) {
					p.data.file = data.file;
				}

				if (data.name) {
					p.data.title = data.name;
				}
			}

			// Extract the file, if it exists from the data object
			// If the File is an INPUT element lets just concern ourselves with the NodeList
			var file;
			if ('file' in p.data) {
				file = p.data.file;
				delete p.data.file;

				if (typeof (file) === 'object' && 'files' in file) {
					// Assign the NodeList
					file = file.files;
				}

				if (!file || !file.length) {
					callback({
						error: {
							code: 'request_invalid',
							message: 'There were no files attached with this request to upload'
						}
					});
					return;
				}
			}

			// Set type p.data.mimeType = Object(file[0]).type || 'application/octet-stream';

			// Construct a multipart message
			var parts = new Multipart();
			parts.append(JSON.stringify(p.data), 'application/json');

			// Read the file into a  base64 string... yep a hassle, i know
			// FormData doesn't let us assign our own Multipart headers and HTTP Content-Type
			// Alas GoogleApi need these in a particular format
			if (file) {
				parts.append(file);
			}

			parts.onready(function(body, boundary) {

				p.headers['content-type'] = 'multipart/related; boundary="' + boundary + '"';
				p.data = body;

				callback('upload/drive/v2/files' + (data.id ? '/' + data.id : '') + '?uploadType=multipart');
			});

		}

		function toJSON(p) {
			if (typeof (p.data) === 'object') {
				// Convert the POST into a javascript object
				try {
					p.data = JSON.stringify(p.data);
					p.headers['content-type'] = 'application/json';
				}
				catch (e) {}
			}
		}

	})(hello);

	(function(hello) {

		hello.init({

			instagram: {

				name: 'Instagram',

				oauth: {
					// See: http://instagram.com/developer/authentication/
					version: 2,
					auth: 'https://instagram.com/oauth/authorize/',
					grant: 'https://api.instagram.com/oauth/access_token'
				},

				// Refresh the access_token once expired
				refresh: true,

				scope: {
					basic: 'basic',
					photos: '',
					friends: 'relationships',
					publish: 'likes comments',
					email: '',
					share: '',
					publish_files: '',
					files: '',
					videos: '',
					offline_access: ''
				},

				scope_delim: ' ',

				base: 'https://api.instagram.com/v1/',

				get: {
					me: 'users/self',
					'me/feed': 'users/self/feed?count=@{limit|100}',
					'me/photos': 'users/self/media/recent?min_id=0&count=@{limit|100}',
					'me/friends': 'users/self/follows?count=@{limit|100}',
					'me/following': 'users/self/follows?count=@{limit|100}',
					'me/followers': 'users/self/followed-by?count=@{limit|100}',
					'friend/photos': 'users/@{id}/media/recent?min_id=0&count=@{limit|100}'
				},

				post: {
					'me/like': function(p, callback) {
						var id = p.data.id;
						p.data = {};
						callback('media/' + id + '/likes');
					}
				},

				del: {
					'me/like': 'media/@{id}/likes'
				},

				wrap: {
					me: function(o) {

						formatError(o);

						if ('data' in o) {
							o.id = o.data.id;
							o.thumbnail = o.data.profile_picture;
							o.name = o.data.full_name || o.data.username;
						}

						return o;
					},

					'me/friends': formatFriends,
					'me/following': formatFriends,
					'me/followers': formatFriends,
					'me/photos': function(o) {

						formatError(o);
						paging(o);

						if ('data' in o) {
							o.data = o.data.filter(function(d) {
								return d.type === 'image';
							});

							o.data.forEach(function(d) {
								d.name = d.caption ? d.caption.text : null;
								d.thumbnail = d.images.thumbnail.url;
								d.picture = d.images.standard_resolution.url;
								d.pictures = Object.keys(d.images)
									.map(function(key) {
										var image = d.images[key];
										return formatImage(image);
									})
									.sort(function(a, b) {
										return a.width - b.width;
									});
							});
						}

						return o;
					},

					'default': function(o) {
						o = formatError(o);
						paging(o);
						return o;
					}
				},

				// Instagram does not return any CORS Headers
				// So besides JSONP we're stuck with proxy
				xhr: function(p, qs) {

					var method = p.method;
					var proxy = method !== 'get';

					if (proxy) {

						if ((method === 'post' || method === 'put') && p.query.access_token) {
							p.data.access_token = p.query.access_token;
							delete p.query.access_token;
						}

						// No access control headers
						// Use the proxy instead
						p.proxy = proxy;
					}

					return proxy;
				},

				// No form
				form: false
			}
		});

		function formatImage(image) {
			return {
				source: image.url,
				width: image.width,
				height: image.height
			};
		}

		function formatError(o) {
			if (typeof o === 'string') {
				return {
					error: {
						code: 'invalid_request',
						message: o
					}
				};
			}

			if (o && 'meta' in o && 'error_type' in o.meta) {
				o.error = {
					code: o.meta.error_type,
					message: o.meta.error_message
				};
			}

			return o;
		}

		function formatFriends(o) {
			paging(o);
			if (o && 'data' in o) {
				o.data.forEach(formatFriend);
			}

			return o;
		}

		function formatFriend(o) {
			if (o.id) {
				o.thumbnail = o.profile_picture;
				o.name = o.full_name || o.username;
			}
		}

		// See: http://instagram.com/developer/endpoints/
		function paging(res) {
			if ('pagination' in res) {
				res.paging = {
					next: res.pagination.next_url
				};
				delete res.pagination;
			}
		}

	})(hello);

	(function(hello) {

		hello.init({

			joinme: {

				name: 'join.me',

				oauth: {
					version: 2,
					auth: 'https://secure.join.me/api/public/v1/auth/oauth2',
					grant: 'https://secure.join.me/api/public/v1/auth/oauth2'
				},

				refresh: false,

				scope: {
					basic: 'user_info',
					user: 'user_info',
					scheduler: 'scheduler',
					start: 'start_meeting',
					email: '',
					friends: '',
					share: '',
					publish: '',
					photos: '',
					publish_files: '',
					files: '',
					videos: '',
					offline_access: ''
				},

				scope_delim: ' ',

				login: function(p) {
					p.options.popup.width = 400;
					p.options.popup.height = 700;
				},

				base: 'https://api.join.me/v1/',

				get: {
					me: 'user',
					meetings: 'meetings',
					'meetings/info': 'meetings/@{id}'
				},

				post: {
					'meetings/start/adhoc': function(p, callback) {
						callback('meetings/start');
					},

					'meetings/start/scheduled': function(p, callback) {
						var meetingId = p.data.meetingId;
						p.data = {};
						callback('meetings/' + meetingId + '/start');
					},

					'meetings/schedule': function(p, callback) {
						callback('meetings');
					}
				},

				patch: {
					'meetings/update': function(p, callback) {
						callback('meetings/' + p.data.meetingId);
					}
				},

				del: {
					'meetings/delete': 'meetings/@{id}'
				},

				wrap: {
					me: function(o, headers) {
						formatError(o, headers);

						if (!o.email) {
							return o;
						}

						o.name = o.fullName;
						o.first_name = o.name.split(' ')[0];
						o.last_name = o.name.split(' ')[1];
						o.id = o.email;

						return o;
					},

					'default': function(o, headers) {
						formatError(o, headers);

						return o;
					}
				},

				xhr: formatRequest

			}
		});

		function formatError(o, headers) {
			var errorCode;
			var message;
			var details;

			if (o && ('Message' in o)) {
				message = o.Message;
				delete o.Message;

				if ('ErrorCode' in o) {
					errorCode = o.ErrorCode;
					delete o.ErrorCode;
				}
				else {
					errorCode = getErrorCode(headers);
				}

				o.error = {
					code: errorCode,
					message: message,
					details: o
				};
			}

			return o;
		}

		function formatRequest(p, qs) {
			// Move the access token from the request body to the request header
			var token = qs.access_token;
			delete qs.access_token;
			p.headers.Authorization = 'Bearer ' + token;

			// Format non-get requests to indicate json body
			if (p.method !== 'get' && p.data) {
				p.headers['Content-Type'] = 'application/json';
				if (typeof (p.data) === 'object') {
					p.data = JSON.stringify(p.data);
				}
			}

			if (p.method === 'put') {
				p.method = 'patch';
			}

			return true;
		}

		function getErrorCode(headers) {
			switch (headers.statusCode) {
				case 400:
					return 'invalid_request';
				case 403:
					return 'stale_token';
				case 401:
					return 'invalid_token';
				case 500:
					return 'server_error';
				default:
					return 'server_error';
			}
		}

	}(hello));

	(function(hello) {

		hello.init({

			linkedin: {

				oauth: {
					version: 2,
					response_type: 'code',
					auth: 'https://www.linkedin.com/uas/oauth2/authorization',
					grant: 'https://www.linkedin.com/uas/oauth2/accessToken'
				},

				// Refresh the access_token once expired
				refresh: true,

				scope: {
					basic: 'r_basicprofile',
					email: 'r_emailaddress',
					files: '',
					friends: '',
					photos: '',
					publish: 'w_share',
					publish_files: 'w_share',
					share: '',
					videos: '',
					offline_access: ''
				},
				scope_delim: ' ',

				base: 'https://api.linkedin.com/v1/',

				get: {
					me: 'people/~:(picture-url,first-name,last-name,id,formatted-name,email-address)',

					// See: http://developer.linkedin.com/documents/get-network-updates-and-statistics-api
					'me/share': 'people/~/network/updates?count=@{limit|250}'
				},

				post: {

					// See: https://developer.linkedin.com/documents/api-requests-json
					'me/share': function(p, callback) {
						var data = {
							visibility: {
								code: 'anyone'
							}
						};

						if (p.data.id) {

							data.attribution = {
								share: {
									id: p.data.id
								}
							};

						}
						else {
							data.comment = p.data.message;
							if (p.data.picture && p.data.link) {
								data.content = {
									'submitted-url': p.data.link,
									'submitted-image-url': p.data.picture
								};
							}
						}

						p.data = JSON.stringify(data);

						callback('people/~/shares?format=json');
					},

					'me/like': like
				},

				del:{
					'me/like': like
				},

				wrap: {
					me: function(o) {
						formatError(o);
						formatUser(o);
						return o;
					},

					'me/friends': formatFriends,
					'me/following': formatFriends,
					'me/followers': formatFriends,
					'me/share': function(o) {
						formatError(o);
						paging(o);
						if (o.values) {
							o.data = o.values.map(formatUser);
							o.data.forEach(function(item) {
								item.message = item.headline;
							});

							delete o.values;
						}

						return o;
					},

					'default': function(o, headers) {
						formatError(o);
						empty(o, headers);
						paging(o);
					}
				},

				jsonp: function(p, qs) {
					formatQuery(qs);
					if (p.method === 'get') {
						qs.format = 'jsonp';
						qs['error-callback'] = p.callbackID;
					}
				},

				xhr: function(p, qs) {
					if (p.method !== 'get') {
						formatQuery(qs);
						p.headers['Content-Type'] = 'application/json';

						// Note: x-li-format ensures error responses are not returned in XML
						p.headers['x-li-format'] = 'json';
						p.proxy = true;
						return true;
					}

					return false;
				}
			}
		});

		function formatError(o) {
			if (o && 'errorCode' in o) {
				o.error = {
					code: o.status,
					message: o.message
				};
			}
		}

		function formatUser(o) {
			if (o.error) {
				return;
			}

			o.first_name = o.firstName;
			o.last_name = o.lastName;
			o.name = o.formattedName || (o.first_name + ' ' + o.last_name);
			o.thumbnail = o.pictureUrl;
			o.email = o.emailAddress;
			return o;
		}

		function formatFriends(o) {
			formatError(o);
			paging(o);
			if (o.values) {
				o.data = o.values.map(formatUser);
				delete o.values;
			}

			return o;
		}

		function paging(res) {
			if ('_count' in res && '_start' in res && (res._count + res._start) < res._total) {
				res.paging = {
					next: '?start=' + (res._start + res._count) + '&count=' + res._count
				};
			}
		}

		function empty(o, headers) {
			if (JSON.stringify(o) === '{}' && headers.statusCode === 200) {
				o.success = true;
			}
		}

		function formatQuery(qs) {
			// LinkedIn signs requests with the parameter 'oauth2_access_token'
			// ... yeah another one who thinks they should be different!
			if (qs.access_token) {
				qs.oauth2_access_token = qs.access_token;
				delete qs.access_token;
			}
		}

		function like(p, callback) {
			p.headers['x-li-format'] = 'json';
			var id = p.data.id;
			p.data = (p.method !== 'delete').toString();
			p.method = 'put';
			callback('people/~/network/updates/key=' + id + '/is-liked');
		}

	})(hello);

	// See: https://developers.soundcloud.com/docs/api/reference
	(function(hello) {

		hello.init({

			soundcloud: {
				name: 'SoundCloud',

				oauth: {
					version: 2,
					auth: 'https://soundcloud.com/connect',
					grant: 'https://soundcloud.com/oauth2/token'
				},

				// Request path translated
				base: 'https://api.soundcloud.com/',
				get: {
					me: 'me.json',

					// Http://developers.soundcloud.com/docs/api/reference#me
					'me/friends': 'me/followings.json',
					'me/followers': 'me/followers.json',
					'me/following': 'me/followings.json',

					// See: http://developers.soundcloud.com/docs/api/reference#activities
					'default': function(p, callback) {

						// Include '.json at the end of each request'
						callback(p.path + '.json');
					}
				},

				// Response handlers
				wrap: {
					me: function(o) {
						formatUser(o);
						return o;
					},

					'default': function(o) {
						if (Array.isArray(o)) {
							o = {
								data: o.map(formatUser)
							};
						}

						paging(o);
						return o;
					}
				},

				xhr: formatRequest,
				jsonp: formatRequest
			}
		});

		function formatRequest(p, qs) {
			// Alter the querystring
			var token = qs.access_token;
			delete qs.access_token;
			qs.oauth_token = token;
			qs['_status_code_map[302]'] = 200;
			return true;
		}

		function formatUser(o) {
			if (o.id) {
				o.picture = o.avatar_url;
				o.thumbnail = o.avatar_url;
				o.name = o.username || o.full_name;
			}

			return o;
		}

		// See: http://developers.soundcloud.com/docs/api/reference#activities
		function paging(res) {
			if ('next_href' in res) {
				res.paging = {
					next: res.next_href
				};
			}
		}

	})(hello);

	(function(hello) {

		var base = 'https://api.twitter.com/';

		hello.init({

			twitter: {

				// Ensure that you define an oauth_proxy
				oauth: {
					version: '1.0a',
					auth: base + 'oauth/authenticate',
					request: base + 'oauth/request_token',
					token: base + 'oauth/access_token'
				},

				login: function(p) {
					// Reauthenticate
					// https://dev.twitter.com/oauth/reference/get/oauth/authenticate
					var prefix = '?force_login=true';
					this.oauth.auth = this.oauth.auth.replace(prefix, '') + (p.options.force ? prefix : '');
				},

				base: base + '1.1/',

				get: {
					me: 'account/verify_credentials.json',
					'me/friends': 'friends/list.json?count=@{limit|200}',
					'me/following': 'friends/list.json?count=@{limit|200}',
					'me/followers': 'followers/list.json?count=@{limit|200}',

					// Https://dev.twitter.com/docs/api/1.1/get/statuses/user_timeline
					'me/share': 'statuses/user_timeline.json?count=@{limit|200}',

					// Https://dev.twitter.com/rest/reference/get/favorites/list
					'me/like': 'favorites/list.json?count=@{limit|200}'
				},

				post: {
					'me/share': function(p, callback) {

						var data = p.data;
						p.data = null;

						var status = [];

						// Change message to status
						if (data.message) {
							status.push(data.message);
							delete data.message;
						}

						// If link is given
						if (data.link) {
							status.push(data.link);
							delete data.link;
						}

						if (data.picture) {
							status.push(data.picture);
							delete data.picture;
						}

						// Compound all the components
						if (status.length) {
							data.status = status.join(' ');
						}

						// Tweet media
						if (data.file) {
							data['media[]'] = data.file;
							delete data.file;
							p.data = data;
							callback('statuses/update_with_media.json');
						}

						// Retweet?
						else if ('id' in data) {
							callback('statuses/retweet/' + data.id + '.json');
						}

						// Tweet
						else {
							// Assign the post body to the query parameters
							hello.utils.extend(p.query, data);
							callback('statuses/update.json?include_entities=1');
						}
					},

					// See: https://dev.twitter.com/rest/reference/post/favorites/create
					'me/like': function(p, callback) {
						var id = p.data.id;
						p.data = null;
						callback('favorites/create.json?id=' + id);
					}
				},

				del: {

					// See: https://dev.twitter.com/rest/reference/post/favorites/destroy
					'me/like': function() {
						p.method = 'post';
						var id = p.data.id;
						p.data = null;
						callback('favorites/destroy.json?id=' + id);
					}
				},

				wrap: {
					me: function(res) {
						formatError(res);
						formatUser(res);
						return res;
					},

					'me/friends': formatFriends,
					'me/followers': formatFriends,
					'me/following': formatFriends,

					'me/share': function(res) {
						formatError(res);
						paging(res);
						if (!res.error && 'length' in res) {
							return {data: res};
						}

						return res;
					},

					'default': function(res) {
						res = arrayToDataResponse(res);
						paging(res);
						return res;
					}
				},
				xhr: function(p) {

					// Rely on the proxy for non-GET requests.
					return (p.method !== 'get');
				}
			}
		});

		function formatUser(o) {
			if (o.id) {
				if (o.name) {
					var m = o.name.split(' ');
					o.first_name = m.shift();
					o.last_name = m.join(' ');
				}

				// See: https://dev.twitter.com/overview/general/user-profile-images-and-banners
				o.thumbnail = o.profile_image_url_https || o.profile_image_url;
			}

			return o;
		}

		function formatFriends(o) {
			formatError(o);
			paging(o);
			if (o.users) {
				o.data = o.users.map(formatUser);
				delete o.users;
			}

			return o;
		}

		function formatError(o) {
			if (o.errors) {
				var e = o.errors[0];
				o.error = {
					code: 'request_failed',
					message: e.message
				};
			}
		}

		// Take a cursor and add it to the path
		function paging(res) {
			// Does the response include a 'next_cursor_string'
			if ('next_cursor_str' in res) {
				// See: https://dev.twitter.com/docs/misc/cursoring
				res.paging = {
					next: '?cursor=' + res.next_cursor_str
				};
			}
		}

		function arrayToDataResponse(res) {
			return Array.isArray(res) ? {data: res} : res;
		}

		/**
		// The documentation says to define user in the request
		// Although its not actually required.

		var user_id;

		function withUserId(callback){
			if(user_id){
				callback(user_id);
			}
			else{
				hello.api('twitter:/me', function(o){
					user_id = o.id;
					callback(o.id);
				});
			}
		}

		function sign(url){
			return function(p, callback){
				withUserId(function(user_id){
					callback(url+'?user_id='+user_id);
				});
			};
		}
		*/

	})(hello);

	// Vkontakte (vk.com)
	(function(hello) {

		hello.init({

			vk: {
				name: 'Vk',

				// See https://vk.com/dev/oauth_dialog
				oauth: {
					version: 2,
					auth: 'https://oauth.vk.com/authorize',
					grant: 'https://oauth.vk.com/access_token'
				},

				// Authorization scopes
				// See https://vk.com/dev/permissions
				scope: {
					email: 'email',
					friends: 'friends',
					photos: 'photos',
					videos: 'video',
					share: 'share',
					offline_access: 'offline'
				},

				// Refresh the access_token
				refresh: true,

				login: function(p) {
					p.qs.display = window.navigator &&
						window.navigator.userAgent &&
						/ipad|phone|phone|android/.test(window.navigator.userAgent.toLowerCase()) ? 'mobile' : 'popup';
				},

				// API Base URL
				base: 'https://api.vk.com/method/',

				// Map GET requests
				get: {
					me: function(p, callback) {
						p.query.fields = 'id,first_name,last_name,photo_max';
						callback('users.get');
					}
				},

				wrap: {
					me: function(res, headers, req) {
						formatError(res);
						return formatUser(res, req);
					}
				},

				// No XHR
				xhr: false,

				// All requests should be JSONP as of missing CORS headers in https://api.vk.com/method/*
				jsonp: true,

				// No form
				form: false
			}
		});

		function formatUser(o, req) {

			if (o !== null && 'response' in o && o.response !== null && o.response.length) {
				o = o.response[0];
				o.id = o.uid;
				o.thumbnail = o.picture = o.photo_max;
				o.name = o.first_name + ' ' + o.last_name;

				if (req.authResponse && req.authResponse.email !== null)
					o.email = req.authResponse.email;
			}

			return o;
		}

		function formatError(o) {

			if (o.error) {
				var e = o.error;
				o.error = {
					code: e.error_code,
					message: e.error_msg
				};
			}
		}

	})(hello);

	(function(hello) {

		hello.init({
			windows: {
				name: 'Windows live',

				// REF: http://msdn.microsoft.com/en-us/library/hh243641.aspx
				oauth: {
					version: 2,
					auth: 'https://login.live.com/oauth20_authorize.srf',
					grant: 'https://login.live.com/oauth20_token.srf'
				},

				// Refresh the access_token once expired
				refresh: true,

				logout: function() {
					return 'http://login.live.com/oauth20_logout.srf?ts=' + (new Date()).getTime();
				},

				// Authorization scopes
				scope: {
					basic: 'wl.signin,wl.basic',
					email: 'wl.emails',
					birthday: 'wl.birthday',
					events: 'wl.calendars',
					photos: 'wl.photos',
					videos: 'wl.photos',
					friends: 'wl.contacts_emails',
					files: 'wl.skydrive',
					publish: 'wl.share',
					publish_files: 'wl.skydrive_update',
					share: 'wl.share',
					create_event: 'wl.calendars_update,wl.events_create',
					offline_access: 'wl.offline_access'
				},

				// API base URL
				base: 'https://apis.live.net/v5.0/',

				// Map GET requests
				get: {

					// Friends
					me: 'me',
					'me/friends': 'me/friends',
					'me/following': 'me/contacts',
					'me/followers': 'me/friends',
					'me/contacts': 'me/contacts',

					'me/albums': 'me/albums',

					// Include the data[id] in the path
					'me/album': '@{id}/files',
					'me/photo': '@{id}',

					// Files
					'me/files': '@{parent|me/skydrive}/files',
					'me/folders': '@{id|me/skydrive}/files',
					'me/folder': '@{id|me/skydrive}/files'
				},

				// Map POST requests
				post: {
					'me/albums': 'me/albums',
					'me/album': '@{id}/files/',

					'me/folders': '@{id|me/skydrive/}',
					'me/files': '@{parent|me/skydrive}/files'
				},

				// Map DELETE requests
				del: {
					// Include the data[id] in the path
					'me/album': '@{id}',
					'me/photo': '@{id}',
					'me/folder': '@{id}',
					'me/files': '@{id}'
				},

				wrap: {
					me: formatUser,

					'me/friends': formatFriends,
					'me/contacts': formatFriends,
					'me/followers': formatFriends,
					'me/following': formatFriends,
					'me/albums': formatAlbums,
					'me/photos': formatDefault,
					'default': formatDefault
				},

				xhr: function(p) {
					if (p.method !== 'get' && p.method !== 'delete' && !hello.utils.hasBinary(p.data)) {

						// Does this have a data-uri to upload as a file?
						if (typeof (p.data.file) === 'string') {
							p.data.file = hello.utils.toBlob(p.data.file);
						}
						else {
							p.data = JSON.stringify(p.data);
							p.headers = {
								'Content-Type': 'application/json'
							};
						}
					}

					return true;
				},

				jsonp: function(p) {
					if (p.method !== 'get' && !hello.utils.hasBinary(p.data)) {
						p.data.method = p.method;
						p.method = 'get';
					}
				}
			}
		});

		function formatDefault(o) {
			if ('data' in o) {
				o.data.forEach(function(d) {
					if (d.picture) {
						d.thumbnail = d.picture;
					}

					if (d.images) {
						d.pictures = d.images
							.map(formatImage)
							.sort(function(a, b) {
								return a.width - b.width;
							});
					}
				});
			}

			return o;
		}

		function formatImage(image) {
			return {
				width: image.width,
				height: image.height,
				source: image.source
			};
		}

		function formatAlbums(o) {
			if ('data' in o) {
				o.data.forEach(function(d) {
					d.photos = d.files = 'https://apis.live.net/v5.0/' + d.id + '/photos';
				});
			}

			return o;
		}

		function formatUser(o, headers, req) {
			if (o.id) {
				var token = req.query.access_token;
				if (o.emails) {
					o.email = o.emails.preferred;
				}

				// If this is not an non-network friend
				if (o.is_friend !== false) {
					// Use the id of the user_id if available
					var id = (o.user_id || o.id);
					o.thumbnail = o.picture = 'https://apis.live.net/v5.0/' + id + '/picture?access_token=' + token;
				}
			}

			return o;
		}

		function formatFriends(o, headers, req) {
			if ('data' in o) {
				o.data.forEach(function(d) {
					formatUser(d, headers, req);
				});
			}

			return o;
		}

	})(hello);

	(function(hello) {

		hello.init({

			yahoo: {

				// Ensure that you define an oauth_proxy
				oauth: {
					version: '1.0a',
					auth: 'https://api.login.yahoo.com/oauth/v2/request_auth',
					request: 'https://api.login.yahoo.com/oauth/v2/get_request_token',
					token: 'https://api.login.yahoo.com/oauth/v2/get_token'
				},

				// Login handler
				login: function(p) {
					// Change the default popup window to be at least 560
					// Yahoo does dynamically change it on the fly for the signin screen (only, what if your already signed in)
					p.options.popup.width = 560;

					// Yahoo throws an parameter error if for whatever reason the state.scope contains a comma, so lets remove scope
					try {delete p.qs.state.scope;}
					catch (e) {}
				},

				base: 'https://social.yahooapis.com/v1/',

				get: {
					me: yql('select * from social.profile(0) where guid=me'),
					'me/friends': yql('select * from social.contacts(0) where guid=me'),
					'me/following': yql('select * from social.contacts(0) where guid=me')
				},
				wrap: {
					me: formatUser,

					// Can't get IDs
					// It might be better to loop through the social.relationship table with has unique IDs of users.
					'me/friends': formatFriends,
					'me/following': formatFriends,
					'default': paging
				}
			}
		});

		/*
			// Auto-refresh fix: bug in Yahoo can't get this to work with node-oauth-shim
			login : function(o){
				// Is the user already logged in
				var auth = hello('yahoo').getAuthResponse();

				// Is this a refresh token?
				if(o.options.display==='none'&&auth&&auth.access_token&&auth.refresh_token){
					// Add the old token and the refresh token, including path to the query
					// See http://developer.yahoo.com/oauth/guide/oauth-refreshaccesstoken.html
					o.qs.access_token = auth.access_token;
					o.qs.refresh_token = auth.refresh_token;
					o.qs.token_url = 'https://api.login.yahoo.com/oauth/v2/get_token';
				}
			},
		*/

		function formatError(o) {
			if (o && 'meta' in o && 'error_type' in o.meta) {
				o.error = {
					code: o.meta.error_type,
					message: o.meta.error_message
				};
			}
		}

		function formatUser(o) {

			formatError(o);
			if (o.query && o.query.results && o.query.results.profile) {
				o = o.query.results.profile;
				o.id = o.guid;
				o.last_name = o.familyName;
				o.first_name = o.givenName || o.nickname;
				var a = [];
				if (o.first_name) {
					a.push(o.first_name);
				}

				if (o.last_name) {
					a.push(o.last_name);
				}

				o.name = a.join(' ');
				o.email = (o.emails && o.emails[0]) ? o.emails[0].handle : null;
				o.thumbnail = o.image ? o.image.imageUrl : null;
			}

			return o;
		}

		function formatFriends(o, headers, request) {
			formatError(o);
			paging(o, headers, request);
			var contact;
			var field;
			if (o.query && o.query.results && o.query.results.contact) {
				o.data = o.query.results.contact;
				delete o.query;

				if (!Array.isArray(o.data)) {
					o.data = [o.data];
				}

				o.data.forEach(formatFriend);
			}

			return o;
		}

		function formatFriend(contact) {
			contact.id = null;

			// #362: Reports of responses returning a single item, rather than an Array of items.
			// Format the contact.fields to be an array.
			if (contact.fields && !(contact.fields instanceof Array)) {
				contact.fields = [contact.fields];
			}

			(contact.fields || []).forEach(function(field) {
				if (field.type === 'email') {
					contact.email = field.value;
				}

				if (field.type === 'name') {
					contact.first_name = field.value.givenName;
					contact.last_name = field.value.familyName;
					contact.name = field.value.givenName + ' ' + field.value.familyName;
				}

				if (field.type === 'yahooid') {
					contact.id = field.value;
				}
			});
		}

		function paging(res, headers, request) {

			// See: http://developer.yahoo.com/yql/guide/paging.html#local_limits
			if (res.query && res.query.count && request.options) {
				res.paging = {
					next: '?start=' + (res.query.count + (+request.options.start || 1))
				};
			}

			return res;
		}

		function yql(q) {
			return 'https://query.yahooapis.com/v1/yql?q=' + (q + ' limit @{limit|100} offset @{start|0}').replace(/\s/g, '%20') + '&format=json';
		}

	})(hello);

	// Register as anonymous AMD module
	if (typeof define === 'function' && define.amd) {
		define(function() {
			return hello;
		});
	}

	// CommonJS module for browserify
	if (typeof module === 'object' && module.exports) {
		module.exports = hello;
	}
	});

	var hello_all$1 = interopDefault(hello_all);

	var hello$1 = hello_all$1;
	var PAGE_NAME$3 = PAGES.SHARE;
	var TWITTER_CLIENT_PROD = 'bkMmxlirv04KxJtAbWSgekbVM';
	var TWITTER_CLIENT_DEV = 'Eqrm5IQ5zgLUfZXrgpVuntjvA';

	var saveCanvas$1 = document.getElementById('canvas-save');
	var backBtn$1 = document.getElementById('btn-back-share');
	var shareTextInput = document.getElementById('share-text');
	var shareImagePreview = document.getElementById('share-preview');
	var shareSubmitButton = document.getElementById('share-submit');
	var twitterUsernameDisplay = document.getElementById('twitter-username');

	var imageDataURI = null;

	function initOAuth() {
	  hello$1.init({
	    twitter: window.location.hostname === 'localhost' ? TWITTER_CLIENT_DEV : TWITTER_CLIENT_PROD
	  }, {
	    redirect_uri: 'redirect.html'
	  });
	}

	function initControls$4() {

	  shareSubmitButton.addEventListener('click', function () {

	    var blob = dataURItoBlob(imageDataURI);

	    hello$1('twitter').api('me/share', 'POST', {
	      message: shareTextInput.value,
	      file: blob
	    }).then(function (json) {
	      console.log('Twitter response', json);
	      showPrompt('tweet-ok');
	    }, function (err) {
	      console.error('Twitter error', err);
	      showPrompt('tweet-error');
	    });

	    AnnotatePage.show();
	    showPrompt('tweeting');
	  });

	  backBtn$1.addEventListener('click', function () {
	    SnapshotPage.show();
	  });
	}

	var SharePage = {

	  init: function init() {
	    initOAuth();
	    initControls$4();
	  },

	  show: function show(data) {

	    imageDataURI = saveCanvas$1.toDataURL('image/png');
	    shareImagePreview.src = imageDataURI;

	    twitterUsernameDisplay.innerText = data.username;

	    showPage(PAGE_NAME$3);
	  }

	};

	var hello = hello_all$1;
	var PAGE_NAME$2 = PAGES.SNAPSHOT;

	var backBtn = document.getElementById('btn-back-snapshot');
	var tweetButton = document.getElementById('btn-share-twitter');
	var drawingCanvas = document.getElementById('canvas-draw');
	var emojiCanvas$1 = document.getElementById('canvas-emoji');
	var saveCanvas = document.getElementById('canvas-save');
	var saveImage = document.getElementById('image-save');
	var saveCtx = saveCanvas.getContext('2d');
	var cameraCanvas$1 = void 0;

	function initSave() {

	  // May have been swapped out after initial app load
	  cameraCanvas$1 = document.getElementById('canvas-camera');

	  saveCanvas.width = cameraCanvas$1.width;
	  saveCanvas.height = cameraCanvas$1.height;

	  saveCanvas.style.width = cameraCanvas$1.style.width;
	  saveCanvas.style.height = cameraCanvas$1.style.height;

	  saveImage.width = drawingCanvas.width;
	  saveImage.height = drawingCanvas.height;

	  saveCtx.font = '16px Arial';
	  saveCtx.fillStyle = '#fff';
	}

	function initControls$3() {

	  tweetButton.addEventListener('click', function () {

	    hello('twitter').login().then(function (res) {
	      console.log('Logged into Twitter', res);
	      SharePage.show({ username: res.authResponse.screen_name });
	    }, function (err) {
	      console.error('Error logging in to Twitter', err);
	    });
	  });

	  backBtn.addEventListener('click', function () {
	    AnnotatePage.show();
	  });
	}

	var SnapshotPage = {

	  init: function init() {
	    initControls$3();
	  },

	  show: function show() {

	    playCameraSound();

	    initSave();

	    // Copy the other canvases onto a single canvas for saving
	    saveCtx.drawImage(cameraCanvas$1, 0, 0, saveCanvas.width, saveCanvas.height);
	    saveCtx.drawImage(drawingCanvas, 0, 0, saveCanvas.width, saveCanvas.height);
	    saveCtx.drawImage(emojiCanvas$1, 0, 0, saveCanvas.width, saveCanvas.height);

	    // Add the URL at the bottom
	    saveCtx.fillText('snapw.at', saveCanvas.width - 72, saveCanvas.height - 10);

	    saveImage.src = saveCanvas.toDataURL('image/png');
	    saveCanvas.style.display = 'none';
	    saveImage.style.display = 'block';

	    showPage(PAGE_NAME$2);
	  }

	};

	var PAGE_NAME$1 = PAGES.ANNOTATE;

	var snapshotBtn = document.getElementById('btn-snapshot');

	function initControls$1() {

	  snapshotBtn.addEventListener('click', function () {
	    Draw.snapshot();
	    SnapshotPage.show();
	  });
	}

	var AnnotatePage = {

	  init: function init() {
	    Draw.init();
	    initControls$1();
	  },

	  show: function show() {

	    showPage(PAGE_NAME$1);

	    if (isLiveCamera()) {
	      init$1();
	    }

	    Draw.show();
	  }

	};

	var PAGE_NAME$4 = PAGES.ABOUT;

	var homeLink = document.getElementById('link-home');

	function initControls$5() {
	  homeLink.addEventListener('click', function () {
	    HomePage.show();
	  });
	}

	var AboutPage = {

	  init: function init() {
	    initControls$5();
	  },

	  show: function show() {
	    showPage(PAGE_NAME$4);
	  }

	};

	var PAGE_NAME = PAGES.HOME;

	var inputPhoto = document.getElementById('input-photo');
	var startCameraSection = document.getElementById('start-camera');
	var startCameraBtn = document.getElementById('btn-start-camera');
	var annotateCameraContainer = document.getElementById('annotate-camera-container');
	var cameraCanvas = document.getElementById('canvas-camera');
	var drawCanvas = document.getElementById('canvas-draw');
	var emojiCanvas = document.getElementById('canvas-emoji');
	var aboutLink = document.getElementById('link-about');

	function onPhotoInputChange(e) {

	  console.log('Min width and height', cameraCanvas.width, cameraCanvas.height);

	  var options = {
	    maxWidth: cameraCanvas.width,
	    maxHeight: cameraCanvas.height,
	    contain: true,
	    orientation: true,
	    canvas: true,
	    pixelRatio: devicePixelRatio
	  };

	  function onImageLoad(result) {
	    if (result.type === 'error') {
	      console.error('Error loading image', result);
	    } else {

	      console.log('Generated canvas width and height', result.width, result.height);

	      // Replace our default canvas (for video) with the generated one
	      result.id = 'canvas-camera';

	      annotateCameraContainer.removeChild(cameraCanvas);
	      annotateCameraContainer.appendChild(result);

	      cameraCanvas = result;

	      var newWidth = cameraCanvas.style.width ? parseInt(cameraCanvas.style.width) : cameraCanvas.width;
	      var newHeight = cameraCanvas.style.height ? parseInt(cameraCanvas.style.height) : cameraCanvas.height;

	      // Make drawing canvas the same size
	      drawCanvas.width = newWidth;
	      drawCanvas.height = newHeight;
	      emojiCanvas.width = newWidth;
	      emojiCanvas.height = newHeight;

	      setLiveCamera(false);

	      AnnotatePage.show();
	    }
	  }

	  // A little library which handles rotating the image appropriately depending
	  // on the image's orientation (determined from the exif data) & scaling to fit
	  LoadImage(e.target.files[0], onImageLoad, options);
	}

	function initCanvas() {
	  cameraCanvas.width = window.innerWidth;
	  cameraCanvas.height = window.innerHeight - HEADER_HEIGHT;
	}

	function initControls() {

	  inputPhoto.addEventListener('change', onPhotoInputChange);

	  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
	    // Looks like we have support, so enable WebRTC button
	    startCameraSection.style.display = 'block';
	  }

	  startCameraBtn.addEventListener('click', function () {
	    setLiveCamera(true);
	    AnnotatePage.show();
	  });

	  aboutLink.addEventListener('click', function () {
	    AboutPage.show();
	  });
	}

	var HomePage = {

	  init: function init() {
	    initCanvas();
	    initControls();
	  },

	  show: function show() {
	    showPage(PAGE_NAME);
	  }

	};

	var Pages = [HomePage, AnnotatePage, AboutPage, SharePage, SnapshotPage];

	function initApp() {
	  SWRegister();
	  InputColourShim();
	  WebRTCShim();
	  init();
	}

	function initPages(pages) {
	  var _iteratorNormalCompletion = true;
	  var _didIteratorError = false;
	  var _iteratorError = undefined;

	  try {
	    for (var _iterator = pages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	      var page = _step.value;

	      page.init();
	    }
	  } catch (err) {
	    _didIteratorError = true;
	    _iteratorError = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion && _iterator.return) {
	        _iterator.return();
	      }
	    } finally {
	      if (_didIteratorError) {
	        throw _iteratorError;
	      }
	    }
	  }
	}

	initApp();
	initPages(Pages);
	HomePage.show();

}));