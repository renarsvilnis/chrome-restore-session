/* eslint-env webextensions */

/**
 * API DOCS
 * https://developer.chrome.com/extensions/devguide
 */

/**
 * Fetch current browser tabs
 * https://developer.chrome.com/extensions/tabs#method-query
 */
async function fetchTabs () {
  return new Promise((resolve) => {
    const query = {};
    chrome.tabs.query(query, resolve);
  });
}

async function setCloudUserTabs (deviceId, tabs) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({[deviceId]: tabs}, resolve);
  });
}

/**
 * https://developer.chrome.com/extensions/sessions#method-getDevices
 */
async function getDevices (filter = {}) {
  return new Promise((resolve) => {
    chrome.sessions.getDevices(filter, resolve);
  })
}

function parseRawTabData (tabs) {
  const windows = new Map();

  let windowIndex = 0;
  tabs.forEach((tab) => {
    let windowObj;
    if (windows.has(tab.windowId)) {
      windowObj = windows.get(tab.windowId);
    } else {
      windowObj = {
        width: tab.width,
        height: tab.height,
        index: windowIndex++,
        tabs: []
      };
      windows.set(tab.windowId, windowObj);
    }

    windowObj.tabs.push({
      index: tab.index,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl
    });
  })

  return [...windows.values()];
}

// https://stackoverflow.com/a/23854032/1378261
function getRandomToken() {
  // E.g. 8 * 32 = 256 bits token
  const randomPool = new Uint8Array(32);
  crypto.getRandomValues(randomPool);
  let hex = '';
  for (let i = 0; i < randomPool.length; ++i) {
    hex += randomPool[i].toString(16);
  }
  // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
  return hex;
}

const DEVICE_ID_STORAGE_KEY = 'deviceId';

chrome.storage.sync.get(DEVICE_ID_STORAGE_KEY, (items) => {
  var deviceId = items.deviceId;
  if (deviceId) {
    initiate(deviceId);
  } else {
    deviceId = getRandomToken();
    chrome.storage.sync.set({[DEVICE_ID_STORAGE_KEY]: deviceId}, () => {
      initiate(deviceId);
    });
  }
});

function initiate (deviceId) {
  setInterval(async () => {
    console.log('Fetching tabs!');
    const tabs = await fetchTabs();
    const devices = await getDevices();
  
    await setCloudUserTabs(deviceId, tabs);
    console.log({tabs});
    console.log({parsedTabs: parseRawTabData(tabs)})
    console.log({devices});
    
  }, 15 * 1000);

  // #############################################################################
  // Events
  // #############################################################################

  // Listen to store changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log('storage.onChanged called', changes, namespace);
    
    for (let key in changes) {
      const storageChange = changes[key];
      console.log(`Storage key "${key}" in namespace "${namespace}" changed. Old value was "${storageChange.oldValue}", new value is "${storageChange.newValue}".`);
    }
  });

  // https://developer.chrome.com/extensions/sessions#event-onChanged
  chrome.sessions.onChanged.addListener((ev) => {
    console.log('session onChanged called', ev);
  });

  // https://developer.chrome.com/extensions/windows#event-onCreated
  chrome.windows.onCreated.addListener((ev) => {
    console.log('New window created', ev);
  })

  // https://developer.chrome.com/extensions/windows#event-onRemoved
  chrome.windows.onRemoved.addListener((tabId) => {
    console.log('Window closed', tabId);
  })


  chrome.tabs.onCreated.addListener((ev) => {
    console.log('tabs.onCreated called', ev);
  })

  // Wehn url changes, finish resorting etc
  chrome.tabs.onUpdated.addListener((ev) => {
    console.log('tabs.onUpdated called', ev);
  })

  // When order changed but not yet released
  chrome.tabs.onMoved.addListener((ev) => {
    console.log('tabs.onMoved called', ev);
  })

  // chrome.tabs.onActivated.addListener((ev) => {
  //   console.log('tabs.onActivated called', ev);
  // })

  // chrome.tabs.onHighlighted.addListener((ev) => {
  //   console.log('tabs.onHighlighted called', ev);
  // })

  chrome.tabs.onDetached.addListener((ev) => {
    console.log('tabs.onDetached called', ev);
  })
  chrome.tabs.onAttached.addListener((ev) => {
    console.log('tabs.onAttached called', ev);
  })

  chrome.tabs.onRemoved.addListener((ev) => {
    console.log('tabs.onRemoved called', ev);
  })

  chrome.tabs.onReplaced.addListener((ev) => {
    console.log('tabs.onReplaced called', ev);
  })
}
