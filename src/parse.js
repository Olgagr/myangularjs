/* jshint globalstrict: true */
/* global _: false */
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

var generatedGetterFn = function(pathKeys) {
	var code = '';
	_.forEach(pathKeys, function(key) {
		code += 'if(!scope) { return undefined; }\n';
		code += 'scope = scope["' + key + '"];\n';
	});
	code += 'return scope;\n';
	/* jshint -W054 */
	return new Function('scope', code);
	/* jshint +W054 */
};

var getterFn = _.memoize(function(ident) {
	var pathKeys = ident.split('.');

	if(pathKeys.length === 1) {
		return function(scope) {
			return scope ? scope[ident] : undefined;
		};
	} else if (pathKeys.length === 2) {
		return function(scope) {
			if(!scope) return undefined;
			scope = scope[pathKeys[0]];
			return scope ? scope[pathKeys[1]] : undefined;
		};
	} else {
		return generatedGetterFn(pathKeys);
	}
});

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
		} else if(this.is('[],{}:')) {
			this.tokens.push({
				text: this.ch
			});
			this.index += 1;
		} else if(this.isIdent(this.ch)) {
			this.readIdent();
		} else if(this.isWhitespace(this.ch)) {
			this.index += 1;	
		} else {
			throw 'Unexpected character' + this.ch;
		}
	}
	return this.tokens;
};

Lexer.prototype.is = function(chs) {
	return chs.indexOf(this.ch) > -1;
};

Lexer.prototype.nextCharacter = function() {
	return this.index < this.text.length - 1 ? this.text.charAt(this.index + 1) : false;
};

Lexer.prototype.isNumber = function(character) {
	return '0' <= character && character <= '9';
};

Lexer.prototype.isIdent = function(character) {
	return (character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z') || character === '_' || character === '$';
};

Lexer.prototype.isWhitespace = function(character) {
	return (character === ' ' || character === '\r' || character === '\n' || character === '\v' || character === '\t' || character === '\u00A0');
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
		if(ch === '.' || this.isIdent(ch) || this.isNumber(ch)) {
			text += ch;
		} else {
			break;
		}
		this.index++;
	}
	var token = { 
		text: text,
		fn: CONSTANTS[text] || getterFn(text),
		constant: true 
	};
	this.tokens.push(token);
};



function Parser (lexer) {
	this.lexer = lexer;
}

Parser.prototype.primary = function() {
	var primary;
	if(this.expect('[')) {
		primary = this.arrayDeclaration();
	}	else if(this.expect('{')) {
		primary = this.objectDeclaration();
	} else {
		var token = this.expect();
		primary = token.fn;
		if(token.constant) {
			primary.constant = true;
			primary.literal = true;
		}
	}
	return primary;
};

Parser.prototype.expect = function(text) {
	var token = this.peek(text);
	if(token) {
		return this.tokens.shift();
	}
};

Parser.prototype.arrayDeclaration = function() {
	var elementsFns = [];
	if(!this.peek(']')) {
		do {
			if(this.peek(']')) break;
			elementsFns.push(this.primary());
		} while(this.expect(','));
	}
	this.consume(']');
	var arrayFn = function() {
		return _.map(elementsFns, function(elementFn) {
			return elementFn();
		});
	};

	arrayFn.literal = true;
	arrayFn.constant = true;

	return arrayFn;
};

Parser.prototype.objectDeclaration = function() {
	var keyValues = [];
	if(!this.peek('}')) {
		do {
			var keyToken = this.expect();
			this.consume(':');
			var valueExpression = this.primary();
			keyValues.push({ key: keyToken.text, value: valueExpression });
		} while(this.expect(','));
	}
	this.consume('}');
	var objectFn = function() {
		var object = {};
		_.forEach(keyValues, function(kv) {
			object[kv.key] = kv.value();
		});
		return object;
	};

	objectFn.literal = true;
	objectFn.constant = true;

	return objectFn;
};

Parser.prototype.peek = function(text) {
	if(this.tokens.length > 0) {
		if(this.tokens[0].text === text || !text){
			return this.tokens[0];
		}
	}
};

Parser.prototype.consume = function(text) {
	if(!this.expect(text)) {
		throw 'Unexpected. Expecting ' + text;
	}
};



Parser.prototype.parse = function(text) {
	this.tokens = this.lexer.lex(text);
	return this.primary();
};