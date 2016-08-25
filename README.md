# snapwat?

**Work in progress...**

[sna**pwa**t](https://snapw.at) is a demo to showcase progressive web app capabilities.

The idea of the app is to let you doodle and add emojis etc. on top of photos and videos.
Right now you can snap selfie stills from your camera view with your lovely drawings and emojis
on top. 

<img src="docs/snapwat-snapshots.png?raw=true" alt="A snapwat" width="600px"/>

Choosing a photo from your gallery should be coming soon and recording videos may come later...


## How to use it

Choose a colour using the colour picker in the corner and start drawing over the camera view.

Select an emoji from the emoji menu and touch on the camera view to stamp it as a sticker.
Tap and drag to move an emoji around. Pinch an emoji to resize it.

When you have a moment that you want to snap, press the camera button. The snapwat (that's the noun for a snapwat 
snapshot!) will open up in the page. Tap and hold / right-click and choose your device's Save / Download option to save 
the image. (Unfortunately it doesn't seem possible right now to download the generated file automatically across mobile 
browsers - I'm planning to write a blog post about this soon).

From there, be sure to share your beautiful creation with the world, hashtag snapwat! 


## Browser Support

So far I have tested it in:

* Samsung Internet for Android (obvs, [that's where I work](https://medium.com/samsung-internet-dev/about)!)
* Chrome for Android
* Chrome desktop

Unfortunately iOS Safari does not have support for getUserMedia yet, although you can still doodle in it, if you like.

If you have any problems with $your_browser, please create an issue (or even better, a PR).


## Known issues

Unfortunately the long-tap to save the image is disabled in standalone app mode in Samsung Internet, i.e. when you
launch it from the home screen icon. So for now, I recommend using Snapwat in a regular browser view.


## Tech

This demo is intended to be as lightweight as possible. However, it would be a shame to avoid
all modern tooling and lose out on the latest syntax and JS bundling. So, I'm using 
[Babel](https://babeljs.io/) to transpile the ES2015 syntax and [rollup](http://rollupjs.org) 
for module loading.

The [WebRTC adapter](https://github.com/webrtc/adapter) is used to polyfill the latest 
MediaDevices promise-based API.

It uses [Web Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) to enable home screen 
installation and a [service worker](https://developers.google.com/web/fundamentals/primers/service-worker/) 
for offline use. Yes, you can take a snapwat on an airplane!


## Local development

As usual, the best place to begin is:

```npm install```

Then to transpile and combine the JavaScript:

```npm run build```

(This just runs the `rollup` commands for the app source code and the service worker script).

To run the app, you can use any static web server. I just use `python -m SimpleHTTPServer`.

To watch for changes (in a separate terminal):

```npm run watch```

(This just uses `watch` to rebuild the JS when a change is detected in the src directory).


## Snapwat the name

Snapwat is called Snapwat because it's a snapshot with "pwa" in it - for Progressive Web App. 
Also, it's abbreviated to SW, like Service Workers. Good eh? 

It's pronounced "snap what?" to rhyme with snapshot.

Any resemblance to other social apps is purely coincidental...


## Feedback or questions

Please [tweet me](https://twitter.com/poshaughnessy) or email: peter dot oshaughnessy at gmail dot com.


## Credits

Emojis provided free by [EmojiOne](http://emojione.com/).

Icons by [Iconic](https://useiconic.com/).

Camera shutter sound by [xef6](https://www.freesound.org/people/xef6/sounds/61059/).


# Licence

MIT
