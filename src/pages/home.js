import {PAGES, HEADER_HEIGHT} from '../shared/constants';
import {showPage} from '../shared/helpers';
import drawImageContain from '../shared/drawImageContain';
import AnnotatePage from './annotate';
import AboutPage from './about';

const PAGE_NAME = PAGES.HOME;

let inputPhoto = document.getElementById('input-photo');
let startCameraSection = document.getElementById('start-camera'); 
let startCameraBtn = document.getElementById('btn-start-camera');
let canvas = document.getElementById('canvas-camera');
let aboutLink = document.getElementById('link-about');

function onPhotoInputChange(e) {

    let file = e.target.files[0];

    let img = new Image();
    
    img.onload = function() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight - HEADER_HEIGHT;
      var ctx = canvas.getContext('2d');
      drawImageContain(ctx, img, 0, 0, canvas.width, canvas.height, 0.5, 0.5);
      //ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
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
