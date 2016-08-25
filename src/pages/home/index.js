import Camera from './camera';
import Draw from './draw';
import SnapshotPage from '../snapshot';
import {PAGES} from '../../shared/constants';
import {showPage} from '../../shared/helpers';

const PAGE_NAME = PAGES.HOME;

let snapshotBtn = document.getElementById('btn-snapshot');

function initControls() {

  snapshotBtn.addEventListener('click', () => {
    SnapshotPage.show();
  });

}

export default {

  init: function () {
    Camera();
    Draw();
    initControls();
  },

  show: function () {
    showPage(PAGE_NAME);
  }

};
