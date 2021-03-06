var app = angular.module('meanNews', ['ui.router']);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainController',
      resolve: {
      	postPromise: ['posts', function(posts) {
      		return posts.getAll();
      	}]
      }
    })
    .state('posts', {
    	url: '/posts/{id}',
    	templateUrl: '/posts.html',
    	controller: 'PostsController',
    	resolve: {
    		post: ['$stateParams', 'posts', function($stateParams, posts) {
    			return posts.get($stateParams.id);
    		}]
    	}
    })
    .state('login', {
    	url: '/login',
    	templateUrl: '/login.html',
    	controller: 'AuthController',
    	onEnter: ['$state', 'auth', function($state, auth) {
    		if (auth.isLoggedIn()) {
    			$state.go('home');
    		}
    	}]
    })
    .state('register', {
    	url: '/register',
    	templateUrl: '/register.html',
    	controller: 'AuthController',
    	onEnter: ['$state', 'auth', function($state, auth) {
    		if (auth.isLoggedIn()) {
    			$state.go('home');
    		}
    	}]
    });

  $urlRouterProvider.otherwise('home');
}]);

// posts service
app.factory('posts', ['$http', 'auth', function($http, auth) {
	var o = {
		posts: []
	};

	// get all posts
	o.getAll = function() {
		return $http.get('/posts').success(function(data) {
			angular.copy(data, o.posts);
		});
	};

	// creating new posts
	o.create = function(post) {
		return $http.post('/posts', post, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).success(function(data) {
			o.posts.push(data);
		});
	};

	// upvoting posts
	o.upvote = function(post) {
		return $http.put('/posts/' + post._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+ auth.getToken()}
		}).success(function(data) {
				post.upvotes += 1;
		});
	};

	// retrieve a single post from server
	o.get = function(id) {
		return $http.get('/posts/' + id).then(function(res) {
			return res.data;
		});
	};

	// add comments
	o.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment, {
			headers: {Authorization: 'Bearer '+ auth.getToken()}
		});
	};

	// upvote comments
	o.upvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+ auth.getToken()}
		}).success(function(data) {
				comment.upvotes += 1;
		});
	};

	return o;
}]);

// auth service
app.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};

	// setting token
	auth.saveToken = function(token) {
		$window.localStorage['mean-news-token'] = token;
	};

	// get token
	auth.getToken = function() {
		return $window.localStorage['mean-news-token'];
	};

	// returns a boolean value for if the user is logged in
	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	// returns the username of the user who's logged in
	auth.currentUser = function() {
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	// posts user to /register route and saves token returned
	auth.register = function(user) {
		return $http.post('/register', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	// posts a user to /login route and saves token returned
	auth.logIn = function(user) {
		return $http.post('/login', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	// removes the user's token from localStorage, logging the user out
	auth.logOut = function() {
		$window.localStorage.removeItem('mean-news-token');
	};

	return auth;
}]);

app.controller('MainController', [
	'$scope',
	'posts',
	'auth',
	function($scope, posts, auth) {

	$scope.posts = posts.posts;

	$scope.addPost = function() {
		if (!$scope.title || $scope.title === '') {return; }
		// saves posts to the server
		posts.create({
			title: $scope.title,
			link: $scope.link
		});
		$scope.title = '';
		$scope.link = '';
	};

	$scope.incrementUpvotes = function(post) {
		posts.upvote(post);
	};

	// check if user is logged in
	$scope.isLoggedIn = auth.isLoggedIn;
}]);

app.controller('PostsController', [
	'$scope',
	'posts',
	'post',
	'auth',
	function($scope, posts, post, auth) {
		$scope.post = post;

		$scope.addComment = function() {
			if($scope.body === '') { return; }
			posts.addComment(post._id, {
				body: $scope.body,
				author: 'user',
			}).success(function(comment) {
				$scope.post.comments.push(comment);
			});
		  	$scope.body = '';
		};

	    $scope.incrementUpvotes = function (comment) {
	        comment.upvotes += 1;
	    };

		$scope.incrementUpvotes = function(comment) {
			posts.upvoteComment(post, comment);
		};

		// check if user is logged in
		$scope.isLoggedIn = auth.isLoggedIn;
}]);

app.controller('AuthController', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth) {
		$scope.user = {};

		$scope.register = function() {
			auth.register($scope.user).error(function(error) {
				$scope.error = error;
			}).then(function() {
				$state.go('home');
			});
		};

		$scope.logIn = function() {
			auth.logIn($scope.user).error(function(error) {
				$scope.error = error;
			}).then(function() {
				$state.go('home');
			});
		};
}]);

app.controller('NavController', [
	'$scope',
	'auth',
	function($scope, auth) {
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
	}
]);