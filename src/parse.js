/* jshint globalstrict: true */
"use strict";

function parse(expr) {
	var lexer = new Lexer();
	var parser = new Parser(lexer);
	return parser.parse(expr);
}

function Lexer () {
	// body...
}

Lexer.prototype.lex = function(text) {
	this.text = text;
	this.index = 0;
	this.ch = undefined;
	this.tokens = [];

	while(this.index < this.text.length){
		this.ch = this.text.charAt(this.index);
		if(this.isNumber(this.ch)){
			this.readNumber();
		} else {
			throw 'Unexpected character' + this.ch;
		}
	}

	return this.tokens;
};

Lexer.prototype.isNumber = function(character) {
	return '0' <= character && character <= '9';
};

Lexer.prototype.readNumber = function() {
	var number = '';
	while(this.index < this.text.length){
		this.ch = this.text.charAt(this.index);
		if(this.isNumber(this.ch)){
			number += this.ch;
		} else {
			break;
		}
		this.index++;
	}
	number = 1*number;
	this.tokens.push({
		text: number,
		fn: _.constant(number)
	});
};

function Parser (lexer) {
	this.lexer = lexer;
}

Parser.prototype.parse = function(text) {
	this.tokens = this.lexer.lex(text);
	return _.first(this.tokens).fn;
};