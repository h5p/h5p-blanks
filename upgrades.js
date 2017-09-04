var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.Blanks'] = (function ($) {
  return {
    1: {
      1: {
        contentUpgrade: function (parameters, finished) {
          // Moved all behavioural settings into "behaviour" group.
          parameters.behaviour = {
            enableRetry: parameters.enableTryAgain === undefined ? true : parameters.enableRetry,
            enableSolutionsButton: true,
            autoCheck: parameters.autoCheck === undefined ? false : parameters.autoCheck,
            caseSensitive: parameters.caseSensitive === undefined ? true : parameters.caseSensitive,
            showSolutionsRequiresInput: parameters.showSolutionsRequiresInput === undefined ? true : parameters.showSolutionsRequiresInput,
            separateLines: parameters.separateLines === undefined ? false : parameters.separateLines
          };
          delete parameters.enableTryAgain;
          delete parameters.enableShowSolution;
          delete parameters.autoCheck;
          delete parameters.caseSensitive;
          delete parameters.showSolutionsRequiresInput;
          delete parameters.separateLines;
          delete parameters.changeAnswer;

          finished(null, parameters);
        }
      },

      /**
       * Asynchronous content upgrade hook.
       * Upgrades content parameters to support Blanks 1.5.
       *
       * Converts task image into media object, adding support for video.
       *
       * @params {Object} parameters
       * @params {function} finished
       */
      5: function (parameters, finished) {

        if (parameters.image) {
          // Convert image field to media field
          parameters.media = {
            library: 'H5P.Image 1.0',
            params: {
              file: parameters.image
            }
          };

          // Remove old image field
          delete parameters.image;
        }

        // Done
        finished(null, parameters);
      },

      /**
       * Asynchronous content upgrade hook.
       * Upgrades content parameters to support Blanks 1.8
       *
       * Move old feedback message to the new overall feedback system.
       *
       * @param {object} parameters
       * @param {function} finished
       */
      8: function (parameters, finished) {
        if (parameters && parameters.score) {
          parameters.overallFeedback = [
            {
              'from': 0,
              'to': 100,
              'feedback': parameters.score
            }
          ];

          delete parameters.score;
        }

        finished(null, parameters);
      }
    }
  };
})(H5P.jQuery);
