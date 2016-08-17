import {HEADER_HEIGHT} from './constants';

let downloadBtn = document.getElementById('btn-download');
let cameraCanvas = document.getElementById('canvas-camera');
let drawingCanvas = document.getElementById('canvas-draw');
let saveCanvas = document.getElementById('canvas-save');
let saveCtx = saveCanvas.getContext('2d');
let saveLink = document.createElement('a');
  

function openSnapshot() {

  // Copy the other canvases onto a single canvas for saving
  saveCtx.drawImage(cameraCanvas, 0, 0);
  saveCtx.drawImage(drawingCanvas, 0, 0);

  saveLink.download = "snapwat.png";
  saveLink.href = saveCanvas.toDataURL('image/png');
  saveLink.click();
  saveLink.href = '';

  // Also load the image up in a new tab so the user can download manually if they need to... 
  // Yeah I don't like this either, but unfortunately we can't download data URIs automatically 
  // on Samsung Internet. Also, going via a Service Worker (so we can use an http/https URL) 
  // doesn't work due to: https://bugs.chromium.org/p/chromium/issues/detail?id=468227
  window.open(saveCanvas.toDataURL('image/png'), '_blank');

}

/**
 * The 'save' canvas is HEADER_HEIGHT longer than the other canvases.
 * This is so we can take up the whole browser height and add the snapwat logo.
 */
function initSaveCanvas() {
  
  saveCanvas.width  = window.innerWidth;
  saveCanvas.height = window.innerHeight;

  saveCtx.fillStyle = '#75448c';
  saveCtx.fillRect(0, cameraCanvas.height, saveCanvas.width, HEADER_HEIGHT);

  let logo = new Image();
  logo.src = 'images/logo-transparent.png';
  logo.onload = function() {
    //saveCtx.imageSmoothingEnabled = true;
    saveCtx.drawImage(logo, 20, saveCanvas.height - 60, 40, 40);
  };

  saveCtx.font = '25px Arial';
  saveCtx.fillStyle = '#fff';
  saveCtx.fillText('snapwat', saveCanvas.width - 110, saveCanvas.height - 28);

}

function initButton() {
  downloadBtn.addEventListener('click', () => {
    openSnapshot();
  });
}

export default function() {

  initSaveCanvas();
  initButton();

}
