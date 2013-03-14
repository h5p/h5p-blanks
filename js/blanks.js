window.H5P = window.H5P || {};

H5P.Blanks = function (options, contentId) {
	var panel;
	var target;
	var answer_panel;
	var $ = H5P.jQuery;

	if ( !(this instanceof H5P.Blanks) ){
		return new H5P.Blanks(options, contentId);
	}

	var getAnswerGiven = function(){
		var total = totalScore();
		var answers = 0;
		panel.find('.question').each(function (idx, el) {
			var index = parseInt(el.id.replace(/^.*-/,''));
			var input = $('#'+panel.attr('id')+'-input-'+index);
			var user_answer = input.val().trim();
			if(user_answer != ''){
				answers++;
			}
		});
		console.log('a='+answers);
		console.log('t='+total);
		return answers == total;
	}

	var getScore = function(){
		var score = 0;
		panel.find('.question').each(function (idx, el) {
			var index = parseInt(el.id.replace(/^.*-/,''));
			var input = $('#'+panel.attr('id')+'-input-'+index);
			var question = $('#'+panel.attr('id')+'-question-'+index);
			var answer = options.questions[index].replace(/^.*?\*([\w]*)\*.*$/, '$1').trim();
			var user_answer = input.val().trim();
			score += user_answer == answer ? 1 : 0;
		});
		return score;
	}

	var totalScore = function(){
		var score = 0;
		panel.find('.question').each(function (idx, el) {
			score++;
		});
		return score;
	};

	var showScore = function(){
		answer_panel.html('');
		addElement(answer_panel, 'ok', 'button', { text: 'Lukk', bottom: '20px', right: '20px', click: hideAnswer });
		answer_panel.animate({
			top: '0px'
		}, 'slow');

		// TODO: Remove confirmations
		console.log("Score " + getScore());
		console.log("Total " + totalScore());
		console.log("given " + (getAnswerGiven() ? "true" : "false"));

		panel.find('.question').each(function (idx, el) {
			var index = parseInt(el.id.replace(/^.*-/,''));
			var input = $('#'+panel.attr('id')+'-input-'+index);
			var question = $('#'+panel.attr('id')+'-question-'+index);
			var answer = options.questions[index].replace(/^.*?\*([\w]*)\*.*$/, '$1').trim();
			var user_answer = input.val().trim();
			var replace = user_answer == answer ? '<span class="correct-answer"><b>✓ '+answer+'</b></span>' : ' <span class="wrong-answer">'+user_answer+'</span> <b>'+answer+'</b>';
			var text = options.questions[index].replace(/\*[\w]*\*/, replace);
			addElement(answer_panel, 'answer-panel', 'answer-question', {text: text});
		});
	}

	var buttons = Array(
		{
			text: 'Vis fasit',
			width: 100,
			right: 10,
			bottom: 10,
			click: showScore
		}
	);

	function addElement(container, id, className, el) {
		var text = el.text ? el.text : '';
		var $el = $('<div class="'+className+'">'+text+'</div>');
		container.append($el);
		if(el.top) {
			$el.css({ top: el.top});
		}
		if(el.left) {
			$el.css({ left: el.left});
		}
		if(el.right) {
			$el.css({ right: el.right});
		}
		if(el.bottom) {
			$el.css({ bottom: el.bottom});
		}
		if(id) {
			$el.attr('id', id);
		}
		if(el.height) {
			$el.css({ height: el.height });
		}
		if(el.width) {
			$el.css({ width: el.width });
		}
		if(el.click) {
			$el.click(el.click);
		}
		return $el;
	}

	var hideAnswer = function () {
		console.log("Hide");
		answer_panel.animate({
			top: -parseInt(panel.css('height'))
		}, 'slow');
	}

	var attach = function (el) {
		target = $(el);
		panel = addElement(target, 'panel-'+target.attr('data-content-id'), 'panel', options);
		answer_panel = addElement(panel, 'answerpanel-'+target.attr('data-content-id'), 'answer-panel', {
			top: -parseInt(panel.css('height')),
			height: panel.css('height'),
			width: panel.css('width')
		});

		// Add buttons
		for (var i = 0; i < buttons.length; i++) {
			$button = addElement(panel, null, 'button', buttons[i]);
			$button.click(buttons[i].click);
		}

		// Add questions
		for(var i=0; i < options.questions.length; i++) {
			var answer = options.questions[i].replace(/^.*?\*([\w]*)\*.*$/, '$1');
			var input = '<input id="'+panel.attr('id')+'-input-'+i+'" type="text"/>';
			var text = options.questions[i].replace(/\*[\w]*\*/, input);
			addElement(panel, panel.attr('id')+'-question-'+i, 'question', { text: text });
			if( ! i){
				$('#input-0').focus();
			}
		}

		return this;
  };

  var returnObject = {
		attach: attach,
		machineName: 'H5P.Blanks',
		getScore: getScore,
		getAnswerGiven: getAnswerGiven,
		totalScore: totalScore
  };

  return returnObject;
};
