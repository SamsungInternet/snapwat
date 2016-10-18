import * as hellojs from 'hellojs';
import {HEADER_HEIGHT} from '../shared/constants';
import {playCameraSound} from '../shared/audio';
import AnnotatePage from './annotate';
import SharePage from './share';
import {PAGES} from '../shared/constants';
import {showPage, showPrompt} from '../shared/helpers';

const hello = hellojs.default;
const PAGE_NAME = PAGES.SNAPSHOT;

let backBtn = document.getElementById('btn-back-snapshot');
let tweetButton = document.getElementById('btn-share-twitter');
let cameraCanvas = document.getElementById('canvas-camera');
let drawingCanvas = document.getElementById('canvas-draw');
let saveCanvas = document.getElementById('canvas-save');
let saveImage = document.getElementById('image-save');
let saveCtx = saveCanvas.getContext('2d');

function initSave() {

  saveCanvas.width  = window.innerWidth;
  saveCanvas.height = window.innerHeight - HEADER_HEIGHT;

  saveCtx.font = '16px Arial';
  saveCtx.fillStyle = '#fff';

  saveImage.width  = window.innerWidth;
  saveImage.height = window.innerHeight - HEADER_HEIGHT;

}

function initControls() {

  tweetButton.addEventListener('click', () => {

    hello('twitter').login()
      .then(res => {
        console.log('Logged into Twitter', res);
        SharePage.show({username: res.authResponse.screen_name});

      }, err => {
        console.error('Error logging in to Twitter', err);
      });
  });


  backBtn.addEventListener('click', () => {
    AnnotatePage.show();
  });

}

export default {

  init: function () {
    initSave();
    initControls();
  },

  show: function () {

    playCameraSound();

    // Copy the other canvases onto a single canvas for saving
    saveCtx.drawImage(cameraCanvas, 0, 0);
    saveCtx.drawImage(drawingCanvas, 0, 0);

    // Add the URL at the bottom
    saveCtx.fillText('snapw.at', saveCanvas.width - 72, saveCanvas.height - 10);

    saveImage.src = saveCanvas.toDataURL('image/png');
    saveCanvas.style.display = 'none';
    saveImage.style.display = 'block';

    showPage(PAGE_NAME);

  }

};
