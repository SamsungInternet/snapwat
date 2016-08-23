import * as hellojs from 'hellojs';
import {dataURItoBlob, showPage} from '../shared/helpers';

const hello = hellojs.default;

const TWITTER_CLIENT_ID = 'bkMmxlirv04KxJtAbWSgekbVM';

let saveCanvas = document.getElementById('canvas-save');
let tweetButton = document.getElementById('btn-share-twitter');
let backBtn = document.getElementById('btn-back-share');
let shareTextInput = document.getElementById('share-text');
let shareImagePreview = document.getElementById('share-preview');
let shareSubmitButton = document.getElementById('share-submit');

let imageDataURI = null;

function showSharePage() {

  imageDataURI = saveCanvas.toDataURL('image/png');

  shareImagePreview.src = imageDataURI;
  showPage('share');

}

function initOAuth() {
  hello.init({
    twitter: TWITTER_CLIENT_ID
  });
}

function initControls() {

  tweetButton.addEventListener('click', () => {

    hello('twitter').login()
      .then(res => {
        console.log('Logged into Twitter', res);
        showSharePage();
      }, err => {
        console.error('Error logging in to Twitter', err);
      });
  });

  shareSubmitButton.addEventListener('click', () => {

    let blob = dataURItoBlob(imageDataURI);

    hello('twitter')
      .api('me/share', 'POST', {
        message: shareTextInput.value,
        file: blob
      })
      .then(json => {
        console.log('Twitter response', json);
      });

    showPage('home');

  });

  backBtn.addEventListener('click', () => {
    showPage('snapshot');
  });

}

export default function init() {
  initOAuth();
  initControls();
}