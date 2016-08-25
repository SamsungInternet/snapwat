import SWRegister from './swRegister';
import InputColour from './shared/inputColour';
import Audio from './shared/audio';

import HomePage from './pages/home';
import SnapshotPage from './pages/snapshot';
import SharePage from './pages/share';

SWRegister();
InputColour();
Audio();

HomePage.init();
SnapshotPage.init();
SharePage.init();
