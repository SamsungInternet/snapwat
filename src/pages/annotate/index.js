import LiveCamera from './liveCamera';
import Draw from './draw';
import SnapshotPage from '../snapshot';
import {PAGES} from '../../shared/constants';
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

  show: function(config) {

    showPage(PAGE_NAME);
    Draw.show();
    if (config && config.live) {
      LiveCamera();
    }
  }

};
