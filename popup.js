(function($){
    $(function() {

        chrome.runtime.onMessage.addListener(
            function(msg, sender, sendResponse) {
                if (msg.action === "update_popup") {
                    init_popup();
                }
            }
        );

        init_popup();
    });

    /**
     * ポップアップ初期化
     */
    function init_popup() {
        chrome.runtime.sendMessage({ action: "get_database" }, function(storage) {
            if (storage.bbs_contents) {
                for (let code in storage.bbs_contents) {
                    let bbs_contents = analyze_bbs_contents(storage.bbs_contents[code], storage);
                    update_tab(code, storage.last_modified[code]);
                    update_status(code, bbs_contents);
                    update_ranking(code, bbs_contents);
                }
                if (storage.last_bbs) {
                    // デフォルトタブ
                    $('#' + storage.last_bbs + '-tab').trigger('click');
                }
            }
        });
    }

    /**
     * タブの内容初期化
     * 
     * @param string code 
     * @param number last_modified 
     */
    function update_tab(code, last_modified) {
        let $container = $('#' + code);
        let time = new Date(last_modified);
        let last_modified_text = '';
        last_modified_text += time.getFullYear() + '年';
        last_modified_text += (time.getMonth() + 1) + '月';
        last_modified_text += time.getDay() + '日';
        last_modified_text += (time.getHours() > 10 ? time.getHours() : '0' + time.getHours()) + ':';
        last_modified_text += (time.getMinutes() > 10 ? time.getMinutes() : '0' + time.getMinutes()) + ':';
        last_modified_text += (time.getSeconds() > 10 ? time.getSeconds() : '0' + time.getSeconds());
        $('.last_modified', $container).text(last_modified_text);

        $('.btn.update', $container).on('click', function(){
            let url = $(this).attr('href');
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs && tabs.length > 0) {
                    chrome.tabs.update(tabs[0].id, { url: url });
                }
            });
            return false;
        });
    }

    /**
     * ステータス部更新
     * 
     * @param string code 
     * @param object[] bbs_contents 
     */
    function update_status(code, bbs_contents) {
        let count_sos = 0;
        let count_sos_done = 0;
        let count_help = 0;
        let count_thanks = 0;
        for (let i = 0; i < bbs_contents.length; i++) {
            let bbs_content = bbs_contents[i];
            if (bbs_content.is_sos) {
                if (bbs_content.rescued) {
                    count_sos_done ++;
                } else {
                    count_sos ++;
                }
            } else if (bbs_content.is_help) {
                count_help ++;
            } else if (bbs_content.is_thanks) {
                count_thanks ++;
            }
        }

        let count_sos_done_percent = count_sos + count_sos_done > 0 ? Math.round(count_sos_done / (count_sos + count_sos_done) * 100) : 0;
        let count_thanks_percent = count_sos_done > 0 ? Math.round(count_thanks / count_sos_done * 100) : 0;

        let $container = $('#' + code);
        $('.count_sos', $container).text(count_sos);
        $('.count_sos_done', $container).text(count_sos_done);
        $('.count_help', $container).text(count_help);
        $('.count_sos_done_percent', $container).text(count_sos_done_percent);
        $('.count_thanks', $container).text(count_thanks);
        $('.count_thanks_percent', $container).text(count_thanks_percent);
    }

    /**
     * ランキング部更新
     * 
     * @param string code 
     * @param object[] bbs_contents 
     */
    function update_ranking(code, bbs_contents) {
        let helper_count_hash = {};
        for (let i = 0; i < bbs_contents.length; i++) {
            let bbs_content = bbs_contents[i];
            if (bbs_content.is_help && bbs_content.helper) {
                if (!helper_count_hash[bbs_content.helper.id]) {
                    helper_count_hash[bbs_content.helper.id] = {
                        id: bbs_content.helper.id,
                        name: bbs_content.helper.name,
                        count: 0
                    }
                }
                helper_count_hash[bbs_content.helper.id].count++;
            }
        }
        
        let helper_count = [];
        for (let id in helper_count_hash) {
            helper_count.push(helper_count_hash[id]);
        }
        
        // count降順でソート
        helper_count.sort(function(a, b){
            if (a.count == b.count) {
                return 0;
            }
            return a.count > b.count ? -1 : 1;
        });

        let $container = $('#' + code + ' .ranking');
        $('tr:not(.template)', $container).remove();

        for (let i = 0; i < helper_count.length; i++) {
            let helper = helper_count[i];
            let $tmpl = $('.template', $container).clone().removeClass('template');
            $('.name', $tmpl).text((i + 1) + '. ' + helper.name + ' （ID:' + helper.id + '）');
            $('.count', $tmpl).text(helper.count + '回');
            $tmpl.appendTo($container);
        }
    }

})(jQuery);