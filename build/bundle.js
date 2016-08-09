(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, function () { 'use strict';

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var HEADER_HEIGHT = 67;
  var canvas = null;
  var ctx = null;

  var Draw = function () {
    function Draw() {
      classCallCheck(this, Draw);
    }

    createClass(Draw, [{
      key: 'init',
      value: function init() {

        canvas = document.getElementById('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - HEADER_HEIGHT;
        canvas.addEventListener('touchstart', this.onTouchStart, false);
        canvas.addEventListener('touchmove', this.onTouchMove, false);

        ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
      }
    }, {
      key: 'onTouchStart',
      value: function onTouchStart(e) {
        ctx.beginPath();
        var touch = e.changedTouches[0];
        var x = touch.pageX;
        var y = touch.pageY - HEADER_HEIGHT;
        ctx.moveTo(x, y);
      }
    }, {
      key: 'onTouchMove',
      value: function onTouchMove(e) {
        e.preventDefault();
        var touch = e.changedTouches[0];
        var x = touch.pageX;
        var y = touch.pageY - HEADER_HEIGHT;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }]);
    return Draw;
  }();

  var Draw$1 = new Draw();

  Draw$1.init();

}));