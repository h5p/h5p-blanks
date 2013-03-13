window.H5P = window.H5P || {};

H5P.Blanks = function (options, contentId) {

	var $ = H5P.jQuery;

	if ( !(this instanceof H5P.Blanks) ){
		return new H5P.Blanks(options, contentId);
	}

	var cp = H5P.getContentPath(contentId);

	var showScore = function(){
	}

	var buttons = Array(
		{
			text: 'Vis fasit',
			width: 100,
			right: 69,
			bottom: 100,
			click: showScore
		}
	);

	var attach = function (target) {
		var position = $(target).position;

		function addElement(id, className, el) {
			var x=0;
			var y=0;
			var text = el.text ? el.text : '';
			var $el = $('<div class="'+className+'">'+text+'</div>');
			target.append($el);
			if(el.top) {
				y = Math.round(position.top + el.top);
			}
			if(el.left) {
				// x = Math.round(position.left + el.left);
				x = el.left;
			}
			if(el.right) {
				x = Math.round(position.left + target.outerWidth() - el.right - $el.outerWidth());
			}
			if(el.bottom) {
				y = parseInt(position.top) + target.height - el.bottom - $el.outerHeight();
			}
			$el.css({ top: y });
			$el.css({ left: x + 'px' });
			$el.attr('data-x', x);
			$el.attr('data-y', y);
			if(id) {
				$el.attr('id', id);
			}
			if(el.scope) {
				$el.attr('data-scope', el.scope);
			}
			if(el.height) {
				$el.css({ height: el.height });
			}
			if(el.width) {
				$el.css({ width: el.width });
			}
			return $el;
		}

		// Add buttons
		for (var i = 0; i < buttons.length; i++) {
			$button = addElement(null, 'button', buttons[i]);
			$button.click(buttons[i].click);
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
