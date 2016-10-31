import {HEADER_HEIGHT} from '../../shared/constants';

// Time to wait before treating single touch events as a separate intention
const RESIZING_TIME_THRESHOLD = 500;
const DEFAULT_EMOJI_SIZE = 120;
const DEFAULT_EMOJI_FONT = 'arial';

let canvas = document.getElementById('canvas-draw');
let ctx = ctx = canvas.getContext('2d');
let colourInputContainer = document.getElementById('input-colour-container');
let colourInput = document.getElementById('input-colour');
let trashButton = document.getElementById('btn-trash');
let emojiMenuButton = document.getElementById('btn-emoji');
let emojiMenuButtonImage = document.getElementById('btn-emoji-img');
let emojiModal = document.getElementById('modal-emoji');
let touchedEmojiIndex = -1;
let chosenEmoji = null;
let origResizeTouchDelta = null;
let resizingTimeout = null;
let isDrawing = false;
let isRedrawing = false;
let isResizing = false;

// Store drawing events (lines and emojis) for redrawing
let drawEvents = [];

/**
 * Returns index of touched emoji in the drawEvents, or -1 if none touched.
 */
function indexOfSelectedEmoji(coords) {

  for (let i=0; i < drawEvents.length; i++) {

    let evt = drawEvents[i];

    if (typeof evt.text === 'undefined') {
      continue;
    }

    // Presume it's centred around event x and y - handled by drawEmoji function
    const emojiLeft = evt.x - (DEFAULT_EMOJI_SIZE * evt.scale) / 2,
      emojiRight = evt.x + (DEFAULT_EMOJI_SIZE * evt.scale) / 2,
      emojiTop = evt.y - (DEFAULT_EMOJI_SIZE * evt.scale) / 2,
      emojiBottom = evt.y + (DEFAULT_EMOJI_SIZE * evt.scale) / 2;

    // DEBUGGING
    //ctx.strokeRect(emojiLeft, emojiTop, emojiRight-emojiLeft, emojiBottom-emojiTop);

    if (coords.x >= emojiLeft &&
        coords.x <= emojiRight &&
        coords.y >= emojiTop &&
        coords.y <= emojiBottom) {
      return i;
    }

  }

  return -1;

}

function drawEmoji(emoji, coords, scale = 1) {

  console.log('Draw emoji', coords, scale);

  ctx.font = Math.round(scale * DEFAULT_EMOJI_SIZE) + 'px ' + DEFAULT_EMOJI_FONT;

  console.log('Font', ctx.font);

  // ctx.scale(scaleX, scaleY);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, coords.x, coords.y);
  // ctx.scale(1/scaleX, 1/scaleY);

}

function onDrawingMouseDown(coords) {

  const x = coords.x;
  const y = coords.y;

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

  e.preventDefault();

  let touch = e.changedTouches && e.changedTouches.length ?
    e.changedTouches[0] : null;

  let coords = touch ? {x: touch.pageX - canvas.offsetLeft, y: touch.pageY - canvas.offsetTop - HEADER_HEIGHT} :
    {x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop - HEADER_HEIGHT};

  touchedEmojiIndex = indexOfSelectedEmoji(coords);

  if (touchedEmojiIndex > -1) {
    // Selected an existing emoji - fall through
    return;
  }

  if (chosenEmoji) {

    // Add new emoji

    drawEvents.push({
      text: chosenEmoji,
      font: ctx.font,
      x: coords.x,
      y: coords.y,
      scale: 1
    });

    //const emojiPos = clickPosToEmojiPos(coords);
    drawEmoji(chosenEmoji, coords);

  } else {
    onDrawingMouseDown(coords);
  }

}

function onTouchMoveOrMouseMove(e) {

  e.preventDefault();

  let touches = e.changedTouches || [];
  let touch1 = touches.length ? touches[0] : null;
  let touch2 = touches.length > 1 ? touches[1] : null;

  let coords1 = touch1 ? {x: touch1.pageX - canvas.offsetLeft, y: touch1.pageY - canvas.offsetTop - HEADER_HEIGHT} :
    {x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop - HEADER_HEIGHT};

  if (touchedEmojiIndex >= 0) {

    let evt = drawEvents[touchedEmojiIndex];

    if (touch2) {

      // Resize emoji

      let coords2 = {x: touch2.pageX - canvas.offsetLeft, y: touch2.pageY - canvas.offsetTop - HEADER_HEIGHT};
      let newResizeTouchDelta = {x: Math.abs(coords2.x - coords1.x),
        y: Math.abs(coords2.y - coords1.y)};

      if (!origResizeTouchDelta) {

        origResizeTouchDelta = newResizeTouchDelta;

        console.log('origResizeTouchDelta', origResizeTouchDelta);

      } else {

        // Seems to disappear when font size gets too big?! Limit to 1.75x for now.
        evt.scale = Math.min(1.75, newResizeTouchDelta.x / origResizeTouchDelta.x);

        console.log('newResizeTouchDelta', newResizeTouchDelta);
        console.log('scale', evt.scale);

        isResizing = true;

        if (resizingTimeout) {
          clearTimeout(resizingTimeout);
        }

        resizingTimeout = setTimeout(() => {
          isResizing = false;
        }, RESIZING_TIME_THRESHOLD);

        redrawOnNextFrame();

      }

    } else if (!isResizing) {

      console.log('Move emoji - not resizing', coords1);

      // Single touch - moving the emoji - update its position
      evt.x = coords1.x;
      evt.y = coords1.y;

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

function onTouchEndOrMouseUp(e) {
  isDrawing = false;
  touchedEmojiIndex = -1;
  origResizeTouchDelta = null;
}

function onEmojiClick(event) {

  chosenEmoji = event.currentTarget.innerText;

  emojiModal.style.display = 'none';
  // TODO display selected emoji?
  //emojiMenuButtonImage.src = chosenEmoji.src;

  emojiMenuButton.classList.add('selected');
  colourInputContainer.classList.remove('selected');

}

function redrawOnNextFrame() {
  if (!isRedrawing) {
    isRedrawing = true;
    requestAnimationFrame(redraw);
  }
}

function redraw() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i=0; i < drawEvents.length; i++) {

    let evt = drawEvents[i];

    if (typeof evt.text !== 'undefined') {
      drawEmoji(evt.text, {x: evt.x, y: evt.y}, evt.scale);

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
  colourInputContainer.classList.add('selected');
  emojiMenuButton.classList.remove('selected');
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

  colourInput.addEventListener('input', onColourClickOrChange);
  colourInput.addEventListener('click', onColourClickOrChange);

  // Add click handlers to emojis so you can select one
  let emojis = document.querySelectorAll('#modal-emoji button');
  for (let i=0; i < emojis.length; i++) {
    let emoji = emojis[i];
    emoji.addEventListener('click', onEmojiClick);
  }

  emojiMenuButton.addEventListener('click', () => {
    // Toggle emoji selector modal dialog
    if (emojiModal.style.display !== 'block') {
      emojiModal.style.display = 'block';
    } else {
      emojiModal.style.display = 'none';
    }

  });

  trashButton.addEventListener('click', () => {
    // Could do with a confirmation prompt!
    drawEvents = [];
    redraw();
  })

}

export default function init() {
  initCanvas();
  initControls();
}
