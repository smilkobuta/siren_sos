function init() {
    init_message_listener();
}

/**
 * メッセージリスナー
 */
function init_message_listener() {
    chrome.runtime.onMessage.addListener(function(msg, sender, callback) {
        if (msg.action == 'get_database') {
            get_database(callback);
        } else if (msg.action == 'save_database') {
            save_database(msg.storage, callback);
        }
        return true;
    });
}

/**
 * データベース取得
 * 
 * @param function callback 
 */
function get_database(callback) {
    var defaults = {
        last_bbs: 'gamewith',
        last_modified: {
            gamewith: 0,
            altema: 0,
        },
        bbs_contents: {
            gamewith: [],
            altema: [],
        }
    };

    chrome.storage.local.get(defaults, function(storage) {
        callback(storage);
    });
}

/**
 * データベース保存
 * 
 * @param object storage 
 * @param function callback 
 */
function save_database(storage, callback) {
    chrome.storage.local.set(storage, function() {
        console.log('stored');
        chrome.runtime.sendMessage({ action: "update_popup" });
        callback();
    });
}

init();