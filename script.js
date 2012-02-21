/**
 * This file was originally written by Matt Mastracci as part of Relpies and More for Google+:
 *   https://chrome.google.com/webstore/detail/fgmhgfecnmeljhchgcjlfldjiepcfpea
 *   https://plus.google.com/u/0/115459243651688775505/posts
 *
 * Modified by Tzafrir Rehan to add nuke-specific logic, and remove unused code.
 */

var RESCAN_PERIOD = 500;
var RESCAN_PERIOD_IDLE = 2500;
var YIELD = 10;
var BATCH_SIZE = 40;

var foundSomeactions = true;

var cachedShortcutIcon;
var cachedCount = -1;
var settings;

// Forgive us, gods of programming
var COMMENT_CLASSNAME = "c-C UuCFYe";
var POST_TEXT_CLASSNAME = "rXnUBd";
var POST_NAME_CLASSNAME = "cs2K7c qk is";
var COMMENT_NAME_CLASSNAME = "cs2K7c qk xs";

var DELETED_COMMENT_CLASSNAME = "Vd";

// Major DRY violation here...
var COMMENT_SELECTOR = "." + COMMENT_CLASSNAME.replace(/ /g, ".");
var PROFILE_NAME_SELECTOR = "." + POST_NAME_CLASSNAME.replace(/ /g, ".") + ", ." + COMMENT_NAME_CLASSNAME.replace(/ /g, ".");
var POST_TEXT_SELECTOR = "." + POST_TEXT_CLASSNAME.replace(/ /g, ".");
var POST_NAME_SELECTOR = "." + POST_NAME_CLASSNAME.replace(/ /g, ".");

// The flags container
var ACTION_SELECTOR = ".Yg14nf.zo";

var NUKE_OVERLAY_ID = 'tz_nuke_overlay';

var selfId;
var isHydrogen = false;
var isDismissed = false;

var commentId;
var nukedPersonId;
var nukedTextDiv;
var commentDiv;

function extractProfile(profile) {
    return { profileLink: profile, profileName: profile.getAttribute('oid'), realName: profile.textContent };
}

function addClickListener(button, userId) {
    button.addEventListener("click", function(e) {
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
    nukedPersonId = userId;
    commentDiv = buttonFromComment.parentElement.parentElement.parentElement.parentElement;
    commentId = commentDiv.id;
    chrome.extension.sendRequest({'name': 'nukeClick'}, function() {});
    var parent = buttonFromComment.parentElement.parentElement;
    nukedTextDiv = document.createElement("div");
    nukedTextDiv.style.cssText = "color: red; padding: 1px";
    parent.appendChild(nukedTextDiv);

    if (isHydrogen) {
      nukeBlockReport();
    } else {
      document.querySelector("#" + NUKE_OVERLAY_ID).style.display = "block";
    }
}

function deprecated(nukeButton) {
    nukeButton.addEventListener('click', function(e) {
      e.stopPropagation();
      var popup = document.createElement("div");
      popup.style.cssText = "box-shadow: 0 2px 4px rgba(0, 0, 0, .2); border-radius: 2px; background-color: white; border: 1px solid #CCC; padding: 16px; position: absolute; z-index: 1201!important;";
      popup.style.left = e.offsetX + "px";
      popup.style.bottom = e.offsetY + "px";
      popup.style.width = "200px";

      var deprecatedMessage = document.createElement('p');
      deprecatedMessage.innerHTML = "The Nuke button has been moved near the Delete and Flag buttons. Look for <img src='https://nukecomments.appspot.com/ico/nuke.png' /><br /><br /><span style='color: red'>Dismiss</span>";
      popup.appendChild(deprecatedMessage);
      nukeButton.parentElement.appendChild(popup);
      popup.addEventListener('click', function(event) {
          event.stopPropagation();
          popup.style.display = 'none';
          chrome.extension.sendRequest({'name': 'dismissed'}, function() {});
      }, false);
    }, false);
}

function block() {
    var userId = nukedPersonId;
    var destDiv = nukedTextDiv;
    destDiv.innerHTML = "Nuking...";
    chrome.extension.sendRequest({'name': 'block', 'userId': userId}, function(response) {
        if (response.ok) {
            destDiv.innerHTML = "Nuked!";
        } else {
            destDiv.innerHTML = "Failed to nuke :(";
        }
    });
}

function report() {
    var userId = nukedPersonId;
    chrome.extension.sendRequest({'name': 'report', 'userId': userId}, function() {});
}

function deleteComment() {
    var id = commentId;
    var div = commentDiv;
    chrome.extension.sendRequest({'name': 'deleteComment', 'commentId': id}, function(ok) {
      if (ok) {
        div.className += (" " + DELETED_COMMENT_CLASSNAME);
      }
    });
}

function cancel(event) {
    if (event) {
      event.stopPropagation();
    }
    document.querySelector("#" + NUKE_OVERLAY_ID).style.display = "none";
    commentId = undefined;
    nukedPersonId = undefined;
    nukedTextDiv = undefined;
    commentDiv = undefined;
}

function nukeBlock(event) {
    block();
    deleteComment();
    cancel(event);
}

function nukeBlockReport(event) {
    block();
    deleteComment();
    report();
    cancel(event);
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

function displayFirstWhenSecondIsHovered(first, second) {
    second.addEventListener('mouseover', function(event) {
      first.style.display = "";
    });
    second.addEventListener('mouseout', function(event) {
      first.style.display = "none";
    });
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


        var actions = document.body ? document.body.querySelectorAll(ACTION_SELECTOR + ":not([tz_nuke_a])") : [];

        var oid = selfId;

        if (!actions || actions.length == 0) {
            // Less aggressive if idle
            window.setTimeout(processFooters, foundSomeactions ? RESCAN_PERIOD : RESCAN_PERIOD_IDLE);
            foundSomeactions = false;
            return;
        }

        foundSomeactions = true;

        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];
            action.setAttribute("tz_nuke_a", 1);

            // Only show nuke button on posts owned by the user.
            if (!getPostOwnerUrl(action).match(oid)) {
                continue;
            }

            // Try to figure out what the author's name is
            var parent = action.parentElement;
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
                continue;
            }

            // Nuke.
            var newButton = document.createElement('div');
            newButton.setAttribute('role', 'button');
            newButton.style.cssText = "height: 16px; width: 16px; float: right;" +
                                      "background:url('https://nukecomments.appspot.com/ico/nuke.png');" +
                                      "margin-left: 12px; display: none";
            newButton.title = "Nuke this comment";
            action.appendChild(newButton, null);
            addClickListener(newButton, profile.profileName);
            displayFirstWhenSecondIsHovered(newButton, action.parentElement.parentElement);

            if (!isDismissed) {
                // Deprecation.
                var depButton = document.createElement('a');
                depButton.setAttribute('role', 'button');
                depButton.textContent = "Nuke";
                depButton.style.color = "#666";
                var element = action.parentElement.children[1];

                element.appendChild(document.createTextNode('\u00a0\u00a0-\u00a0\u00a0'));
                element.appendChild(depButton, null);
                deprecated(depButton);
            }

        }
        window.setTimeout(processFooters, RESCAN_PERIOD);
}

function onLoad() {
    processFooters();
    var isNotification = !!document.location.toString().match(/\/notifications\/frame/);
    var size = isNotification ? "100%" : "2em";
    var overlay = document.createElement("div");
    overlay.id = NUKE_OVERLAY_ID;
    overlay.style.cssText = "display: none;" +
                            "background-color: rgba(180, 0, 0, 0.6);" +
                            "position: fixed;" +
                            "top: 0;" +
                            "left: 0;" +
                            "width: 100%;" +
                            "height: 100%;" +
                            "z-index: 1287;";

    var dialog = document.createElement("div");
    dialog.style.cssText = "position: fixed;" +
                           "top: 25%;" +
                           "left: 0;" +
                           "width: 100%;" +
                           "height: 30%;" +
                           "text-align: center;" +
                           "font-size: " + size + ";" +
                           "font-family: monospace;" +
                           "color: #400;";

    var buttonClassName = 'ov_nuke_button';

    var style = document.createElement("style");
    style.innerHTML = "." + buttonClassName + " {" +
                      "  border: 2px solid #fdc;" +
                      "  -webkit-border-radius: 25px;" +
                      "  background-color: #fe9;" +
                      "  width: auto;" +
                      "  display: inline-block;" +
                      "  padding: 20px;" +
                      "  margin: 20px;" +
                      "}" +
                      "." + buttonClassName + ":hover {" +
                      "  cursor: pointer;}";
    document.body.appendChild(style);

    dialog.innerHTML = "<div id='tz_btn_0' class='" + buttonClassName + "'><p>" +
                       "  Delete & Block</p></div>" +
                       "<div id='tz_btn_1' class='" + buttonClassName + "'><p>" +
                       "  Delete & Block & Report</p></div>" +
                       "<div id='tz_btn_2' class='" + buttonClassName + "' style='" +
                          "background-color: #ccc; width: 200px;'><p>" +
                       "  Cancel</p></div>";

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    document.querySelector("#tz_btn_0").addEventListener('click', nukeBlock);
    document.querySelector("#tz_btn_1").addEventListener('click', nukeBlockReport);
    document.querySelector("#tz_btn_2").addEventListener('click', cancel);

    chrome.extension.sendRequest({'name': 'settings'}, function(result) {
        isHydrogen = result.hydrogen == "true" ? true : false;
        isDismissed = result.dismissed == "true" ? true : false;
    });

}
document.addEventListener("DOMContentLoaded", onLoad);

