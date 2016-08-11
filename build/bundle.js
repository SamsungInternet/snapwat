(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, function () { 'use strict';

  var HEADER_HEIGHT = 72;

  console.log('header height', HEADER_HEIGHT);

  var canvas = null;
  var ctx = null;
  var drawing = false;

  function initCanvas() {
    canvas = document.getElementById('canvas-draw');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - HEADER_HEIGHT;

    canvas.addEventListener('touchstart', onTouchStartOrMouseDown, false);
    canvas.addEventListener('touchmove', onTouchMoveOrMouseMove, false);
    canvas.addEventListener('touchend', onTouchEndOrMouseUp, false);

    canvas.addEventListener('mousedown', onTouchStartOrMouseDown, false);
    canvas.addEventListener('mousemove', onTouchMoveOrMouseMove, false);
    canvas.addEventListener('mouseup', onTouchEndOrMouseUp, false);
  }

  function initDrawingContext() {
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
  }

  function init() {
    initCanvas();
    initDrawingContext();
  }

  function onTouchStartOrMouseDown(e) {
    ctx.beginPath();
    var touch = e.changedTouches ? e.changedTouches[0] : null;
    var coords = touch ? { x: touch.pageX, y: touch.pageY } : { x: e.clientX, y: e.clientY };
    ctx.moveTo(coords.x, coords.y - HEADER_HEIGHT);
    drawing = true;
  }

  function onTouchMoveOrMouseMove(e) {
    if (drawing) {
      e.preventDefault();
      var touch = e.changedTouches ? e.changedTouches[0] : null;
      var coords = touch ? { x: touch.pageX, y: touch.pageY } : { x: e.clientX, y: e.clientY };
      ctx.lineTo(coords.x, coords.y - HEADER_HEIGHT);
      ctx.stroke();
    }
  }

  function onTouchEndOrMouseUp() {
    drawing = false;
  }

  var video = null;
  var canvas$1 = null;
  var context = null;

  function init$1() {

    video = document.querySelector('video');

    canvas$1 = document.getElementById('canvas-camera');
    canvas$1.width = window.innerWidth;
    canvas$1.height = window.innerHeight - HEADER_HEIGHT;

    context = canvas$1.getContext('2d');

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    if (!navigator.getUserMedia) {
      console.log('Get user media not supported');
      return false;
    }

    navigator.getUserMedia({ audio: false, video: { facingMode: 'user' } }, function (mediaStream) {
      video.srcObject = mediaStream;

      // Every 33ms copy video to canvas (30 FPS). Is there a smarter way to do this...?
      setInterval(function () {

        if (video.paused || video.ended) {
          return;
        }

        var width = canvas$1.width;
        var height = canvas$1.height;

        context.fillRect(0, 0, width, height);
        context.drawImage(video, 0, 0, width, height);
      }, 33);
    }, function (err) {
      console.error('Unable to get user media', err);
    });
  }

  init();
  init$1();

}));