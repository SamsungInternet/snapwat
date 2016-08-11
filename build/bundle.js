(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, function () { 'use strict';

  var HEADER_HEIGHT = 72;
  var canvas = null;
  var ctx = null;
  var drawing = false;

  function initCanvas() {
    canvas = document.getElementById('canvas');

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

  init();

}));