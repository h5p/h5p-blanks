var H5PPresave = H5PPresave || {};

/**
 * Resolve the presave logic for the content type Fill in the Blanks
 *
 * @param {object} content
 * @param finished
 * @constructor
 */
H5PPresave['H5P.Blanks'] = function (content, finished) {
  var presave = H5PEditor.Presave;

  if (isContentInvalid()) {
    throw {
      name: 'Invalid Fill in the blanks Error',
      message: 'Could not find expected semantics in content.'
    };
  }

  var score = content.questions
    .map(function (question) {
      var pattern = /\*[^\*]+\*/g;
      var matches = question.match(pattern);
      return Array.isArray(matches) ? matches.length : 0;
    })
    .reduce(function (previous, current) {
      return previous + current;
    }, 0);

  presave.validateScore(score);

  // Clean HTML tags from all questions
  content.questions = content.questions.map((question) => cleanQuestionItems(question));

  finished({
    maxScore: score,
    filteredParams: content
  });

  /**
   * Check if required parameters is present
   * @return {boolean}
   */
  function isContentInvalid() {
    return !presave.checkNestedRequirements(content, 'content.questions') || !Array.isArray(content.questions);
  }

  /**
   * Strip HTML tags from a text.
   * Would be more robust with DOMParser, but this is faster.
   * @param {string} text Text to be cleaned.
   * @return {string} Cleaned text.
   */
  function cleanHtmlTags(text = '') {
    return text.replace(/<\/?[^>]+(>|$)/g, '');
  }

  /**
   * Clean HTML tags from question items
   * @param {string} question Question to be cleaned.
   * @return {string} Cleaned question.
   */
  function cleanQuestionItems(question = '') {
    return question.replace(/\*(.*?)\*/ig, (match) => {
      const chunk = match.split(':')[0];
      const cleanedChunk = cleanHtmlTags(chunk);
      return match.replace(chunk, cleanedChunk);
    });
  }
};
