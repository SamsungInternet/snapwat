(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, function () { 'use strict';

	function SWRegister () {

	  if ('serviceWorker' in navigator) {

	    navigator.serviceWorker.register('/build/sw.js').then(function () {
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
	function InputColour () {

	  var input = document.getElementById('input-colour');
	  var substitute = document.getElementById('input-colour-substitute');

	  // Unsupported browsers e.g. iOS Safari revert type to 'text'
	  if (input.type === 'color') {
	    input.style.display = 'block';
	    substitute.style.display = 'none';
	  }
	}

	var HEADER_HEIGHT = 72;

	var canvas = document.getElementById('canvas-draw');
	var ctx = ctx = canvas.getContext('2d');
	var colourInput = document.getElementById('input-colour');
	var trashButton = document.getElementById('btn-trash');
	var emojiButton = document.getElementById('btn-emoji');
	var emojiButtonImage = document.getElementById('btn-emoji-img');
	var emojiModal = document.getElementById('modal-emoji');
	var touchedEmojiIndex = -1;
	var chosenEmoji = null;
	var resizeTouchDelta = null;
	var isDrawing = false;
	var isRedrawing = false;

	// Store drawing events (lines and emojis) for redrawing
	var drawEvents = [];

	/**
	 * Returns index of touched emoji in the drawEvents, or -1 if none touched.
	 */
	function indexOfSelectedEmoji(coords) {

	  for (var i = 0; i < drawEvents.length; i++) {

	    var evt = drawEvents[i];

	    if (!evt.image) {
	      continue;
	    }

	    if (coords.x >= evt.x && coords.x <= evt.x + evt.width && coords.y >= evt.y && coords.y <= evt.y + evt.height) {
	      return i;
	    }
	  }

	  return -1;
	}

	function stampEmoji(coords) {

	  // Increase the default SVG size
	  var width = chosenEmoji.width * 2;
	  var height = chosenEmoji.height * 2;

	  // Centre the image around where we have tapped/clicked
	  var x = coords.x - width / 2;
	  var y = coords.y - height / 2;

	  ctx.drawImage(chosenEmoji, x, y, width, height);

	  drawEvents.push({
	    image: chosenEmoji,
	    x: x,
	    y: y,
	    width: width,
	    height: height
	  });
	}

	function onDrawingMouseDown(coords) {

	  var x = coords.x;
	  var y = coords.y;

	  ctx.beginPath();
	  ctx.moveTo(x, y);

	  isDrawing = true;

	  drawEvents.push({
	    begin: true,
	    x: x,
	    y: y
	  });
	}

	function onTouchStartOrMouseDown(e) {

	  var touch = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : null;

	  var coords = touch ? { x: touch.pageX, y: touch.pageY - HEADER_HEIGHT } : { x: e.clientX, y: e.clientY - HEADER_HEIGHT };

	  touchedEmojiIndex = indexOfSelectedEmoji(coords);

	  if (touchedEmojiIndex > -1) {
	    // Selected an existing emoji - fall through
	    return;
	  }

	  if (chosenEmoji) {
	    stampEmoji(coords);
	  } else {
	    onDrawingMouseDown(coords);
	  }
	}

	function onTouchMoveOrMouseMove(e) {

	  e.preventDefault();

	  var touches = e.changedTouches || [];
	  var touch1 = touches.length ? touches[0] : null;
	  var touch2 = touches.length > 1 ? touches[1] : null;

	  var coords1 = touch1 ? { x: touch1.pageX, y: touch1.pageY - HEADER_HEIGHT } : { x: e.clientX, y: e.clientY - HEADER_HEIGHT };

	  if (touchedEmojiIndex >= 0) {

	    var evt = drawEvents[touchedEmojiIndex];

	    if (touch2) {

	      // Resize emoji

	      var coords2 = { x: touch2.pageX, y: touch2.pageY - HEADER_HEIGHT };
	      var newResizeTouchDelta = { x: Math.abs(coords2.x - coords1.x),
	        y: Math.abs(coords2.y - coords1.y) };

	      if (resizeTouchDelta) {

	        evt.width += newResizeTouchDelta.x - resizeTouchDelta.x;
	        evt.height += newResizeTouchDelta.y - resizeTouchDelta.y;

	        evt.x = (coords1.x + coords2.x) / 2 - evt.width / 2;
	        evt.y = (coords1.y + coords2.y) / 2 - evt.height / 2;

	        redrawOnNextFrame();
	      }

	      resizeTouchDelta = newResizeTouchDelta;
	    } else {

	      // Update emoji position

	      evt.x = coords1.x - evt.width / 2;
	      evt.y = coords1.y - evt.height / 2;

	      redrawOnNextFrame();
	    }
	  } else if (isDrawing) {

	    ctx.lineTo(coords1.x, coords1.y);
	    ctx.stroke();

	    drawEvents.push({
	      stokeStyle: ctx.strokeStyle,
	      x: coords1.x,
	      y: coords1.y
	    });
	  }
	}

	function onTouchEndOrMouseUp() {
	  isDrawing = false;
	  touchedEmojiIndex = -1;
	  resizeTouchDelta = null;
	}

	function onEmojiClick(event) {

	  chosenEmoji = event.currentTarget;

	  emojiModal.style.display = 'none';
	  emojiButtonImage.src = chosenEmoji.src;

	  emojiButton.classList.add('selected');
	  colourInput.classList.remove('selected');
	}

	function redrawOnNextFrame() {
	  if (!isRedrawing) {
	    isRedrawing = true;
	    requestAnimationFrame(redraw);
	  }
	}

	function redraw() {

	  ctx.clearRect(0, 0, canvas.width, canvas.height);

	  for (var i = 0; i < drawEvents.length; i++) {

	    var evt = drawEvents[i];

	    if (evt.image) {
	      // Emoji
	      ctx.drawImage(evt.image, evt.x, evt.y, evt.width, evt.height);
	    } else if (evt.begin) {
	      // Start a line
	      ctx.beginPath();
	      ctx.moveTo(evt.x, evt.y);
	    } else {
	      // Stroke
	      ctx.strokeStyle = evt.strokeStyle;
	      ctx.lineTo(evt.x, evt.y);
	      ctx.stroke();
	    }
	  }

	  isRedrawing = false;
	}

	function onColourClickOrChange() {
	  ctx.strokeStyle = colourInput.value;
	  chosenEmoji = null;
	  colourInput.classList.add('selected');
	  emojiButton.classList.remove('selected');
	}

	function initCanvas() {
	  canvas.width = window.innerWidth;
	  canvas.height = window.innerHeight - HEADER_HEIGHT;

	  canvas.addEventListener('touchstart', onTouchStartOrMouseDown, false);
	  canvas.addEventListener('touchmove', onTouchMoveOrMouseMove, false);
	  canvas.addEventListener('touchend', onTouchEndOrMouseUp, false);

	  canvas.addEventListener('mousedown', onTouchStartOrMouseDown, false);
	  canvas.addEventListener('mousemove', onTouchMoveOrMouseMove, false);
	  canvas.addEventListener('mouseup', onTouchEndOrMouseUp, false);

	  ctx.strokeStyle = '#000000';
	  ctx.lineWidth = 3;
	}

	function initControls() {

	  colourInput.addEventListener('input', onColourClickOrChange);
	  colourInput.addEventListener('click', onColourClickOrChange);

	  // Add click handlers to emojis so you can select one
	  var emojis = document.querySelectorAll('#modal-emoji img');
	  for (var i = 0; i < emojis.length; i++) {
	    var emoji = emojis[i];
	    emoji.addEventListener('click', onEmojiClick);
	  }

	  emojiButton.addEventListener('click', function () {
	    // Toggle emoji selector modal dialog
	    if (emojiModal.style.display !== 'block') {
	      emojiModal.style.display = 'block';
	    } else {
	      emojiModal.style.display = 'none';
	    }
	  });

	  trashButton.addEventListener('click', function () {
	    // Could do with a confirmation prompt!
	    drawEvents = [];
	    redraw();
	  });
	}

	function init() {
	  initCanvas();
	  initControls();
	}

	function interopDefault(ex) {
		return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var utils = createCommonjsModule(function (module) {
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';

	var logDisabled_ = true;

	// Utility methods.
	var utils = {
	  disableLog: function(bool) {
	    if (typeof bool !== 'boolean') {
	      return new Error('Argument type: ' + typeof bool +
	          '. Please use a boolean.');
	    }
	    logDisabled_ = bool;
	    return (bool) ? 'adapter.js logging disabled' :
	        'adapter.js logging enabled';
	  },

	  log: function() {
	    if (typeof window === 'object') {
	      if (logDisabled_) {
	        return;
	      }
	      if (typeof console !== 'undefined' && typeof console.log === 'function') {
	        console.log.apply(console, arguments);
	      }
	    }
	  },

	  /**
	   * Extract browser version out of the provided user agent string.
	   *
	   * @param {!string} uastring userAgent string.
	   * @param {!string} expr Regular expression used as match criteria.
	   * @param {!number} pos position in the version string to be returned.
	   * @return {!number} browser version.
	   */
	  extractVersion: function(uastring, expr, pos) {
	    var match = uastring.match(expr);
	    return match && match.length >= pos && parseInt(match[pos], 10);
	  },

	  /**
	   * Browser detector.
	   *
	   * @return {object} result containing browser and version
	   *     properties.
	   */
	  detectBrowser: function() {
	    // Returned result object.
	    var result = {};
	    result.browser = null;
	    result.version = null;

	    // Fail early if it's not a browser
	    if (typeof window === 'undefined' || !window.navigator) {
	      result.browser = 'Not a browser.';
	      return result;
	    }

	    // Firefox.
	    if (navigator.mozGetUserMedia) {
	      result.browser = 'firefox';
	      result.version = this.extractVersion(navigator.userAgent,
	          /Firefox\/([0-9]+)\./, 1);

	    // all webkit-based browsers
	    } else if (navigator.webkitGetUserMedia) {
	      // Chrome, Chromium, Webview, Opera, all use the chrome shim for now
	      if (window.webkitRTCPeerConnection) {
	        result.browser = 'chrome';
	        result.version = this.extractVersion(navigator.userAgent,
	          /Chrom(e|ium)\/([0-9]+)\./, 2);

	      // Safari or unknown webkit-based
	      // for the time being Safari has support for MediaStreams but not webRTC
	      } else {
	        // Safari UA substrings of interest for reference:
	        // - webkit version:           AppleWebKit/602.1.25 (also used in Op,Cr)
	        // - safari UI version:        Version/9.0.3 (unique to Safari)
	        // - safari UI webkit version: Safari/601.4.4 (also used in Op,Cr)
	        //
	        // if the webkit version and safari UI webkit versions are equals,
	        // ... this is a stable version.
	        //
	        // only the internal webkit version is important today to know if
	        // media streams are supported
	        //
	        if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
	          result.browser = 'safari';
	          result.version = this.extractVersion(navigator.userAgent,
	            /AppleWebKit\/([0-9]+)\./, 1);

	        // unknown webkit-based browser
	        } else {
	          result.browser = 'Unsupported webkit-based browser ' +
	              'with GUM support but no WebRTC support.';
	          return result;
	        }
	      }

	    // Edge.
	    } else if (navigator.mediaDevices &&
	        navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
	      result.browser = 'edge';
	      result.version = this.extractVersion(navigator.userAgent,
	          /Edge\/(\d+).(\d+)$/, 2);

	    // Default fallthrough: not supported.
	    } else {
	      result.browser = 'Not a supported browser.';
	      return result;
	    }

	    return result;
	  }
	};

	// Export.
	module.exports = {
	  log: utils.log,
	  disableLog: utils.disableLog,
	  browserDetails: utils.detectBrowser(),
	  extractVersion: utils.extractVersion
	};
	});

	var utils$1 = interopDefault(utils);
	var log = utils.log;
	var disableLog$1 = utils.disableLog;
	var browserDetails$1 = utils.browserDetails;
	var extractVersion$1 = utils.extractVersion;

var require$$0 = Object.freeze({
	  default: utils$1,
	  log: log,
	  disableLog: disableLog$1,
	  browserDetails: browserDetails$1,
	  extractVersion: extractVersion$1
	});

	var getusermedia = createCommonjsModule(function (module) {
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';
	var logging = interopDefault(require$$0).log;

	// Expose public methods.
	module.exports = function() {
	  var constraintsToChrome_ = function(c) {
	    if (typeof c !== 'object' || c.mandatory || c.optional) {
	      return c;
	    }
	    var cc = {};
	    Object.keys(c).forEach(function(key) {
	      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
	        return;
	      }
	      var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
	      if (r.exact !== undefined && typeof r.exact === 'number') {
	        r.min = r.max = r.exact;
	      }
	      var oldname_ = function(prefix, name) {
	        if (prefix) {
	          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
	        }
	        return (name === 'deviceId') ? 'sourceId' : name;
	      };
	      if (r.ideal !== undefined) {
	        cc.optional = cc.optional || [];
	        var oc = {};
	        if (typeof r.ideal === 'number') {
	          oc[oldname_('min', key)] = r.ideal;
	          cc.optional.push(oc);
	          oc = {};
	          oc[oldname_('max', key)] = r.ideal;
	          cc.optional.push(oc);
	        } else {
	          oc[oldname_('', key)] = r.ideal;
	          cc.optional.push(oc);
	        }
	      }
	      if (r.exact !== undefined && typeof r.exact !== 'number') {
	        cc.mandatory = cc.mandatory || {};
	        cc.mandatory[oldname_('', key)] = r.exact;
	      } else {
	        ['min', 'max'].forEach(function(mix) {
	          if (r[mix] !== undefined) {
	            cc.mandatory = cc.mandatory || {};
	            cc.mandatory[oldname_(mix, key)] = r[mix];
	          }
	        });
	      }
	    });
	    if (c.advanced) {
	      cc.optional = (cc.optional || []).concat(c.advanced);
	    }
	    return cc;
	  };

	  var shimConstraints_ = function(constraints, func) {
	    constraints = JSON.parse(JSON.stringify(constraints));
	    if (constraints && constraints.audio) {
	      constraints.audio = constraintsToChrome_(constraints.audio);
	    }
	    if (constraints && typeof constraints.video === 'object') {
	      // Shim facingMode for mobile, where it defaults to "user".
	      var face = constraints.video.facingMode;
	      face = face && ((typeof face === 'object') ? face : {ideal: face});

	      if ((face && (face.exact === 'user' || face.exact === 'environment' ||
	                    face.ideal === 'user' || face.ideal === 'environment')) &&
	          !(navigator.mediaDevices.getSupportedConstraints &&
	            navigator.mediaDevices.getSupportedConstraints().facingMode)) {
	        delete constraints.video.facingMode;
	        if (face.exact === 'environment' || face.ideal === 'environment') {
	          // Look for "back" in label, or use last cam (typically back cam).
	          return navigator.mediaDevices.enumerateDevices()
	          .then(function(devices) {
	            devices = devices.filter(function(d) {
	              return d.kind === 'videoinput';
	            });
	            var back = devices.find(function(d) {
	              return d.label.toLowerCase().indexOf('back') !== -1;
	            }) || (devices.length && devices[devices.length - 1]);
	            if (back) {
	              constraints.video.deviceId = face.exact ? {exact: back.deviceId} :
	                                                        {ideal: back.deviceId};
	            }
	            constraints.video = constraintsToChrome_(constraints.video);
	            logging('chrome: ' + JSON.stringify(constraints));
	            return func(constraints);
	          });
	        }
	      }
	      constraints.video = constraintsToChrome_(constraints.video);
	    }
	    logging('chrome: ' + JSON.stringify(constraints));
	    return func(constraints);
	  };

	  var shimError_ = function(e) {
	    return {
	      name: {
	        PermissionDeniedError: 'NotAllowedError',
	        ConstraintNotSatisfiedError: 'OverconstrainedError'
	      }[e.name] || e.name,
	      message: e.message,
	      constraint: e.constraintName,
	      toString: function() {
	        return this.name + (this.message && ': ') + this.message;
	      }
	    };
	  };

	  var getUserMedia_ = function(constraints, onSuccess, onError) {
	    shimConstraints_(constraints, function(c) {
	      navigator.webkitGetUserMedia(c, onSuccess, function(e) {
	        onError(shimError_(e));
	      });
	    });
	  };

	  navigator.getUserMedia = getUserMedia_;

	  // Returns the result of getUserMedia as a Promise.
	  var getUserMediaPromise_ = function(constraints) {
	    return new Promise(function(resolve, reject) {
	      navigator.getUserMedia(constraints, resolve, reject);
	    });
	  };

	  if (!navigator.mediaDevices) {
	    navigator.mediaDevices = {
	      getUserMedia: getUserMediaPromise_,
	      enumerateDevices: function() {
	        return new Promise(function(resolve) {
	          var kinds = {audio: 'audioinput', video: 'videoinput'};
	          return MediaStreamTrack.getSources(function(devices) {
	            resolve(devices.map(function(device) {
	              return {label: device.label,
	                      kind: kinds[device.kind],
	                      deviceId: device.id,
	                      groupId: ''};
	            }));
	          });
	        });
	      }
	    };
	  }

	  // A shim for getUserMedia method on the mediaDevices object.
	  // TODO(KaptenJansson) remove once implemented in Chrome stable.
	  if (!navigator.mediaDevices.getUserMedia) {
	    navigator.mediaDevices.getUserMedia = function(constraints) {
	      return getUserMediaPromise_(constraints);
	    };
	  } else {
	    // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
	    // function which returns a Promise, it does not accept spec-style
	    // constraints.
	    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
	        bind(navigator.mediaDevices);
	    navigator.mediaDevices.getUserMedia = function(cs) {
	      return shimConstraints_(cs, function(c) {
	        return origGetUserMedia(c).catch(function(e) {
	          return Promise.reject(shimError_(e));
	        });
	      });
	    };
	  }

	  // Dummy devicechange event methods.
	  // TODO(KaptenJansson) remove once implemented in Chrome stable.
	  if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
	    navigator.mediaDevices.addEventListener = function() {
	      logging('Dummy mediaDevices.addEventListener called.');
	    };
	  }
	  if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
	    navigator.mediaDevices.removeEventListener = function() {
	      logging('Dummy mediaDevices.removeEventListener called.');
	    };
	  }
	};
	});

	var getusermedia$1 = interopDefault(getusermedia);


	var require$$0$1 = Object.freeze({
	  default: getusermedia$1
	});

	var chrome_shim = createCommonjsModule(function (module) {
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';
	var logging = interopDefault(require$$0).log;
	var browserDetails = interopDefault(require$$0).browserDetails;

	var chromeShim = {
	  shimMediaStream: function() {
	    window.MediaStream = window.MediaStream || window.webkitMediaStream;
	  },

	  shimOnTrack: function() {
	    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
	        window.RTCPeerConnection.prototype)) {
	      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
	        get: function() {
	          return this._ontrack;
	        },
	        set: function(f) {
	          var self = this;
	          if (this._ontrack) {
	            this.removeEventListener('track', this._ontrack);
	            this.removeEventListener('addstream', this._ontrackpoly);
	          }
	          this.addEventListener('track', this._ontrack = f);
	          this.addEventListener('addstream', this._ontrackpoly = function(e) {
	            // onaddstream does not fire when a track is added to an existing
	            // stream. But stream.onaddtrack is implemented so we use that.
	            e.stream.addEventListener('addtrack', function(te) {
	              var event = new Event('track');
	              event.track = te.track;
	              event.receiver = {track: te.track};
	              event.streams = [e.stream];
	              self.dispatchEvent(event);
	            });
	            e.stream.getTracks().forEach(function(track) {
	              var event = new Event('track');
	              event.track = track;
	              event.receiver = {track: track};
	              event.streams = [e.stream];
	              this.dispatchEvent(event);
	            }.bind(this));
	          }.bind(this));
	        }
	      });
	    }
	  },

	  shimSourceObject: function() {
	    if (typeof window === 'object') {
	      if (window.HTMLMediaElement &&
	        !('srcObject' in window.HTMLMediaElement.prototype)) {
	        // Shim the srcObject property, once, when HTMLMediaElement is found.
	        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
	          get: function() {
	            return this._srcObject;
	          },
	          set: function(stream) {
	            var self = this;
	            // Use _srcObject as a private property for this shim
	            this._srcObject = stream;
	            if (this.src) {
	              URL.revokeObjectURL(this.src);
	            }

	            if (!stream) {
	              this.src = '';
	              return;
	            }
	            this.src = URL.createObjectURL(stream);
	            // We need to recreate the blob url when a track is added or
	            // removed. Doing it manually since we want to avoid a recursion.
	            stream.addEventListener('addtrack', function() {
	              if (self.src) {
	                URL.revokeObjectURL(self.src);
	              }
	              self.src = URL.createObjectURL(stream);
	            });
	            stream.addEventListener('removetrack', function() {
	              if (self.src) {
	                URL.revokeObjectURL(self.src);
	              }
	              self.src = URL.createObjectURL(stream);
	            });
	          }
	        });
	      }
	    }
	  },

	  shimPeerConnection: function() {
	    // The RTCPeerConnection object.
	    window.RTCPeerConnection = function(pcConfig, pcConstraints) {
	      // Translate iceTransportPolicy to iceTransports,
	      // see https://code.google.com/p/webrtc/issues/detail?id=4869
	      logging('PeerConnection');
	      if (pcConfig && pcConfig.iceTransportPolicy) {
	        pcConfig.iceTransports = pcConfig.iceTransportPolicy;
	      }

	      var pc = new webkitRTCPeerConnection(pcConfig, pcConstraints);
	      var origGetStats = pc.getStats.bind(pc);
	      pc.getStats = function(selector, successCallback, errorCallback) {
	        var self = this;
	        var args = arguments;

	        // If selector is a function then we are in the old style stats so just
	        // pass back the original getStats format to avoid breaking old users.
	        if (arguments.length > 0 && typeof selector === 'function') {
	          return origGetStats(selector, successCallback);
	        }

	        var fixChromeStats_ = function(response) {
	          var standardReport = {};
	          var reports = response.result();
	          reports.forEach(function(report) {
	            var standardStats = {
	              id: report.id,
	              timestamp: report.timestamp,
	              type: report.type
	            };
	            report.names().forEach(function(name) {
	              standardStats[name] = report.stat(name);
	            });
	            standardReport[standardStats.id] = standardStats;
	          });

	          return standardReport;
	        };

	        // shim getStats with maplike support
	        var makeMapStats = function(stats, legacyStats) {
	          var map = new Map(Object.keys(stats).map(function(key) {
	            return[key, stats[key]];
	          }));
	          legacyStats = legacyStats || stats;
	          Object.keys(legacyStats).forEach(function(key) {
	            map[key] = legacyStats[key];
	          });
	          return map;
	        };

	        if (arguments.length >= 2) {
	          var successCallbackWrapper_ = function(response) {
	            args[1](makeMapStats(fixChromeStats_(response)));
	          };

	          return origGetStats.apply(this, [successCallbackWrapper_,
	              arguments[0]]);
	        }

	        // promise-support
	        return new Promise(function(resolve, reject) {
	          if (args.length === 1 && typeof selector === 'object') {
	            origGetStats.apply(self, [
	              function(response) {
	                resolve(makeMapStats(fixChromeStats_(response)));
	              }, reject]);
	          } else {
	            // Preserve legacy chrome stats only on legacy access of stats obj
	            origGetStats.apply(self, [
	              function(response) {
	                resolve(makeMapStats(fixChromeStats_(response),
	                    response.result()));
	              }, reject]);
	          }
	        }).then(successCallback, errorCallback);
	      };

	      return pc;
	    };
	    window.RTCPeerConnection.prototype = webkitRTCPeerConnection.prototype;

	    // wrap static methods. Currently just generateCertificate.
	    if (webkitRTCPeerConnection.generateCertificate) {
	      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
	        get: function() {
	          return webkitRTCPeerConnection.generateCertificate;
	        }
	      });
	    }

	    ['createOffer', 'createAnswer'].forEach(function(method) {
	      var nativeMethod = webkitRTCPeerConnection.prototype[method];
	      webkitRTCPeerConnection.prototype[method] = function() {
	        var self = this;
	        if (arguments.length < 1 || (arguments.length === 1 &&
	            typeof arguments[0] === 'object')) {
	          var opts = arguments.length === 1 ? arguments[0] : undefined;
	          return new Promise(function(resolve, reject) {
	            nativeMethod.apply(self, [resolve, reject, opts]);
	          });
	        }
	        return nativeMethod.apply(this, arguments);
	      };
	    });

	    // add promise support -- natively available in Chrome 51
	    if (browserDetails.version < 51) {
	      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
	          .forEach(function(method) {
	            var nativeMethod = webkitRTCPeerConnection.prototype[method];
	            webkitRTCPeerConnection.prototype[method] = function() {
	              var args = arguments;
	              var self = this;
	              var promise = new Promise(function(resolve, reject) {
	                nativeMethod.apply(self, [args[0], resolve, reject]);
	              });
	              if (args.length < 2) {
	                return promise;
	              }
	              return promise.then(function() {
	                args[1].apply(null, []);
	              },
	              function(err) {
	                if (args.length >= 3) {
	                  args[2].apply(null, [err]);
	                }
	              });
	            };
	          });
	    }

	    // shim implicit creation of RTCSessionDescription/RTCIceCandidate
	    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
	        .forEach(function(method) {
	          var nativeMethod = webkitRTCPeerConnection.prototype[method];
	          webkitRTCPeerConnection.prototype[method] = function() {
	            arguments[0] = new ((method === 'addIceCandidate') ?
	                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
	            return nativeMethod.apply(this, arguments);
	          };
	        });

	    // support for addIceCandidate(null)
	    var nativeAddIceCandidate =
	        RTCPeerConnection.prototype.addIceCandidate;
	    RTCPeerConnection.prototype.addIceCandidate = function() {
	      return arguments[0] === null ? Promise.resolve()
	          : nativeAddIceCandidate.apply(this, arguments);
	    };
	  }
	};


	// Expose public methods.
	module.exports = {
	  shimMediaStream: chromeShim.shimMediaStream,
	  shimOnTrack: chromeShim.shimOnTrack,
	  shimSourceObject: chromeShim.shimSourceObject,
	  shimPeerConnection: chromeShim.shimPeerConnection,
	  shimGetUserMedia: interopDefault(require$$0$1)
	};
	});

	var chrome_shim$1 = interopDefault(chrome_shim);
	var shimMediaStream = chrome_shim.shimMediaStream;
	var shimOnTrack = chrome_shim.shimOnTrack;
	var shimSourceObject = chrome_shim.shimSourceObject;
	var shimPeerConnection = chrome_shim.shimPeerConnection;
	var shimGetUserMedia = chrome_shim.shimGetUserMedia;

var require$$3 = Object.freeze({
	  default: chrome_shim$1,
	  shimMediaStream: shimMediaStream,
	  shimOnTrack: shimOnTrack,
	  shimSourceObject: shimSourceObject,
	  shimPeerConnection: shimPeerConnection,
	  shimGetUserMedia: shimGetUserMedia
	});

	var sdp = createCommonjsModule(function (module) {
	/* eslint-env node */
	'use strict';

	// SDP helpers.
	var SDPUtils = {};

	// Generate an alphanumeric identifier for cname or mids.
	// TODO: use UUIDs instead? https://gist.github.com/jed/982883
	SDPUtils.generateIdentifier = function() {
	  return Math.random().toString(36).substr(2, 10);
	};

	// The RTCP CNAME used by all peerconnections from the same JS.
	SDPUtils.localCName = SDPUtils.generateIdentifier();

	// Splits SDP into lines, dealing with both CRLF and LF.
	SDPUtils.splitLines = function(blob) {
	  return blob.trim().split('\n').map(function(line) {
	    return line.trim();
	  });
	};
	// Splits SDP into sessionpart and mediasections. Ensures CRLF.
	SDPUtils.splitSections = function(blob) {
	  var parts = blob.split('\nm=');
	  return parts.map(function(part, index) {
	    return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
	  });
	};

	// Returns lines that start with a certain prefix.
	SDPUtils.matchPrefix = function(blob, prefix) {
	  return SDPUtils.splitLines(blob).filter(function(line) {
	    return line.indexOf(prefix) === 0;
	  });
	};

	// Parses an ICE candidate line. Sample input:
	// candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
	// rport 55996"
	SDPUtils.parseCandidate = function(line) {
	  var parts;
	  // Parse both variants.
	  if (line.indexOf('a=candidate:') === 0) {
	    parts = line.substring(12).split(' ');
	  } else {
	    parts = line.substring(10).split(' ');
	  }

	  var candidate = {
	    foundation: parts[0],
	    component: parts[1],
	    protocol: parts[2].toLowerCase(),
	    priority: parseInt(parts[3], 10),
	    ip: parts[4],
	    port: parseInt(parts[5], 10),
	    // skip parts[6] == 'typ'
	    type: parts[7]
	  };

	  for (var i = 8; i < parts.length; i += 2) {
	    switch (parts[i]) {
	      case 'raddr':
	        candidate.relatedAddress = parts[i + 1];
	        break;
	      case 'rport':
	        candidate.relatedPort = parseInt(parts[i + 1], 10);
	        break;
	      case 'tcptype':
	        candidate.tcpType = parts[i + 1];
	        break;
	      default: // Unknown extensions are silently ignored.
	        break;
	    }
	  }
	  return candidate;
	};

	// Translates a candidate object into SDP candidate attribute.
	SDPUtils.writeCandidate = function(candidate) {
	  var sdp = [];
	  sdp.push(candidate.foundation);
	  sdp.push(candidate.component);
	  sdp.push(candidate.protocol.toUpperCase());
	  sdp.push(candidate.priority);
	  sdp.push(candidate.ip);
	  sdp.push(candidate.port);

	  var type = candidate.type;
	  sdp.push('typ');
	  sdp.push(type);
	  if (type !== 'host' && candidate.relatedAddress &&
	      candidate.relatedPort) {
	    sdp.push('raddr');
	    sdp.push(candidate.relatedAddress); // was: relAddr
	    sdp.push('rport');
	    sdp.push(candidate.relatedPort); // was: relPort
	  }
	  if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
	    sdp.push('tcptype');
	    sdp.push(candidate.tcpType);
	  }
	  return 'candidate:' + sdp.join(' ');
	};

	// Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
	// a=rtpmap:111 opus/48000/2
	SDPUtils.parseRtpMap = function(line) {
	  var parts = line.substr(9).split(' ');
	  var parsed = {
	    payloadType: parseInt(parts.shift(), 10) // was: id
	  };

	  parts = parts[0].split('/');

	  parsed.name = parts[0];
	  parsed.clockRate = parseInt(parts[1], 10); // was: clockrate
	  // was: channels
	  parsed.numChannels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
	  return parsed;
	};

	// Generate an a=rtpmap line from RTCRtpCodecCapability or
	// RTCRtpCodecParameters.
	SDPUtils.writeRtpMap = function(codec) {
	  var pt = codec.payloadType;
	  if (codec.preferredPayloadType !== undefined) {
	    pt = codec.preferredPayloadType;
	  }
	  return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate +
	      (codec.numChannels !== 1 ? '/' + codec.numChannels : '') + '\r\n';
	};

	// Parses an a=extmap line (headerextension from RFC 5285). Sample input:
	// a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
	SDPUtils.parseExtmap = function(line) {
	  var parts = line.substr(9).split(' ');
	  return {
	    id: parseInt(parts[0], 10),
	    uri: parts[1]
	  };
	};

	// Generates a=extmap line from RTCRtpHeaderExtensionParameters or
	// RTCRtpHeaderExtension.
	SDPUtils.writeExtmap = function(headerExtension) {
	  return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) +
	       ' ' + headerExtension.uri + '\r\n';
	};

	// Parses an ftmp line, returns dictionary. Sample input:
	// a=fmtp:96 vbr=on;cng=on
	// Also deals with vbr=on; cng=on
	SDPUtils.parseFmtp = function(line) {
	  var parsed = {};
	  var kv;
	  var parts = line.substr(line.indexOf(' ') + 1).split(';');
	  for (var j = 0; j < parts.length; j++) {
	    kv = parts[j].trim().split('=');
	    parsed[kv[0].trim()] = kv[1];
	  }
	  return parsed;
	};

	// Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.
	SDPUtils.writeFmtp = function(codec) {
	  var line = '';
	  var pt = codec.payloadType;
	  if (codec.preferredPayloadType !== undefined) {
	    pt = codec.preferredPayloadType;
	  }
	  if (codec.parameters && Object.keys(codec.parameters).length) {
	    var params = [];
	    Object.keys(codec.parameters).forEach(function(param) {
	      params.push(param + '=' + codec.parameters[param]);
	    });
	    line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
	  }
	  return line;
	};

	// Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
	// a=rtcp-fb:98 nack rpsi
	SDPUtils.parseRtcpFb = function(line) {
	  var parts = line.substr(line.indexOf(' ') + 1).split(' ');
	  return {
	    type: parts.shift(),
	    parameter: parts.join(' ')
	  };
	};
	// Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.
	SDPUtils.writeRtcpFb = function(codec) {
	  var lines = '';
	  var pt = codec.payloadType;
	  if (codec.preferredPayloadType !== undefined) {
	    pt = codec.preferredPayloadType;
	  }
	  if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
	    // FIXME: special handling for trr-int?
	    codec.rtcpFeedback.forEach(function(fb) {
	      lines += 'a=rtcp-fb:' + pt + ' ' + fb.type +
	      (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') +
	          '\r\n';
	    });
	  }
	  return lines;
	};

	// Parses an RFC 5576 ssrc media attribute. Sample input:
	// a=ssrc:3735928559 cname:something
	SDPUtils.parseSsrcMedia = function(line) {
	  var sp = line.indexOf(' ');
	  var parts = {
	    ssrc: parseInt(line.substr(7, sp - 7), 10)
	  };
	  var colon = line.indexOf(':', sp);
	  if (colon > -1) {
	    parts.attribute = line.substr(sp + 1, colon - sp - 1);
	    parts.value = line.substr(colon + 1);
	  } else {
	    parts.attribute = line.substr(sp + 1);
	  }
	  return parts;
	};

	// Extracts DTLS parameters from SDP media section or sessionpart.
	// FIXME: for consistency with other functions this should only
	//   get the fingerprint line as input. See also getIceParameters.
	SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
	  var lines = SDPUtils.splitLines(mediaSection);
	  // Search in session part, too.
	  lines = lines.concat(SDPUtils.splitLines(sessionpart));
	  var fpLine = lines.filter(function(line) {
	    return line.indexOf('a=fingerprint:') === 0;
	  })[0].substr(14);
	  // Note: a=setup line is ignored since we use the 'auto' role.
	  var dtlsParameters = {
	    role: 'auto',
	    fingerprints: [{
	      algorithm: fpLine.split(' ')[0],
	      value: fpLine.split(' ')[1]
	    }]
	  };
	  return dtlsParameters;
	};

	// Serializes DTLS parameters to SDP.
	SDPUtils.writeDtlsParameters = function(params, setupType) {
	  var sdp = 'a=setup:' + setupType + '\r\n';
	  params.fingerprints.forEach(function(fp) {
	    sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
	  });
	  return sdp;
	};
	// Parses ICE information from SDP media section or sessionpart.
	// FIXME: for consistency with other functions this should only
	//   get the ice-ufrag and ice-pwd lines as input.
	SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
	  var lines = SDPUtils.splitLines(mediaSection);
	  // Search in session part, too.
	  lines = lines.concat(SDPUtils.splitLines(sessionpart));
	  var iceParameters = {
	    usernameFragment: lines.filter(function(line) {
	      return line.indexOf('a=ice-ufrag:') === 0;
	    })[0].substr(12),
	    password: lines.filter(function(line) {
	      return line.indexOf('a=ice-pwd:') === 0;
	    })[0].substr(10)
	  };
	  return iceParameters;
	};

	// Serializes ICE parameters to SDP.
	SDPUtils.writeIceParameters = function(params) {
	  return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' +
	      'a=ice-pwd:' + params.password + '\r\n';
	};

	// Parses the SDP media section and returns RTCRtpParameters.
	SDPUtils.parseRtpParameters = function(mediaSection) {
	  var description = {
	    codecs: [],
	    headerExtensions: [],
	    fecMechanisms: [],
	    rtcp: []
	  };
	  var lines = SDPUtils.splitLines(mediaSection);
	  var mline = lines[0].split(' ');
	  for (var i = 3; i < mline.length; i++) { // find all codecs from mline[3..]
	    var pt = mline[i];
	    var rtpmapline = SDPUtils.matchPrefix(
	        mediaSection, 'a=rtpmap:' + pt + ' ')[0];
	    if (rtpmapline) {
	      var codec = SDPUtils.parseRtpMap(rtpmapline);
	      var fmtps = SDPUtils.matchPrefix(
	          mediaSection, 'a=fmtp:' + pt + ' ');
	      // Only the first a=fmtp:<pt> is considered.
	      codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
	      codec.rtcpFeedback = SDPUtils.matchPrefix(
	          mediaSection, 'a=rtcp-fb:' + pt + ' ')
	        .map(SDPUtils.parseRtcpFb);
	      description.codecs.push(codec);
	      // parse FEC mechanisms from rtpmap lines.
	      switch (codec.name.toUpperCase()) {
	        case 'RED':
	        case 'ULPFEC':
	          description.fecMechanisms.push(codec.name.toUpperCase());
	          break;
	        default: // only RED and ULPFEC are recognized as FEC mechanisms.
	          break;
	      }
	    }
	  }
	  SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(function(line) {
	    description.headerExtensions.push(SDPUtils.parseExtmap(line));
	  });
	  // FIXME: parse rtcp.
	  return description;
	};

	// Generates parts of the SDP media section describing the capabilities /
	// parameters.
	SDPUtils.writeRtpDescription = function(kind, caps) {
	  var sdp = '';

	  // Build the mline.
	  sdp += 'm=' + kind + ' ';
	  sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.
	  sdp += ' UDP/TLS/RTP/SAVPF ';
	  sdp += caps.codecs.map(function(codec) {
	    if (codec.preferredPayloadType !== undefined) {
	      return codec.preferredPayloadType;
	    }
	    return codec.payloadType;
	  }).join(' ') + '\r\n';

	  sdp += 'c=IN IP4 0.0.0.0\r\n';
	  sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';

	  // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.
	  caps.codecs.forEach(function(codec) {
	    sdp += SDPUtils.writeRtpMap(codec);
	    sdp += SDPUtils.writeFmtp(codec);
	    sdp += SDPUtils.writeRtcpFb(codec);
	  });
	  // FIXME: add headerExtensions, fecMechanismş and rtcp.
	  sdp += 'a=rtcp-mux\r\n';
	  return sdp;
	};

	// Parses the SDP media section and returns an array of
	// RTCRtpEncodingParameters.
	SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
	  var encodingParameters = [];
	  var description = SDPUtils.parseRtpParameters(mediaSection);
	  var hasRed = description.fecMechanisms.indexOf('RED') !== -1;
	  var hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1;

	  // filter a=ssrc:... cname:, ignore PlanB-msid
	  var ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
	  .map(function(line) {
	    return SDPUtils.parseSsrcMedia(line);
	  })
	  .filter(function(parts) {
	    return parts.attribute === 'cname';
	  });
	  var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
	  var secondarySsrc;

	  var flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID')
	  .map(function(line) {
	    var parts = line.split(' ');
	    parts.shift();
	    return parts.map(function(part) {
	      return parseInt(part, 10);
	    });
	  });
	  if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
	    secondarySsrc = flows[0][1];
	  }

	  description.codecs.forEach(function(codec) {
	    if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
	      var encParam = {
	        ssrc: primarySsrc,
	        codecPayloadType: parseInt(codec.parameters.apt, 10),
	        rtx: {
	          payloadType: codec.payloadType,
	          ssrc: secondarySsrc
	        }
	      };
	      encodingParameters.push(encParam);
	      if (hasRed) {
	        encParam = JSON.parse(JSON.stringify(encParam));
	        encParam.fec = {
	          ssrc: secondarySsrc,
	          mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
	        };
	        encodingParameters.push(encParam);
	      }
	    }
	  });
	  if (encodingParameters.length === 0 && primarySsrc) {
	    encodingParameters.push({
	      ssrc: primarySsrc
	    });
	  }

	  // we support both b=AS and b=TIAS but interpret AS as TIAS.
	  var bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');
	  if (bandwidth.length) {
	    if (bandwidth[0].indexOf('b=TIAS:') === 0) {
	      bandwidth = parseInt(bandwidth[0].substr(7), 10);
	    } else if (bandwidth[0].indexOf('b=AS:') === 0) {
	      bandwidth = parseInt(bandwidth[0].substr(5), 10);
	    }
	    encodingParameters.forEach(function(params) {
	      params.maxBitrate = bandwidth;
	    });
	  }
	  return encodingParameters;
	};

	SDPUtils.writeSessionBoilerplate = function() {
	  // FIXME: sess-id should be an NTP timestamp.
	  return 'v=0\r\n' +
	      'o=thisisadapterortc 8169639915646943137 2 IN IP4 127.0.0.1\r\n' +
	      's=-\r\n' +
	      't=0 0\r\n';
	};

	SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
	  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

	  // Map ICE parameters (ufrag, pwd) to SDP.
	  sdp += SDPUtils.writeIceParameters(
	      transceiver.iceGatherer.getLocalParameters());

	  // Map DTLS parameters to SDP.
	  sdp += SDPUtils.writeDtlsParameters(
	      transceiver.dtlsTransport.getLocalParameters(),
	      type === 'offer' ? 'actpass' : 'active');

	  sdp += 'a=mid:' + transceiver.mid + '\r\n';

	  if (transceiver.rtpSender && transceiver.rtpReceiver) {
	    sdp += 'a=sendrecv\r\n';
	  } else if (transceiver.rtpSender) {
	    sdp += 'a=sendonly\r\n';
	  } else if (transceiver.rtpReceiver) {
	    sdp += 'a=recvonly\r\n';
	  } else {
	    sdp += 'a=inactive\r\n';
	  }

	  // FIXME: for RTX there might be multiple SSRCs. Not implemented in Edge yet.
	  if (transceiver.rtpSender) {
	    var msid = 'msid:' + stream.id + ' ' +
	        transceiver.rtpSender.track.id + '\r\n';
	    sdp += 'a=' + msid;
	    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
	        ' ' + msid;
	  }
	  // FIXME: this should be written by writeRtpDescription.
	  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
	      ' cname:' + SDPUtils.localCName + '\r\n';
	  return sdp;
	};

	// Gets the direction from the mediaSection or the sessionpart.
	SDPUtils.getDirection = function(mediaSection, sessionpart) {
	  // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
	  var lines = SDPUtils.splitLines(mediaSection);
	  for (var i = 0; i < lines.length; i++) {
	    switch (lines[i]) {
	      case 'a=sendrecv':
	      case 'a=sendonly':
	      case 'a=recvonly':
	      case 'a=inactive':
	        return lines[i].substr(2);
	      default:
	        // FIXME: What should happen here?
	    }
	  }
	  if (sessionpart) {
	    return SDPUtils.getDirection(sessionpart);
	  }
	  return 'sendrecv';
	};

	// Expose public methods.
	module.exports = SDPUtils;
	});

	var sdp$1 = interopDefault(sdp);


	var require$$2$1 = Object.freeze({
	  default: sdp$1
	});

	var getusermedia$2 = createCommonjsModule(function (module) {
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';

	// Expose public methods.
	module.exports = function() {
	  var shimError_ = function(e) {
	    return {
	      name: {PermissionDeniedError: 'NotAllowedError'}[e.name] || e.name,
	      message: e.message,
	      constraint: e.constraint,
	      toString: function() {
	        return this.name;
	      }
	    };
	  };

	  // getUserMedia error shim.
	  var origGetUserMedia = navigator.mediaDevices.getUserMedia.
	      bind(navigator.mediaDevices);
	  navigator.mediaDevices.getUserMedia = function(c) {
	    return origGetUserMedia(c).catch(function(e) {
	      return Promise.reject(shimError_(e));
	    });
	  };
	};
	});

	var getusermedia$3 = interopDefault(getusermedia$2);


	var require$$0$2 = Object.freeze({
	  default: getusermedia$3
	});

	var edge_shim = createCommonjsModule(function (module) {
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';

	var SDPUtils = interopDefault(require$$2$1);
	var browserDetails = interopDefault(require$$0).browserDetails;

	var edgeShim = {
	  shimPeerConnection: function() {
	    if (window.RTCIceGatherer) {
	      // ORTC defines an RTCIceCandidate object but no constructor.
	      // Not implemented in Edge.
	      if (!window.RTCIceCandidate) {
	        window.RTCIceCandidate = function(args) {
	          return args;
	        };
	      }
	      // ORTC does not have a session description object but
	      // other browsers (i.e. Chrome) that will support both PC and ORTC
	      // in the future might have this defined already.
	      if (!window.RTCSessionDescription) {
	        window.RTCSessionDescription = function(args) {
	          return args;
	        };
	      }
	    }

	    window.RTCPeerConnection = function(config) {
	      var self = this;

	      var _eventTarget = document.createDocumentFragment();
	      ['addEventListener', 'removeEventListener', 'dispatchEvent']
	          .forEach(function(method) {
	            self[method] = _eventTarget[method].bind(_eventTarget);
	          });

	      this.onicecandidate = null;
	      this.onaddstream = null;
	      this.ontrack = null;
	      this.onremovestream = null;
	      this.onsignalingstatechange = null;
	      this.oniceconnectionstatechange = null;
	      this.onnegotiationneeded = null;
	      this.ondatachannel = null;

	      this.localStreams = [];
	      this.remoteStreams = [];
	      this.getLocalStreams = function() {
	        return self.localStreams;
	      };
	      this.getRemoteStreams = function() {
	        return self.remoteStreams;
	      };

	      this.localDescription = new RTCSessionDescription({
	        type: '',
	        sdp: ''
	      });
	      this.remoteDescription = new RTCSessionDescription({
	        type: '',
	        sdp: ''
	      });
	      this.signalingState = 'stable';
	      this.iceConnectionState = 'new';
	      this.iceGatheringState = 'new';

	      this.iceOptions = {
	        gatherPolicy: 'all',
	        iceServers: []
	      };
	      if (config && config.iceTransportPolicy) {
	        switch (config.iceTransportPolicy) {
	          case 'all':
	          case 'relay':
	            this.iceOptions.gatherPolicy = config.iceTransportPolicy;
	            break;
	          case 'none':
	            // FIXME: remove once implementation and spec have added this.
	            throw new TypeError('iceTransportPolicy "none" not supported');
	          default:
	            // don't set iceTransportPolicy.
	            break;
	        }
	      }
	      this.usingBundle = config && config.bundlePolicy === 'max-bundle';

	      if (config && config.iceServers) {
	        // Edge does not like
	        // 1) stun:
	        // 2) turn: that does not have all of turn:host:port?transport=udp
	        // 3) turn: with ipv6 addresses
	        var iceServers = JSON.parse(JSON.stringify(config.iceServers));
	        this.iceOptions.iceServers = iceServers.filter(function(server) {
	          if (server && server.urls) {
	            var urls = server.urls;
	            if (typeof urls === 'string') {
	              urls = [urls];
	            }
	            urls = urls.filter(function(url) {
	              return (url.indexOf('turn:') === 0 &&
	                  url.indexOf('transport=udp') !== -1 &&
	                  url.indexOf('turn:[') === -1) ||
	                  (url.indexOf('stun:') === 0 &&
	                    browserDetails.version >= 14393);
	            })[0];
	            return !!urls;
	          }
	          return false;
	        });
	      }

	      // per-track iceGathers, iceTransports, dtlsTransports, rtpSenders, ...
	      // everything that is needed to describe a SDP m-line.
	      this.transceivers = [];

	      // since the iceGatherer is currently created in createOffer but we
	      // must not emit candidates until after setLocalDescription we buffer
	      // them in this array.
	      this._localIceCandidatesBuffer = [];
	    };

	    window.RTCPeerConnection.prototype._emitBufferedCandidates = function() {
	      var self = this;
	      var sections = SDPUtils.splitSections(self.localDescription.sdp);
	      // FIXME: need to apply ice candidates in a way which is async but
	      // in-order
	      this._localIceCandidatesBuffer.forEach(function(event) {
	        var end = !event.candidate || Object.keys(event.candidate).length === 0;
	        if (end) {
	          for (var j = 1; j < sections.length; j++) {
	            if (sections[j].indexOf('\r\na=end-of-candidates\r\n') === -1) {
	              sections[j] += 'a=end-of-candidates\r\n';
	            }
	          }
	        } else if (event.candidate.candidate.indexOf('typ endOfCandidates')
	            === -1) {
	          sections[event.candidate.sdpMLineIndex + 1] +=
	              'a=' + event.candidate.candidate + '\r\n';
	        }
	        self.localDescription.sdp = sections.join('');
	        self.dispatchEvent(event);
	        if (self.onicecandidate !== null) {
	          self.onicecandidate(event);
	        }
	        if (!event.candidate && self.iceGatheringState !== 'complete') {
	          var complete = self.transceivers.every(function(transceiver) {
	            return transceiver.iceGatherer &&
	                transceiver.iceGatherer.state === 'completed';
	          });
	          if (complete) {
	            self.iceGatheringState = 'complete';
	          }
	        }
	      });
	      this._localIceCandidatesBuffer = [];
	    };

	    window.RTCPeerConnection.prototype.addStream = function(stream) {
	      // Clone is necessary for local demos mostly, attaching directly
	      // to two different senders does not work (build 10547).
	      this.localStreams.push(stream.clone());
	      this._maybeFireNegotiationNeeded();
	    };

	    window.RTCPeerConnection.prototype.removeStream = function(stream) {
	      var idx = this.localStreams.indexOf(stream);
	      if (idx > -1) {
	        this.localStreams.splice(idx, 1);
	        this._maybeFireNegotiationNeeded();
	      }
	    };

	    window.RTCPeerConnection.prototype.getSenders = function() {
	      return this.transceivers.filter(function(transceiver) {
	        return !!transceiver.rtpSender;
	      })
	      .map(function(transceiver) {
	        return transceiver.rtpSender;
	      });
	    };

	    window.RTCPeerConnection.prototype.getReceivers = function() {
	      return this.transceivers.filter(function(transceiver) {
	        return !!transceiver.rtpReceiver;
	      })
	      .map(function(transceiver) {
	        return transceiver.rtpReceiver;
	      });
	    };

	    // Determines the intersection of local and remote capabilities.
	    window.RTCPeerConnection.prototype._getCommonCapabilities =
	        function(localCapabilities, remoteCapabilities) {
	          var commonCapabilities = {
	            codecs: [],
	            headerExtensions: [],
	            fecMechanisms: []
	          };
	          localCapabilities.codecs.forEach(function(lCodec) {
	            for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
	              var rCodec = remoteCapabilities.codecs[i];
	              if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() &&
	                  lCodec.clockRate === rCodec.clockRate &&
	                  lCodec.numChannels === rCodec.numChannels) {
	                // push rCodec so we reply with offerer payload type
	                commonCapabilities.codecs.push(rCodec);

	                // determine common feedback mechanisms
	                rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function(fb) {
	                  for (var j = 0; j < lCodec.rtcpFeedback.length; j++) {
	                    if (lCodec.rtcpFeedback[j].type === fb.type &&
	                        lCodec.rtcpFeedback[j].parameter === fb.parameter) {
	                      return true;
	                    }
	                  }
	                  return false;
	                });
	                // FIXME: also need to determine .parameters
	                //  see https://github.com/openpeer/ortc/issues/569
	                break;
	              }
	            }
	          });

	          localCapabilities.headerExtensions
	              .forEach(function(lHeaderExtension) {
	                for (var i = 0; i < remoteCapabilities.headerExtensions.length;
	                     i++) {
	                  var rHeaderExtension = remoteCapabilities.headerExtensions[i];
	                  if (lHeaderExtension.uri === rHeaderExtension.uri) {
	                    commonCapabilities.headerExtensions.push(rHeaderExtension);
	                    break;
	                  }
	                }
	              });

	          // FIXME: fecMechanisms
	          return commonCapabilities;
	        };

	    // Create ICE gatherer, ICE transport and DTLS transport.
	    window.RTCPeerConnection.prototype._createIceAndDtlsTransports =
	        function(mid, sdpMLineIndex) {
	          var self = this;
	          var iceGatherer = new RTCIceGatherer(self.iceOptions);
	          var iceTransport = new RTCIceTransport(iceGatherer);
	          iceGatherer.onlocalcandidate = function(evt) {
	            var event = new Event('icecandidate');
	            event.candidate = {sdpMid: mid, sdpMLineIndex: sdpMLineIndex};

	            var cand = evt.candidate;
	            var end = !cand || Object.keys(cand).length === 0;
	            // Edge emits an empty object for RTCIceCandidateComplete‥
	            if (end) {
	              // polyfill since RTCIceGatherer.state is not implemented in
	              // Edge 10547 yet.
	              if (iceGatherer.state === undefined) {
	                iceGatherer.state = 'completed';
	              }

	              // Emit a candidate with type endOfCandidates to make the samples
	              // work. Edge requires addIceCandidate with this empty candidate
	              // to start checking. The real solution is to signal
	              // end-of-candidates to the other side when getting the null
	              // candidate but some apps (like the samples) don't do that.
	              event.candidate.candidate =
	                  'candidate:1 1 udp 1 0.0.0.0 9 typ endOfCandidates';
	            } else {
	              // RTCIceCandidate doesn't have a component, needs to be added
	              cand.component = iceTransport.component === 'RTCP' ? 2 : 1;
	              event.candidate.candidate = SDPUtils.writeCandidate(cand);
	            }

	            // update local description.
	            var sections = SDPUtils.splitSections(self.localDescription.sdp);
	            if (event.candidate.candidate.indexOf('typ endOfCandidates')
	                === -1) {
	              sections[event.candidate.sdpMLineIndex + 1] +=
	                  'a=' + event.candidate.candidate + '\r\n';
	            } else {
	              sections[event.candidate.sdpMLineIndex + 1] +=
	                  'a=end-of-candidates\r\n';
	            }
	            self.localDescription.sdp = sections.join('');

	            var complete = self.transceivers.every(function(transceiver) {
	              return transceiver.iceGatherer &&
	                  transceiver.iceGatherer.state === 'completed';
	            });

	            // Emit candidate if localDescription is set.
	            // Also emits null candidate when all gatherers are complete.
	            switch (self.iceGatheringState) {
	              case 'new':
	                self._localIceCandidatesBuffer.push(event);
	                if (end && complete) {
	                  self._localIceCandidatesBuffer.push(
	                      new Event('icecandidate'));
	                }
	                break;
	              case 'gathering':
	                self._emitBufferedCandidates();
	                self.dispatchEvent(event);
	                if (self.onicecandidate !== null) {
	                  self.onicecandidate(event);
	                }
	                if (complete) {
	                  self.dispatchEvent(new Event('icecandidate'));
	                  if (self.onicecandidate !== null) {
	                    self.onicecandidate(new Event('icecandidate'));
	                  }
	                  self.iceGatheringState = 'complete';
	                }
	                break;
	              case 'complete':
	                // should not happen... currently!
	                break;
	              default: // no-op.
	                break;
	            }
	          };
	          iceTransport.onicestatechange = function() {
	            self._updateConnectionState();
	          };

	          var dtlsTransport = new RTCDtlsTransport(iceTransport);
	          dtlsTransport.ondtlsstatechange = function() {
	            self._updateConnectionState();
	          };
	          dtlsTransport.onerror = function() {
	            // onerror does not set state to failed by itself.
	            dtlsTransport.state = 'failed';
	            self._updateConnectionState();
	          };

	          return {
	            iceGatherer: iceGatherer,
	            iceTransport: iceTransport,
	            dtlsTransport: dtlsTransport
	          };
	        };

	    // Start the RTP Sender and Receiver for a transceiver.
	    window.RTCPeerConnection.prototype._transceive = function(transceiver,
	        send, recv) {
	      var params = this._getCommonCapabilities(transceiver.localCapabilities,
	          transceiver.remoteCapabilities);
	      if (send && transceiver.rtpSender) {
	        params.encodings = transceiver.sendEncodingParameters;
	        params.rtcp = {
	          cname: SDPUtils.localCName
	        };
	        if (transceiver.recvEncodingParameters.length) {
	          params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
	        }
	        transceiver.rtpSender.send(params);
	      }
	      if (recv && transceiver.rtpReceiver) {
	        params.encodings = transceiver.recvEncodingParameters;
	        params.rtcp = {
	          cname: transceiver.cname
	        };
	        if (transceiver.sendEncodingParameters.length) {
	          params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
	        }
	        transceiver.rtpReceiver.receive(params);
	      }
	    };

	    window.RTCPeerConnection.prototype.setLocalDescription =
	        function(description) {
	          var self = this;
	          var sections;
	          var sessionpart;
	          if (description.type === 'offer') {
	            // FIXME: What was the purpose of this empty if statement?
	            // if (!this._pendingOffer) {
	            // } else {
	            if (this._pendingOffer) {
	              // VERY limited support for SDP munging. Limited to:
	              // * changing the order of codecs
	              sections = SDPUtils.splitSections(description.sdp);
	              sessionpart = sections.shift();
	              sections.forEach(function(mediaSection, sdpMLineIndex) {
	                var caps = SDPUtils.parseRtpParameters(mediaSection);
	                self._pendingOffer[sdpMLineIndex].localCapabilities = caps;
	              });
	              this.transceivers = this._pendingOffer;
	              delete this._pendingOffer;
	            }
	          } else if (description.type === 'answer') {
	            sections = SDPUtils.splitSections(self.remoteDescription.sdp);
	            sessionpart = sections.shift();
	            var isIceLite = SDPUtils.matchPrefix(sessionpart,
	                'a=ice-lite').length > 0;
	            sections.forEach(function(mediaSection, sdpMLineIndex) {
	              var transceiver = self.transceivers[sdpMLineIndex];
	              var iceGatherer = transceiver.iceGatherer;
	              var iceTransport = transceiver.iceTransport;
	              var dtlsTransport = transceiver.dtlsTransport;
	              var localCapabilities = transceiver.localCapabilities;
	              var remoteCapabilities = transceiver.remoteCapabilities;
	              var rejected = mediaSection.split('\n', 1)[0]
	                  .split(' ', 2)[1] === '0';

	              if (!rejected) {
	                var remoteIceParameters = SDPUtils.getIceParameters(
	                    mediaSection, sessionpart);
	                if (isIceLite) {
	                  var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
	                  .map(function(cand) {
	                    return SDPUtils.parseCandidate(cand);
	                  })
	                  .filter(function(cand) {
	                    return cand.component === '1';
	                  });
	                  // ice-lite only includes host candidates in the SDP so we can
	                  // use setRemoteCandidates (which implies an
	                  // RTCIceCandidateComplete)
	                  if (cands.length) {
	                    iceTransport.setRemoteCandidates(cands);
	                  }
	                }
	                var remoteDtlsParameters = SDPUtils.getDtlsParameters(
	                    mediaSection, sessionpart);
	                if (isIceLite) {
	                  remoteDtlsParameters.role = 'server';
	                }

	                if (!self.usingBundle || sdpMLineIndex === 0) {
	                  iceTransport.start(iceGatherer, remoteIceParameters,
	                      isIceLite ? 'controlling' : 'controlled');
	                  dtlsTransport.start(remoteDtlsParameters);
	                }

	                // Calculate intersection of capabilities.
	                var params = self._getCommonCapabilities(localCapabilities,
	                    remoteCapabilities);

	                // Start the RTCRtpSender. The RTCRtpReceiver for this
	                // transceiver has already been started in setRemoteDescription.
	                self._transceive(transceiver,
	                    params.codecs.length > 0,
	                    false);
	              }
	            });
	          }

	          this.localDescription = {
	            type: description.type,
	            sdp: description.sdp
	          };
	          switch (description.type) {
	            case 'offer':
	              this._updateSignalingState('have-local-offer');
	              break;
	            case 'answer':
	              this._updateSignalingState('stable');
	              break;
	            default:
	              throw new TypeError('unsupported type "' + description.type +
	                  '"');
	          }

	          // If a success callback was provided, emit ICE candidates after it
	          // has been executed. Otherwise, emit callback after the Promise is
	          // resolved.
	          var hasCallback = arguments.length > 1 &&
	            typeof arguments[1] === 'function';
	          if (hasCallback) {
	            var cb = arguments[1];
	            window.setTimeout(function() {
	              cb();
	              if (self.iceGatheringState === 'new') {
	                self.iceGatheringState = 'gathering';
	              }
	              self._emitBufferedCandidates();
	            }, 0);
	          }
	          var p = Promise.resolve();
	          p.then(function() {
	            if (!hasCallback) {
	              if (self.iceGatheringState === 'new') {
	                self.iceGatheringState = 'gathering';
	              }
	              // Usually candidates will be emitted earlier.
	              window.setTimeout(self._emitBufferedCandidates.bind(self), 500);
	            }
	          });
	          return p;
	        };

	    window.RTCPeerConnection.prototype.setRemoteDescription =
	        function(description) {
	          var self = this;
	          var stream = new MediaStream();
	          var receiverList = [];
	          var sections = SDPUtils.splitSections(description.sdp);
	          var sessionpart = sections.shift();
	          var isIceLite = SDPUtils.matchPrefix(sessionpart,
	              'a=ice-lite').length > 0;
	          this.usingBundle = SDPUtils.matchPrefix(sessionpart,
	              'a=group:BUNDLE ').length > 0;
	          sections.forEach(function(mediaSection, sdpMLineIndex) {
	            var lines = SDPUtils.splitLines(mediaSection);
	            var mline = lines[0].substr(2).split(' ');
	            var kind = mline[0];
	            var rejected = mline[1] === '0';
	            var direction = SDPUtils.getDirection(mediaSection, sessionpart);

	            var transceiver;
	            var iceGatherer;
	            var iceTransport;
	            var dtlsTransport;
	            var rtpSender;
	            var rtpReceiver;
	            var sendEncodingParameters;
	            var recvEncodingParameters;
	            var localCapabilities;

	            var track;
	            // FIXME: ensure the mediaSection has rtcp-mux set.
	            var remoteCapabilities = SDPUtils.parseRtpParameters(mediaSection);
	            var remoteIceParameters;
	            var remoteDtlsParameters;
	            if (!rejected) {
	              remoteIceParameters = SDPUtils.getIceParameters(mediaSection,
	                  sessionpart);
	              remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection,
	                  sessionpart);
	              remoteDtlsParameters.role = 'client';
	            }
	            recvEncodingParameters =
	                SDPUtils.parseRtpEncodingParameters(mediaSection);

	            var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:');
	            if (mid.length) {
	              mid = mid[0].substr(6);
	            } else {
	              mid = SDPUtils.generateIdentifier();
	            }

	            var cname;
	            // Gets the first SSRC. Note that with RTX there might be multiple
	            // SSRCs.
	            var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
	                .map(function(line) {
	                  return SDPUtils.parseSsrcMedia(line);
	                })
	                .filter(function(obj) {
	                  return obj.attribute === 'cname';
	                })[0];
	            if (remoteSsrc) {
	              cname = remoteSsrc.value;
	            }

	            var isComplete = SDPUtils.matchPrefix(mediaSection,
	                'a=end-of-candidates', sessionpart).length > 0;
	            var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
	                .map(function(cand) {
	                  return SDPUtils.parseCandidate(cand);
	                })
	                .filter(function(cand) {
	                  return cand.component === '1';
	                });
	            if (description.type === 'offer' && !rejected) {
	              var transports = self.usingBundle && sdpMLineIndex > 0 ? {
	                iceGatherer: self.transceivers[0].iceGatherer,
	                iceTransport: self.transceivers[0].iceTransport,
	                dtlsTransport: self.transceivers[0].dtlsTransport
	              } : self._createIceAndDtlsTransports(mid, sdpMLineIndex);

	              if (isComplete) {
	                transports.iceTransport.setRemoteCandidates(cands);
	              }

	              localCapabilities = RTCRtpReceiver.getCapabilities(kind);
	              sendEncodingParameters = [{
	                ssrc: (2 * sdpMLineIndex + 2) * 1001
	              }];

	              rtpReceiver = new RTCRtpReceiver(transports.dtlsTransport, kind);

	              track = rtpReceiver.track;
	              receiverList.push([track, rtpReceiver]);
	              // FIXME: not correct when there are multiple streams but that is
	              // not currently supported in this shim.
	              stream.addTrack(track);

	              // FIXME: look at direction.
	              if (self.localStreams.length > 0 &&
	                  self.localStreams[0].getTracks().length >= sdpMLineIndex) {
	                var localTrack;
	                if (kind === 'audio') {
	                  localTrack = self.localStreams[0].getAudioTracks()[0];
	                } else if (kind === 'video') {
	                  localTrack = self.localStreams[0].getVideoTracks()[0];
	                }
	                if (localTrack) {
	                  rtpSender = new RTCRtpSender(localTrack,
	                      transports.dtlsTransport);
	                }
	              }

	              self.transceivers[sdpMLineIndex] = {
	                iceGatherer: transports.iceGatherer,
	                iceTransport: transports.iceTransport,
	                dtlsTransport: transports.dtlsTransport,
	                localCapabilities: localCapabilities,
	                remoteCapabilities: remoteCapabilities,
	                rtpSender: rtpSender,
	                rtpReceiver: rtpReceiver,
	                kind: kind,
	                mid: mid,
	                cname: cname,
	                sendEncodingParameters: sendEncodingParameters,
	                recvEncodingParameters: recvEncodingParameters
	              };
	              // Start the RTCRtpReceiver now. The RTPSender is started in
	              // setLocalDescription.
	              self._transceive(self.transceivers[sdpMLineIndex],
	                  false,
	                  direction === 'sendrecv' || direction === 'sendonly');
	            } else if (description.type === 'answer' && !rejected) {
	              transceiver = self.transceivers[sdpMLineIndex];
	              iceGatherer = transceiver.iceGatherer;
	              iceTransport = transceiver.iceTransport;
	              dtlsTransport = transceiver.dtlsTransport;
	              rtpSender = transceiver.rtpSender;
	              rtpReceiver = transceiver.rtpReceiver;
	              sendEncodingParameters = transceiver.sendEncodingParameters;
	              localCapabilities = transceiver.localCapabilities;

	              self.transceivers[sdpMLineIndex].recvEncodingParameters =
	                  recvEncodingParameters;
	              self.transceivers[sdpMLineIndex].remoteCapabilities =
	                  remoteCapabilities;
	              self.transceivers[sdpMLineIndex].cname = cname;

	              if ((isIceLite || isComplete) && cands.length) {
	                iceTransport.setRemoteCandidates(cands);
	              }
	              if (!self.usingBundle || sdpMLineIndex === 0) {
	                iceTransport.start(iceGatherer, remoteIceParameters,
	                    'controlling');
	                dtlsTransport.start(remoteDtlsParameters);
	              }

	              self._transceive(transceiver,
	                  direction === 'sendrecv' || direction === 'recvonly',
	                  direction === 'sendrecv' || direction === 'sendonly');

	              if (rtpReceiver &&
	                  (direction === 'sendrecv' || direction === 'sendonly')) {
	                track = rtpReceiver.track;
	                receiverList.push([track, rtpReceiver]);
	                stream.addTrack(track);
	              } else {
	                // FIXME: actually the receiver should be created later.
	                delete transceiver.rtpReceiver;
	              }
	            }
	          });

	          this.remoteDescription = {
	            type: description.type,
	            sdp: description.sdp
	          };
	          switch (description.type) {
	            case 'offer':
	              this._updateSignalingState('have-remote-offer');
	              break;
	            case 'answer':
	              this._updateSignalingState('stable');
	              break;
	            default:
	              throw new TypeError('unsupported type "' + description.type +
	                  '"');
	          }
	          if (stream.getTracks().length) {
	            self.remoteStreams.push(stream);
	            window.setTimeout(function() {
	              var event = new Event('addstream');
	              event.stream = stream;
	              self.dispatchEvent(event);
	              if (self.onaddstream !== null) {
	                window.setTimeout(function() {
	                  self.onaddstream(event);
	                }, 0);
	              }

	              receiverList.forEach(function(item) {
	                var track = item[0];
	                var receiver = item[1];
	                var trackEvent = new Event('track');
	                trackEvent.track = track;
	                trackEvent.receiver = receiver;
	                trackEvent.streams = [stream];
	                self.dispatchEvent(event);
	                if (self.ontrack !== null) {
	                  window.setTimeout(function() {
	                    self.ontrack(trackEvent);
	                  }, 0);
	                }
	              });
	            }, 0);
	          }
	          if (arguments.length > 1 && typeof arguments[1] === 'function') {
	            window.setTimeout(arguments[1], 0);
	          }
	          return Promise.resolve();
	        };

	    window.RTCPeerConnection.prototype.close = function() {
	      this.transceivers.forEach(function(transceiver) {
	        /* not yet
	        if (transceiver.iceGatherer) {
	          transceiver.iceGatherer.close();
	        }
	        */
	        if (transceiver.iceTransport) {
	          transceiver.iceTransport.stop();
	        }
	        if (transceiver.dtlsTransport) {
	          transceiver.dtlsTransport.stop();
	        }
	        if (transceiver.rtpSender) {
	          transceiver.rtpSender.stop();
	        }
	        if (transceiver.rtpReceiver) {
	          transceiver.rtpReceiver.stop();
	        }
	      });
	      // FIXME: clean up tracks, local streams, remote streams, etc
	      this._updateSignalingState('closed');
	    };

	    // Update the signaling state.
	    window.RTCPeerConnection.prototype._updateSignalingState =
	        function(newState) {
	          this.signalingState = newState;
	          var event = new Event('signalingstatechange');
	          this.dispatchEvent(event);
	          if (this.onsignalingstatechange !== null) {
	            this.onsignalingstatechange(event);
	          }
	        };

	    // Determine whether to fire the negotiationneeded event.
	    window.RTCPeerConnection.prototype._maybeFireNegotiationNeeded =
	        function() {
	          // Fire away (for now).
	          var event = new Event('negotiationneeded');
	          this.dispatchEvent(event);
	          if (this.onnegotiationneeded !== null) {
	            this.onnegotiationneeded(event);
	          }
	        };

	    // Update the connection state.
	    window.RTCPeerConnection.prototype._updateConnectionState = function() {
	      var self = this;
	      var newState;
	      var states = {
	        'new': 0,
	        closed: 0,
	        connecting: 0,
	        checking: 0,
	        connected: 0,
	        completed: 0,
	        failed: 0
	      };
	      this.transceivers.forEach(function(transceiver) {
	        states[transceiver.iceTransport.state]++;
	        states[transceiver.dtlsTransport.state]++;
	      });
	      // ICETransport.completed and connected are the same for this purpose.
	      states.connected += states.completed;

	      newState = 'new';
	      if (states.failed > 0) {
	        newState = 'failed';
	      } else if (states.connecting > 0 || states.checking > 0) {
	        newState = 'connecting';
	      } else if (states.disconnected > 0) {
	        newState = 'disconnected';
	      } else if (states.new > 0) {
	        newState = 'new';
	      } else if (states.connected > 0 || states.completed > 0) {
	        newState = 'connected';
	      }

	      if (newState !== self.iceConnectionState) {
	        self.iceConnectionState = newState;
	        var event = new Event('iceconnectionstatechange');
	        this.dispatchEvent(event);
	        if (this.oniceconnectionstatechange !== null) {
	          this.oniceconnectionstatechange(event);
	        }
	      }
	    };

	    window.RTCPeerConnection.prototype.createOffer = function() {
	      var self = this;
	      if (this._pendingOffer) {
	        throw new Error('createOffer called while there is a pending offer.');
	      }
	      var offerOptions;
	      if (arguments.length === 1 && typeof arguments[0] !== 'function') {
	        offerOptions = arguments[0];
	      } else if (arguments.length === 3) {
	        offerOptions = arguments[2];
	      }

	      var tracks = [];
	      var numAudioTracks = 0;
	      var numVideoTracks = 0;
	      // Default to sendrecv.
	      if (this.localStreams.length) {
	        numAudioTracks = this.localStreams[0].getAudioTracks().length;
	        numVideoTracks = this.localStreams[0].getVideoTracks().length;
	      }
	      // Determine number of audio and video tracks we need to send/recv.
	      if (offerOptions) {
	        // Reject Chrome legacy constraints.
	        if (offerOptions.mandatory || offerOptions.optional) {
	          throw new TypeError(
	              'Legacy mandatory/optional constraints not supported.');
	        }
	        if (offerOptions.offerToReceiveAudio !== undefined) {
	          numAudioTracks = offerOptions.offerToReceiveAudio;
	        }
	        if (offerOptions.offerToReceiveVideo !== undefined) {
	          numVideoTracks = offerOptions.offerToReceiveVideo;
	        }
	      }
	      if (this.localStreams.length) {
	        // Push local streams.
	        this.localStreams[0].getTracks().forEach(function(track) {
	          tracks.push({
	            kind: track.kind,
	            track: track,
	            wantReceive: track.kind === 'audio' ?
	                numAudioTracks > 0 : numVideoTracks > 0
	          });
	          if (track.kind === 'audio') {
	            numAudioTracks--;
	          } else if (track.kind === 'video') {
	            numVideoTracks--;
	          }
	        });
	      }
	      // Create M-lines for recvonly streams.
	      while (numAudioTracks > 0 || numVideoTracks > 0) {
	        if (numAudioTracks > 0) {
	          tracks.push({
	            kind: 'audio',
	            wantReceive: true
	          });
	          numAudioTracks--;
	        }
	        if (numVideoTracks > 0) {
	          tracks.push({
	            kind: 'video',
	            wantReceive: true
	          });
	          numVideoTracks--;
	        }
	      }

	      var sdp = SDPUtils.writeSessionBoilerplate();
	      var transceivers = [];
	      tracks.forEach(function(mline, sdpMLineIndex) {
	        // For each track, create an ice gatherer, ice transport,
	        // dtls transport, potentially rtpsender and rtpreceiver.
	        var track = mline.track;
	        var kind = mline.kind;
	        var mid = SDPUtils.generateIdentifier();

	        var transports = self.usingBundle && sdpMLineIndex > 0 ? {
	          iceGatherer: transceivers[0].iceGatherer,
	          iceTransport: transceivers[0].iceTransport,
	          dtlsTransport: transceivers[0].dtlsTransport
	        } : self._createIceAndDtlsTransports(mid, sdpMLineIndex);

	        var localCapabilities = RTCRtpSender.getCapabilities(kind);
	        var rtpSender;
	        var rtpReceiver;

	        // generate an ssrc now, to be used later in rtpSender.send
	        var sendEncodingParameters = [{
	          ssrc: (2 * sdpMLineIndex + 1) * 1001
	        }];
	        if (track) {
	          rtpSender = new RTCRtpSender(track, transports.dtlsTransport);
	        }

	        if (mline.wantReceive) {
	          rtpReceiver = new RTCRtpReceiver(transports.dtlsTransport, kind);
	        }

	        transceivers[sdpMLineIndex] = {
	          iceGatherer: transports.iceGatherer,
	          iceTransport: transports.iceTransport,
	          dtlsTransport: transports.dtlsTransport,
	          localCapabilities: localCapabilities,
	          remoteCapabilities: null,
	          rtpSender: rtpSender,
	          rtpReceiver: rtpReceiver,
	          kind: kind,
	          mid: mid,
	          sendEncodingParameters: sendEncodingParameters,
	          recvEncodingParameters: null
	        };
	      });
	      if (this.usingBundle) {
	        sdp += 'a=group:BUNDLE ' + transceivers.map(function(t) {
	          return t.mid;
	        }).join(' ') + '\r\n';
	      }
	      tracks.forEach(function(mline, sdpMLineIndex) {
	        var transceiver = transceivers[sdpMLineIndex];
	        sdp += SDPUtils.writeMediaSection(transceiver,
	            transceiver.localCapabilities, 'offer', self.localStreams[0]);
	      });

	      this._pendingOffer = transceivers;
	      var desc = new RTCSessionDescription({
	        type: 'offer',
	        sdp: sdp
	      });
	      if (arguments.length && typeof arguments[0] === 'function') {
	        window.setTimeout(arguments[0], 0, desc);
	      }
	      return Promise.resolve(desc);
	    };

	    window.RTCPeerConnection.prototype.createAnswer = function() {
	      var self = this;

	      var sdp = SDPUtils.writeSessionBoilerplate();
	      if (this.usingBundle) {
	        sdp += 'a=group:BUNDLE ' + this.transceivers.map(function(t) {
	          return t.mid;
	        }).join(' ') + '\r\n';
	      }
	      this.transceivers.forEach(function(transceiver) {
	        // Calculate intersection of capabilities.
	        var commonCapabilities = self._getCommonCapabilities(
	            transceiver.localCapabilities,
	            transceiver.remoteCapabilities);

	        sdp += SDPUtils.writeMediaSection(transceiver, commonCapabilities,
	            'answer', self.localStreams[0]);
	      });

	      var desc = new RTCSessionDescription({
	        type: 'answer',
	        sdp: sdp
	      });
	      if (arguments.length && typeof arguments[0] === 'function') {
	        window.setTimeout(arguments[0], 0, desc);
	      }
	      return Promise.resolve(desc);
	    };

	    window.RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
	      if (candidate === null) {
	        this.transceivers.forEach(function(transceiver) {
	          transceiver.iceTransport.addRemoteCandidate({});
	        });
	      } else {
	        var mLineIndex = candidate.sdpMLineIndex;
	        if (candidate.sdpMid) {
	          for (var i = 0; i < this.transceivers.length; i++) {
	            if (this.transceivers[i].mid === candidate.sdpMid) {
	              mLineIndex = i;
	              break;
	            }
	          }
	        }
	        var transceiver = this.transceivers[mLineIndex];
	        if (transceiver) {
	          var cand = Object.keys(candidate.candidate).length > 0 ?
	              SDPUtils.parseCandidate(candidate.candidate) : {};
	          // Ignore Chrome's invalid candidates since Edge does not like them.
	          if (cand.protocol === 'tcp' && (cand.port === 0 || cand.port === 9)) {
	            return;
	          }
	          // Ignore RTCP candidates, we assume RTCP-MUX.
	          if (cand.component !== '1') {
	            return;
	          }
	          // A dirty hack to make samples work.
	          if (cand.type === 'endOfCandidates') {
	            cand = {};
	          }
	          transceiver.iceTransport.addRemoteCandidate(cand);

	          // update the remoteDescription.
	          var sections = SDPUtils.splitSections(this.remoteDescription.sdp);
	          sections[mLineIndex + 1] += (cand.type ? candidate.candidate.trim()
	              : 'a=end-of-candidates') + '\r\n';
	          this.remoteDescription.sdp = sections.join('');
	        }
	      }
	      if (arguments.length > 1 && typeof arguments[1] === 'function') {
	        window.setTimeout(arguments[1], 0);
	      }
	      return Promise.resolve();
	    };

	    window.RTCPeerConnection.prototype.getStats = function() {
	      var promises = [];
	      this.transceivers.forEach(function(transceiver) {
	        ['rtpSender', 'rtpReceiver', 'iceGatherer', 'iceTransport',
	            'dtlsTransport'].forEach(function(method) {
	              if (transceiver[method]) {
	                promises.push(transceiver[method].getStats());
	              }
	            });
	      });
	      var cb = arguments.length > 1 && typeof arguments[1] === 'function' &&
	          arguments[1];
	      return new Promise(function(resolve) {
	        // shim getStats with maplike support
	        var results = new Map();
	        Promise.all(promises).then(function(res) {
	          res.forEach(function(result) {
	            Object.keys(result).forEach(function(id) {
	              results.set(id, result[id]);
	              results[id] = result[id];
	            });
	          });
	          if (cb) {
	            window.setTimeout(cb, 0, results);
	          }
	          resolve(results);
	        });
	      });
	    };
	  }
	};

	// Expose public methods.
	module.exports = {
	  shimPeerConnection: edgeShim.shimPeerConnection,
	  shimGetUserMedia: interopDefault(require$$0$2)
	};
	});

	var edge_shim$1 = interopDefault(edge_shim);
	var shimPeerConnection$1 = edge_shim.shimPeerConnection;
	var shimGetUserMedia$1 = edge_shim.shimGetUserMedia;

var require$$2 = Object.freeze({
	  default: edge_shim$1,
	  shimPeerConnection: shimPeerConnection$1,
	  shimGetUserMedia: shimGetUserMedia$1
	});

	var getusermedia$4 = createCommonjsModule(function (module) {
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';

	var logging = interopDefault(require$$0).log;
	var browserDetails = interopDefault(require$$0).browserDetails;

	// Expose public methods.
	module.exports = function() {
	  var shimError_ = function(e) {
	    return {
	      name: {
	        SecurityError: 'NotAllowedError',
	        PermissionDeniedError: 'NotAllowedError'
	      }[e.name] || e.name,
	      message: {
	        'The operation is insecure.': 'The request is not allowed by the ' +
	        'user agent or the platform in the current context.'
	      }[e.message] || e.message,
	      constraint: e.constraint,
	      toString: function() {
	        return this.name + (this.message && ': ') + this.message;
	      }
	    };
	  };

	  // getUserMedia constraints shim.
	  var getUserMedia_ = function(constraints, onSuccess, onError) {
	    var constraintsToFF37_ = function(c) {
	      if (typeof c !== 'object' || c.require) {
	        return c;
	      }
	      var require = [];
	      Object.keys(c).forEach(function(key) {
	        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
	          return;
	        }
	        var r = c[key] = (typeof c[key] === 'object') ?
	            c[key] : {ideal: c[key]};
	        if (r.min !== undefined ||
	            r.max !== undefined || r.exact !== undefined) {
	          require.push(key);
	        }
	        if (r.exact !== undefined) {
	          if (typeof r.exact === 'number') {
	            r. min = r.max = r.exact;
	          } else {
	            c[key] = r.exact;
	          }
	          delete r.exact;
	        }
	        if (r.ideal !== undefined) {
	          c.advanced = c.advanced || [];
	          var oc = {};
	          if (typeof r.ideal === 'number') {
	            oc[key] = {min: r.ideal, max: r.ideal};
	          } else {
	            oc[key] = r.ideal;
	          }
	          c.advanced.push(oc);
	          delete r.ideal;
	          if (!Object.keys(r).length) {
	            delete c[key];
	          }
	        }
	      });
	      if (require.length) {
	        c.require = require;
	      }
	      return c;
	    };
	    constraints = JSON.parse(JSON.stringify(constraints));
	    if (browserDetails.version < 38) {
	      logging('spec: ' + JSON.stringify(constraints));
	      if (constraints.audio) {
	        constraints.audio = constraintsToFF37_(constraints.audio);
	      }
	      if (constraints.video) {
	        constraints.video = constraintsToFF37_(constraints.video);
	      }
	      logging('ff37: ' + JSON.stringify(constraints));
	    }
	    return navigator.mozGetUserMedia(constraints, onSuccess, function(e) {
	      onError(shimError_(e));
	    });
	  };

	  // Returns the result of getUserMedia as a Promise.
	  var getUserMediaPromise_ = function(constraints) {
	    return new Promise(function(resolve, reject) {
	      getUserMedia_(constraints, resolve, reject);
	    });
	  };

	  // Shim for mediaDevices on older versions.
	  if (!navigator.mediaDevices) {
	    navigator.mediaDevices = {getUserMedia: getUserMediaPromise_,
	      addEventListener: function() { },
	      removeEventListener: function() { }
	    };
	  }
	  navigator.mediaDevices.enumerateDevices =
	      navigator.mediaDevices.enumerateDevices || function() {
	        return new Promise(function(resolve) {
	          var infos = [
	            {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
	            {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
	          ];
	          resolve(infos);
	        });
	      };

	  if (browserDetails.version < 41) {
	    // Work around http://bugzil.la/1169665
	    var orgEnumerateDevices =
	        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
	    navigator.mediaDevices.enumerateDevices = function() {
	      return orgEnumerateDevices().then(undefined, function(e) {
	        if (e.name === 'NotFoundError') {
	          return [];
	        }
	        throw e;
	      });
	    };
	  }
	  if (browserDetails.version < 49) {
	    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
	        bind(navigator.mediaDevices);
	    navigator.mediaDevices.getUserMedia = function(c) {
	      return origGetUserMedia(c).catch(function(e) {
	        return Promise.reject(shimError_(e));
	      });
	    };
	  }
	  navigator.getUserMedia = function(constraints, onSuccess, onError) {
	    if (browserDetails.version < 44) {
	      return getUserMedia_(constraints, onSuccess, onError);
	    }
	    // Replace Firefox 44+'s deprecation warning with unprefixed version.
	    console.warn('navigator.getUserMedia has been replaced by ' +
	                 'navigator.mediaDevices.getUserMedia');
	    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
	  };
	};
	});

	var getusermedia$5 = interopDefault(getusermedia$4);


	var require$$0$3 = Object.freeze({
	  default: getusermedia$5
	});

	var firefox_shim = createCommonjsModule(function (module) {
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */
	'use strict';

	var browserDetails = interopDefault(require$$0).browserDetails;

	var firefoxShim = {
	  shimOnTrack: function() {
	    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
	        window.RTCPeerConnection.prototype)) {
	      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
	        get: function() {
	          return this._ontrack;
	        },
	        set: function(f) {
	          if (this._ontrack) {
	            this.removeEventListener('track', this._ontrack);
	            this.removeEventListener('addstream', this._ontrackpoly);
	          }
	          this.addEventListener('track', this._ontrack = f);
	          this.addEventListener('addstream', this._ontrackpoly = function(e) {
	            e.stream.getTracks().forEach(function(track) {
	              var event = new Event('track');
	              event.track = track;
	              event.receiver = {track: track};
	              event.streams = [e.stream];
	              this.dispatchEvent(event);
	            }.bind(this));
	          }.bind(this));
	        }
	      });
	    }
	  },

	  shimSourceObject: function() {
	    // Firefox has supported mozSrcObject since FF22, unprefixed in 42.
	    if (typeof window === 'object') {
	      if (window.HTMLMediaElement &&
	        !('srcObject' in window.HTMLMediaElement.prototype)) {
	        // Shim the srcObject property, once, when HTMLMediaElement is found.
	        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
	          get: function() {
	            return this.mozSrcObject;
	          },
	          set: function(stream) {
	            this.mozSrcObject = stream;
	          }
	        });
	      }
	    }
	  },

	  shimPeerConnection: function() {
	    if (typeof window !== 'object' || !(window.RTCPeerConnection ||
	        window.mozRTCPeerConnection)) {
	      return; // probably media.peerconnection.enabled=false in about:config
	    }
	    // The RTCPeerConnection object.
	    if (!window.RTCPeerConnection) {
	      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
	        if (browserDetails.version < 38) {
	          // .urls is not supported in FF < 38.
	          // create RTCIceServers with a single url.
	          if (pcConfig && pcConfig.iceServers) {
	            var newIceServers = [];
	            for (var i = 0; i < pcConfig.iceServers.length; i++) {
	              var server = pcConfig.iceServers[i];
	              if (server.hasOwnProperty('urls')) {
	                for (var j = 0; j < server.urls.length; j++) {
	                  var newServer = {
	                    url: server.urls[j]
	                  };
	                  if (server.urls[j].indexOf('turn') === 0) {
	                    newServer.username = server.username;
	                    newServer.credential = server.credential;
	                  }
	                  newIceServers.push(newServer);
	                }
	              } else {
	                newIceServers.push(pcConfig.iceServers[i]);
	              }
	            }
	            pcConfig.iceServers = newIceServers;
	          }
	        }
	        return new mozRTCPeerConnection(pcConfig, pcConstraints);
	      };
	      window.RTCPeerConnection.prototype = mozRTCPeerConnection.prototype;

	      // wrap static methods. Currently just generateCertificate.
	      if (mozRTCPeerConnection.generateCertificate) {
	        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
	          get: function() {
	            return mozRTCPeerConnection.generateCertificate;
	          }
	        });
	      }

	      window.RTCSessionDescription = mozRTCSessionDescription;
	      window.RTCIceCandidate = mozRTCIceCandidate;
	    }

	    // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
	    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
	        .forEach(function(method) {
	          var nativeMethod = RTCPeerConnection.prototype[method];
	          RTCPeerConnection.prototype[method] = function() {
	            arguments[0] = new ((method === 'addIceCandidate') ?
	                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
	            return nativeMethod.apply(this, arguments);
	          };
	        });

	    // support for addIceCandidate(null)
	    var nativeAddIceCandidate =
	        RTCPeerConnection.prototype.addIceCandidate;
	    RTCPeerConnection.prototype.addIceCandidate = function() {
	      return arguments[0] === null ? Promise.resolve()
	          : nativeAddIceCandidate.apply(this, arguments);
	    };

	    // shim getStats with maplike support
	    var makeMapStats = function(stats) {
	      var map = new Map();
	      Object.keys(stats).forEach(function(key) {
	        map.set(key, stats[key]);
	        map[key] = stats[key];
	      });
	      return map;
	    };

	    var nativeGetStats = RTCPeerConnection.prototype.getStats;
	    RTCPeerConnection.prototype.getStats = function(selector, onSucc, onErr) {
	      return nativeGetStats.apply(this, [selector || null])
	        .then(function(stats) {
	          return makeMapStats(stats);
	        })
	        .then(onSucc, onErr);
	    };
	  }
	};

	// Expose public methods.
	module.exports = {
	  shimOnTrack: firefoxShim.shimOnTrack,
	  shimSourceObject: firefoxShim.shimSourceObject,
	  shimPeerConnection: firefoxShim.shimPeerConnection,
	  shimGetUserMedia: interopDefault(require$$0$3)
	};
	});

	var firefox_shim$1 = interopDefault(firefox_shim);
	var shimOnTrack$1 = firefox_shim.shimOnTrack;
	var shimSourceObject$1 = firefox_shim.shimSourceObject;
	var shimPeerConnection$2 = firefox_shim.shimPeerConnection;
	var shimGetUserMedia$2 = firefox_shim.shimGetUserMedia;

var require$$1 = Object.freeze({
	  default: firefox_shim$1,
	  shimOnTrack: shimOnTrack$1,
	  shimSourceObject: shimSourceObject$1,
	  shimPeerConnection: shimPeerConnection$2,
	  shimGetUserMedia: shimGetUserMedia$2
	});

	var safari_shim = createCommonjsModule(function (module) {
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	'use strict';
	var safariShim = {
	  // TODO: DrAlex, should be here, double check against LayoutTests
	  // shimOnTrack: function() { },

	  // TODO: once the back-end for the mac port is done, add.
	  // TODO: check for webkitGTK+
	  // shimPeerConnection: function() { },

	  shimGetUserMedia: function() {
	    navigator.getUserMedia = navigator.webkitGetUserMedia;
	  }
	};

	// Expose public methods.
	module.exports = {
	  shimGetUserMedia: safariShim.shimGetUserMedia
	  // TODO
	  // shimOnTrack: safariShim.shimOnTrack,
	  // shimPeerConnection: safariShim.shimPeerConnection
	};
	});

	var safari_shim$1 = interopDefault(safari_shim);
	var shimGetUserMedia$3 = safari_shim.shimGetUserMedia;

var require$$0$4 = Object.freeze({
	  default: safari_shim$1,
	  shimGetUserMedia: shimGetUserMedia$3
	});

	var adapter_core = createCommonjsModule(function (module) {
	/*
	 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
	 *
	 *  Use of this source code is governed by a BSD-style license
	 *  that can be found in the LICENSE file in the root of the source
	 *  tree.
	 */
	 /* eslint-env node */

	'use strict';

	// Shimming starts here.
	(function() {
	  // Utils.
	  var logging = interopDefault(require$$0).log;
	  var browserDetails = interopDefault(require$$0).browserDetails;
	  // Export to the adapter global object visible in the browser.
	  module.exports.browserDetails = browserDetails;
	  module.exports.extractVersion = interopDefault(require$$0).extractVersion;
	  module.exports.disableLog = interopDefault(require$$0).disableLog;

	  // Uncomment the line below if you want logging to occur, including logging
	  // for the switch statement below. Can also be turned on in the browser via
	  // adapter.disableLog(false), but then logging from the switch statement below
	  // will not appear.
	  // require('./utils').disableLog(false);

	  // Browser shims.
	  var chromeShim = interopDefault(require$$3) || null;
	  var edgeShim = interopDefault(require$$2) || null;
	  var firefoxShim = interopDefault(require$$1) || null;
	  var safariShim = interopDefault(require$$0$4) || null;

	  // Shim browser if found.
	  switch (browserDetails.browser) {
	    case 'opera': // fallthrough as it uses chrome shims
	    case 'chrome':
	      if (!chromeShim || !chromeShim.shimPeerConnection) {
	        logging('Chrome shim is not included in this adapter release.');
	        return;
	      }
	      logging('adapter.js shimming chrome.');
	      // Export to the adapter global object visible in the browser.
	      module.exports.browserShim = chromeShim;

	      chromeShim.shimGetUserMedia();
	      chromeShim.shimMediaStream();
	      chromeShim.shimSourceObject();
	      chromeShim.shimPeerConnection();
	      chromeShim.shimOnTrack();
	      break;
	    case 'firefox':
	      if (!firefoxShim || !firefoxShim.shimPeerConnection) {
	        logging('Firefox shim is not included in this adapter release.');
	        return;
	      }
	      logging('adapter.js shimming firefox.');
	      // Export to the adapter global object visible in the browser.
	      module.exports.browserShim = firefoxShim;

	      firefoxShim.shimGetUserMedia();
	      firefoxShim.shimSourceObject();
	      firefoxShim.shimPeerConnection();
	      firefoxShim.shimOnTrack();
	      break;
	    case 'edge':
	      if (!edgeShim || !edgeShim.shimPeerConnection) {
	        logging('MS edge shim is not included in this adapter release.');
	        return;
	      }
	      logging('adapter.js shimming edge.');
	      // Export to the adapter global object visible in the browser.
	      module.exports.browserShim = edgeShim;

	      edgeShim.shimGetUserMedia();
	      edgeShim.shimPeerConnection();
	      break;
	    case 'safari':
	      if (!safariShim) {
	        logging('Safari shim is not included in this adapter release.');
	        return;
	      }
	      logging('adapter.js shimming safari.');
	      // Export to the adapter global object visible in the browser.
	      module.exports.browserShim = safariShim;

	      safariShim.shimGetUserMedia();
	      break;
	    default:
	      logging('Unsupported browser!');
	  }
	})();
	});

	interopDefault(adapter_core);

	var video = document.querySelector('video');
	var canvas$1 = document.getElementById('canvas-camera');
	var context = context = canvas$1.getContext('2d');

	function copyVideoToCanvas() {
	  var width = canvas$1.width;
	  var height = canvas$1.height;

	  context.fillRect(0, 0, width, height);
	  context.drawImage(video, 0, 0, width, height);

	  requestAnimationFrame(copyVideoToCanvas);
	}

	function initCanvas$1() {
	  canvas$1.width = window.innerWidth;
	  canvas$1.height = window.innerHeight - HEADER_HEIGHT;
	}

	function alertUnsupported() {
	  alert('Oh no! Your browser does not appear to have camera support (getUserMedia)' + 'or there was a problem initiating it. Maybe try another browser? =)');
	}

	function initCameraStream() {

	  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
	    alertUnsupported();
	    return;
	  }

	  navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then(function (stream) {

	    var videoTracks = stream.getVideoTracks();

	    console.log('Using video device: ' + videoTracks[0].label);

	    stream.oninactive = function () {
	      console.log('Stream inactive');
	    };

	    video.srcObject = stream;

	    requestAnimationFrame(copyVideoToCanvas);
	  }).catch(function (err) {
	    console.error('getUserMedia error', err);
	    alertUnsupported();
	  });
	}

	function init$1() {
	  initCanvas$1();
	  initCameraStream();
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

	var context$1 = void 0;
	var bufferLoader = void 0;
	var bufferList = null;

	function playCameraSound() {

	  if (!bufferList || bufferList.length < 1) {
	    // Not ready to play yet
	    return false;
	  }

	  var source = context$1.createBufferSource();
	  source.buffer = bufferList[0];
	  source.connect(context$1.destination);
	  source.start(0);

	  return true;
	}

	function init$3() {
	  window.AudioContext = window.AudioContext || window.webkitAudioContext;
	  context$1 = new AudioContext();
	  bufferLoader = new BufferLoader(context$1, ['/sounds/camera.wav'], function (list) {
	    bufferList = list;
	  });
	  bufferLoader.load();
	}

	var homeHeader = document.getElementById('header-home');
	var snapshotHeader = document.getElementById('header-snapshot');
	var backBtn = document.getElementById('btn-back');
	var downloadBtn = document.getElementById('btn-download');
	var cameraCanvas = document.getElementById('canvas-camera');
	var drawingCanvas = document.getElementById('canvas-draw');
	var saveCanvas = document.getElementById('canvas-save');
	var saveImage = document.getElementById('image-save');
	var saveCtx = saveCanvas.getContext('2d');

	function openSnapshot() {

	  playCameraSound();

	  // Copy the other canvases onto a single canvas for saving
	  saveCtx.drawImage(cameraCanvas, 0, 0);
	  saveCtx.drawImage(drawingCanvas, 0, 0);

	  // Add the URL at the bottom
	  saveCtx.fillText('snapw.at', saveCanvas.width - 72, saveCanvas.height - 15);

	  saveImage.src = saveCanvas.toDataURL('image/png');
	  saveImage.style.display = 'block';

	  homeHeader.style.display = 'none';
	  snapshotHeader.style.display = 'block';
	}

	function initSave() {

	  saveCanvas.width = window.innerWidth;
	  saveCanvas.height = window.innerHeight - HEADER_HEIGHT;

	  saveCtx.font = '16px Arial';
	  saveCtx.fillStyle = '#fff';

	  saveImage.width = window.innerWidth;
	  saveImage.height = window.innerHeight - HEADER_HEIGHT;
	}

	function initControls$1() {

	  downloadBtn.addEventListener('click', function () {
	    openSnapshot();
	  });

	  backBtn.addEventListener('click', function () {
	    homeHeader.style.display = 'block';
	    snapshotHeader.style.display = 'none';
	    saveImage.style.display = 'none';
	  });
	}

	function init$2() {
	  initSave();
	  initControls$1();
	}

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

	var hello = hello_all$1;

	var TWITTER_CLIENT_ID = 'bkMmxlirv04KxJtAbWSgekbVM';

	var saveCanvas$1 = document.getElementById('canvas-save');
	var tweetButton = document.getElementById('btn-share-twitter');

	function init$4() {

	  console.log('hello hello.js...');

	  hello.init({
	    twitter: TWITTER_CLIENT_ID
	  }, {
	    redirect_uri: 'http://localhost:8000' //'https://snapw.at/'
	  });

	  var imageDataURI = saveCanvas$1.toDataURL('image/png');
	  var blob = dataURItoBlob(imageDataURI);

	  tweetButton.addEventListener('click', function () {

	    hello('twitter').login().then(function (res) {
	      console.log('Logged into twitter', res);

	      /*
	      hello('twitter')
	        .api('me/share', 'POST', {
	          message: 'hello?'
	        })
	        .then(json => {
	          console.error('Twitter response', json);
	        });
	      */
	    }, function (err) {
	      console.error('Error logging in to Twitter', err);
	    });

	    /*
	    OAuth.callback('twitter')
	      .done((result) => {
	        // token in result.access_token
	        result.post('https://upload.twitter.com/1.1/media/upload.json', {
	          data: {
	            media: blob
	          }
	        })
	        .done((response) => {
	          console.log('Response', response);
	        })
	        .fail((err) => {
	          console.error('Error', err);
	        });
	      })
	      .fail((error) => {
	        console.error('Error', error);  
	      });
	    */
	  });
	}

	SWRegister();
	InputColour();
	init();
	init$1();
	init$2();
	init$3();
	init$4();

}));