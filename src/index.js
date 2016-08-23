import SWRegister from './swRegister';
import InputColour from './shared/inputColour';
import Audio from './shared/audio';

import PageHome from './pages/home';
import PageSnapshot from './pages/snapshot';
import PageShare from './pages/share';

SWRegister();
InputColour();
Audio();

PageHome()
PageSnapshot();
PageShare();
