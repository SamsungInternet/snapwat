import LiveCamera from './liveCamera';
import Draw from './draw';
import SnapshotPage from '../snapshot';
import {PAGES} from '../../shared/constants';
import {showPage} from '../../shared/helpers';

const PAGE_NAME = PAGES.ANNOTATE;

let snapshotBtn = document.getElementById('btn-snapshot');

function initControls() {

  snapshotBtn.addEventListener('click', () => {
    SnapshotPage.show();
  });

}

export default {

  init: function () {
    Draw();
    initControls();
  },

  // TODO what about when you click back from snapshot page? Should be app-level config?
  show: function (config) {
    showPage(PAGE_NAME);
    if (config && config.live) {
      LiveCamera();
    }
  }

};
