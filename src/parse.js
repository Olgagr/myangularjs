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
		if(this.isNumber(this.ch) || (this.ch === '.' && this.isNumber(this.nextCharacter()))) {
			this.readNumber();
		} else if (this.ch === '\'' || this.ch === '"') {
			this.readString();
		} else {
			throw 'Unexpected character' + this.ch;
		}
	}

	return this.tokens;
};

Lexer.prototype.nextCharacter = function() {
	return this.index < this.text.length - 1 ? this.text.charAt(this.index + 1) : false;
};

Lexer.prototype.isNumber = function(character) {
	return '0' <= character && character <= '9';
};

Lexer.prototype.readNumber = function() {
	var number = '';
	while(this.index < this.text.length){
		var ch = this.text.charAt(this.index);
		if(ch === '.' || this.isNumber(ch)){
			number += ch;
		} else {
			break;
		}
		this.index++;
	}
	number = 1*number;
	this.tokens.push({
		text: number,
		fn: _.constant(number),
		constant: true
	});
};

Lexer.prototype.readString = function() {
	this.index += 1;
	var string = '';
	while(this.index < this.text.length) {
		var ch = this.text.charAt(this.index);
		if(ch === this.ch) {
			this.index += 1;
			this.tokens.push({
				fn: _.constant(string),
				constant: true
			});
			return;
		} else {
			string += ch;
		}
		this.index += 1;
	}
	throw 'Unmatched quotes';
};

function Parser (lexer) {
	this.lexer = lexer;
}

Parser.prototype.primary = function() {
	var token = this.tokens[0];
	var primary = token.fn;
	if(token.constant) {
		primary.constant = true;
		primary.literal = true;
	}
	return primary;
};

Parser.prototype.parse = function(text) {
	this.tokens = this.lexer.lex(text);
	return this.primary();
};