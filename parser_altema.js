/**
 * 掲示板名称
 */
function get_bbs_name() {
    return 'altema';
}

/**
 * 1ページ目かどうか判定
 */
function is_first_page() {
    if (!location.href.match(/\/kyujokeijiban/) || $('.commentlist').length == 0) {
        return false;
    }
    return location.href.match(/kyujokeijiban\?comment_page=/) ? false : true;
}

/**
 * 最新データの取得
 * 
 * @param function callback 
 */
function load_bbs_pages(callback) {
    let loadinfo = {
        page_num: 3,
        page_loaded: 0,
        bbs_contents: []
    };

    for (let page = 1; page <= loadinfo.page_num; page++) {
        let url = 'https://altema.jp/shiren/kyujokeijiban';
        if (page >= 2) {
            url += '?comment_page=' + page + '&t=' + (new Date()).getTime();
        }

        let $iframe = $('<iframe></iframe>')
            .attr('src', url)
            .data('page', page)
            .css({'display': 'none'})
            .appendTo(document.body);

        $iframe.on('load', function(){
            let $html_body = $(this).contents();
            $('.commentlist .comment', $html_body).ready(function(){
                loadinfo.page_loaded ++;
                loadinfo.bbs_contents = loadinfo.bbs_contents.concat(get_bbs_contents($(this).data('page'), $html_body));

                if (loadinfo.page_num == loadinfo.page_loaded) {
                    // 最後のページ
                    callback(loadinfo.bbs_contents);
                }
            });
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
    $('.comment', $html_body).each(function(){
        bbs_contents.push(parse_bbs_content(page, $(this)));
    });
    return bbs_contents;
}

/**
 * 本文からメタ情報の取得
 * 
 * @param int page
 * @param jQuery $bbs 
 */
function parse_bbs_content(page, $bbs) {
    let body = $('>p', $bbs).html();
    let bbs_no = $('.comment-author span:eq(0)', $bbs).text();
    let is_sos = body.match(/【風来のシレン】救助のお願い/) && body.match(/#風来救助依頼/);
    let is_help = body.match(/【風来のシレン】復活の呪文/) && body.match(/#風来救助成功/);
    let is_thanks = body.match(/【風来のシレン】お礼の手紙/) && body.match(/#風来救助お礼/);
    let url = 'https://altema.jp/shiren/kyujokeijiban';
    url += '?comment_page=' + page;
    url += '#siren_sos_' + bbs_no;

    let replys = [];
    $('.getajcom', $bbs).each(function(){
        let reply_no = $(this).text().replace(/\D/g, '');
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
    console.log('update_page', $('.comment').length);
    $('.comment').each(function(){
        let $bbs = $(this);
        let bbs_no = $('.comment-author span:eq(0)', $bbs).text();

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
    let $icon = $('<span class="siren_sos_icon"></span>');
    if (bbs_content.is_sos) {
        if (!bbs_content.rescued) {
            $icon.text('救助依頼');
            $icon.addClass('siren_sos_ext_sos');
        } else {
            if (bbs_content.rescued.bbs_name == bbs_content.bbs_name) {
                $icon.text('救助依頼（済み）');
                $icon.addClass('siren_sos_ext_sos_done');
                $icon.addClass('getajcom');
                $icon.attr('id', 'getcom_' + bbs_content.rescued.bbs_no);     
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
    $('.fn:eq(0) .siren_sos_icon', $bbs).remove();
    $('.fn:eq(0)', $bbs).append($icon);

    // 参照リンク
    if (bbs_content.replys_from) {
        for (let i = 0; i < bbs_content.replys_from.length; i++) {
            let $icon_ref = $('<span></span>');
            $icon_ref.text('>>' + bbs_content.replys_from[i].bbs_no);
            $icon_ref.addClass('siren_sos_ext_sos_ref');
            $icon_ref.addClass('getajcom');
            $icon_ref.attr('id', 'getcom_' + bbs_content.replys_from[i].bbs_no);
            $('.fn:eq(0)', $bbs).append($icon_ref);
        }
    }
}