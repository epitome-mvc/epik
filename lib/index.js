;(function(factory){
	if (typeof define == 'function' && define.amd){
		define('epik/index', [
			'primish/primish',
			'primish/options',
			'primish/emitter',
			'lodash'
		], factory);
	} else if (typeof module != 'undefined' && module.exports){
		module.exports = factory(
			require('primish'),
			require('primish/options'),
			require('primish/emitter'),
			require('lodash')
		);
	} else {
		this.epik = factory(
			this.primish,
			this.options,
			this.emitter,
			this._
		);
	}
}).call(this, function(primish, options, emitter, _, slicker){

	var util = {
		/**
		 * @description memoizes a function key->value setter to work with objects
		 * @param {Function} fn to memoize
		 * @returns {Function}
		 */
		setter: function(fn){
			return function(a, b){
				if (a == null) return fn;
				if (_.isObject(a))
					for (var k in a) fn.call(this, k, a[k]);
				else
					fn.call(this, a, b);
			};
		},
		/**
		 * @description memoizes a function key->value getter to work with objects
		 * @param {Function} fn to memoize
		 * @returns {Array} values returned as per keys
		 */
		getter: function(fn){
			return function(a){
				var result,
					args,
					i;

				args = typeof a != 'string' ? a : arguments.length > 1 ? arguments : false;
				if (args){
					result = {};
					for (i = 0; i < args.length; i++) result[args[i]] = fn.call(this, args[i]);
				}
				else {
					result = fn.call(this, a);
				}
				return result;
			};
		}
	};

	var slice = primish.slice;

	/**
	 * @module emitter
	 * @description extends default func to support subscribers
	 * @constructor
	 * @type {primish.emitter}
	 */
	var Emitter = primish('emitter', {

		extend: emitter,

		/**
		 * @description allows subscribing to a particular event or all events on another instance implementing emitter
		 * @param {Object} obj instance to subscribe from
		 * @param {String=} event optional event type.
		 * @param {Function=} fn optional callback
		 * @returns {emitter}
		 */
		listenTo: function(obj, event, fn){
			var t = typeof event,
				eventObj = {
					context: obj,
					subscriber: this
				},
				subscribers = obj._subscribers || primish.hide(obj, '_subscribers', {});

			if (t === 'function'){
				fn = event;
				event = '*';
				delete eventObj.event;
			}
			else if (t === 'undefined'){
				event = '*';
				delete eventObj.event;
			}
			else if (t === 'string'){
				eventObj.event = event;
			}

			fn && (eventObj.fn = fn);
			subscribers[event] || (subscribers[event] = []);

			_.indexOf(subscribers[event], eventObj) === -1 && subscribers[event].push(eventObj);

			return this;
		},

		/**
		 * @descriptions stops subscribed events from other instances
		 * @param {Object} obj instance to stop listening to
		 * @param {String=} event type: particular event to unsubscribe from, or all events by default. '*' wildcard events only
		 * @param {Function=} fn particular callback to remove only, in pair with event
		 * @returns {emitter}
		 */
		stopListening: function(obj, event, fn){
			_.forIn(obj._subscribers, function(value, key, len){
				len = value.length;
				if (typeof event !== 'undefined'){
					if (key === event) while (len--)
						(((fn && fn === value[len].fn) || !fn) && value[len].context === obj) && value.splice(len, 1);
				}
				else {
					// no type, unsubscribe from all for that context object
					while (len--) value[len].context === obj && value.splice(len, 1);
				}
			});

			return this;
		},

		/**
		 * @description fires an event to an instance and all of its subscribers
		 * @param {String} event name to fire.
		 * @param {*=} remaining args to pass to callback,
		 * @returns {emitter}
		 */
		trigger: function(event){
			var events = this._listeners,
				subscribers = this._subscribers,
				k,
				l,
				args,
				argsCopy,
				subscriber;

			if (events && events[event]){
				args = arguments.length > 1 ? slice(arguments, 1) : [];
				for (k in events[event]) events[event][k].apply(this, args);
			}

			if (subscribers){
				// wildcard subs
				events = subscribers['*'] || [];
				for (k = 0, l = events.length; k < l; k++){
					subscriber = events[k];
					argsCopy = subscriber.event ? args : arguments;
					if (subscriber.fn){
						subscriber.fn.apply(subscriber.context, argsCopy);
					}
					else {
						this.trigger.apply(subscriber.subscriber, argsCopy);
					}
				}
				// particular subs
				events = subscribers[event] || [];
				for (k = 0, l = events.length; k < l; k++){
					subscriber = events[k];
					argsCopy = subscriber.event ? args : arguments;
					if (subscriber.fn){
						subscriber.fn.apply(subscriber.context, argsCopy);
					}
					else {
						this.trigger.apply(subscriber.subscriber, arguments);
					}
				}

			}

			return this;
		},

		/**
		 * @description stops all event listeners and subscribers for a particular event
		 * @param {String} event to stop emitting
		 * @returns {emitter}
		 */
		offAll: function(event){
			var listeners = this._listeners,
				subscribers = this._subscribers,
				events;

			// danger danger. no arg = removes all events. use sparringly
			if (!event || !event.length){
				this._listeners = {};
				this._subscribers = {};
				return this;
			}

			if (listeners && (events = listeners[event])){
				delete listeners[event];
			}
			if (subscribers && (events = subscribers[event])){
				delete subscribers[event];
			}
			return this;
		}
	});

	Emitter.prototype.on = util.setter(Emitter.prototype.on);

	/**
	 * @type {{_: *, primish: *, options: *, emitter: *, slicker: *, util: {setter: setter, getter: getter}}}
	 */
	return {
		_: _,
		primish: primish,
		options: options,
		emitter: Emitter,
		slicker: slicker,
		util: util
	};
});
