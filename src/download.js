import {HEADER_HEIGHT} from './constants';

let downloadBtn = null;
let cameraCanvas = null;
let drawingCanvas = null;
let saveCanvas = null;
let saveContext = null;

function download() {

  saveContext = saveCanvas.getContext('2d');
  saveContext.drawImage(drawingCanvas, 0, 0);

  /*
  let link = document.createElement('a');
  link.download = 'snapwat-snapshot.png';
  
  let tempHref = 'data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7';

  link.href = tempHref; //saveCanvas.toDataURL('image/png'); //.replace('image/png', 'image/octet-stream');
  link.click();
  link.href = '';
  link.download = '';
  */

  /*
  if (!localStorage || !localStorage.setItem) {
    console.log('Local storage not available');
    return;
  }

  localStorage.setItem('snapshot', saveCanvas.toDataURL('image/png'));

  console.log('Stored in local storage', localStorage.getItem('snapshot'));
  */

  const imageBlob = saveCanvas.toDataURL('image/png');

  let link = document.createElement('a');
  link.download = 'snapshot.png';
  link.href = `/snapshot/${imageBlob}`;
  link.click();
  link.remove();

}

function init() {

  cameraCanvas = document.getElementById('canvas-camera');
  drawingCanvas = document.getElementById('canvas-draw');
  saveCanvas = document.getElementById('canvas-save');

  saveCanvas.width  = window.innerWidth;
  saveCanvas.height = window.innerHeight - HEADER_HEIGHT;

  downloadBtn = document.getElementById('download');

  downloadBtn.addEventListener('click', () => {
    download();
  });

}

export default init;