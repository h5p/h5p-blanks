var H5PPresave = H5PPresave || {};

H5PPresave['H5P.Blanks'] = function (content, finished) {
    if (typeof content === "undefined" || !content.hasOwnProperty('questions') || !Array.isArray(content.questions) ) {
        throw {
            name: 'Invalid Fill in the blanks Error',
            message: "Could not find expected semantics in content."
        };
    }

    var score = content.questions
            .map(function (question) {
                var pattern = /\*[^\*]+\*/g;
                return question.match(pattern || []).length;
            })
            .reduce(function (previous, current) {
                return previous + current;
            }, 0);

    if( isNaN(score) || score < 0){
        throw {
            name: 'InvalidMaxScore Error',
            message: "Could not calculate the max score for this content. The max score is assumed to be 0. Contact your administrator if this isn’t correct."
        };
    }

    finished({maxScore: score});
};
