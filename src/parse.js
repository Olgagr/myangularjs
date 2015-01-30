/* jshint globalstrict: true */
"use strict";

var CONSTANTS = {
	'null': _.constant(null),
	'false': _.constant(false),
	'true': _.constant(true)
};

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
		} else if(this.isIdent(this.ch)) {
			this.readIdent();
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

Lexer.prototype.isIdent = function(character) {
	return (character >= 'a' && character <= 'z') || (character >= 'A' || character <= 'Z') || character === '_' || character === '$';
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
	var rawString;
	while(this.index < this.text.length) {
		var ch = this.text.charAt(this.index);
		rawString += ch;
		if(ch === this.ch) {
			this.index += 1;
			this.tokens.push({
				text: rawString,
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

Lexer.prototype.readIdent = function() {
	var text = '';
	while(this.index < this.text.length) {
		var ch = this.text.charAt(this.index);
		if(this.isIdent(ch) || this.isNumber(ch)) {
			text += ch;
		} else {
			break;
		}
		this.index++;
	}
	var token = { 
		text: text,
		fn: CONSTANTS[text],
		constant: true 
	};
	this.tokens.push(token);
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