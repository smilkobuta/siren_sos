/**
 * 掲示板名称
 */
function get_bbs_name() {
    return 'gamewith';
}

/**
 * 1ページ目かどうか判定
 */
function is_first_page() {
    if (!location.href.match(/\/threads\/show\/771/) || $('#bbs-posts').length == 0) {
        return false;
    }
    return location.href.match(/\/threads\/show\/771\?p=/) ? false : true;
}

/**
 * 最新データの取得
 * 
 * @param function callback 
 */
function load_bbs_pages(callback) {
    let loadinfo = {
        page_num: 5,
        page_loaded: 0,
        bbs_contents: []
    };

    for (let page = 1; page <= loadinfo.page_num; page++) {
        let url = 'https://gamewith.jp/furai-shiren/bbs/threads/show/771';
        if (page >= 2) {
            url += '?p=' + page;
        }

        let $iframe = $('<iframe></iframe>')
            .attr('src', url)
            .data('page', page)
            .css({'display': 'none'})
            .appendTo(document.body);

        $iframe.on('load', function(){
            loadinfo.page_loaded ++;
            
            let $html_body = $(this).contents();
            loadinfo.bbs_contents = loadinfo.bbs_contents.concat(get_bbs_contents($(this).data('page'), $html_body));

            if (loadinfo.page_num == loadinfo.page_loaded) {
                // 最後のページ
                callback(loadinfo.bbs_contents);
            }
        });
    }
}

/**
 * DOMから投稿を抽出
 * 
 * @param int page
 * @param jQuery $html_body 
 */
function get_bbs_contents(page, $html_body) {
    let bbs_contents = [];
    $('.bbs-post.bbs-content', $html_body).each(function(){
        bbs_contents.push(parse_bbs_content(page, $(this)));
    });
    return bbs_contents;
}

/**
 * 本文からメタ情報の取得
 * 
 * @param jQuery $bbs 
 */
function parse_bbs_content(page, $bbs) {
    let body = $('.bbs-post-body', $bbs).html();
    let bbs_no = $bbs.attr('data-number');
    let is_sos = body.match(/【風来のシレン】救助のお願い/) && body.match(/#風来救助依頼/);
    let is_help = body.match(/【風来のシレン】復活の呪文/) && body.match(/#風来救助成功/);
    let is_thanks = body.match(/【風来のシレン】お礼の手紙/) && body.match(/#風来救助お礼/);
    let url = 'https://gamewith.jp/furai-shiren/bbs/threads/show/771';
    if (page > 1) {
        url += '?p=' + page;
    }
    url += '#bbs-post-' + bbs_no;

    let replys = [];
    $('.bbs-reply-anchor', $bbs).each(function(){
        let reply_no = $(this).attr('data-reply-number');
        replys.push(reply_no);
    });

    return {
        bbs_name: get_bbs_name(),
        bbs_no: bbs_no,
        is_sos: is_sos ? true : false,
        is_help: is_help ? true : false,
        is_thanks: is_thanks ? true : false,
        replys: replys,
        body: body,
        url: url
    };
}

/**
 * 画面の書き換え
 * 
 * @param object[] bbs_contents 
 */
function update_page(bbs_contents) {
    $('.bbs-post.bbs-content').each(function(){
        let $bbs = $(this);
        let bbs_no = $bbs.attr('data-number');

        for (let i = 0; i < bbs_contents.length; i++) {
            if (bbs_no == bbs_contents[i].bbs_no) {
                display_marks($bbs, bbs_contents[i]);
            }
        }
    });
}

/**
 * 投稿要素の書き換え
 * 
 * @param jQuery $bbs 
 * @param object bbs_content 
 */
function display_marks($bbs, bbs_content) {
    let $icon = $('<span></span>');
    $icon.attr('id', 'siren_sos_' + bbs_content.bbs_no);
    if (bbs_content.is_sos) {
        if (!bbs_content.rescued) {
            $icon.text('救助依頼');
            $icon.addClass('siren_sos_ext_sos');
        } else {
            if (bbs_content.rescued.bbs_name == bbs_content.bbs_name) {
                let $link = $('<a>救助依頼（済み）</a>');
                $link.on('click', function(){
                    popup_reply($link, bbs_content.rescued);
                    return false;
                });
                $icon.append($link);
                $icon.addClass('siren_sos_ext_sos_done');
            } else {
                let $link = $('<a>救助依頼（済み）</a>').attr('href', bbs_content.rescued.url);
                $icon.append($link);
                $icon.addClass('siren_sos_ext_sos_done');
            }
        }
    } else if (bbs_content.is_help) {
        $icon.text('復活の呪文');
        $icon.addClass('siren_sos_ext_sos_help');
    } else if (bbs_content.is_thanks) {
        $icon.text('お礼');
        $icon.addClass('siren_sos_ext_sos_thanks');
    }

    $('.bbs-post-user-name', $bbs).append($icon);

    // 参照リンク
    if (bbs_content.replys_from) {
        for (let i = 0; i < bbs_content.replys_from.length; i++) {
            let $icon_ref = $('<span></span>');
            $icon_ref.attr('id', 'siren_sos_ref_' + bbs_content.bbs_no + '_' + i);
            let $link = $('<a></a>').text('>>' + bbs_content.replys_from[i].bbs_no);
            $link.on('click', function(){
                popup_reply($link, bbs_content.replys_from[i]);
                return false;
            });
            $icon_ref.append($link);
            $icon_ref.addClass('siren_sos_ext_sos_ref');
            $('.bbs-post-user-name', $bbs).append($icon_ref);
        }
    }
}

function popup_reply($link, rescued) {
    let bbs_no = rescued.bbs_no;

    $.ajax({
        url: '/api/bbs/post/show?thread_id=771&number=' + bbs_no + '&_=' + new Date().getTime(),
        type: 'get',
        dataType: 'json'
    }).done(function(data){
        let $modal = $('<div class="bbs-reply-popup-clone bbs-post" style="display:block;background:#fff;padding:5px;"</div>')
            .attr('id', 'bbs-post-popup-clone-' + bbs_no)
            .attr('data-number', bbs_no);
        $('<div class="title"><span class="bbs-popup-title">' + bbs_no + 'の書き込み</span><span class="flr close-modal icon-close">×</span></div>').appendTo($modal);
        $('<div class="bbs-content bbs-reply-popup-content"><div class="bbs-post-number-block"><div id="js-not-logged-in" style=""><div class="crop-thumbnail_img bbs-post-user-icon" style="display: inline-block;background-image:url(https://gamewith.akamaized.net/assets/images/users/user-default-icon.png);"></div><span class="bbs-post-user-name"></span><span class="bbs-post-number">' + bbs_no + '</span></div></div>').appendTo($modal);
        $('<div class="bbs-post-body-block"><p class="bbs-post-body" style="white-space:pre;"></div>').appendTo($modal);
        $('<div class="bbs-post-footer cf"><div class="bbs-post-time sub-info"><span class="bbs-posted-time"></span></div><a class="bbs-go"><i class="icon-bbs-reply"></i>移動</a></div>').appendTo($modal);
        $modal.appendTo($('#bbs-posts'));

        $('.bbs-post-user-name', $modal).html(data.result.user_name);
        $('.bbs-post-body', $modal).html(data.result.body);
        $('.bbs-posted-time', $modal).html(data.result.posted_time);
        $('.bbs-go', $modal).attr('href', rescued.url);
        $('.icon-close,bbs-go', $modal).on('click', function(){
            $modal.remove();
        });

        let offset = $link.closest('.bbs-content').offset();

        $modal.offset({
            top: offset.top + 50,
            left: offset.left + 10
        });
    });
}
