/* Effects.js
 * @descprition This is simply an effects utility bases on Promises.
 * It eases the process of handling effects, so that they can be used in the game.
 */
(() => {
  /*
   * @description This is used to hide an element.
   * @param {selectors} is a string containing one or more CSS selectors separated by commas
   * @param {all} indicates to select all elementy. default is false.
   */
  function hide(selectors, all = false) {
    return new Promise((resolve, reject) => {
      const elem = all ? document.querySelectorAll(selectors) : document.querySelector(selectors);
      if (elem) {
        if (all) {
          elem.forEach(item => item.classList.add('hide'));
        } else {
          elem.classList.add('hide');
        }
        resolve();
      }
      reject(new Error(`No match found for ${elem}`));
    });
  }

  /*
   * @description This is used to remove an element.
   * @param {selectors} is a string containing one or more CSS selectors separated by commas
   * @param {all} indicates to select all elementy. default is false.
   */
  function remove(selectors, all = false) {
    return new Promise((resolve, reject) => {
      const elem = all ? document.querySelectorAll(selectors) : document.querySelector(selectors);
      if (elem) {
        if (all) {
          elem.forEach(item => item.classList.add('remove'));
        } else {
          elem.classList.add('remove');
        }
        resolve();
      }
      reject(new Error(`No match found for ${elem}`));
    });
  }

  /*
   * @description This is used to show an element.
   * @param {selectors} is a string containing one or more CSS selectors separated by commas
   * @param {all} indicates to select all elementy. default is false.
   */
  function show(selectors, all = false) {
    return new Promise((resolve, reject) => {
      const elem = all ? document.querySelectorAll(selectors) : document.querySelector(selectors);
      if (elem) {
        if (all) {
          elem.forEach(item => item.classList.remove('hide', 'remove'));
        } else {
          elem.classList.remove('hide', 'remove');
        }
        resolve();
      }
      reject(new Error(`No match found for ${selectors}`));
    });
  }

  /* This object defines the publicly accessible functions available to
   * developers by creating a global Effects object.
   */
  window.Effects = {
    hide,
    remove,
    show,
  };
})();
