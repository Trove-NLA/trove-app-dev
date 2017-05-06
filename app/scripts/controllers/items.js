'use strict';

/**
 * @ngdoc function
 * @name trovelistsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the trovelistsApp
 */
angular.module('trovelistsApp')
  .controller('ItemsCtrl', ['$scope', '$rootScope', '$routeParams', '$document', '$filter', '$http', '$q', '$location', 'ListsDataFactory', function ($scope, $rootScope, $routeParams, $document, $filter, $http, $q, $location, ListsDataFactory) {
    $document.scrollTop(0);
    $scope.view = 'list';
    $scope.totalDisplayed = 20;
    $scope.loadMore = function() {
      if ($scope.totalDisplayed < $scope.items.length) {
        $scope.totalDisplayed += 20;
      }
    };
    $scope.displayPrevTertiary = function(){
      var index = $scope.item.order-1;
      if (index<=0){
        index = $scope.items.length;
      }
      $scope.displayTertiary(index);
    }
    $scope.displayNextTertiary = function(){
      var index = $scope.item.order+1;
      if (index>=$scope.items.length){
        index=1;
      }
      $scope.displayTertiary(index);
    }
    $scope.displayTertiary = function(order){
      event.preventDefault();
      $scope.isloading=true;
      var item = $filter('findById')($rootScope.items, order);
      $scope.item = item;
    $('#viewitemurl').attr('href',item.url);

      //setItem(item);
      $('.popup-highlights').addClass('is-visible');
      if (item.thumbnail!=undefined){
        $('#itemimagesrc').attr('src',item.thumbnail);
        $('#itemimagesrc').css('display','block');
      }else{

        $('#itemimagesrc').css('display','none');

      }
      $('.itemtitle').html(item.title);
      $('.itemdate').html(item.date);
      $('.itemtype').html(item.type);
      if (item.newspaper!=undefined){
        $('.itemcaption').html("<p><em>"+item.newspaper+"</em>, page "+item.page+"</p>");
      }else{
        $('.itemcaption').html("");
      }
      showSlides(1);
      $('.itemdisplaytext').html(item.note);
      $scope.isloading=false;
    };
    var setItem = function(item) {
      //var item = $filter('findById')($rootScope.items, $routeParams.order);
      $scope.item = item;
      if (item.type === 'newspaper') {
        $http.jsonp(troveApiUrl+'/newspaper/' + item.id + '?encoding=json&reclevel=full&include=articletext&key=' + window.troveAPIKey + '&callback=JSON_CALLBACK', {cache: true})
          .then(function successCallback(response) {
            $scope.isloading=false;
            //var paras = response.data.article.articleText.match(/<p>.*?<\/p>/g);
            //$scope.articleText = paras.slice(0,5).join('') + '&hellip;';
            $scope.articleText = response.data.article.articleText;
            $scope.words = response.data.article.wordCount;
            $scope.showText('snippet');
        });
      } else if (item.type === 'work' && item.holdings === 1) {
        $http.jsonp(troveApiUrl+'/work/' + item.id + '?encoding=json&reclevel=full&include=holdings&key=' + window.troveAPIKey + '&callback=JSON_CALLBACK', {cache: true})
          .then(function successCallback(response) {
            $scope.isloading=false;
            var nuc;
            try {
              nuc = response.data.work.holding[0].nuc;
            } catch(e) {
              //Do nothing
            }
            if (typeof nuc !== 'undefined') {
              $http.jsonp(troveApiUrl+'/contributor/' + nuc + '?encoding=json&key=' + window.troveAPIKey + '&callback=JSON_CALLBACK', {cache: true})
                .then(function successCallback(response) {
                  $scope.repository = response.data.contributor.name.replace(/\.$/, '');
              });
            }
        });
      }else{
        $scope.isloading=false;
      }
    };
    $scope.showText = function(length) {
      if (length === 'snippet') {
        $scope.displayText = $filter('words')($scope.articleText, 100);
        $scope.fullText = false;
      } else {
        $scope.displayText = $scope.articleText;
        $scope.fullText = true;
      }

    };
    if (typeof $rootScope.items === 'undefined' && $rootScope.failed !== true) {
        var tries = 1;
        var loadListData = function() {
          var promises = ListsDataFactory.getPromises();
          $q.all(promises).then(
          function successCallback(responses) {
            ListsDataFactory.loadResources(responses);
          },
          function errorCallback() {
            if (tries < 1) {
              tries++;
              loadListData();
            } else {
              //$rootScope.listHide = false;
              $rootScope.failed = true;
            }
          });
        };
        loadListData();
    } else if ($rootScope.failed === true) {
      $location.url('/');
    }
  }]);
