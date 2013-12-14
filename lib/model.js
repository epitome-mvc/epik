;(function(factory){
	'use strict';

	if (typeof define == 'function' && define.amd){
		define(['./index'], factory);
	} else if (typeof module != 'undefined' && module.exports){
		module.exports = factory(
			require('index')
		);
	} else {
		this.epitome.model = factory(
			this.epitome
		);
	}

}).call(this, function(epitome){
	'use strict';

	var	primish = epitome.primish,
		options = epitome.options,
		emitter = epitome.emitter,
		_ = epitome._,
		util = epitome.util;

	return primish({
		implement: [options, emitter],

		_attributes: {},

		properties: {
			id: {
				get: function(){
					// need a cid to identify model.
					var id = this._attributes.id || String.uniqueID();
					// always need a collection id.
					this.cid || (this.cid = id);

					return this._attributes.id;
				}
			}
		},

		options: {
			defaults: {}
		},

		collections: [],

		constructor: function(obj, options){

			options && options.defaults && (this.options.defaults = primish.merge(this.options.defaults, options.defaults));

			this.set(primish.merge(this.options.defaults, obj && typeof obj == 'object' ? obj : {}));
			this.setOptions(options);

			return this.trigger('ready');
		},

		set: function(){
			// call the real getter. we proxy this because we want
			// a single event after all properties are updated and the ability to work with
			// either a single key, value pair or an object
			this.propertiesChanged = [];
			this.validationFailed = [];

			this._set.apply(this, arguments);
			// if any properties did change, fire a change event with the array.
			this.propertiesChanged.length && this.trigger('change', this.get(this.propertiesChanged));
			this.validationFailed.length && this.trigger('error', [this.validationFailed]);

			return this;
		},

		// private, real setter functions, not on prototype, see note above
		_set: util.setter(function(key, value){
			// needs to be bound the the instance.
			if (!key || typeof value === 'undefined') return this;

			// custom setter - see bit further down
			if (this.properties[key] && this.properties[key]['set'])
				return this.properties[key]['set'].call(this, value);

			// no change? this is crude and works for primitives.
			if (this._attributes[key] && _.isEqual(this._attributes[key], value))
				return this;

			// basic validator support
			var validator = this.validate(key, value);
			if (this.validators[key] && validator !== true){
				var obj = {};
				obj[key] = {
					key: key,
					value: value,
					error: validator
				};
				this.validationFailed.push(obj);
				this.trigger('error:' + key, obj[key]);
				return this;
			}

			if (value === null){
				delete this._attributes[key]; // delete = null.
			}
			else {
				this._attributes[key] = value;
			}

			// fire an event.
			this.trigger('change:' + key, value);

			// store changed keys...
			this.propertiesChanged.push(key);

			return this;
		}),

		get: function(key){
			// overload getter, 2 paths...

			// custom accessors take precedence and have no reliance on item being in attributes
			if (key && this.properties[key] && this.properties[key].get){
				return this.properties[key].get.call(this);
			}

			// else, return from attributes or return null when undefined.
			return (key && typeof this._attributes[key] !== 'undefined') ? this._attributes[key] : null;
		},

	});

});
