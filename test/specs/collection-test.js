var Model = this.epik.model,
	Collection = this.epik.collection,
	_ = this.epik._,
	primish = this.primish,
	buster = this.buster;

buster.testCase('Basic epik empty collection creation >', {
	setUp: function(){
		this.timeout = 1000;
		this.Collection = primish({
			extend: Collection
		});

		this.collection = new this.Collection();
		this.model = new Model({
			hello: 'there'
		});

	},

	tearDown: function(){
		this.collection.offAll();
		//this.collection.empty();
		this.collection._listeners = {};
		this.collection._subscribers = {};
	},

	'Expect a collection to be created >': function(){
		buster.assert.isTrue(this.collection instanceof Collection);
	},

	'Expect a collection to have length of 0 >': function(){
		buster.assert.equals(this.collection.length, 0);
	},

	'Expect adding models to collection to fire onAdd event >': function(){
		var self = this;
		this.collection.on('add', function(model){
			buster.assert.equals(model, self.model);
		});

		this.collection.add(this.model);
	},

	'Expect to be able to add a model to collection when it has defaults >': function(){
		var M = primish({
			extend: Model,
			defaults: {
				name: 'bob'
			}
		});

		var collection = new (primish({
			extend: Collection,
			model: M
		}));

		var model = collection.add();
		buster.assert.equals(model.get('name'), 'bob');
	},

	'Expect not to be able to add the same model twice to the collection >': function(){
		this.collection.add(this.model);
		this.collection.add(this.model);
		buster.assert.equals(this.collection.length, 1);
	},

	'Expect adding a model with the same cid twice to fire an add:error event >': function(){
		var spy = this.spy();
		this.collection.on('add:error', spy);
		this.collection.add(this.model);
		this.collection.add(this.model);
		buster.assert.calledWith(spy, this.model);
	},

	'Expect adding a model with the same cid with a replace flag to work >': function(){
		var spy = this.spy(),
			fakeModel = new Model({
				id: 'hello'
			});

		this.model.set('id', 'hello');
		this.collection.add(this.model);
		this.collection.on('add', spy);
		this.collection.add(fakeModel, true);
		buster.assert.calledWith(spy, fakeModel);
	},

	'Expect reset to empty collection first and then add new models >': function(){
		this.collection.add(this.model);

		this.collection.set({
			hello: 'again'
		});

		buster.assert.equals(this.model._collections.length, 0);
		buster.assert.equals(this.collection.length, 1);
	},

	'Expect adding a model via an object only to create a model and add it >': function(){
		var data = {
			id: 'hello'
		};

		this.collection.add(data);
		buster.assert.isTrue(this.collection.getModelByCID(data.id) instanceof this.collection.model);
	},

	'Expect adding a model to fire onSet >': function(){
		var data = {
			id: 'hello'
		}, spy = this.spy();

		this.collection.on('reset', spy);
		this.collection.add(data);
		buster.assert.called(spy);
	},

	'Expect removing a model to fire onReset >': function(){
		var spy = this.spy();
		this.collection.on('reset', spy);
		this.collection.remove(this.model);
		buster.assert.called(spy);
	},

	'Expect removing models to collection to fire onRemove event >': function(){
		var self = this;
		this.collection.add(this.model);
		this.collection.offAll();
		this.collection.on('remove', function(model){
			buster.assert.equals(model, self.model);
		});
		this.collection.remove(this.model);
	},

	'Expect to be able to remove multiple models at the same time >': function(){
		var model2 = new Model({
				hai: 'mum'
			});

		this.collection.add(this.model);
		this.collection.add(model2);

		this.collection.on('reset', function(models){
			buster.assert.equals(this.length, 0);
			buster.assert.equals(models.length, 2);
		});

		this.collection.remove([this.model, model2]);
	},

	'Expect to be able to add models to the collection >': function(){
		var models = this.collection.length;
		this.collection.add(this.model);
		buster.assert.equals(this.collection.length, models + 1);
	},

	'Expect to be able to remove models from the collection >': function(){
		var modelsCount = this.collection._models.length;
		this.collection.add(this.model);
		this.collection.remove(this.model);
		buster.assert.equals(this.collection.length, modelsCount);
	},

	'Expect to be able to get a model from collection by id': function(){
		var fakeModel = new Model({
			id: 'hello'
		});

		this.collection.add(fakeModel);
		buster.assert.equals(fakeModel, this.collection.getModelById(fakeModel.get('id')));
		buster.assert.equals(fakeModel, this.collection._map['em' + fakeModel.get('id')]);
	},

	'Expect a model that changes its ID to change map reference': function(){
		var fakeModel = new Model({
			id: 'hello'
		});

		this.collection.add(fakeModel);
		buster.assert.equals(typeof this.collection._map['emhello'], 'object');
		fakeModel.set('id', 'bye');
		buster.assert.equals(typeof this.collection._map['embye'], 'object');
		//buster.assert.equals(typeof this.collection._map['emhello'], 'undefined');
	},

	'Expect to be able to get a model from collection by cid': function(){
		var fakeModel = new Model({
			id: 'hello'
		});

		this.collection.add(fakeModel);
		buster.assert.equals(fakeModel, this.collection.getModelByCID(fakeModel.get('id')));
	}

});


buster.testCase('Basic epik collection with a model creation >', {
	setUp: function(){
		this.Collection = primish({
			extend: Collection,

			options: {
				onChange: function(){
					// this.change.apply(this, arguments);
				}
			}
		});

		this.model = new Model({
			hello: 'there'
		});

		this.models = [this.model];

		this.collection = new this.Collection(this.models);
	},

	tearDown: function(){
		this.collection.offAll();
		this.collection._listeners = {};
		this.collection._subscribers = {};
	},

	'Expect models to be equal to number passed in constructor >': function(){
		buster.assert.equals(this.collection._models.length, this.models.length);
	},

	'Expect onChange on a model to fire for collection >': function(){
		var self = this;
		this.collection.offAll();
		this.collection.on('change', function(model, props){
			buster.assert.equals(model, self.model);
			buster.assert.equals(_.indexOf(props, 'foo'), 0);
		});
		this.model.set('foo', 'bar');
	},

	'Expect any Event on any model to fire for collection observer >': function(){
		var self = this,
			event = _.uniqueId();
		this.collection.on(event, function(model){
			buster.assert.equals(model, self.model);
		});
		this.model.trigger(event);
	},

	'Expect a model that has been destroyed to be removed from the collection >': function(){
		var temp = new Model({
			id: 'hai'
		});

		this.collection.add(temp);
		temp.destroy();
		buster.refute.equals(temp, this.collection.getModelById('hai'));
	},

	'A model should be able to exist in 2 collections and the event emitter should work when removed from either one >': function(){
		var collection2 = new this.Collection(this.models);

		this.collection.on('change', function(done){
			buster.assert.isTrue(true);
			done();
		});

		collection2.remove(this.model);
		buster.assert.equals(this.model._collections.length, 1);
		this.model.set('foo', 'bar' + _.uniqueId());
	},

	'Adding a model to a collection should include the collection instance in the model.collections array >': function(){
		buster.assert.isTrue(_.indexOf(this.model._collections, this.collection) !== -1);
	},

	'Removing a model from a collection should also remove the collection instance in the model.collections array >': function(){
		this.collection.remove(this.model);
		buster.assert.equals(_.indexOf(this.model._collections, this.collection), -1);
	}

});


buster.testCase('Basic epik collection array methods >', {
	setUp: function(){
		this.Collection = primish({
			extend: Collection
		});

		this.model = new Model({
			hello: 'there'
		});

		this.models = [this.model];

		this.collection = new this.Collection(this.models);
	},

	tearDown: function(){
		this.collection.offAll();
	},

	'Expect toJSON to return an array of all models\' dereferenced objects >': function(){
		buster.assert.equals(this.collection.toJSON().length, this.collection.length);
	},

	'Expect Array method .each to work on the collection >': function(){
		var spy = this.spy();

		this.collection.each(spy);
		buster.assert.calledWith(spy, this.model, 0);
	},

	'Expect Array method .invoke to work on the collection >': function(){
		this.collection.invoke('set', {
			testing: 123
		});
		buster.assert.equals(this.model.get('testing'), 123);
	},

	'Expect Array method .map to work on the collection >': function(){
		this.collection.map(function(el, index){
			el.cid = index;
		});
		buster.assert.equals(this.model.cid, 0);
	},

	'Expect Array method .filter to work on the collection >': function(){
		var cid = 'testsftw';

		this.collection.add({
			id: cid
		});

		var models = this.collection.filter(function(el){
			return el.cid == cid;
		});

		buster.assert.equals(models.length, 1);
	},

	'Expect Array method .contains to work on the collection >': function(){
		buster.assert.isTrue(this.collection.contains(this.model));
	},

	'Expect Array method .indexOf to work on the collection >': function(){
		buster.assert.equals(this.collection.indexOf(this.model), 0);
	},

	'Expect Array method .getRandom to work on the collection >': function(){
		buster.assert.equals(this.collection.getRandom(), this.model);
	},

	'Expect Array method .reverse to reverse the order of models in the collection >': function(){
		this.collection.empty();

		this.collection.add({
			id: 300,
			name: 'A'
		});

		this.collection.add({
			id: 200,
			name: 'B'
		});

		this.collection.add({
			id: 400,
			name: 'C'
		});

		this.collection.reverse();

		var changed = this.collection.toJSON().map(function(el){
			return el.name;
		}).join(','); // should be "C,B,A"

		buster.assert.equals(changed, 'C,B,A');
	},

	'Expect .sort("key") to sort the collection by that model property >': function(){
		this.collection.empty();

		this.collection.add({
			id: 300,
			name: 'A'
		});

		this.collection.add({
			id: 200,
			name: 'B'
		});

		this.collection.add({
			id: 400,
			name: 'C'
		});

		var current = this.collection.toJSON().map(function(el){
			return el.name;
		}).join(','); // should be "A,B,C"

		this.collection.sort('id');

		var changed = this.collection.toJSON().map(function(el){
			return el.name;
		}).join(','); // should be "B,A,C"

		buster.refute.equals(current, changed);
	},

	'Expect .empty() to remove all models from collection >': function(){
		// this.collection.reset();

		this.collection.add({
			id: 300,
			name: 'A'
		});

		this.collection.add({
			id: 200,
			name: 'B'
		});

		this.collection.add({
			id: 400,
			name: 'C'
		});

		this.collection.empty();
		buster.assert.equals(this.collection.length, 0);
	},


	'Expect .sort("key1,key2") to sort the collection by both model properties >': function(){
		this.collection.empty();

		this.collection.add({
			id: 300,
			name: 'B',
			type: 'one'
		});

		this.collection.add({
			id: 200,
			name: 'B',
			type: 'two'
		});

		this.collection.add({
			id: 10,
			name: 'A',
			type: 'one'
		});

		var current = this.collection.toJSON().map(function(el){
			return el.id;
		}).join(','); // should be "300,200,10"

		this.collection.sort('type,name,id:desc');

		var changed = this.collection.toJSON().map(function(el){
			return el.id;
		}).join(','); // should be "10,300,200"

		buster.refute.equals(current, changed);
	},


	'Expect .sort("key:desc") to sort the collection by that model property in reverse >': function(){
		this.collection.empty();

		this.collection.add({
			id: 300,
			name: 'A'
		});

		this.collection.add({
			id: 200,
			name: 'B'
		});

		this.collection.add({
			id: 400,
			name: 'C'
		});

		this.collection.sort('id:desc');

		var changed = this.collection.toJSON().map(function(el){
			return el.name;
		}).join(','); // should be "C,A,B"

		buster.assert.equals(changed, 'C,A,B');
	},

	'Expect .reverse to sort the array in reverse and fire a sort event >': function(done){
		this.collection.empty();

		this.collection.add({
			id: 300,
			name: 'A'
		});

		this.collection.add({
			id: 200,
			name: 'B'
		});

		this.collection.add({
			id: 400,
			name: 'C'
		});

		this.collection.on('sort', function(){
			var changed = this.toJSON().map(function(el){
				return el.name;
			}).join(','); // should be "C,B,A"

			buster.assert.equals(changed, 'C,B,A');
			done();
		});

		this.collection.reverse();
	}
});


buster.testCase('Basic epik collection.find >', {
	setUp: function(){
		this.Collection = primish({
			extend: Collection
		});

		var models = [
			{
				name: 'bob',
				surname: 'roberts',
				type: {
					role: 'admin'
				}
			},
			{
				name: 'robert',
				surname: 'roberts',
				type: {
					role: 'user'
				}
			},
			{
				name: 'Robert',
				surname: 'Roberts'
			},
			{
				name: 'just bob'
			},
			{
				id: 'special',
				surname: 'just roberts'
			}
		];

		this.collection = new this.Collection(models);
	},

	tearDown: function(){
		this.collection.empty();
	},

	'Expect search by existence of a model attribute [attr] to return matching models >': function(){
		buster.assert.equals(this.collection.find('[name]').length, 4);
	},

	'Expect search by deeper object property for type to return matching models >': function(){
		buster.assert.equals(this.collection.find('type').length, 2);
	},

	'Expect search by deeper object property for type.role to return matchign models >': function(){
		buster.assert.equals(this.collection.find('type[role]').length, 2);
	},

	'Expect search by deeper object property for type.role=admin to return matchign models >': function(){
		buster.assert.equals(this.collection.find('type[role=admin]').length, 1);
	},

	'Expect search by existence of a model attribute [attr] not to return if not found >': function(){
		buster.assert.equals(this.collection.find('[foo]').length, 0);
	},

	'Expect search by existence of multiple model attributes [attr1][attr2] to return matching models >': function(){
		buster.assert.equals(this.collection.find('[name][surname]').length, 3);
	},

	'Expect search by exact model attributes [attr=value] to return matching models >': function(){
		buster.assert.equals(this.collection.find('[name=bob]').length, 1);
	},

	'Expect search by exact model attributes [attr=invalid] not to return a matching model >': function(){
		buster.assert.equals(this.collection.find('[name=invalid]').length, 0);
	},

	'Expect search by exact model attributes [attr=WrongCase] not to return a matching model >': function(){
		buster.assert.equals(this.collection.find('[name=Bob]').length, 0);
	},

	'Expect search by exact model multiple attributes [attr1=value][attr2=value] to return matching models >': function(){
		buster.assert.equals(this.collection.find('[name=bob][surname=roberts]').length, 1);
	},

	'Expect search by exact model multiple attributes via OR [attr1=value1],[attr1=value2] to return matching models >': function(){
		buster.assert.equals(this.collection.find('[name=bob],[name=robert]').length, 2);
	},

	'Expect search by excluding model attributes [attr!=value] to return all matching models >': function(){
		buster.assert.equals(this.collection.find('[surname!=roberts]').length, 2);
	},

	'Expect search by substring model attributes starts with [attr^=val] to return matching models >': function(){
		buster.assert.equals(this.collection.find('[name^=bob]').length, 1);
	},

	'Expect search by substring model attributes containing with [attr*=val] to return matching models >': function(){
		buster.assert.equals(this.collection.find('[name*=bob]').length, 2);
	},

	'Expect search by substring model attributes ending with [attr$=val] to return matching models >': function(){
		buster.assert.equals(this.collection.find('[name$=bob]').length, 2);
	},

	'Expect search by #id to return models matching that id >': function(){
		buster.assert.equals(this.collection.find('#special').length, 1);
	},

	'Expect search by #id and attribute with #id[attr*=value] to return models matching  >': function(){
		buster.assert.equals(this.collection.find('#special[surname*=roberts]').length, 1);
	},

	'Expect search via .findOne to return a single model >': function(){
		buster.assert.isTrue(this.collection.findOne('[name=bob]') instanceof Model);
	},

	'Expect search via .findOne when no match to return null >': function(){
		buster.assert.equals(this.collection.findOne('[name=notbob]'), null);
	},

	'Expect search via .where to find exact matches >': function(){
		buster.assert.isTrue(typeof this.collection.where({
			name: 'bob'
		}) === 'object');

		buster.assert.isTrue(typeof this.collection.where({
			name: 'Robert'
		}) === 'object');

		buster.refute.isTrue(typeof this.collection.where({
			name: 'invalid'
		}) === 'object');
	},

	'Expect search via where to match multiple attributes >': function(){
		buster.assert.equals(this.collection.where({
			name: 'Robert',
			surname: 'Roberts'
		}).get('name'), 'Robert');
	}

});
