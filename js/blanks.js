window.H5P = window.H5P || {};

H5P.Blanks = function (options, contentId) {
	var panel;
	var target;
	var position;
	var $ = H5P.jQuery;

	if ( !(this instanceof H5P.Blanks) ){
		return new H5P.Blanks(options, contentId);
	}

	var cp = H5P.getContentPath(contentId);

	var showScore = function(){
		panel.find('.question').each(function (idx, el) {
			var index = parseInt(el.id.replace(/^.*-/,''));
			var input = $('#'+panel.attr('id')+'-input-'+index);
			var question = $('#'+panel.attr('id')+'-question-'+index);
			var answer = options.questions[index].replace(/^.*?\*([\w]*)\*.*$/, '$1').trim();
			var user_answer = input.val().trim();
			var replace = user_answer == answer ? '<span class="correct-answer"><b>✓ '+answer+'</b></span>' : ' <span class="wrong-answer">'+user_answer+'</span> <b>'+answer+'</b>';
			var text = options.questions[index].replace(/\*[\w]*\*/, replace);
			question.html(text);
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
		return $el;
	}

	var attach = function (el) {
		target = $(el);
		panel = addElement(target, 'panel-'+target.attr('data-content-id'), 'panel', options);

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
		getScore: function() {
		},
		getAnswerGiven: function() {
		},
		totalScore: function() {
		}
  };

  return returnObject;
};
