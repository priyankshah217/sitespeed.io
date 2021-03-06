'use strict';

const path = require('path'),
  PNGCrop = require('png-crop'),
  Promise = require('bluebird');

Promise.promisifyAll(PNGCrop);

function getImagesAndName(images) {
  return images.map((image, index) => {
    return {
      data: image,
      name: index + '.png'
    }
  });
}

function storeFirefoxScreenshots(options, url, imagesAndName, storageManager) {
  const width = Number(options.browsertime.viewPort.split('x')[0]);
  const height = Number(options.browsertime.viewPort.split('x')[1]);

  // Firefox screenshots take the full height of the browser window, so let's crop
  return storageManager.createDirForUrl(url, 'screenshots')
    .then((dirPath) => Promise.map(imagesAndName, (screenshot) =>
      PNGCrop.cropAsync(screenshot.data, path.join(dirPath, screenshot.name), {
          width,
          height
        }
      )))
}

function storeChromeScreenshots(url, imagesAndName, storageManager) {
  return Promise.map(imagesAndName, (screenshot) =>
    storageManager.writeDataForUrl(screenshot.data, screenshot.name, url, 'screenshots'));
}

module.exports = {
  name() {
    return path.basename(__dirname);
  },
  open(context, options) {
    this.storageManager = context.storageManager;
    this.options = options;
  },
  processMessage(message) {
    switch (message.type) {
      case 'browsertime.screenshot':
        if (this.options.browser === 'firefox') {
          return storeFirefoxScreenshots(this.options, message.url, getImagesAndName(message.data), this.storageManager);
        } else {
          return storeChromeScreenshots(message.url, getImagesAndName(message.data), this.storageManager);
        }
    }
  }
};
