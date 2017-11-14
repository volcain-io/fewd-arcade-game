/* Effects.js
 * @descprition This is simply an effects utility bases on Promises.
 * It eases the process of handling effects, so that they can be used in the game.
 */
(function() {
  /*
   * @description This is used to hide an element.
   * @param selectors is a string containing one or more CSS selectors separated by commas
   */
  function hide(selectors) {
    return new Promise(function(resolve, reject) {
      var elem = document.querySelector(selectors);
      if (elem) {
        elem.style.display = "none";
        resolve();
      }
      reject(new Error(`No match found for ${elem}`));
    });
  }

  /*
   * @description This is used to show an element.
   * @param selectors is a string containing one or more CSS selectors separated by commas
   */
  function show(selectors) {
    return new Promise(function(resolve, reject) {
      var elem = document.querySelector(selectors);
      if (elem) {
        elem.style.display = "initial";
        resolve();
      }
      reject(new Error(`No match found for ${selectors}`));
    });
  }

  /* This object defines the publicly accessible functions available to
   * developers by creating a global Effects object.
   */
  window.Effects = {
    hide: hide,
    show: show
  };
})();
