import {PAGES, HEADER_HEIGHT} from '../shared/constants';
import {showPage, } from '../shared/helpers';
import drawImageContain from '../shared/drawImageContain';
import AnnotatePage from './annotate';
import AboutPage from './about';

const PAGE_NAME = PAGES.HOME;

let inputPhoto = document.getElementById('input-photo');
let startCameraSection = document.getElementById('start-camera'); 
let startCameraBtn = document.getElementById('btn-start-camera');
let canvas = document.getElementById('canvas-camera');
let ctx = canvas.getContext('2d');
let aboutLink = document.getElementById('link-about');
let fileReader = new FileReader();

/**
 * Fix photo orientation
 * Thanks to: http://stackoverflow.com/a/30242954/396246
 */
fileReader.onloadend = function() {

    var exif = EXIF.readFromBinaryFile(new BinaryFile(this.result));

    switch(exif.Orientation) {

        case 2:
            // horizontal flip
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            break;
        case 3:
            // 180° rotate left
            ctx.translate(canvas.width, canvas.height);
            ctx.rotate(Math.PI);
            break;
        case 4:
            // vertical flip
            ctx.translate(0, canvas.height);
            ctx.scale(1, -1);
            break;
        case 5:
            // vertical flip + 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.scale(1, -1);
            break;
        case 6:
            // 90° rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(0, -canvas.height);
            break;
        case 7:
            // horizontal flip + 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(canvas.width, -canvas.height);
            ctx.scale(-1, 1);
            break;
        case 8:
            // 90° rotate left
            ctx.rotate(-0.5 * Math.PI);
            ctx.translate(-canvas.width, 0);
            break;

    }
};

function onPhotoInputChange(e) {

    let file = e.target.files[0];

    fileReader.readAsDataURL(file);

    let img = new Image();
    
    img.onload = function() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight - HEADER_HEIGHT;
      drawImageContain(ctx, img, 0, 0, canvas.width, canvas.height, 0.5, 0.5);
      AnnotatePage.show({live: false});
    };

    img.src = URL.createObjectURL(file);

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
    initControls();
  },

  show: function () {
    showPage(PAGE_NAME);
  }

};
