/**
 * API DOCS
 * https://developer.chrome.com/extensions/devguide
 */
console.log('Hello world!');

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

async function setCloudUserTabs (deviceName, tabs) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({[deviceName]: tabs}, resolve);
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

setInterval(async () => {
  console.log('Fetching tabs!');
  const deviceId = 1;
  const tabs = await fetchTabs();
  const devices = await getDevices();

  // await setCloudUserTabs(deviceId, tabs);
  console.log({tabs});
  console.log({parsedTabs: parseRawTabData(tabs)})
  console.log({devices});
  
}, 15 * 1000);


// Listen to store changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (key in changes) {
    var storageChange = changes[key];
    console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
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
