/**
 * 投稿の解析
 * 
 * @param object[] bbs_contents 
 * @param object storage 
 */
function analyze_bbs_contents(bbs_contents, storage) {
    // 全救助依頼の依頼日、パスワード抽出
    let all_contents = [].concat(storage.bbs_contents.gamewith, storage.bbs_contents.altema);

    let password_hash = {};
    let bbs_no_hash = {};
    let rescued_hash = {};

    for (let i = 0; i < all_contents.length; i++) {
        let bbs_content = all_contents[i];
        let body = bbs_content.body;

        if (bbs_content.is_sos) {
            
            // 依頼日
            let datetime_search = body.match(/依頼発行日：([0-9\/: ]+)/);
            if (datetime_search) {
                bbs_content.datetime = datetime_search[1];
            }

            // パスワード
            let password_search = body.substring(body.indexOf("倒れた場所："), body.indexOf("#風来救助")).split("<br>");
            if (password_search && password_search.length >= 4) {
                let password = password_search[2] + password_search[3];
                password = password.replace(/[\r\n\s 　]/g, "");
                bbs_content.password = password;
            
                // ハッシュに配列形式で保存
                if (!password_hash[password]) {
                    password_hash[password] = [];
                }
                password_hash[password].push(bbs_content);
            }

            if (bbs_contents.length > 0) {
                // 同一サイトのものだけマッチング用に保存
                if (bbs_content.bbs_name == bbs_contents[0].bbs_name) {
                    bbs_no_hash[bbs_content.bbs_no] = bbs_content;
                }
            }
        } else if (bbs_content.is_help) {
            // 救助者
            let helper_search = body.match(/救助者：([^（]+)（ID：([^）]+)）/);
            if (helper_search) {
                bbs_content.helper = {
                    id: helper_search[2],
                    name: helper_search[1],
                };
            }
        }
    }
    
    // 救助済みかどうか判定
    for (let i = 0; i < bbs_contents.length; i++) {
        if (bbs_contents[i].is_help) {
            for (let j = 0; j < bbs_contents[i].replys.length; j++) {
                let bbs_no = bbs_contents[i].replys[j];
                if (!rescued_hash[bbs_no]) {
                    rescued_hash[bbs_no] = bbs_contents[i];
                }
            }
        }
    }
    
    // 同一救助依頼を見つける
    for (let i = 0; i < bbs_contents.length; i++) {
        let bbs_content = bbs_contents[i];
        if (bbs_content.is_sos) {
            bbs_content = bbs_no_hash[bbs_contents[i].bbs_no];
            bbs_content.same_sos = [];
            if (bbs_content.datetime && bbs_content.password) {
                for (let j = 0; j < password_hash[bbs_content.password].length; j++) {
                    if (password_hash[bbs_content.password][j].bbs_no != bbs_content.bbs_no) {
                        // 自分自身以外を保存
                        bbs_content.same_sos.push(password_hash[bbs_content.password][j]);
                    }
                }
            }

            // 救助済み
            if (rescued_hash[bbs_content.bbs_no]) {
                bbs_content.rescued = rescued_hash[bbs_content.bbs_no];
            }
        }
        bbs_contents[i] = bbs_content;
    }

    // 返信元一覧
    for (let i = 0; i < bbs_contents.length; i++) {
        if (bbs_contents[i].replys) {
            for (let j = 0; j < bbs_contents[i].replys.length; j++) {
                for (let k = 0; k < bbs_contents.length; k++) {
                    if (bbs_contents[i].replys[j] == bbs_contents[k].bbs_no) {
                        if (!bbs_contents[k].replys_from) {
                            bbs_contents[k].replys_from = [];
                        }
                        bbs_contents[k].replys_from.push(bbs_contents[i]);
                    }
                }
            }
        }
    }

    return bbs_contents;
}
