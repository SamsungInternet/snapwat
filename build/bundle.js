(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, function () { 'use strict';

  var Foo = {
    doSomething: function doSomething() {
      console.log('Done!');
    }
  };

  console.log('hello');

  Foo.doSomething();

}));