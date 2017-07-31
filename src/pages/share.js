import * as hellojs from 'hellojs';
import {PAGES} from '../shared/constants';
import AnnotatePage from './annotate';
import SnapshotPage from './snapshot';
import {dataURItoBlob, showPage, showPrompt} from '../shared/helpers';

const hello = hellojs.default;
const PAGE_NAME = PAGES.SHARE;
const TWITTER_CLIENT_PROD = 'bkMmxlirv04KxJtAbWSgekbVM';
const TWITTER_CLIENT_DEV = 'Eqrm5IQ5zgLUfZXrgpVuntjvA';

let saveCanvas = document.getElementById('canvas-save');
let backBtn = document.getElementById('btn-back-share');
let shareTextInput = document.getElementById('share-text');
let shareImagePreview = document.getElementById('share-preview');
let shareSubmitButton = document.getElementById('share-submit');
let twitterUsernameDisplay = document.getElementById('twitter-username');

let imageDataURI = null;

function initOAuth() {
  hello.init({
    twitter: window.location.hostname === 'localhost' ? TWITTER_CLIENT_DEV : TWITTER_CLIENT_PROD
  }, {
    redirect_uri: 'redirect.html'
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
        showPrompt('tweet-ok');
      }, err => {
        console.error('Twitter error', err);
        showPrompt('tweet-error');
      });

    AnnotatePage.show();
    showPrompt('tweeting');

  });

  backBtn.addEventListener('click', () => {
    SnapshotPage.show();
  });

}

export default {

  init: function() {
    initOAuth();
    initControls();
  },

  show: function(data) {

    imageDataURI = saveCanvas.toDataURL('image/png');
    shareImagePreview.src = imageDataURI;

    twitterUsernameDisplay.innerText = data.username;

    showPage(PAGE_NAME);
  }

};
