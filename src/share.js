import * as hellojs from 'hellojs';
import {dataURItoBlob} from './helpers';

const hello = hellojs.default;

console.log('hello 2', hello);

const TWITTER_CLIENT_ID = 'bkMmxlirv04KxJtAbWSgekbVM';

let saveCanvas = document.getElementById('canvas-save');
let tweetButton = document.getElementById('btn-share-twitter');

function init() {

  hello.init({
    twitter: TWITTER_CLIENT_ID
  });

  let imageDataURI = saveCanvas.toDataURL('image/png');
  let blob = dataURItoBlob(imageDataURI);

  tweetButton.addEventListener('click', () => {

    hello('twitter').login().then(() => {
      alert('logged into twitter');
    });

    hello('twitter').api('me/share', 'POST', {
      message: 'hello?'
    });
    /*
    OAuth.callback('twitter')
      .done((result) => {
        // token in result.access_token
        result.post('https://upload.twitter.com/1.1/media/upload.json', {
          data: {
            media: blob
          }
        })
        .done((response) => {
          console.log('Response', response);
        })
        .fail((err) => {
          console.error('Error', err);
        });
      })
      .fail((error) => {
        console.error('Error', error);  
      });
    */
  });
}

export default init;