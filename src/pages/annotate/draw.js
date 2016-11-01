import {HEADER_HEIGHT} from '../../shared/constants';

// Time to wait before treating single touch events as a separate intention
const RESIZING_TIME_THRESHOLD = 500;
const DEFAULT_EMOJI_SIZE = 100;
const DEFAULT_EMOJI_FONT = DEFAULT_EMOJI_SIZE + 'px arial';

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
let resizeTouchDelta = null;
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

    // TODO allow for emoji to be scaled to different sizes
    const emojiLeft = evt.x,
      emojiRight = evt.x + DEFAULT_EMOJI_SIZE,
      emojiTop = evt.y - DEFAULT_EMOJI_SIZE,
      emojiBottom = evt.y;

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

function clickPosToEmojiPos(coords) {
  return {x: coords.x - DEFAULT_EMOJI_SIZE / 2, y: coords.y + DEFAULT_EMOJI_SIZE / 2};
}

function drawEmoji(emoji, coords) {

  ctx.font = DEFAULT_EMOJI_FONT;
  ctx.fillText(emoji, coords.x, coords.y);

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

    const emojiPos = clickPosToEmojiPos(coords);
    drawEmoji(chosenEmoji, emojiPos);

    drawEvents.push({
      text: chosenEmoji,
      font: ctx.font,
      x: emojiPos.x,
      y: emojiPos.y
    });

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

      if (resizeTouchDelta) {

        evt.width += newResizeTouchDelta.x - resizeTouchDelta.x;
        evt.height += newResizeTouchDelta.y - resizeTouchDelta.y;

        evt.x = (coords1.x + coords2.x) / 2 - evt.width / 2;
        evt.y = (coords1.y + coords2.y) / 2 - evt.height / 2;

        isResizing = true;

        if (resizingTimeout) {
          clearTimeout(resizingTimeout);
        }

        resizingTimeout = setTimeout(() => {
          isResizing = false;
        }, RESIZING_TIME_THRESHOLD);

        redrawOnNextFrame();

      }

      resizeTouchDelta = newResizeTouchDelta;

    } else if (!isResizing) {

      // Update emoji position

      evt.x = coords1.x - DEFAULT_EMOJI_SIZE / 2;
      evt.y = coords1.y + DEFAULT_EMOJI_SIZE / 2;

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
  resizeTouchDelta = null;
}

function onEmojiClick(event) {

  chosenEmoji = event.currentTarget.innerText;

  emojiModal.classList.remove('show');

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
      drawEmoji(evt.text, {x: evt.x, y: evt.y});

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
    if (emojiModal.classList.contains('show')) {
      emojiModal.classList.remove('show');
    } else {
      emojiModal.classList.add('show');
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
