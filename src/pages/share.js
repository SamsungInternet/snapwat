import * as hellojs from 'hellojs';
import {dataURItoBlob, showPage} from '../shared/helpers';

const hello = hellojs.default;

const TWITTER_CLIENT_ID = 'bkMmxlirv04KxJtAbWSgekbVM';

let saveCanvas = document.getElementById('canvas-save');
let tweetButton = document.getElementById('btn-share-twitter');
let shareHeader = document.getElementById('header-share');
let sharePage = document.getElementById('page-share');
let backBtn = document.getElementById('btn-back-share');
let shareTextInput = document.getElementById('share-text');
let shareImagePreview = document.getElementById('share-preview');
let shareSubmitButton = document.getElementById('share-submit');

function showSharePage() {

  let imageDataURI = saveCanvas.toDataURL('image/png');
  let blob = dataURItoBlob(imageDataURI);

  shareImagePreview.src = imageDataURI;
  showPage('share');

}

function initOAuth() {
  hello.init({
    twitter: TWITTER_CLIENT_ID
  }, {
    redirect_uri: 'http://localhost:8000' //'https://snapw.at/'
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

    hello('twitter')
      .api('me/share', 'POST', {
        message: shareTextInput.value
      })
      .then(json => {
        console.error('Twitter response', json);
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