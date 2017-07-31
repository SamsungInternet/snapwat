import LiveCamera from './liveCamera';
import Draw from './draw';
import SnapshotPage from '../snapshot';
import {PAGES} from '../../shared/constants';
import {isLiveCamera} from '../../shared/config';
import {showPage} from '../../shared/helpers';

const PAGE_NAME = PAGES.ANNOTATE;

let snapshotBtn = document.getElementById('btn-snapshot');

function initControls() {

  snapshotBtn.addEventListener('click', () => {
    Draw.snapshot();
    SnapshotPage.show();
  });

}

export default {

  init: function() {
    Draw.init();
    initControls();
  },

  show: function() {

    showPage(PAGE_NAME);

    if (isLiveCamera()) {
      LiveCamera();
    }

    Draw.show();

  }

};
