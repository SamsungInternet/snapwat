import {PAGES, HEADER_HEIGHT} from '../shared/constants';
import {showPage, } from '../shared/helpers';
import AnnotatePage from './annotate';
import AboutPage from './about';
import LoadImage from 'blueimp-load-image';

const PAGE_NAME = PAGES.HOME;

let inputPhoto = document.getElementById('input-photo');
let startCameraSection = document.getElementById('start-camera'); 
let startCameraBtn = document.getElementById('btn-start-camera');
let canvas = document.getElementById('canvas-camera');
let ctx = canvas.getContext('2d');
let aboutLink = document.getElementById('link-about');
let fileReader = new FileReader();

function onPhotoInputChange(e) {

    const options = {
        minWidth: canvas.width,
        minHeight: canvas.height,
        maxWidth: canvas.width,
        maxHeight: canvas.height,
        contain: true,
        orientation: true,
        canvas: true
    };

    function onImageLoad(result) {    
        if (result.type === 'error') {
            console.error('Error loading image', result);
        } else {
            ctx.drawImage(result, 0, 0, canvas.width, canvas.height);
            AnnotatePage.show({live: false});
        }   
    }

    // A little library which handles rotating the image appropriately depending 
    // on the image's orientation (determined from the exif data) & scaling to fit
    LoadImage(e.target.files[0], onImageLoad, options);

}

function initCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight - HEADER_HEIGHT;
}

function initControls() {

  inputPhoto.addEventListener('change', onPhotoInputChange);
  
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Looks like we have support, so enable WebRTC button
    startCameraSection.style.display = 'block';
  }

  startCameraBtn.addEventListener('click', function() {
    AnnotatePage.show({live: true});
  });

  aboutLink.addEventListener('click', function() {
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
