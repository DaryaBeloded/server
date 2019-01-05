// npm test

const assert = require('assert');
const {getDate} = require('./server.js');

it('правильно преобразует 2019-01-05T17:37:48.034Z', () => {
	let date = new Date();
	let expect = '2019-01-05'; // заменить на текущую дату
	let curr = getDate(date);
  	assert.equal(curr, expect);
});