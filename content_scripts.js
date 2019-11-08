// $('document').ready(function(){
//     chrome.storage.local.clear();
//     refresh_database();
// });
$(function(){
    // chrome.storage.local.clear();
    refresh_database();
});

/**
 * データベースを最新の状態にする
 */
function refresh_database() {
    
    chrome.runtime.sendMessage({ action: "get_database" }, function(storage) {
        let bbs_name = get_bbs_name();
        
        console.log('database_info', new Date(storage.last_modified[bbs_name]), storage);

        if (storage.last_modified[bbs_name] < new Date().getTime() - 1000 * 60 * 5) {
            // 最終更新日時より5分以上経っている場合、BBS全取得処理
            console.log('update');

            // ロード実行
            load_bbs_pages(function(bbs_contents){
                // No昇順でソート
                bbs_contents.sort(function(a, b){
                    if (a.bbs_no == b.bbs_no) {
                        return 0;
                    }
                    return a.bbs_no < b.bbs_no ? -1 : 1;
                });

                // 登録
                storage.last_bbs = bbs_name;
                storage.last_modified[bbs_name] = new Date().getTime();
                storage.bbs_contents[bbs_name] = bbs_contents;

                chrome.runtime.sendMessage({ action: "save_database", storage: storage }, function() {
                    console.log('stored');
                    analyze_and_update_page(bbs_contents, storage);
                });
            });
        } else if (is_first_page()) {
            // 新規追加分を読み込み
            let bbs_contents = storage.bbs_contents[bbs_name];
            let bbs_contents_add = get_bbs_contents(1, $(document.body));

            // No昇順でソート
            bbs_contents_add.sort(function(a, b){
                if (a.bbs_no == b.bbs_no) {
                    return 0;
                }
                return a.bbs_no < b.bbs_no ? -1 : 1;
            });

            for (let i = 0; i < bbs_contents_add.length; i++) {
                let found = false;
                for (let j = 0; j < bbs_contents.length; j++) {
                    if (bbs_contents_add[i].bbs_no == bbs_contents[j].bbs_no) {
                        // すでにある
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.log('add', bbs_contents_add[i]);
                    bbs_contents.push(bbs_contents_add[i]);
                }
            }

            // 登録
            storage.last_bbs = bbs_name;
            storage.last_modified[bbs_name] = new Date().getTime();
            storage.bbs_contents[bbs_name] = bbs_contents;

            chrome.runtime.sendMessage({ action: "save_database", storage: storage }, function() {
                console.log('done');
                analyze_and_update_page(bbs_contents, storage);
            });
        } else {
            analyze_and_update_page(storage.bbs_contents[bbs_name], storage);
        }
    });
}

/**
 * 投稿の解析＆画面の書き換え
 * 
 * @param object[] bbs_contents 
 * @param object storage 
 */
function analyze_and_update_page(bbs_contents, storage) {
    bbs_contents = analyze_bbs_contents(bbs_contents, storage);
    update_page(bbs_contents);
}
