var H5P = H5P || {};

/**
 * Blanks(cloze text) module
 *
 * @param {jQuery} $
 */
H5P.Blanks = (function ($) {
  var STATE_ONGOING = 'ongoing';
  var STATE_CHECKING = 'checking';
  var STATE_SHOWING_SOLUTION = 'showing-solution';
  var STATE_FINISHED = 'finished';
  
  /**
   * Initialize module.
   *
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @returns {_L8.C}
   */
  function C(params, id) {
    this.id = this.contentId = id;
    H5P.EventDispatcher.call(this);

    // Set default behavior.
    this.params = $.extend({}, {
      text: "Fill in",
      questions: [
        "2 + 2 = *4*"
      ],
      userAnswers: [],
      score: "You got @score of @total points.",
      showSolutions: "Show solutions",
      tryAgain: "Try again",
      checkAnswer: "Check",
      changeAnswer: "Change answer",
      notFilledOut: "Please fill in all blanks",
      behaviour: {
        enableRetry: true,
        enableSolutionsButton: true,
        caseSensitive: true,
        showSolutionsRequiresInput: true,
        autoCheck: false,
        separateLines: false
      },
      postUserStatistics: (H5P.postUserStatistics === true)
    }, params);

    this.clozes = [];
  };

  C.prototype = Object.create(H5P.EventDispatcher.prototype);
  C.prototype.constructor = C;

  /**
   * Append field to wrapper.
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    // Reset clozes in case we are re-attaching
    this.clozes = [];

    this._$inner = $container.addClass('h5p-blanks').html('<div class="h5p-inner"><div class="h5p-blanks-title">' + this.params.text + '</div></div>').children();
    this.appendQuestionsTo(this._$inner);

    if (this.params.behaviour.separateLines) {
      this._$inner.addClass('h5p-separate-lines');
    }

    // Add "show solutions" button and evaluation area
    this.addFooter();
    
    this.trigger('resize');
  };

  /**
   * Append questitons to the given container.
   *
   * @param {jQuery} $container
   */
  C.prototype.appendQuestionsTo = function ($container) {
    var self = this;

    for (var i = 0; i < self.params.questions.length; i++) {
      var question = self.params.questions[i];

      // Go through the text and replace all the asterisks with input fields
      var clozeEnd, clozeStart = question.indexOf('*');
      while (clozeStart !== -1 && clozeEnd !== -1) {
        clozeStart++;
        clozeEnd = question.indexOf('*', clozeStart);
        if (clozeEnd === -1) {
          continue; // No end
        }

        // Create new cloze
        var defaultUserAnswer = self.params.userAnswers.length > self.clozes.length
          ? self.params.userAnswers[self.clozes.length]
          : null;
        var cloze = new Cloze(question.substring(clozeStart, clozeEnd), self.params.behaviour, defaultUserAnswer);
        clozeEnd++;

        question = question.slice(0, clozeStart - 1) + cloze + question.slice(clozeEnd);
        self.clozes.push(cloze);

        // Find the next cloze
        clozeStart = question.indexOf('*', clozeEnd);
      }

      $container[0].innerHTML += '<div>' + question + '</div>';
    }

    // Set input fields.
    $container.find('input').each(function (i) {
      var afterCheck;
      if (self.params.behaviour.autoCheck) {
        afterCheck = function () {
          if (self.done || self.getAnswerGiven()) {
            // All answers has been given. Show solutions button.
            self.toggleButtonVisibility(STATE_CHECKING);
            self.showEvaluation();
            self.done = true;
            if (self.params.postUserStatistics === true) {
              H5P.setFinished(self.id, self.getScore(), self.getMaxScore());
            }
          }
        };
      }
      self.clozes[i].setInput($(this), afterCheck, function () {
        self.toggleButtonVisibility(STATE_ONGOING);
        self.hideEvaluation();
      });
    }).keydown(function (event) {
      if (event.keyCode === 13) {
        return false; // Prevent form submission on enter key
      }
    }).one('change', function () {
      self.triggerXAPI('attempted');
    });
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
    if (this._$solutionButton !== undefined) {
      return; // Buttons already added.
    }

    var that = this;
    var $buttonBar = $('<div/>', {'class': 'h5p-button-bar'});
    
    if (!that.params.behaviour.autoCheck) {
      // Check answer button
      this._$checkAnswerButton = $('<button/>', {
        'class': 'h5p-button h5p-check-answer',
        type: 'button',
        text: this.params.checkAnswer
      }).appendTo($buttonBar)
        .click(function () {
          that.toggleButtonVisibility(STATE_CHECKING);
          that.markResults();
          that.showEvaluation();
          var event = that.createXAPIEventTemplate('completed');
          event.setScoredResult(that.getScore(), that.getMaxScore());
          that.trigger('xAPI', event);
        });
    }

    // Display solution button
    this._$solutionButton = $('<button/>', {
      'class': 'h5p-button h5p-show-solution',
      style: 'display:' + (this.params.behaviour.enableSolutionsButton === true ? 'block;' : 'none;'),
      type: 'button',
      text: this.params.showSolutions
    }).appendTo($buttonBar)
      .click(function () {
        if (that.allBlanksFilledOut()) {
          that.toggleButtonVisibility(STATE_SHOWING_SOLUTION);
          that.showCorrectAnswers();
          var event = that.createXAPIEventTemplate('completed');
          event.setScoredResult(that.getScore(), that.getMaxScore());
          that.trigger('xAPI', event);
        }
      });
    
    // Try again button 
    if(this.params.behaviour.enableRetry === true) {
      this._$tryAgainButton = $('<button/>', {'class': 'h5p-button h5p-try-again', type: 'button', text: this.params.tryAgain})
        .appendTo($buttonBar)
        .click(function () {
          that.removeMarkedResults();
          that.hideSolutions();
          that.hideEvaluation();
          that.clearAnswers();
          that.done = false;
          that.toggleButtonVisibility(STATE_ONGOING);
          that._$inner.find('input:first').focus();
        }
      );
    }

    $buttonBar.appendTo(this._$footer);

    this.toggleButtonVisibility(STATE_ONGOING);
  };

  /**
   * Toggle buttons dependent of state.
   *
   * Using CSS-rules to conditionally show/hide using the data-attribute [data-state]
   */
  C.prototype.toggleButtonVisibility = function (state) {
    // The show solutions button is hidden if all answers are correct
    var allCorrect = (this.getScore() === this.getMaxScore());
    if (this.params.behaviour.autoCheck && allCorrect) {
      // We are viewing the solutions
      state = STATE_FINISHED;
    }

    var toggle = (state === STATE_CHECKING && !allCorrect);
    if (this.params.behaviour.enableSolutionsButton) {
      this._$solutionButton.toggle(toggle);
    }
    var toggleRetry = (((state === STATE_CHECKING) && !allCorrect) || (state === STATE_SHOWING_SOLUTION));
    if (this.params.behaviour.enableRetry) {
      this._$tryAgainButton.toggle(toggleRetry);
    }

    this._$footer.attr("data-state", state);
    
    if (!this.params.behaviour.autoCheck && state !== this.lastState ) {
      this.lastState = state;

      if (state !== STATE_ONGOING) {
        // Setting focus on first visible button!
        this._$footer.find("button:visible").eq(0).focus();
      }
    }
  };

  /**
   * Check if all blanks are filled out. Warn user if not
   */
  C.prototype.allBlanksFilledOut = function () {
    var self = this;

    if (!self.getAnswerGiven()) {
      self._$evaluationScore.text(self.params.notFilledOut);
      self._$evaluation.addClass('not-filled-out');
      setTimeout(function(){
        self._$evaluation.removeClass('not-filled-out');
      }, 1000);

      return false;
    }

    return true;
  };

  /**
   * Mark which answers are correct and which are wrong and disable fields if retry is off.
   */
  C.prototype.markResults = function () {
    var self = this;
    for (var i = 0; i < self.clozes.length; i++) {
      self.clozes[i].checkAnswer();
      if (!self.params.behaviour.enableRetry) {
        self.clozes[i].disableInput();
      }
    }
  };

  /**
   * Removed marked results
   */
  C.prototype.removeMarkedResults = function () {
    this._$inner.find('.h5p-input-wrapper').removeClass('h5p-correct h5p-wrong');
    this._$inner.find('.h5p-input-wrapper > input').attr('disabled', false);
  };


  /**
   * Displays the correct answers
   */
  C.prototype.showCorrectAnswers = function () {
    var self = this;
    this.hideSolutions();

    for (var i = 0; i < self.clozes.length; i++) {
      self.clozes[i].showSolution();
    }
  };

  /**
   * Display the correct solution for the input boxes.
   *
   * This is invoked from CP - be carefull!
   */
  C.prototype.showSolutions = function () {
    this.params.behaviour.enableSolutionsButton = true;
    this.toggleButtonVisibility(STATE_FINISHED);
    this.markResults();
    this.showCorrectAnswers();
    this.showEvaluation();
    //Hides all buttons in "show solution" mode.
    this.hideButtons();
  };

  /**
   * Resets the complete task.
   * Used in contracts.
   * @public
   */
  C.prototype.resetTask = function () {
    this.hideEvaluation();
    this.hideSolutions();
    this.clearAnswers();
    this.removeMarkedResults();
    this.toggleButtonVisibility(STATE_ONGOING);
  };

  /**
   * Hides all buttons.
   * @public
   */
  C.prototype.hideButtons = function () {
    this.toggleButtonVisibility(STATE_FINISHED);
  };

  /**
   * Show evaluation widget, i.e: 'You got x of y blanks correct'
   */
  C.prototype.showEvaluation = function () {
    this.hideEvaluation();

    this._$evaluation = this._$footer.find('.h5p-blanks-evaluation-container');
    var maxScore = this.getMaxScore();
    var score = this.getScore();
    var scoreText = this.params.score.replace('@score', score).replace('@total', maxScore);
    this._$evalutaionEmoticon = $('<div class="h5p-blanks-evaluation-score-emoticon"></div>').appendTo(this._$evaluation);
    this._$evaluationScore = $('<div class="h5p-blanks-evaluation-score">' + scoreText + '</div>').appendTo(this._$evaluation);

    if (score === maxScore) {
      this._$evaluation.addClass('max-score');
      this.toggleButtonVisibility(STATE_FINISHED);
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
  };

  /**
   * Get maximum number of correct answers.
   *
   * @returns {Number} Max points
   */
  C.prototype.getMaxScore = function () {
    var self = this;
    return self.clozes.length;
  };

  /**
   * Count the number of correct answers.
   *
   * @returns {Number} Points
   */
  C.prototype.getScore = function () {
    var self = this;
    var correct = 0;
    for (var i = 0; i < self.clozes.length; i++) {
      if (self.clozes[i].correct()) {
        correct++;
      }
      self.params.userAnswers[i] = self.clozes[i].getUserAnswer();
    }

    return correct;
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
    var self = this;
    
    if (this.params.behaviour.showSolutionsRequiresInput === true) {
      for (var i = 0; i < self.clozes.length; i++) {
        if (!self.clozes[i].filledOut()) {
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

  /**
   * Simple private class for keeping track of clozes.
   *
   * @param {String} answer
   * @param {Object} behaviour Behaviour for the task
   * @returns {_L8.Cloze}
   */
  function Cloze(answer, behaviour, defaultUserAnswer) {
    var self = this;
    var $input, $wrapper;
    var answers = [];
    var tip;

    var answersAndTip = answer.split(':');

    if (answersAndTip.length > 0) {
      answer = answersAndTip[0];
      answers = answer.split('/');

      // Trim answers
      for (var i = 0; i < answers.length; i++) {
        answers[i] = H5P.trim(answers[i]);
        if (behaviour.caseSensitive !== true) {
          answers[i] = answers[i].toLowerCase();
        }
      }

      if (answersAndTip.length === 2) {
        tip = answersAndTip[1];
      }
    }

    /**
     * Public
     *
     * @returns {String} Trimmed answer
     */
    this.getUserAnswer = function () {
      return H5P.trim($input.val());
    };

    /**
     * Private. Check if the answer is correct.
     *
     * @param {String} answered
     */
    var correct = function (answered) {
      if (behaviour.caseSensitive !== true) {
        answered = answered.toLowerCase();
      }

      for (var i = 0; i < answers.length; i++) {
        if (answered === answers[i]) {
          return true;
        }
      }
      return false;
    };

    /**
     * Public. Check if filled out.
     *
     * @param {Boolean}
     */
    this.filledOut = function () {
      var answered = this.getUserAnswer();
      // Blank can be correct and is interpreted as filled out.
      return (answered !== '' || correct(answered));
    };

    /**
     * Public. Check the cloze and mark it as wrong or correct.
     */
    this.checkAnswer = function () {
      var isCorrect = correct(this.getUserAnswer());
      if (isCorrect) {
        $wrapper.addClass('h5p-correct');
        $input.attr('disabled', true);
      }
      else {
        $wrapper.addClass('h5p-wrong');
      }
    };

    /**
     * @public
     * Disables further input from this button.
     */
    this.disableInput = function () {
      $input.attr('disabled', true);
    };
    
    /** 
     * Public. Show the correct solution.
     */
    this.showSolution = function () {
      if (correct(this.getUserAnswer())) {
        return; // Only for the wrong ones
      }

      $('<span class="h5p-correct-answer"> ' + answer + '</span>').insertAfter($wrapper);
      $input.attr('disabled', true);
    };

    /**
     * Public.
     *
     * @returns {Boolean}
     */
    this.correct = function () {
      return correct(this.getUserAnswer());
    };

    /**
     * Public. Set input element.
     *
     * @param {jQuery} $element
     */
    this.setInput = function ($element, afterCheck, afterFocus) {
      $input = $element;
      $wrapper = $element.parent();

      // Add tip if tip is set
      if(tip !== undefined && tip.trim().length > 0) {
        $wrapper.addClass('has-tip').append(H5P.JoubelUI.createTip(tip, $wrapper.parent()));
      }

      if (afterCheck !== undefined) {
        $input.blur(function () {
          if (self.filledOut()) {
            // Check answers
            if (!behaviour.enableRetry) {
              self.disableInput();
            }
            self.checkAnswer();
            afterCheck();
          }
        });
      }
      $input.focus(function () {
        $wrapper.removeClass('h5p-wrong');
        if (afterFocus !== undefined) {
          afterFocus();
        }
      });
    };

    /**
     * Public.
     *
     * @returns {String} Cloze html
     */
    this.toString = function () {
      var extra = defaultUserAnswer ? ' value="' + defaultUserAnswer + '"' : '';
      return '<span class="h5p-input-wrapper"><input type="text" class="h5p-text-input" autocapitalize="off"' + extra + '></span>';
    };
  }

  return C;
})(H5P.jQuery);
