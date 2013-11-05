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
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @returns {_L8.C}
   */
  function C(params, id) {
    this.id = id;

    // Set default behavior.
    this.params = $.extend({}, {
      text: "Fill in",
      questions: [
        "2 + 2 = *4*"
      ],
      score: "You got @score of @total points.",
      showSolutions: "Show solutions",
      hideSolutions: "Hide solutions",
      enableTryAgain: true,
      displaySolutionsButton: true,
      postUserStatistics: (H5P.postUserStatistics === true)
    }, params);

    this.answers = [];
    this.$inputs = [];
    this.displayingSolution = false;
  };

  /**
   * Append field to wrapper.
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    this._$inner = $container.addClass('h5p-blanks').html('<div class="h5p-inner"><div class="h5p-blanks-title">' + this.params.text + '</div></div>').children();
    this.appendQuestionsTo(this._$inner);

    // Add "show solutions" button and evaluation area
    this.addFooter();
  };

  /**
   * Append footer to Blanks block.
   */
  C.prototype.addFooter = function () {
    this._$footer = this._$inner.append('<div class="h5p-blanks-footer"><div class="h5p-blanks-evaluation-container"></div></div>');

    if (this.params.displaySolutionsButton === true) {
      this.addSolutionButton();
    }
  };

  /**
   * Add show solution button.
   */
  C.prototype.addSolutionButton = function () {
    var that = this;

    if (this._$solutionButton !== undefined) {
      return;
    }

    this._$solutionButton = $('<button class="h5p-button" type="submit">' + this.params.showSolutions + '</button>').appendTo(this._$footer).click(function () {
      if (that._$solutionButton.hasClass('h5p-hide-solution')) {
        that.hideSolutions();
      }
      else {
        var missingFields = false;
        for (var i = 0; i < that.$inputs.length; i++) {
          for (var j = 0; j < that.$inputs[i].length; j++) {
            var $input = that.$inputs[i][j];

            if (H5P.trim($input.val()) === '') {
              if (!missingFields) {
                missingFields = true;
                C.setFocus($input);
              }
              $input.addClass('h5p-not-filled-out');
            }
          }
        }
        if (missingFields) {
          that.hideSolutions();
        }
        else {
          that.showSolutions();
          if (that.params.postUserStatistics) {
            H5P.setFinished(that.id, that.getScore(), that.getMaxScore());
          }
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
    var that = this;

    for (var i = 0; i < this.params.questions.length; i++) {
      var question = this.params.questions[i];
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
            question = question.slice(0, first) + '<span class="h5p-input-wrapper"><input type="text" class="h5p-text-input"></span>' + question.slice(second + 1);
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
      }).change(function () {
        $(that).trigger('h5pQuestionAnswered');
      });
    }
  };

  /**
   * Display the correct solution for the input boxes.
   */
  C.prototype.showSolutions = function () {
    if (this.displayingSolution) {
      return;
    }

    if (this._$solutionButton !== undefined) {
      if (this.params.enableTryAgain) {
        this._$solutionButton.text(this.params.hideSolutions).addClass('h5p-hide-solution');
      }
      else {
        this._$solutionButton.remove();
      }
    }

    for (var i = 0; i < this.$inputs.length; i++) {
      for (var j = 0; j < this.$inputs[i].length; j++) {
        var $input = this.$inputs[i][j].attr('disabled', true);
        var $wrapper = $input.parent();
        if (this.correctAnswer(i, j)) {
          $wrapper.addClass('h5p-correct');
          // $('<span class="h5p-correct-answer">&#x2713; </span>').insertBefore($input.addClass('h5p-correct'));
        }
        else {
          $('<span class="h5p-correct-answer"> ' + this.answers[i][j].join('/') + '</span>').insertAfter($wrapper.addClass('h5p-wrong'));
        }
      }
    }

    var $evaluation = this._$footer.find('.h5p-blanks-evaluation-container'),
      score = this.params.score.replace('@score', this.getScore()).replace('@total', this.getMaxScore());
    $evaluation.append('<div class="h5p-blanks-evaluation-score-emoticon"></div>');
    $evaluation.append('<div class="h5p-blanks-evaluation-score">' + score + '</div>');

    if (this.getScore() === this.getMaxScore()) {
      $evaluation.addClass('max-score');
    }
    else {
      $evaluation.removeClass('max-score');
    }

    this.displayingSolution = true;
  };

  /**
   * Hide solutions. (/try again)
   */
  C.prototype.hideSolutions = function () {
    if (this._$solutionButton !== undefined) {
      this._$solutionButton.text(this.params.showSolutions).removeClass('h5p-hide-solution');
    }

    // Clean solution from quiz
    this._$inner.find('input').attr('disabled', false);
    this._$inner.find('.h5p-wrong, .h5p-correct').removeClass('h5p-wrong h5p-correct');
    this._$inner.find('.h5p-correct-answer').remove();

    // Clear evaluation section.
    this._$footer.find('.h5p-blanks-evaluation-container').html('');

    this.displayingSolution = false;
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
   * @param {Number} block
   * @param {Number} question
   * @returns {Boolean}
   */
  C.prototype.correctAnswer = function (block, question) {
    var answer = H5P.trim(this.$inputs[block][question].val());
    var correctAnswers = this.answers[block][question];
    for (var i = 0; i < correctAnswers.length; i++) {
      if (answer === correctAnswers[i]) {
        return true;
      }
    }

    return false;
  };

  /**
   * Checks if all has been answered.
   *
   * @returns {Boolean}
   */
  C.prototype.getAnswerGiven = function () {
    for (var i = 0; i < this.$inputs.length; i++) {
      for (var j = 0; j < this.$inputs[i].length; j++) {
        var $input = this.$inputs[i][j];
        if (H5P.trim($input.val()) === '') {
          return false;
        }
      }
    }
    return true;
  };

  /**
   * Helps set focus the given input field.
   * @param {jQuery} $input
   */
  C.setFocus = function ($input) {
    setTimeout(function () {
      $input.focus();
    }, 1);
  };

  return C;
})(H5P.jQuery);