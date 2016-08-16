import {HEADER_HEIGHT} from './constants';

let downloadBtn = null;
let cameraCanvas = null;
let drawingCanvas = null;
let saveCanvas = null;
let saveContext = null;

function openSnapshot() {

  saveContext = saveCanvas.getContext('2d');
  saveContext.drawImage(cameraCanvas, 0, 0);
  saveContext.drawImage(drawingCanvas, 0, 0);

  // Yeah I don't like this either, but unfortunately we can't download data URIs
  // on Samsung Internet. Also, going via a Service Worker doesn't work due to:
  // https://bugs.chromium.org/p/chromium/issues/detail?id=468227
  window.open(saveCanvas.toDataURL('image/png'), '_blank');

}

function initCanvases() {

  cameraCanvas = document.getElementById('canvas-camera');
  drawingCanvas = document.getElementById('canvas-draw');
  saveCanvas = document.getElementById('canvas-save');

  saveCanvas.width  = window.innerWidth;
  saveCanvas.height = window.innerHeight - HEADER_HEIGHT;
}

function initButton() {
  
  downloadBtn = document.getElementById('btn-download');

  downloadBtn.addEventListener('click', () => {
    openSnapshot();
  });
}

export default function() {

  initCanvases();
  initButton();

}
