var H5P = H5P || {};

H5P.Blanks = function (options, contentId) {
  var that = this;
  var $panel;
  var $answerPanel;
  var $ = H5P.jQuery;
  var userAnswers = [];

  this.options = H5P.jQuery.extend({}, {
    text: "Fill in",
    questions: [
      "2 + 2 = *4*"
    ],
    score: "You got @score of @total points.",
    showSolutions: "Show solutions",
    hideSolutions: "Hide solutions"
  }, options);

  if (!this instanceof H5P.Blanks){
    return new H5P.Blanks(options, contentId);
  }

  var getAnswerGiven = function () {
    return userAnswers.length === $panel.find('.h5p-blanks-input').length;
  };

  var getScore = function () {
    var score = 0;
    for (var i = 0; i < userAnswers.length; i++) {
      var answer = that.options.questions[i].replace(/^.*?\*([^*]+)\*.*$/, '$1').trim().split('/');
      for (var j = 0; j < answer.length; j++) {
        var userAnswer = userAnswers[i];
        score += userAnswer === answer[j].trim() ? 1 : 0;
      }
    }
    return score;
  };

  var getMaxScore = function () {
    return $panel.find('.h5p-blanks-input').length;
  };

  var showSolutions = function () {
    $answerPanel.html('');
    $answerPanel.animate({ top: '0%' }, 'slow');

    $panel.find('.h5p-blanks-question').each(function (idx, el) {
      var $input = $(el).find('input');
      if ($input.length === 0) {
        return true;
      }
      var answer = that.options.questions[idx].replace(/^.*?\*([^\*]+)\*.*$/, '$1').trim().split('/');
      var list = that.options.questions[idx].replace(/^.*?\*([^\*]+)\*.*$/, '$1').trim();
      var userAnswer = $input.val().trim();
      var correct = 0;
      for (var i = 0; i < answer.length; i++) {
        if (userAnswer === answer[i]) {
          correct = 1;
          break;
        }
      }
      var replace = correct ? '<span class="h5p-correct-answer"><b> ' + userAnswer + '</b></span>' : ' <span class="h5p-wrong-answer">' + userAnswer + '</span> <span class="h5p-answer-list"><b>' + list + '</b></span>';
      var text = that.options.questions[idx].replace(/\*[^\*]+\*/, replace);
      var classType = correct ? 'h5p-answer-question-correct-answer' : 'h5p-answer-question-wrong-answer';      
      addElement($answerPanel, classType, {text: text});      
    });
    var $evaluation = $('<div class="h5p-blanks-evaluation-container"></div>');
    $answerPanel.append($evaluation);
    var score = that.options.score.replace('@score', getScore()).replace('@total', getMaxScore());
    if (getScore() === getMaxScore()) {
      $evaluation.append('<div class="h5p-blanks-evaluation-score-max-emoticon"></div>');
      addElement($evaluation, 'h5p-blanks-evaluation-score-max', { text: score });
    }
    else {
      $evaluation.append('<div class="h5p-blanks-evaluation-score-emoticon"></div>');
      addElement($evaluation, 'h5p-blanks-evaluation-score', { text: score });
    }    
    addElement($answerPanel, 'h5p-button', { text: that.options.hideSolutions, click: hideAnswer });
  };

  var buttons = Array(
    {
      text: this.options.showSolutions,
      click: showSolutions
    }
  );

  function addElement(container, className, el) {
    var text = el.text ? el.text : '';
    var $el = $('<div class="' + className + '">' + text + '</div>');
    container.append($el);
    if (el.top) {
      $el.css({ top: el.top});
    }
    if (el.left) {
      $el.css({ left: el.left});
    }
    if (el.right) {
      $el.css({ right: el.right});
    }
    if (el.bottom) {
      $el.css({ bottom: el.bottom});
    }
    if (el.height) {
      $el.css({ height: el.height });
    }
    if (el.width) {
      $el.css({ width: el.width });
    }
    if (el.click) {
      $el.click(el.click);
    }
    return $el;
  }

  var hideAnswer = function () {
    $answerPanel.animate({
      top: '-101%'
    }, 'slow');
  };

  var attach = function ($wrapper) {
    $wrapper.html('').addClass('h5p-blanks');

    $panel = $('<div class="blanks-panel"></div>').appendTo($wrapper);
    $panel.append('<div class="blanks-intro">' + that.options.text + '</div>');

    // Add questions
    for (var i = 0; i < that.options.questions.length; i++) {
      var input = '<input class="h5p-blanks-input" type="text" value="' + (userAnswers[i] === undefined ? '' : userAnswers[i]) + '"/>';
      var text = that.options.questions[i].replace(/\*[^\*]+\*/, input);
      var $element = addElement($panel, 'h5p-blanks-question', { text: text });
      if (!i) {
        $element.focus();
      }
      $element.find('input').data('i', i).blur(function() {
        var $this = $(this);
        var ans = $this.val().trim();
        if (ans) {
          userAnswers[$this.data('i')] = ans;
        }
        if (getAnswerGiven()) {
          $(returnObject).trigger('h5pQuestionAnswered');
        }
      });
    }

    // Add buttons
    for (var i = 0; i < buttons.length; i++) {
      addElement($panel, 'h5p-button h5p-solutions-button h5p-hidden-solution-btn', buttons[i]);
      // h5p-hidden-solution-btn gets hidden if parent activates the solutions
      // h5p-show-solutions can't be used for this since styling might be applied to it
    }

    $answerPanel = addElement($wrapper, 'h5p-answer-panel', {
      top: '-101%',
      height: '100%',
      width: '100%'
    });

    return this;
  };

  var returnObject = {
    attach: attach,
    machineName: 'H5P.Blanks',
    getScore: getScore,
    getAnswerGiven: getAnswerGiven,
    getMaxScore: getMaxScore,
    showSolutions: showSolutions
  };

  return returnObject;
};
