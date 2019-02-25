/* eslint-env webextensions */

/**
 * Based on https://github.com/kdzwinel/Context/blob/master/js/classes/HugeStorageSync.class.js
 * from https://stackoverflow.com/a/17722111/1378261
 */

function getCacheKey(key, i) {
  return (i === 0) ? key : key + "_" + i;
}

export default {
  /**
   * Allows to save strings longer than QUOTA_BYTES_PER_ITEM in chrome.storage.sync by splitting them into smaller parts.
   * Please note that you still can't save more than QUOTA_BYTES.
   */
  set (key, value) {
    return new Promise((resolve, reject) => {
      let i = 0;
      let cache = {};
      let segment;
      let cacheKey;

      // split value into chunks and store them in an object indexed by `key_i`
      while(value.length > 0) {
        cacheKey = getCacheKey(key, i);
        //if you are wondering about -2 at the end see: https://code.google.com/p/chromium/issues/detail?id=261572
        segment = value.substr(0, chrome.storage.sync.QUOTA_BYTES_PER_ITEM - cacheKey.length - 2);
        cache[cacheKey] = segment;
        value = value.substr(chrome.storage.sync.QUOTA_BYTES_PER_ITEM - cacheKey.length - 2);
        i++;
      }

      // store all the chunks
      chrome.storage.sync.set(cache, resolve);

      //we need to make sure that after the last chunk we have an empty chunk. Why this is so important?
      // Saving v1 of our object. Chrome sync status: [chunk1v1] [chunk2v1] [chunk3v1]
      // Saving v2 of our object (a bit smaller). Chrome sync status: [chunk1v2] [chunk2v2] [chunk3v1]
      // When reading this configuration back we will end up with chunk3v1 being appended to the chunk1v2+chunk2v2
      chrome.storage.sync.remove(getCacheKey(key, i));
    });
  },

  /**
   * Retrieves chunks of value stored in chrome.storage.sync and combines them.
   */
  get (key) {
    return new Promise((resolve, reject) => {
      //get everything from storage
      chrome.storage.sync.get(null, (items) => {
        let value = '';

        for(let i=0; i<chrome.storage.sync.MAX_ITEMS; i++) {
          if(items[getCacheKey(key, i)] === undefined) {
            break;
          }
          value += items[getCacheKey(key, i)];
        }

        resolve(value);
      });
    });
  }
}
