var H5P = H5P || {};

/**
 * Blanks(cloze text) module
 *
 * @param {jQuery} $
 */
H5P.Blanks = (function ($) {

  /**
   * Initialize module.
   *
   * @param {Object} options Run parameters
   * @param {Number} id Content identification
   */
  function C(options, id) {
    this.tryAgain = true;

    this.answers = [];
    this.$inputs = [];

    // Set options with defaults.
    this.options = H5P.jQuery.extend({}, {
      text: "Fill in",
      questions: [
        "2 + 2 = *4*"
      ],
      score: "You got @score of @total points.",
      showSolutions: "Show solutions",
      tryAgain: "Try again"
    }, options);
  };

  /**
   * Append field to wrapper.
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    var that = this;

    var $inner = $container.addClass('h5p-blanks').html('<div class="h5p-inner"><h2>' + this.options.text + '</h2></div>').children();
    this.appendQuestionsTo($inner);

    // Add "show solutions" button.
    var $button = $('<input class="h5p-button" type="submit" value="' + this.options.showSolutions + '"/>').appendTo($inner).click(function () {
      if ($button.hasClass('h5p-try-again')) {
        $button.val(that.options.showSolutions).removeClass('h5p-try-again');
        that.hideSolutions();
      }
      else if (that.showSolutions()) {
        if (that.tryAgain) {
          $button.val(that.options.tryAgain).addClass('h5p-try-again');
        }
        else {
          $button.remove();
        }
      }
    });
  };

  /**
   * Append questitons to the given container.
   *
   * @param {jQuery} $container
   */
  C.prototype.appendQuestionsTo = function ($container) {
    for (var i = 0; i < this.options.questions.length; i++) {
      var question = this.options.questions[i];
      var answers = this.answers[i] = [];

      do {
        var first = question.indexOf('*');
        if (first !== -1) {
          var second = question.indexOf('*', first + 1);
          if (second !== -1) {
            var answer = question.substring(first + 1, second);
            var correctAnswers = answer.split('/');
            var width = 0;

            for (var j = 0; j < correctAnswers.length; j++) {
              correctAnswers[j] = H5P.trim(correctAnswers[j]);
              if (correctAnswers[j].length > width) {
                width = correctAnswers[j].length;
              }
            }
            answers.push(correctAnswers);
            question = question.slice(0, first) + '<input type="text" class="h5p-text-input" style="width:' + (width * 0.8) + 'em">' + question.slice(second + 1);
          }
        }
      } while (first !== -1 && second !== -1);

      var $inputs = this.$inputs[i] = [];
      $('<div>' + question + '</div>').appendTo($container).find('input').keydown(function (event) {
        if (event.keyCode === 13) {
          return false; // Prevent form submission on enter key
        }
        $(this).removeClass('h5p-not-filled-out');
      }).each(function () {
        $inputs.push($(this));
      });
    }
  };

  /**
   * Display the correct solution for the input boxes.
   */
  C.prototype.showSolutions = function () {
    var missingFields = false;
    for (var i = 0; i < this.$inputs.length; i++) {
      for (var j = 0; j < this.$inputs[i].length; j++) {
        var $input = this.$inputs[i][j].attr('disabled', true);
        var correct = this.correctAnswer(i, j);
        if (correct === null) {
          if (!missingFields) {
            missingFields = true;
            C.setFocus($input);
          }
          $input.addClass('h5p-not-filled-out');
        }
        else if (correct) {
          $('<span class="h5p-correct-answer">&#x2713; </span>').insertBefore($input.addClass('h5p-correct'));
        }
        else {
          $('<span class="h5p-correct-answer"> ' + this.answers[i][j].join('/') + '</span>').insertAfter($input.addClass('h5p-wrong'));
        }
      }
    }
    if (missingFields) {
      this.hideSolutions();
    }
    return !missingFields;
  };

  /**
   * Hide solutions. (/try again)
   */
  C.prototype.hideSolutions = function () {
    for (var i = 0; i < this.$inputs.length; i++) {
      for (var j = 0; j < this.$inputs[i].length; j++) {
        var $input = this.$inputs[i][j].attr('disabled', false);
        if ($input.hasClass('h5p-correct')) {
          $input.removeClass('h5p-correct').prev('.h5p-correct-answer').remove();
        }
        else {
          $input.removeClass('h5p-wrong').next('.h5p-correct-answer').remove();
        }
      }
    }
  };

  /**
   * Get maximum number of correct answers.
   *
   * @returns {Number} Max points
   */
  C.prototype.getMaxScore = function () {
    var max = 0;
    for (var i = 0; i < this.$inputs.length; i++) {
      max += this.$inputs[i].length;
    }

    return max;
  };

  /**
   * Count the number of correct answers.
   *
   * @returns {Number} Points
   */
  C.prototype.getScore = function () {
    var correct = 0;
    for (var i = 0; i < this.$inputs.length; i++) {
      for (var j = 0; j < this.$inputs[i].length; j++) {
        if (this.correctAnswer(i, j)) {
          correct++;
        }
      }
    }

    return correct;
  };

  /**
   * Check if the answer is correct.
   *
   * @returns {Boolean} Null means no answer.
   */
  C.prototype.correctAnswer = function (block, question) {
    var answer = H5P.trim(this.$inputs[block][question].val());
    if (answer === '') {
      return null;
    }

    var correctAnswers = this.answers[block][question];
    for (var i = 0; i < correctAnswers.length; i++) {
      if (answer === correctAnswers[i]) {
        return true;
      }
    }

    return false;
  };

  /**
   * Helps set focus the given input field.
   */
  C.setFocus = function ($input) {
    setTimeout(function () {
      $input.focus();
    }, 1);
  };

  return C;
})(H5P.jQuery);