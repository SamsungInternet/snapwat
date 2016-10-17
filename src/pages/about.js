import {PAGES} from '../shared/constants';
import {showPage} from '../shared/helpers';
import HomePage from './home';

const PAGE_NAME = PAGES.ABOUT;

let homeLink = document.getElementById('link-home');

function initControls() {
  homeLink.addEventListener('click', function() {
    HomePage.show();
  });
}

export default {

  init: function () {
    initControls();
  },

  show: function () {
    showPage(PAGE_NAME);
  }

};
