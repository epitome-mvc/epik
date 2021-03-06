require.config({
	baseUrl: '../../',
	paths: {
		epik: 'lib',
		examples: 'example/js/',
		util: 'example/util/',
		components: 'lib/components',
		primish: 'components/primish',
		lodash: 'components/lodash/lodash',
		slicker: 'components/slicker/index',
		rivets: 'components/rivets/dist/rivets',
		jquery: 'components/jquery/dist/jquery',
		'rivets-adapter': 'lib/plugins/rivets-adapter',
		io: '/socket.io/socket.io',
		text: 'example/util/text'
	},
	bundles: {
		'components/primish/primish-min': [
			'primish/primish',
			'primish/emitter',
			'primish/options'
		]
	}
	// , urlArgs: 'burst=' + (+new Date())
});

define(function(require){

	var transport = new (require('util/transport'))(),
		epik = require('epik/index'),
		primish = epik.primish,
		_ = epik._,
		Router = require('epik/router'),
		Collection = require('epik/collection'),
		Menu = require('util/menu-vc');

	var Examples = primish({
		extend: Collection
	});

	var createRouter = function(routes){
		var obj = {
			routes: {
				'': 'index'
			},
			onBefore: function(id){
				var active = document.querySelector('.menu-item.active');
				active && (active.className = active.className.replace('active', ''));
				active = document.querySelector('#' + id);
				active && (active.className += ' active');
				document.getElementById('example').innerHTML = '<h2>'+ id +'</h2>';
				console.clear();
				console.info('loaded ' + id);
			},
			onUndefined: function(){
				this.navigate('');
			},
			onIndex: function(){
				console.log('welcome');
			}
		};

		var capitalize = function(string){
			string = string.split('');
			string[0] = string[0].toUpperCase();
			return string.join('');
		};

		var prefix = '#!';

		_.forEach(routes, function(route){
			if (route.title === 'index' || route.title === 'router')
				return;

			obj.routes[prefix + route.title] = route.title;
			obj['on' + capitalize(route.title)] = function(){
				require(['example/js/' + route.title], function(example){
					typeof example === 'function' && example();
				});
			};
		});

		return new Router(obj);
	};

	var menu = window.menu = new Menu({
		element: document.querySelector('#menu .container'),
		collection: new Examples([]),
		'onCollection:set': function(){
			this.router || (this.router = createRouter(this.collection.toJSON()));
		}
	});

	transport.subscribe('demos:get', function(demos){
		menu.collection.set(demos);
	});
	transport.send('demos:get');

	var foo = new epik.emitter(),
		bar = new epik.emitter();

	foo.on('foo', function(bar){
		bar;
	});

	setTimeout(function(){
		var c = 500000;
		console.time('events:trigger');
		while (c--)
			foo.trigger('foo').trigger('foo', 'bar');
		console.timeEnd('events:trigger');
	}, 1000);

	bar.listenTo(foo);
});
