import {HEADER_HEIGHT} from './constants';

let canvas = document.getElementById('canvas-draw');
let ctx = ctx = canvas.getContext('2d');
let colourInput = document.getElementById('input-colour');
let trashButton = document.getElementById('btn-trash');
let emojiButton = document.getElementById('btn-emoji');
let emojiButtonImage = document.getElementById('btn-emoji-img');
let emojiModal = document.getElementById('modal-emoji');
let chosenEmoji = null;

let isDrawing = false;

// Store drawing events (lines and emojis) for redrawing
let drawEvents = [];


function onTouchStartOrMouseDown(e) {

  let touch = e.changedTouches ? e.changedTouches[0] : null;
  let coords = touch ? {x: touch.pageX, y: touch.pageY} : {x: e.clientX, y: e.clientY};

  if (chosenEmoji) {

    // Increase the default SVG size
    const width = chosenEmoji.width * 1.5;
    const height = chosenEmoji.height * 1.5;

    const x = coords.x - width / 2;
    const y = coords.y - height / 2 - HEADER_HEIGHT;

    ctx.drawImage(chosenEmoji, x, y, width, height);

    drawEvents.push({
      image: chosenEmoji,
      x: x,
      y: y,
      width: width,
      height: height
    })

  } else {

    const x = coords.x;
    const y = coords.y - HEADER_HEIGHT;

    ctx.beginPath();
    ctx.moveTo(x, y);

    isDrawing = true;

    drawEvents.push({
      begin: true,
      x: x,
      y: y
    });

  }
}

function onTouchMoveOrMouseMove(e) {

  e.preventDefault();

  if (isDrawing) {

    let touch = e.changedTouches ? e.changedTouches[0] : null;
    let coords = touch ? {x: touch.pageX, y: touch.pageY} : {x: e.clientX, y: e.clientY};

    ctx.lineTo(coords.x, coords.y - HEADER_HEIGHT);
    ctx.stroke();

    drawEvents.push({
      stokeStyle: ctx.strokeStyle,
      x: coords.x,
      y: coords.y - HEADER_HEIGHT
    });
  }
}

function onTouchEndOrMouseUp() {
  isDrawing = false;
}

function onEmojiClick(event) {

  chosenEmoji = event.currentTarget;

  emojiModal.style.display = 'none';
  emojiButtonImage.src = chosenEmoji.src;

  emojiButton.classList.add('selected');
  colourInput.classList.remove('selected');

}

function redraw() {

  for (let i=0; i < drawEvents.length; i++) {

    let evt = drawEvents[i];

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

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
}

function initControls() {

  colourInput.addEventListener('input', () => {
    // New colour chosen
    ctx.strokeStyle = colourInput.value;
    chosenEmoji = null;
    colourInput.classList.add('selected');
    emojiButton.classList.remove('selected');
  });

  // Add click handlers to emojis so you can select one
  let emojis = document.querySelectorAll('#modal-emoji img');
  for (let i=0; i < emojis.length; i++) {
    let emoji = emojis[i];
    emoji.addEventListener('click', onEmojiClick);
  }

  emojiButton.addEventListener('click', () => {
    // Toggle emoji selector modal dialog
    if (emojiModal.style.display !== 'block') {
      emojiModal.style.display = 'block';
    } else {
      emojiModal.style.display = 'none';
    }

  });

  trashButton.addEventListener('click', () => {
    // Could do with a confirmation prompt!
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  })

}

export default function() {
  initCanvas();
  initControls();
}
