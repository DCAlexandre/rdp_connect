const Q = require('q')
const fs = require('fs')
const os = require('os')
const path = require('path')
const defaults = require('lodash.defaults')
const sanitize = require('sanitize-filename')

let mappingStructure = {
  address: {
    def: '',
    name: 'full address:s:'
  },
  username: {
    def: ''
  },
  password: {
    def: ''
  },
  deleteCredentialsAfter: {
    def: true
  },
  safeMode: {
    def: false
  },
  autoReconnect: {
    def: true,
    name: 'autoreconnection enabled:i:',
    fn: arrayMatchTransform([false, true])
  },
  fullscreen: {
    def: true,
    name: 'screen mode id:i:',
    fn: arrayMatchTransform([false, true], 1)
  },
  colors: {
    def: 32,
    name: 'session bpp:i:'
  },
  compression: {
    def: true,
    name: 'compression:i:',
    fn: arrayMatchTransform([false, true])
  },
  connectionType: {
    def: 'auto',
    name: 'connection type:i:',
    fn: arrayMatchTransform(['modem', 'low', 'satellite', 'high', 'wan', 'lan', 'auto'], 1)
  },
  networkAutoDetect: {
    def: true,
    name: 'networkautodetect:i:',
    fn: arrayMatchTransform([false, true])
  },
  bandwidthAutoDetect: {
    def: true,
    name: 'bandwidthautodetect:i:',
    fn: arrayMatchTransform([false, true])
  },
  showWallpaper: {
    def: false,
    name: 'disable wallpaper:i:',
    fn: arrayMatchTransform([true, false])
  },
  fontSmoothing: {
    def: false,
    name: 'allow font smoothing:i:',
    fn: arrayMatchTransform([false, true])
  },
  desktopComposition: {
    def: false,
    name: 'allow desktop composition:i:',
    fn: arrayMatchTransform([false, true])
  },
  showDraggedWindow: {
    def: false,
    name: 'disable full window drag:i:',
    fn: arrayMatchTransform([true, false])
  },
  showMenuAnimations: {
    def: false,
    name: 'disable menu anims:i:',
    fn: arrayMatchTransform([true, false])
  },
  showThemes: {
    def: true,
    name: 'disable themes:i:',
    fn: arrayMatchTransform([true, false])
  },
  showBlinkingCursor: {
    def: true,
    name: 'disable cursor setting:i:',
    fn: arrayMatchTransform([true, false])
  },
  audioPlayMode: {
    def: 'local',
    name: 'audiomode:i:',
    fn: arrayMatchTransform(['local', 'remote', 'none'], 0)
  },
  audioCaptureMode: {
    def: false,
    name: 'audiocapturemode:i:',
    fn: arrayMatchTransform([false, true])
  },
  enableLocalPrinters: {
    def: true,
    name: 'redirectprinters:i:',
    fn: arrayMatchTransform([false, true])
  },
  enableLocalCOMPorts: {
    def: false,
    name: 'redirectcomports:i:',
    fn: arrayMatchTransform([false, true])
  },
  enableSmartCards: {
    def: true,
    name: 'redirectsmartcards:i:',
    fn: arrayMatchTransform([false, true])
  },
  enableClipboard: {
    def: true,
    name: 'redirectclipboard:i:',
    fn: arrayMatchTransform([false, true])
  },
  enablePlugAndPlayDevices: {
    def: '',
    name: 'devicestoredirect:s:'
  },
  enableDrives: {
    def: '',
    name: 'drivestoredirect:s:'
  },
  enablePos: {
    def: false,
    name: 'redirectposdevices:i:',
    fn: arrayMatchTransform([false, true])
  },
  launch: {
    def: '',
    name: 'alternate shell:s:'
  },
  launchWorkingDirectory: {
    def: '',
    name: 'shell working directory:s:'
  }
};

let mapping = {};
for (let key in mappingStructure) {
  mapping[key] = mappingStructure[key].def;
  if (!mappingStructure[key].fn) {
    mappingStructure[key].fn = function(value) {
      return value;
    };
  }
}

function isNumber(value) {
  return (typeof(value) === 'number');
}

function isUndefined(value) {
  return (typeof(value) === 'undefined');
}

function arrayMatchTransform(array, increment, def) {
  return function(value) {
    let index;
    if (isUndefined(increment)) {
      increment = 0;
    }
    if (isNumber(value)) {
      index = value - increment;
    } else {
      index = array.indexOf(value);
    }
    if (index >= 0 && index <= array.length - 1) {
      return index + increment;
    }
    if (isUndefined(def)) {
      return array.length - 1 + increment;
    }
    return def;
  }
}

function getRdpFileContent(config) {
  defaults(config, mapping);
  let rdpConfigText = '';
  for (let key in config) {
    if (mappingStructure[key] && mappingStructure[key].name) {
      rdpConfigText += mappingStructure[key].name + mappingStructure[key].fn(config[key]) + '\n';
    }
  }
  return rdpConfigText;
}

/**
 * Returns a promise that will be resolved as soon as the file is created.
 * @param config
 * @returns {promise|*|Q.promise}
 */
function buildRdpFile(config) {
  let deferred = Q.defer();
  let fileContent = getRdpFileContent(config);
  let fileName = path.normalize(os.tmpdir() + '/' + sanitize(config.address) + '.rdp');
  Q.nfcall(fs.writeFile, fileName, fileContent)
    .then(function() {
      deferred.resolve(fileName);
    })
    .fail(deferred.reject);
  return deferred.promise;
}

module.exports = buildRdpFile;
