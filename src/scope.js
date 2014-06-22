/* jshint globalstrict: true */
"use strict";

function Scope () {
	this.$$watchers = [];
}

Scope.prototype = {
	$watch: function(watchFn, listenerFn) {
		var watcher = {
			watchFn: watchFn,
			listenerFn: listenerFn	
		};
		this.$$watchers.push(watcher);
	},
	$digest: function() {
		var self = this,
				newValue, 
				oldVaue;

		_.forEach(this.$$watchers, function(watcher) {
			newValue = watcher.watchFn(self);
			oldVaue = watcher.last;
			if(newValue != oldVaue) {
				watcher.last = newValue;
				watcher.listenerFn(newValue, oldVaue, self);
			}
		});
	}
};