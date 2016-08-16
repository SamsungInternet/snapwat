import {HEADER_HEIGHT} from './constants';

let canvas = null;
let ctx = null;
let drawing = false;
let colourInput = null;
let emojiButton = null;
let emojiModal = null;
let chosenEmoji = null;

function onTouchStartOrMouseDown(e) {

  let touch = e.changedTouches ? e.changedTouches[0] : null;
  let coords = touch ? {x: touch.pageX, y: touch.pageY} : {x: e.clientX, y: e.clientY};

  if (chosenEmoji) {

    // Increase the default SVG size
    const width = chosenEmoji.width * 1.5;
    const height = chosenEmoji.height * 1.5;

    ctx.drawImage(chosenEmoji, 
      coords.x - width / 2, 
      coords.y - height / 2 - HEADER_HEIGHT,
      width,
      height);

  } else {
    ctx.beginPath();  
    ctx.moveTo(coords.x, coords.y - HEADER_HEIGHT);
    drawing = true;
  }
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

function onEmojiClick(event) {
  console.log('chosen emoji', event.currentTarget);
  chosenEmoji = event.currentTarget;
  emojiModal.style.display = 'none';  
}

function initControls() {

  colourInput = document.getElementById('input-colour');
  colourInput.addEventListener('input', () => {
    console.log('new colour', colourInput.value);
    ctx.strokeStyle = colourInput.value;
    chosenEmoji = null;
  });

  emojiModal = document.getElementById('modal-emoji');
  let emojis = document.querySelectorAll('#modal-emoji img');
  for (let i=0; i < emojis.length; i++) {
    let emoji = emojis[i];
    emoji.addEventListener('click', onEmojiClick);
  }

  emojiButton = document.getElementById('btn-emoji');
  emojiButton.addEventListener('click', () => {
    emojiModal.style.display = 'block';
  });

}

export default function() {
  initCanvas();
  initDrawingContext();
  initControls();
}
