import SWRegister from './swRegister';
import InputColourShim from './shared/inputColourShim';
import Audio from './shared/audio';

import Pages from './pages';
import HomePage from './pages/home';

function initApp() {
  SWRegister();
  InputColourShim();
  Audio();
}

function initPages(pages) {
  for (let page of pages) {
    page.init();
  }
}

initApp();
initPages(Pages);
HomePage.show();
