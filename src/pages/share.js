import * as hellojs from 'hellojs';
import {PAGES} from '../shared/constants';
import HomePage from './home';
import SnapshotPage from './snapshot';
import {dataURItoBlob, showPage, showPrompt} from '../shared/helpers';

const hello = hellojs.default;
const PAGE_NAME = PAGES.SHARE;

let saveCanvas = document.getElementById('canvas-save');
let backBtn = document.getElementById('btn-back-share');
let shareTextInput = document.getElementById('share-text');
let shareImagePreview = document.getElementById('share-preview');
let shareSubmitButton = document.getElementById('share-submit');
let twitterUsernameDisplay = document.getElementById('twitter-username');

let imageDataURI = null;

function initOAuth() {
  // Twitter client ID provided by rollup replace plugin
  hello.init({
    twitter: TWITTER_CLIENT_ID
  });
}

function initControls() {

  shareSubmitButton.addEventListener('click', () => {

    let blob = dataURItoBlob(imageDataURI);

    hello('twitter')
      .api('me/share', 'POST', {
        message: shareTextInput.value,
        file: blob
      })
      .then(json => {
        console.log('Twitter response', json);
        HomePage.show();
        showPrompt('tweet-ok');
      }, err => {
        console.error('Twitter error', err);
        HomePage.show();
        showPrompt('tweet-error');
      });

  });

  backBtn.addEventListener('click', () => {
    SnapshotPage.show();
  });

}

export default {

  init: function () {
    initOAuth();
    initControls();
  },

  show: function (data) {

    imageDataURI = saveCanvas.toDataURL('image/png');
    shareImagePreview.src = imageDataURI;

    twitterUsernameDisplay.innerText = data.username;

    showPage(PAGE_NAME);
  }

};
