import emojiImages from '\0emoji-images';
import {HEADER_HEIGHT} from '../../shared/constants';

// Time to wait before treating single touch events as a separate intention
const RESIZING_TIME_THRESHOLD = 500;

let canvas = document.getElementById('canvas-draw');
let ctx = ctx = canvas.getContext('2d');
let colourInputContainer = document.getElementById('input-colour-container');
let colourInput = document.getElementById('input-colour');
let trashButton = document.getElementById('btn-trash');
let emojiButton = document.getElementById('btn-emoji');
let emojiButtonImage = document.getElementById('btn-emoji-img');
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

    if (!evt.image) {
      continue;
    }

    if (coords.x >= evt.x && coords.x <= evt.x + evt.width &&
        coords.y >= evt.y && coords.y <= evt.y + evt.height) {
      return i;
    }

  }

  return -1;

}

function stampEmoji(coords) {

  // Increase the default SVG size
  const width = chosenEmoji.width * 2;
  const height = chosenEmoji.height * 2;

  // Centre the image around where we have tapped/clicked
  const x = coords.x - width / 2;
  const y = coords.y - height / 2;

  ctx.drawImage(chosenEmoji, x, y, width, height);

  drawEvents.push({
    image: chosenEmoji,
    x: x,
    y: y,
    width: width,
    height: height
  });

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


  let touch = e.changedTouches && e.changedTouches.length ?
    e.changedTouches[0] : null;

  let coords = touch ? { x: touch.pageX, y: touch.pageY - HEADER_HEIGHT } :
  {x: e.clientX, y: e.clientY - HEADER_HEIGHT};

  touchedEmojiIndex = indexOfSelectedEmoji(coords);

  if (touchedEmojiIndex > -1) {
    // Selected an existing emoji - fall through
    return;
  }

  if (chosenEmoji) {
    stampEmoji(coords);
  } else {
    onDrawingMouseDown(coords);
  }

}

function onTouchMoveOrMouseMove(e) {

  e.preventDefault();

  let touches = e.changedTouches || [];
  let touch1 = touches.length ? touches[0] : null;
  let touch2 = touches.length > 1 ? touches[1] : null;

  let coords1 = touch1 ? {x: touch1.pageX, y: touch1.pageY - HEADER_HEIGHT} :
    {x: e.clientX, y: e.clientY - HEADER_HEIGHT};

  if (touchedEmojiIndex >= 0) {

    let evt = drawEvents[touchedEmojiIndex];

    if (touch2) {

      // Resize emoji

      let coords2 = {x: touch2.pageX, y: touch2.pageY - HEADER_HEIGHT};
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

      evt.x = coords1.x - evt.width / 2;
      evt.y = coords1.y - evt.height / 2;

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

function onTouchEndOrMouseUp() {
  isDrawing = false;
  touchedEmojiIndex = -1;
  resizeTouchDelta = null;
}

function onEmojiClick(event) {

  chosenEmoji = event.currentTarget;

  emojiModal.style.display = 'none';
  emojiButtonImage.src = chosenEmoji.src;

  emojiButton.classList.add('selected');
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

  isRedrawing = false;

}

function onColourClickOrChange() {
  ctx.strokeStyle = colourInput.value;
  chosenEmoji = null;
  colourInputContainer.classList.add('selected');
  emojiButton.classList.remove('selected');
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
    drawEvents = [];
    redraw();
  })

}

function initEmojis() {

  let html = '';

  for (let i=0; i < emojiImages.length; i++) {
    const path = emojiImages[i];
    html += `<img src="${path}" alt="Emoji"/>`;
  }

  emojiModal.innerHTML = html;

}

export default function init() {
  initCanvas();
  initEmojis();
  initControls();
}
