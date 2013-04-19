var H5P = H5P || {};

H5P.Blanks = function (options, contentId) {
  var that = this;
  var $panel;
  var $answerPanel;
  var $ = H5P.jQuery;

  this.options = H5P.jQuery.extend({}, {
    text: "Fill in",
    questions: [
      "2 + 2 = *4*"
    ],
    score: "You got @score of @total points."
  }, options);

  if (!this instanceof H5P.Blanks){
    return new H5P.Blanks(options, contentId);
  }

  var getAnswerGiven = function () {
    var $blanks = $panel.find('.h5p-blanks-input');
    var total = $blanks.length;
    var answers = 0;
    $blanks.each(function (idx, el) {
      var userAnswer = $(el).val().trim();
      if (userAnswer !== '') {
        answers++;
      }
    });
    return answers === total;
  };

  var getScore = function () {
    var score = 0;
    $panel.find('.h5p-blanks-question').each(function (idx, el) {
      var $input = $(el).find('input');
      var answer = that.options.questions[idx].replace(/^.*?\*([^*]+)\*.*$/, '$1').trim().split('/');
      for (var i = 0; i < answer.length; i++) {
        var userAnswer = $input.val().trim();
        score += userAnswer === answer[i].trim() ? 1 : 0;
      }
    });
    return score;
  };

  var getMaxScore = function () {
    return $panel.find('.h5p-blanks-input').length;
  };

  var showSolutions = function () {
    $answerPanel.html('');
    addElement($answerPanel, 'h5p-button', { text: 'Lukk', click: hideAnswer });
    $answerPanel.animate({ top: '0%' }, 'slow');

    $panel.find('.h5p-blanks-question').each(function (idx, el) {
      var answer = that.options.questions[idx].replace(/^.*?\*([^\*]+)\*.*$/, '$1').trim().split('/');
      var list = that.options.questions[idx].replace(/^.*?\*([^\*]+)\*.*$/, '$1').trim();
      var userAnswer = $(el).find('input').val().trim();
      var correct = 0;
      for (var i = 0; i < answer.length; i++) {
        if (userAnswer === answer[i]) {
          correct = 1;
          break;
        }
      }
      var replace = correct ? '<span class="h5p-correct-answer"><b>✓ ' + userAnswer + '</b></span>' : ' <span class="h5p-wrong-answer">' + userAnswer + '</span> <span class="h5p-answer-list">' + list + '</span>';
      var text = that.options.questions[idx].replace(/\*[^\*]+\*/, replace);
      addElement($answerPanel, 'h5p-answer-question', {text: text});
    });
    var score = that.options.score.replace('@score', getScore()).replace('@total', getMaxScore());
    addElement($answerPanel, 'h5p-score', { text: score });
  };

  var buttons = Array(
    {
      text: 'Vis fasit',
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
      top: '-100%'
    }, 'slow');
  };

  var attach = function ($wrapper) {
    $wrapper.html('').addClass('h5p-blanks');

    $panel = $('<div class="blanks-panel"></div>').appendTo($wrapper);
    $panel.append('<h2>' + that.options.text + '</h2>');

    // Add buttons
    for (var i = 0; i < buttons.length; i++) {
      addElement($panel, 'h5p-button h5p-show-solutions h5p-hidden-solution-btn', buttons[i]);
      // h5p-hidden-solution-btn gets hidden if parent activates the solutions
      // h5p-show-solutions can't be used for this since styling might be applied to it
    }

    // Add questions
    for (var i = 0; i < that.options.questions.length; i++) {
      var input = '<input class="h5p-blanks-input" type="text"/>';
      var text = that.options.questions[i].replace(/\*[^\*]+\*/, input);
      var $element = addElement($panel, 'h5p-blanks-question', { text: text });
      if (!i) {
        $element.focus();
      }
      $element.find('input').blur(function() {
        if (getAnswerGiven()) {
          $(returnObject).trigger('h5pQuestionAnswered');
        }
      });
    }

    $answerPanel = addElement($wrapper, 'h5p-answer-panel', {
      top: '-100%',
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
