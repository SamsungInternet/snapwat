# snapwat?

**Disclaimer: Snapwat is a product of a learning process for me (I'm [sharing that](https://medium.com/samsung-internet-dev/things-i-learned-making-a-progressive-web-app-for-super-selfies-49e76d154e4f#.3m59s4t4n) as I go) and it's a work in progress. It shouldn't be seen as a best practice guide (yet)!**

[sna**pwa**t](https://snapw.at) is a demo to showcase progressive web app capabilities.

The idea of the app is to let you doodle and add emojis etc. on top of photos or your live camera feed.

<img src="docs/snapwat-snapshots.png?raw=true" alt="A snapwat" width="600px"/>


## How to use it

Choose a colour using the colour picker in the corner and start drawing over the camera view.

Select an emoji from the emoji menu and touch on the camera view to stamp it as a sticker.
Tap and drag to move an emoji around. Pinch an emoji to resize it.

When you have a moment that you want to snap, press the 'next' arrow. The snapwat (that's the noun for a snapwat 
snapshot!) will open up in the page. Tap and hold / right-click and choose your device's Save / Download option to save 
the image. (Unfortunately it doesn't seem possible right now to download the generated file automatically across mobile 
browsers - [more about that here](https://medium.com/samsung-internet-dev/things-i-learned-making-a-progressive-web-app-for-super-selfies-49e76d154e4f)).

Or press the tweet button and share it directly via the Twitter API. It will request read/write access for your
Twitter account, but it will only ever be used to share your snapwats with your permission. It uses 
[hello.js](https://adodson.com/hello.js/) with their [default auth proxy](https://auth-server.herokuapp.com/). 

Be sure to share your beautiful creations with the world, hashtag snapwat! 


## Browser Support

So far I have tested it in:

* Samsung Internet for Android
* Chrome for Android
* iOS Safari (no getUserMedia, but can use input type="file")
* Chrome desktop

For known issues, see the [Issues tab](https://github.com/SamsungInternet/snapwat/issues).

If you spot other problems, please file an issue (or even better a PR!)


## Tech

This demo is intended to be as lightweight as possible. However, it would be a shame to avoid
all modern tooling and lose out on the latest syntax and JS bundling. So, I'm using 
[Babel](https://babeljs.io/) to transpile the JavaScript and [rollup](http://rollupjs.org) 
for module loading.

The [WebRTC adapter](https://github.com/webrtc/adapter) is used to polyfill the latest 
MediaDevices promise-based API.

It uses [Web Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) to enable home screen 
installation and a [service worker](https://developers.google.com/web/fundamentals/primers/service-worker/) 
for offline use. (Yes, you can take a snapwat on an airplane!)


## Local development

As usual, the best place to begin is:

```npm install``` or ```yarn```

Then to transpile and combine the JavaScript:

```npm run build```*

(This just runs the `rollup` commands for the app source code and the service worker script).

To run the app:

```npm start```*

Or you can use any static web server for the `public` directory - it's all just front-end.

To watch for changes (in a separate terminal):

```npm run watch```*

(This just uses `watch` to rebuild the JS when a change is detected in the src directory).

*NB. You should be able to replace `npm` with `yarn` here, but it's not working with yarn v0.15.1. 
Sounds like it should work once [this gets released](https://github.com/yarnpkg/yarn/pull/809).

To test the sharing feature locally, ensure you have a `NODE_ENV` environment variable set to
'development'.

For reference, I deploy to Github pages using:

```git subtree push --prefix public origin gh-pages```


## Snapwat the name

Snapwat is called Snapwat because it's a snapshot with "pwa" in it - for Progressive Web App. 
Also, it's abbreviated to SW, like Service Workers. Good eh? 

It's pronounced "snap what?" to rhyme with snapshot.

Any resemblance to other social apps is purely coincidental...


## Further reading

* [Things I learned making a PWA for 'super selfies'](https://medium.com/samsung-internet-dev/things-i-learned-making-a-progressive-web-app-for-super-selfies-49e76d154e4f)
* [Chrome Developers guide on capturing images](https://developers.google.com/web/fundamentals/native-hardware/capturing-images/).


## Credits and Thanks

Emoji images provided free by [EmojiOne](http://emojione.com/).

Icons by [Iconic](https://useiconic.com/).

Camera shutter sound by [xef6](https://www.freesound.org/people/xef6/sounds/61059/).

Thanks to Rich Harris for making a [rollup cache manifest example](https://gitlab.com/Rich-Harris/rollup-cache-manifest-example) 
for me (and for [rollup](http://rollupjs.org/) in general!)


## Contact

Please [tweet me](https://twitter.com/poshaughnessy) or email: peter dot oshaughnessy at gmail dot com.


# Licence

MIT
