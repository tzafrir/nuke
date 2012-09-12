window.___gcfg = {lang: 'en'};
(function()
{var po = document.createElement("script");
po.type = "text/javascript"; po.async = true;po.src = "https://apis.google.com/js/plusone.js";
var s = document.getElementsByTagName("script")[0];
s.parentNode.insertBefore(po, s);
})();

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-27041781-3']);
_gaq.push(['_trackPageview']);

(function() {
 var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
 ga.src = 'https://ssl.google-analytics.com/ga.js';
 var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

function restore() {
  var enable = localStorage['hydrogen'] == "true" ? true : false;
  document.getElementById('hydrogen').checked = enable;
}

function hydrogen() {
  enable = document.getElementById('hydrogen').checked;
  localStorage['hydrogen'] = enable;
  var s = enable ? "Enable" : "Disable";
  _gaq.push(['_trackEvent', 'Hydrogen', s]);
  alert("NOTE: You need to refresh your Google+ tab for the changes to apply!");
}

(function() {
  var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
  po.src = 'https://apis.google.com/js/plusone.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
})();

document.addEventListener("DOMContentLoaded", function() {
  restore();
  document.getElementById('hydrogen').onchange = hydrogen;
});
