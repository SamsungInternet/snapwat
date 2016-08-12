import {HEADER_HEIGHT} from './constants';

console.log('header height', HEADER_HEIGHT);

let canvas = null;
let ctx = null;
let drawing = false;
let colourInput = null;

function initCanvas() {
  canvas = document.getElementById('canvas-draw');

  canvas.width  = window.innerWidth;
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
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
}

function initControls() {
  colourInput = document.getElementById('colour');
  colourInput.addEventListener('input', () => {
    console.log('new colour', colourInput.value);
    ctx.strokeStyle = colourInput.value;
  });
}

function init() {
  initCanvas();
  initDrawingContext();
  initControls();
}

function onTouchStartOrMouseDown(e) {
  ctx.beginPath();
  let touch = e.changedTouches ? e.changedTouches[0] : null;
  let coords = touch ? {x: touch.pageX, y: touch.pageY} : {x: e.clientX, y: e.clientY};
  ctx.moveTo(coords.x, coords.y - HEADER_HEIGHT);
  drawing = true;
}

function onTouchMoveOrMouseMove(e) {
  if (drawing) {
    e.preventDefault();
    let touch = e.changedTouches ? e.changedTouches[0] : null;
    let coords = touch ? {x: touch.pageX, y: touch.pageY} : {x: e.clientX, y: e.clientY};
    ctx.lineTo(coords.x, coords.y - HEADER_HEIGHT);
    ctx.stroke();
  }
}

function onTouchEndOrMouseUp() {
  drawing = false;
}

export default init;
