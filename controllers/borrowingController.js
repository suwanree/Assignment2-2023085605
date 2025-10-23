const db = require('../config/db');

const getBorrowingsPage = async (req, res, next) => {
    
    //사용자 아이디 가져오기(현재로그인한 세션에대해서)
    const userId = req.session.userId;

    // 로그안안했으면 로그인페이지로
    if (!userId) {
        return res.redirect('/login');
    }

    try {
        /*
            CLEAR: 유저의 대여 기록을 모두 출력하는 페이지를 렌더링하는 코드를 작성하세요.
        */


        //책이름,작가, 등등정보를 가져오기위해 books랑 조인
        const sql = `
            SELECT 
                b.bookname AS book_title,    -- EJS: borrowing.book_title
                b.author AS book_author,      -- EJS: borrowing.book_author
                br.borrowDate,                -- EJS: borrowing.borrowDate
                br.returnDate,                -- EJS: borrowing.returnDate
                br.bookID,                    -- EJS: Return 폼 hidden input
                br.bookLocation,              -- EJS: Return 폼 hidden input
                br.bookNum,                   -- EJS: Return 폼 hidden input
                br.bookNum AS book_instance_id -- EJS: borrowing.book_instance_id (# ID 표시용)
            FROM 
                borrow AS br
            JOIN 
                books AS b ON br.bookID = b.bookID
            WHERE 
                br.username = ?
            ORDER BY 
                br.borrowDate DESC; -- 최근 대출 순으로 정렬
        `;

        const [borrowings] = await db.query(sql, [userId]);
        res.render('pages/borrowings', {
            title: 'My Borrowing History',
            borrowings: borrowings
        });
    } catch (err) {

        next(err);
    }
};

module.exports = {
    getBorrowingsPage
};