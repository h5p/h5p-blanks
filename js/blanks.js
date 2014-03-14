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
      tryAgain: "Try again",
      checkAnswer: "Check",
      reset: "Reset",
      notFilledOut: "Please fill in all blanks",
      enableTryAgain: true,
      caseSensitive: true,
      displaySolutionsButton: true,
      postUserStatistics: (H5P.postUserStatistics === true)
    }, params);

    this.answers = [];
    this.$inputs = [];
    this.displayingSolution = false;
  }

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

    // If reattaching, we no longer show solution. So forget that we
    // might have done so before.
    this.displayingSolution = false;
  };

  /**
   * Append footer to Blanks block.
   */
  C.prototype.addFooter = function () {
    this._$footer = $('<div class="h5p-blanks-footer"><div class="h5p-blanks-evaluation-container"></div></div>').appendTo(this._$inner);
    this.addButtons();
  };

  /**
   * Add show solution button.
   */
  C.prototype.addButtons = function () {
    var that = this;

    if (this._$checkAnswerButton !== undefined) {
      return;
    }
    
    var STATE_ONGOING = 'ongoing';
    var STATE_CHECKING = 'checking';
    var STATE_SHOWING_SOLUTION = 'showing-solution';
    
    function toggleButtons(state) {
      that._$footer.attr("data-state", state);
    }
    
    toggleButtons(STATE_ONGOING);
    
    // Check answer button
    this._$checkAnswerButton = $('<button/>', {'class': 'h5p-button h5p-check-answer', type: 'button', text: this.params.checkAnswer})
      .appendTo(that._$footer)
      .click(function () {
        toggleButtons(STATE_CHECKING);
        that.markResults();
        that.showEvaluation();
      }
    );
    
    // Display solution button
    if (this.params.displaySolutionsButton === true) {
      this._$solutionButton = $('<button class="h5p-button h5p-show-solution" type="button">' + this.params.showSolutions + '</button>')
        .appendTo(this._$footer)
        .click(function () {
          if (that.allBlanksFilledOut()) {
            toggleButtons(STATE_SHOWING_SOLUTION);
            that.showSolutions();
            if (that.params.postUserStatistics === true) {
              H5P.setFinished(that.id, that.getScore(), that.getMaxScore());
            }
          }
        }
      );
    }
    
    // Try again button 
    if(this.params.enableTryAgain === true) {
      this._$tryAgainButton = $('<button/>', {'class': 'h5p-button h5p-try-again', type: 'button', text: this.params.tryAgain})
        .appendTo(this._$footer)
        .click(function () {
          toggleButtons(STATE_ONGOING);
          that.removeMarkedResults();
          that.hideEvaluation();
        }
      );
    }
    
    // Reset button
    this._$resetButton = $('<button/>', {'class': 'h5p-button h5p-reset', type: 'button', text: this.params.reset})
      .appendTo(this._$footer)
      .click(function () {
        toggleButtons(STATE_ONGOING);
        that.removeMarkedResults();
        that.hideSolutions();
        that.hideEvaluation();
        that.clearAnswers();
      }
    );
  };

  /**
   * Check if all blanks are filled out. Warn user if not
   */
  C.prototype.allBlanksFilledOut = function () {
    var that = this;
    
    for (var i = 0; i < that.$inputs.length; i++) {
      for (var j = 0; j < that.$inputs[i].length; j++) {
        if (H5P.trim(that.$inputs[i][j].val()) === '') {
          this._$evaluationScore.text(that.params.notFilledOut);
          this._$evaluation.addClass('not-filled-out');
          setTimeout(function(){
            that._$evaluation.removeClass('not-filled-out');
          }, 1000);
          return false;
        }
      }
    }
    return true;
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
      var first = 1;
      var second = 1;
      
      do {
        first = question.indexOf('*');
        if (first !== -1) {
          second = question.indexOf('*', first + 1);
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
      }).each(function () {
        $inputs.push($(this));
      }).change(function () {
        $(that).trigger('h5pQuestionAnswered');
      });
    }
  };

  /**
   * Mark which answers are correct and which are wrong
   */
  C.prototype.markResults = function () {
    for (var i = 0; i < this.$inputs.length; i++) {
      for (var j = 0; j < this.$inputs[i].length; j++) {
        var $input = this.$inputs[i][j].attr('disabled', true);
        var $wrapper = $input.parent();
        $wrapper.addClass(this.correctAnswer(i, j) ? 'h5p-correct' : 'h5p-wrong');
      }
    }
  };
  
  /**
   * Removed marked results
   */
  C.prototype.removeMarkedResults = function () {
    this._$inner.find('.h5p-input-wrapper').removeClass('h5p-correct h5p-wrong');
    this._$inner.find('.h5p-input-wrapper input').attr('disabled', false);
  };
  
  /**
   * Display the correct solution for the input boxes.
   */
  C.prototype.showSolutions = function () {
    if (this.displayingSolution) {
      return;
    }

    for (var i = 0; i < this.$inputs.length; i++) {
      for (var j = 0; j < this.$inputs[i].length; j++) {
        var $wrapper = this.$inputs[i][j].parent();
        if (!this.correctAnswer(i, j)) {
          $('<span class="h5p-correct-answer"> ' + this.answers[i][j].join('/') + '</span>').insertAfter($wrapper);
        }
      }
    }

    this.displayingSolution = true;
  };
  
  /**
   * Show evaluation widget, i.e: 'You got x of y blanks correct'
   */
  C.prototype.showEvaluation = function () {
    this._$evaluation = this._$footer.find('.h5p-blanks-evaluation-container');
    var maxScore = this.getMaxScore();
    var score = this.getScore();
    var scoreText = this.params.score.replace('@score', score).replace('@total', maxScore);
    this._$evalutaionEmoticon = $('<div class="h5p-blanks-evaluation-score-emoticon"></div>').appendTo(this._$evaluation);
    this._$evaluationScore = $('<div class="h5p-blanks-evaluation-score">' + scoreText + '</div>').appendTo(this._$evaluation);
    
    if (score === maxScore) {
      this._$evaluation.addClass('max-score');
    }
    else {
      this._$evaluation.removeClass('max-score');
    }
  };
  
  /**
   * Hide the evaluation widget
   */
  C.prototype.hideEvaluation = function () {
    // Clear evaluation section.
    this._$footer.find('.h5p-blanks-evaluation-container').html('');
  };

  /**
   * Hide solutions. (/try again)
   */
  C.prototype.hideSolutions = function () {
    // Clean solution from quiz
    this._$inner.find('.h5p-correct-answer').remove();
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
    
    if (this.params.caseSensitive !== true) {
      answer = answer.toLowerCase();
    }
    
    for (var i = 0; i < correctAnswers.length; i++) {
      var correctAnswer = correctAnswers[i];
      if (this.params.caseSensitive !== true) {
        correctAnswer = correctAnswer.toLowerCase();
      }
    
      if (answer === correctAnswer) {
        return true;
      }
    }

    return false;
  };
  
  /**
   * Clear the user's answers
   */
  C.prototype.clearAnswers = function () {
    this._$inner.find('.h5p-text-input').val('');
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
