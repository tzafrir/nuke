var RESCAN_PERIOD = 1000;
var RESCAN_PERIOD_IDLE = 5000;
var YIELD = 10;
var BATCH_SIZE = 40;

var foundSomeButtons = true;

var cachedShortcutIcon;
var cachedCount = -1;
var settings;

// Forgive us, gods of programming
var COMMENT_CLASSNAME = "a-j fd";
var SHARE_CLASSNAME = "a-j Oh";
var POST_TEXT_CLASSNAME = "vg";
var POST_NAME_CLASSNAME = "yn Hf cg";
var COMMENT_NAME_CLASSNAME = "yn Hf ox";
var MUTE_CLASSNAME = "c-G-j a-H c-G-j-Bc Zi cf";
var SELECTED_POST_CLASSNAME = "md gi rh";
var ORIGINALLY_SHARED_CLASSNAME = "Ux";
var SAVE_POST_CLASSNAME = "a-l-k e-b f-G-ef f-G-ef-i e-b-G";
var SHARE_POST_CLASSNAME = "a-l-k e-b e-b-na";

var DELETED_COMMENT_CLASSNAME = "yj-ia";
var OWN_NAME_NOID_ID = "gbi4t";

// Major DRY violation here...
var COMMENT_SELECTOR = "." + COMMENT_CLASSNAME.replace(/ /g, ".");
var SHARE_SELECTOR = "." + SHARE_CLASSNAME.replace(/ /g, ".");
var SELECTED_POST_SELECTOR = "." + SELECTED_POST_CLASSNAME.replace(/ /g, ".");
var MUTE_SELECTOR = "." + MUTE_CLASSNAME.replace(/ /g, ".");
var PROFILE_NAME_SELECTOR = "." + POST_NAME_CLASSNAME.replace(/ /g, ".") + ", ." + COMMENT_NAME_CLASSNAME.replace(/ /g, ".");
var POST_TEXT_SELECTOR = "." + POST_TEXT_CLASSNAME.replace(/ /g, ".");
var ORIGINALLY_SHARED_SELECTOR = "." + ORIGINALLY_SHARED_CLASSNAME.replace(/ /g, ".");
var SAVE_POST_SELECTOR = "." + SAVE_POST_CLASSNAME.replace(/ /g, ".");
var SHARE_POST_SELECTOR = "." + SHARE_POST_CLASSNAME.replace(/ /g, ".");

var OWN_NAME_SELECTOR = ".c-Cc-XBo9Cc a";
var POST_NAME_SELECTOR = "." + POST_NAME_CLASSNAME.replace(/ /g, ".");

var DELETE_COMMENT_SELECTOR = ".OVu7Pd";

var selfId;

function extractProfile(profile) {
    return { profileLink: profile, profileName: profile.getAttribute('oid'), realName: profile.textContent };
}

function addClickListener(button, userId) {
    button.addEventListener("mouseup", function(e) {
        e.stopPropagation();
        nuke(button, userId);
    }, false);
}

function simulateClick(element) {
    var clickEvent;
    clickEvent = document.createEvent("MouseEvents")
    clickEvent.initEvent("mousedown", true, true)
    element.dispatchEvent(clickEvent);
    
    clickEvent = document.createEvent("MouseEvents")
    clickEvent.initEvent("click", true, true)
    element.dispatchEvent(clickEvent);
    
    clickEvent = document.createEvent("MouseEvents")
    clickEvent.initEvent("mouseup", true, true)
    element.dispatchEvent(clickEvent);
}

function nuke(buttonFromComment, userId) {
    buttonFromComment.innerHTML = "Nuking...";

    var parent = buttonFromComment.parentElement.parentElement;
    var x = parent.querySelector(DELETE_COMMENT_SELECTOR);
    var f = function(event) {
      if (event.target.className && event.target.className.match(DELETED_COMMENT_CLASSNAME)) {
        nukedText = document.createElement("div");
        nukedText.innerHTML = "Nuking...";
        nukedText.style.cssText = "color: red; padding: 1px";
        parent.appendChild(nukedText);
        chrome.extension.sendRequest({'name' : 'block', 'userId': userId}, function(response) {
            if (response.ok) {
                buttonFromComment.innerHTML = "Nuked!";
                nukedText.innerHTML = "Nuked!";
            } else {
                buttonFromComment.innerHTML = "Failed to nuke :(";
                nukedText.innerHTML = "Failed to nuked :(";
            }
        });
        parent.removeEventListener('DOMSubtreeModified', f);
      }
    }
    parent.addEventListener('DOMSubtreeModified', f);
    simulateClick(x);
}

function getPostOwnerUrl(button) {
    var parent = button.parentElement;
    while (parent != null) {
        var postOwnerNode = parent.querySelector(POST_NAME_SELECTOR);
        if (postOwnerNode) {
            return postOwnerNode.href;
        }
        parent = parent.parentElement;
    }
}

function processFooters(first) {
        if (!selfId) {
            chrome.extension.sendRequest({'name': 'getId'}, function(result) {
                if (result.id) {
                    selfId = result.id;
                }
            });
            window.setTimeout(processFooters, RESCAN_PERIOD);
            return;
        }

        var buttons = document.body ? document.body.querySelectorAll("button[g\\:entity^=buzz]:not([tz_nuke_a]), button[g\\:entity^=comment]:not([tz_nuke_a])") : [];

        var oid = selfId;

        if (!buttons || buttons.length == 0) {
            // Less aggressive if idle
            window.setTimeout(processFooters, foundSomeButtons ? RESCAN_PERIOD : RESCAN_PERIOD_IDLE);
            foundSomeButtons = false;
            return;
        }

        foundSomeButtons = true;

        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            button.setAttribute("tz_nuke_a", 1);

            // Only show nuke button on posts owned by the user.
            if (!getPostOwnerUrl(button).match(oid)) {
                continue;
            }

            // Try to figure out what the author's name is
            var parent = button.parentElement;
            var profile;
            while (parent != null) {
                var profileLink = parent.querySelector(PROFILE_NAME_SELECTOR);
                if (profileLink) {
                    profile = extractProfile(profileLink);
                    break;
                }
                
                parent = parent.parentElement;
            }

            if (!profile)
                continue;

            if (profile.profileName == oid) {
                // Don't nuke yourself.
                //continue;
            }
             
            if (button.id.match(/#/)) {
                // Nuke.
                var newButton = document.createElement('a');
                newButton.setAttribute('role', 'button');
                newButton.textContent = "Nuke";

                button.parentElement.appendChild(document.createTextNode('\u00a0\u00a0-\u00a0\u00a0'));
                button.parentElement.appendChild(newButton, null);
                addClickListener(newButton, profile.profileName);
            }
        }
        window.setTimeout(processFooters, RESCAN_PERIOD);
}

function onLoad() {
    processFooters();
}
document.addEventListener("DOMContentLoaded", onLoad);

