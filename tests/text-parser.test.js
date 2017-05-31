import test from 'ava';

const handleBlanks = function (question, handler) {
  // Go through the text and run handler on all asterisk
  var clozeEnd, clozeStart = question.indexOf('*');
  var self = this;
  while (clozeStart !== -1 && clozeEnd !== -1) {
    clozeStart++;
    clozeEnd = question.indexOf('*', clozeStart);
    if (clozeEnd === -1) {
      continue; // No end
    }
    var clozeContent = question.substring(clozeStart, clozeEnd);
    var replacer = '';
    if (clozeContent.length) {
      replacer = handler(parseSolution(clozeContent));
      clozeEnd++;
    }
    else {
      clozeStart += 1;
    }
    question = question.slice(0, clozeStart - 1) + replacer + question.slice(clozeEnd);
    clozeEnd -= clozeEnd - clozeStart - replacer.length;

    // Find the next cloze
    clozeStart = question.indexOf('*', clozeEnd);
  }
  return question;
};

const parseSolution = function (solutionText) {
  var tip, solution;

  var tipStart = solutionText.indexOf(':');
  if (tipStart !== -1) {
    // Found tip, now extract
    tip = solutionText.slice(tipStart + 1);
    solution = solutionText.slice(0, tipStart);
  }
  else {
    solution = solutionText;
  }

  // Split up alternatives
  var solutions = solution.split('/');

  return {
    tip: tip,
    solutions: solutions
  };
};


test('Test parser single', t => {
  var input = 'first *second* third';

  const result = [];

  const question  = handleBlanks(input, data => result.push(data));

  t.is(result[0].solutions[0], 'second');
  t.is(question, 'first 1 third');
});

test('Test should pass', t => {
  var input = 'first *second* third *fourth* fifth';

  const result = [];

  const question  = handleBlanks(input, data => result.push(data));

  t.is(result[0].solutions[0], 'second');
  t.is(result[1].solutions[0], 'fourth');
  t.is(question, 'first 1 third 2 fifth');
});

test('Test should pass', t => {
  var input = 'first *second* third *fourth* fifth *sixth* seventh';

  const result = [];

  const question  = handleBlanks(input, data => result.push(data));

  t.is(result[0].solutions[0], 'second');
  t.is(result[1].solutions[0], 'fourth');
  t.is(result[2].solutions[0], 'sixth');
  t.is(question, 'first 1 third 2 fifth 3 seventh');
});

test('Test should pass', t => {
  var input = 'first *second* third *fourth* fifth *sixth* seventh *eight* ninth';

  const result = [];

  const question  = handleBlanks(input, data => result.push(data));

  t.is(result[0].solutions[0], 'second');
  t.is(result[1].solutions[0], 'fourth');
  t.is(result[2].solutions[0], 'sixth');
  t.is(result[3].solutions[0], 'eight');
  t.is(question, 'first 1 third 2 fifth 3 seventh 4 ninth');
});

test('Test should pass', t => {
  var input = 'first *second* third *fourth* fifth *sixth* seventh *eight* ninth *tenth* eleventh';

  const result = [];

  const question  = handleBlanks(input, data => result.push(data));

  t.is(result[0].solutions[0], 'second');
  t.is(result[1].solutions[0], 'fourth');
  t.is(result[2].solutions[0], 'sixth');
  t.is(result[3].solutions[0], 'eight');
  t.is(result[4].solutions[0], 'tenth');
  t.is(question, 'first 1 third 2 fifth 3 seventh 4 ninth 5 eleventh');
});

test('Test should pass', t => {
  var input = 'first *second* third *fourth* fifth *sixth* seventh *eight* ninth *tenth* eleventh *twelfth* thirteenth';

  const result = [];

  const question  = handleBlanks(input, data => result.push(data));

  t.is(result[0].solutions[0], 'second');
  t.is(result[1].solutions[0], 'fourth');
  t.is(result[2].solutions[0], 'sixth');
  t.is(result[3].solutions[0], 'eight');
  t.is(result[4].solutions[0], 'tenth');
  t.is(result[5].solutions[0], 'twelfth');
  t.is(question, 'first 1 third 2 fifth 3 seventh 4 ninth 5 eleventh 6 thirteenth');
});


test('Test should pass', t => {
  var input = 'first *second* third *fourth* fifth *sixth* seventh *eight* ninth *tenth* eleventh *twelfth* thirteenth *fourteenth* fifteenth';

  const result = [];

  const question  = handleBlanks(input, data => result.push(data));

  t.is(result[0].solutions[0], 'second');
  t.is(result[1].solutions[0], 'fourth');
  t.is(result[2].solutions[0], 'sixth');
  t.is(result[3].solutions[0], 'eight');
  t.is(result[4].solutions[0], 'tenth');
  t.is(result[5].solutions[0], 'twelfth');
  t.is(result[6].solutions[0], 'fourteenth');
  t.is(question, 'first 1 third 2 fifth 3 seventh 4 ninth 5 eleventh 6 thirteenth 7 fifteenth');
});

test('Test should pass', t => {
  var input = 'first *second* third *fourth* fifth *sixth* seventh *eight* ninth *tenth* eleventh *twelfth* thirteenth *fourteenth* fifteenth *sixteenth* seventeenth';

  const result = [];

  const question  = handleBlanks(input, data => result.push(data));

  t.is(result[0].solutions[0], 'second');
  t.is(result[1].solutions[0], 'fourth');
  t.is(result[2].solutions[0], 'sixth');
  t.is(result[3].solutions[0], 'eight');
  t.is(result[4].solutions[0], 'tenth');
  t.is(result[5].solutions[0], 'twelfth');
  t.is(result[6].solutions[0], 'fourteenth');
  t.is(result[7].solutions[0], 'sixteenth');
  t.is(question, 'first 1 third 2 fifth 3 seventh 4 ninth 5 eleventh 6 thirteenth 7 fifteenth 8 seventeenth');
});

test('Test should pass', t => {
  var input = 'first *second* third *fourth* fifth *sixth* seventh *eight* ninth *tenth* eleventh *twelfth* thirteenth *fourteenth* fifteenth *sixteenth* seventeenth *eighteenth* nineteenth';

  const result = [];

  const question  = handleBlanks(input, data => result.push(data));

  t.is(result[0].solutions[0], 'second');
  t.is(result[1].solutions[0], 'fourth');
  t.is(result[2].solutions[0], 'sixth');
  t.is(result[3].solutions[0], 'eight');
  t.is(result[4].solutions[0], 'tenth');
  t.is(result[5].solutions[0], 'twelfth');
  t.is(result[6].solutions[0], 'fourteenth');
  t.is(result[7].solutions[0], 'sixteenth');
  t.is(result[8].solutions[0], 'eighteenth');
  t.is(question, 'first 1 third 2 fifth 3 seventh 4 ninth 5 eleventh 6 thirteenth 7 fifteenth 8 seventeenth 9 nineteenth');
});

test('Test should pass', t => {
  var input = '1234 "first" *"second"* third';

  const result = [];

  const question  = handleBlanks(input, data => result.push(data));

  t.is(result[0].solutions[0], '"second"');
  t.is(question, '1234 "first" 1 third');
});
