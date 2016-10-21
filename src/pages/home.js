import {PAGES, HEADER_HEIGHT} from '../shared/constants';
import {showPage, } from '../shared/helpers';
import AnnotatePage from './annotate';
import AboutPage from './about';
import LoadImage from 'blueimp-load-image';

const PAGE_NAME = PAGES.HOME;

let inputPhoto = document.getElementById('input-photo');
let startCameraSection = document.getElementById('start-camera');
let startCameraBtn = document.getElementById('btn-start-camera');
let annotateCameraContainer = document.getElementById('annotate-camera-container');
let cameraCanvas = document.getElementById('canvas-camera');
let drawCanvas = document.getElementById('canvas-draw');
let aboutLink = document.getElementById('link-about');

function onPhotoInputChange(e) {

  console.log('Min width and height', cameraCanvas.width, cameraCanvas.height);

  // Ugh. Hacky fix for image coming out too small. Seems like LoadImage doesn't take into account orientation while
  // determining max dimensions? Hopefully can submit a PR. In  meantime, just size down to max dimension & allow crop.
  const options = {
    maxWidth: Math.max(cameraCanvas.width, cameraCanvas.height),
    maxHeight: Math.max(cameraCanvas.width, cameraCanvas.height),
    contain: true,
    crop: true,
    orientation: true,
    canvas: true,
    pixelRatio: window.devicePixelRatio
  };

  function onImageLoad(result) {
    if (result.type === 'error') {
      console.error('Error loading image', result);
    } else {

      console.log('Generated canvas width and height', result.width, result.height);

      // Replace our default canvas (for video) with the generated one
      result.id = 'canvas-camera';

      annotateCameraContainer.removeChild(cameraCanvas);
      annotateCameraContainer.appendChild(result);

      cameraCanvas = result;

      // Make drawing canvas the same size
      drawCanvas.width = parseInt(cameraCanvas.style.width);
      drawCanvas.height = parseInt(cameraCanvas.style.height);

      AnnotatePage.show({live: false});
    }
  }

  // A little library which handles rotating the image appropriately depending
  // on the image's orientation (determined from the exif data) & scaling to fit
  LoadImage(e.target.files[0], onImageLoad, options);

}

function initCanvas() {
  cameraCanvas.width = window.innerWidth;
  cameraCanvas.height = window.innerHeight - HEADER_HEIGHT;
}

function initControls() {

  inputPhoto.addEventListener('change', onPhotoInputChange);

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Looks like we have support, so enable WebRTC button
    startCameraSection.style.display = 'block';
  }

  startCameraBtn.addEventListener('click', function () {
    AnnotatePage.show({live: true});
  });

  aboutLink.addEventListener('click', function () {
    AboutPage.show();
  })

}

export default {

  init: function () {
    initCanvas();
    initControls();
  },

  show: function () {
    showPage(PAGE_NAME);
  }

};
