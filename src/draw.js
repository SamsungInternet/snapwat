import {HEADER_HEIGHT} from './constants';

let canvas = document.getElementById('canvas-draw');
let ctx = ctx = canvas.getContext('2d');
let colourInput = document.getElementById('input-colour');
let emojiButton = document.getElementById('btn-emoji');
let emojiButtonImage = document.getElementById('btn-emoji-img');
let emojiModal = document.getElementById('modal-emoji');
let chosenEmoji = null;

let isDrawing = false;

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
    isDrawing = true;
  }
}

function onTouchMoveOrMouseMove(e) {

  e.preventDefault();

  if (isDrawing) {
    let touch = e.changedTouches ? e.changedTouches[0] : null;
    let coords = touch ? {x: touch.pageX, y: touch.pageY} : {x: e.clientX, y: e.clientY};
    ctx.lineTo(coords.x, coords.y - HEADER_HEIGHT);
    ctx.stroke();
  }
}

function onTouchEndOrMouseUp() {
  isDrawing = false;
}

function onEmojiClick(event) {
  console.log('chosen emoji', event.currentTarget);
  chosenEmoji = event.currentTarget;
  emojiModal.style.display = 'none';
  emojiButtonImage.src = chosenEmoji.src;  
}

function initCanvas() {
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
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
}

function initControls() {

  colourInput.addEventListener('input', () => {
    console.log('new colour', colourInput.value);
    ctx.strokeStyle = colourInput.value;
    chosenEmoji = null;
  });
 
  let emojis = document.querySelectorAll('#modal-emoji img');
  for (let i=0; i < emojis.length; i++) {
    let emoji = emojis[i];
    emoji.addEventListener('click', onEmojiClick);
  }
  
  emojiButton.addEventListener('click', () => {
    emojiModal.style.display = 'block';
  });

}

export default function() {
  initCanvas();
  initDrawingContext();
  initControls();
}
