const db = require('../config/db');

// 유저이름 가져오기
const getUsersPage = async (req, res, next) => {

    const { searchBy, query: searchQuery } = req.query; 
    try {
        /*
            CLEAR: 검색어에 맞춰 유저 목록을 출력하는 페이지를 렌더링하는 코드를 작성하세요.
        */


        let sql = `
            SELECT 
                username, 
                role,
                borrowable
            FROM 
                users
        `;

        //where(검색) 이 실행되는 경우만 쿼리 추가해야함
        if (searchQuery && searchBy) {
            let searchColumn = '';
            if (searchBy === 'username') {
                searchColumn = 'username';
            } else if (searchBy === 'role') {
                searchColumn = 'role';
            }

            if (searchColumn) {
                sql += ` WHERE ${searchColumn} LIKE '%${searchQuery}%'`;
            }
        }

        //이름순으로 정렬함
        sql += ` ORDER BY username ASC`;

        const [users] = await db.query(sql);


        res.render('pages/users', {
            title: 'User Management',
            users: users, 
            searchBy: searchBy || 'username', 
            query: searchQuery || ''   
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getUsersPage
};