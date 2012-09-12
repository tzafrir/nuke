var INIT_REPEAT_INTERVAL = 3 * 60000;
var INIT_RETRY_INTERVAL = 5000;

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-27041781-3']);
_gaq.push(['_trackPageview']);

(function() {
 var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
 ga.src = 'https://ssl.google-analytics.com/ga.js';
 var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

function trackNukeClick() {
  _gaq.push(['_trackEvent', 'Nuke', 'Clicked']);
}

function trackReportSuccess(ok) {
  var s = ok ? 'Success' : 'Failure';
  _gaq.push(['_trackEvent', 'Reporting', s]);
}

function trackDeleteSuccess(ok) {
  var s = ok ? 'Success' : 'Failure';
  _gaq.push(['_trackEvent', 'Deleting', s]);
}

function trackBlockSuccess(ok) {
  var s = ok ? 'Success' : 'Failure';
  _gaq.push(['_trackEvent', 'Blocking', s]);
}

function getApi(identityId) {
  var api = apis[identityId];
  if (!api) {
    api = plus;
  }
  return api;
}


function onRequest(request, sender, callback) {
  var n = request.name;
  ok = true;
  var api = getApi(request.activeIdentity);
  if (n == 'block') {
    api.modifyBlocked(function(ok) {
      callback({'ok': ok});
      trackBlockSuccess(ok);
    }, [request.userId], true);
  } else if (n == 'getId') {
    var info = api.getInfo();
    if (info) {
      callback({'id': info.id});
    } else {
      callback({})
    }
  } else if (n == 'settings') {
    callback({'hydrogen': localStorage['hydrogen']});
  } else if (n == 'nukeClick') {
    trackNukeClick();
  } else if (n == 'report') {
    api.reportProfile(function(ok) {
      callback({'ok': ok});
      trackReportSuccess(ok);
    }, request.userId);
  } else if (n == 'deleteComment') {
    api.deleteComment(function(ok) {
      callback({'ok': ok});
      trackDeleteSuccess(ok);
    }, request.commentId);
  }
};

// Wire up the listener.
chrome.extension.onRequest.addListener(onRequest);

// Set up the API
var plus = new GooglePlusAPI();
var apis = {};
var initTimeoutId;

function initialize(opts) {
  var newPlus = new GooglePlusAPI();
  if (!plus) {
    plus = newPlus;
  }
  window.clearTimeout(initTimeoutId);
  try {
    newPlus.init(function(response) {
      if (response.status) {
        newPlus.getAllIdentitiesApis(function(result) {
          result.forEach(function(api) {
            function addApi() {
              apis[api.getInfo().id] = api;
            }
            if (!(api.getInfo() && api.getInfo().id == newPlus.getInfo().id)) {
              api.init(function() {
                addApi();
              });
            } else {
              plus = newPlus;
              addApi();
            }
          });
        });

        initTimeoutId = window.setTimeout(initialize, INIT_REPEAT_INTERVAL);
      } else {
        initTimeoutId = window.setTimeout(initialize, INIT_RETRY_INTERVAL);
      }
    });
  } catch (e) {
    _gaq.push(['_trackEvent', 'Failure', 'plus.init']);
    console.error(e, e.message);
    window.setTimeout(initialize, INIT_RETRY_INTERVAL);
  }
};

initialize();

window.setInterval(function() {
  plus.init(function(){});
}, INIT_REPEAT_INTERVAL);

