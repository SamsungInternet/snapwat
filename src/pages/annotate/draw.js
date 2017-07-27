import {HEADER_HEIGHT} from '../../shared/constants';

// Time to wait before treating single touch events as a separate intention
const RESIZING_TIME_THRESHOLD = 500;
const DEFAULT_COLOUR = '#000000';
const DEFAULT_EMOJI_SIZE = 120;
const DEFAULT_EMOJI_FONT = 'arial';
const DEFAULT_LINE_WIDTH = 2;

const TOOL_PENCIL = 0;
const TOOL_BRUSH = 1;
const TOOL_EMOJI = 2;

let canvas = document.getElementById('canvas-draw');
let ctx = ctx = canvas.getContext('2d');

let chosenTool = TOOL_PENCIL;
let toolsMenuButton = document.getElementById('btn-tools');
let toolsModal = document.getElementById('modal-tools');
let pencilButton = document.getElementById('btn-pencil');
let brushButton = document.getElementById('btn-brush');
let emojiMenuButton = document.getElementById('btn-emoji');
let emojiModal = document.getElementById('modal-emoji');
let optionsMenuButton = document.getElementById('btn-options');
let optionsModal = document.getElementById('modal-options');
let colourInputContainer = document.getElementById('input-colour-container');
let colourInput = document.getElementById('input-colour');
let sizeInput = document.getElementById('input-size');
let sizeOutput = document.getElementById('size-output');
let trashButton = document.getElementById('btn-trash');

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

  ctx.font = Math.round(scale * DEFAULT_EMOJI_SIZE) + 'px ' + DEFAULT_EMOJI_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
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

function closeModals() {
  optionsModal.classList.remove('show');
  toolsModal.classList.remove('show');
  emojiModal.classList.remove('show');
}

function onTouchStartOrMouseDown(e) {

  e.preventDefault();

  closeModals();

  let touch = e.changedTouches && e.changedTouches.length ?
    e.changedTouches[0] : null;

  let coords = touch ? {x: touch.pageX - canvas.offsetLeft, y: touch.pageY - canvas.offsetTop - HEADER_HEIGHT} :
    {x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop - HEADER_HEIGHT};

  touchedEmojiIndex = indexOfSelectedEmoji(coords);

  if (touchedEmojiIndex > -1) {
    // Selected an existing emoji - fall through
    return;
  }

  if (chosenTool === TOOL_EMOJI) {

    // Add new emoji

    drawEvents.push({
      text: chosenEmoji,
      font: ctx.font,
      x: coords.x,
      y: coords.y,
      scale: 1
    });

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

      } else {

        // Seems to disappear when font size gets too big?! Limit to 1.75x for now.
        evt.scale = Math.min(1.75, newResizeTouchDelta.x / origResizeTouchDelta.x);

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
      lineWidth: ctx.lineWidth,
      tool: chosenTool,
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

function highlightSelectedTool(selectedButton) {
  var toolButtons = toolsModal.getElementsByTagName('button');
  for (var i=0; i < toolButtons.length; i++) {
    var button = toolButtons[i];
    if (button === selectedButton) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  }
}

function onEmojiClick(event) {

  chosenTool = TOOL_EMOJI;
  chosenEmoji = event.currentTarget.innerText;

  emojiModal.classList.remove('show');

  // NB. It would be nice to update the emoji to show the selected one,
  // but the emojis are actual characters now, so might be tricky styling-wise
  highlightSelectedTool(emojiMenuButton);

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
      ctx.lineWidth = evt.lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowBlur = ctx.tool === TOOL_BRUSH ? evt.lineWidth * 2 : 0;
      console.log('shadowBlur', ctx.shadowBlur);
      ctx.shadowColor = evt.strokeStyle;
      ctx.lineTo(evt.x, evt.y);
      ctx.stroke();
    }

  }

  isRedrawing = false;

}

function onColourClickOrChange() {
  updateCanvasContext();
  colourInputContainer.classList.add('selected');
  emojiMenuButton.classList.remove('selected');
}

function onSizeChange(event) {
  updateCanvasContext();
  sizeOutput.innerHTML = event.target.value;
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

  ctx.strokeStyle = DEFAULT_COLOUR;
  ctx.lineWidth = DEFAULT_LINE_WIDTH;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = DEFAULT_COLOUR;
}

function updateCanvasContext() {
  ctx.strokeStyle = colourInput.value;
  ctx.lineWidth = sizeInput.value;
  ctx.shadowBlur = chosenTool === TOOL_BRUSH ? 2 : 0;
  console.log('shadowBlur', ctx.shadowBlur);
  ctx.shadowColor = colourInput.value;
}

function initControls() {

  toolsMenuButton.addEventListener('click', () => {
    toolsModal.classList.toggle('show');
    emojiModal.classList.remove('show');
    optionsModal.classList.remove('show');
  });

  // Add click handlers to emojis so you can select one
  let emojis = document.querySelectorAll('#modal-emoji button');
  for (let i=0; i < emojis.length; i++) {
    let emoji = emojis[i];
    emoji.addEventListener('click', onEmojiClick);
  }

  emojiMenuButton.addEventListener('click', () => {
    emojiModal.classList.toggle('show');
    toolsModal.classList.toggle('show');
  });

  pencilButton.addEventListener('click', () => {
    chosenTool = TOOL_PENCIL;
    updateCanvasContext();
    toolsModal.classList.remove('show');
    highlightSelectedTool(pencilButton);
  });

  brushButton.addEventListener('click', () => {
    chosenTool = TOOL_BRUSH;
    updateCanvasContext();
    toolsModal.classList.remove('show');
    highlightSelectedTool(brushButton);
  });

  optionsMenuButton.addEventListener('click', () => {
    optionsModal.classList.toggle('show');
    toolsModal.classList.remove('show');
    emojiModal.classList.remove('show');
  });

  colourInput.addEventListener('input', onColourClickOrChange);
  colourInput.addEventListener('click', onColourClickOrChange);

  sizeInput.addEventListener('change', onSizeChange);
  sizeInput.value = DEFAULT_LINE_WIDTH;
  sizeOutput.innerHTML = DEFAULT_LINE_WIDTH;

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
