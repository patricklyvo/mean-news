var app = angular.module('meanNews', []);

app.controller('MainCtrl', ['$scope', function($scope) {
	$scope.test = 'Hello World!';
}]);