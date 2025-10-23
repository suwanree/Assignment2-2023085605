const db = require('../config/db'); 

//리뷰할떄마다 ratiog 수정해야 하므로
const { updateUserRating } = require('./ratingController'); 

// 리뷰 작성 페이지를 보여주는함수
const getAddReviewPage = async (req, res, next) => {

    const bookId = req.params.bookId;
    const username = req.session.userId; 

    if (!username) {
        return res.redirect('/login');
    }

    try {
        const [bookRows] = await db.query(
            "SELECT bookname, author FROM books WHERE bookID = ?",
            [bookId]
        );

        if (bookRows.length === 0) {
            const err = new Error('Review target book not found.');
            err.status = 404;
            return next(err);
        }

        const book = bookRows[0];

        res.render('pages/add-review', {
            title: `Review: ${book.bookname}`,
            book: {
                id: bookId,
                title: book.bookname,
                author: book.author
            }
        });

    } catch (err) {
        next(err);
    }
};


// 리뷰 데이터 저장
const postAddReview = async (req, res, next) => {
    const bookId = req.params.bookId;
    const username = req.session.userId;
    const { star, detail } = req.body;

    if (!username) {
        return res.redirect('/login');
    }

    const starRating = parseFloat(star);
    if (isNaN(starRating) || starRating < 0 || starRating > 5) {
        const err = new Error('Invalid star rating. Must be between 0 and 5.');
        err.status = 400;
        return next(err);
    }

    let client;

    try {
        client = await db.pool.getConnection();
        await client.query('BEGIN');

        // review 테이블에 리뷰 업뎃 
        const insertSql = `
            INSERT INTO review (username, bookID, star, detail) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE star = ?, detail = ? 
        `;
        await client.query(insertSql, [username, bookId, starRating, detail, starRating, detail]);

        // 평균 별점 계산
        const avgSql = `
            SELECT AVG(star) AS average_rating 
            FROM review 
            WHERE bookID = ?
        `;
        const [avgResult] = await client.query(avgSql, [bookId]);
        const averageRating = avgResult[0].average_rating;

        // 계산한 평균별점 초기화
        const updateSql = `
            UPDATE books 
            SET star = ? 
            WHERE bookID = ?
        `;
        await client.query(updateSql, [averageRating !== null ? averageRating : 0, bookId]);

        // 사용자 레이팅 업뎃 - 추가기능(3)
        await updateUserRating(username, client);

        await client.query('COMMIT');
        res.redirect('/books');

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('리뷰 저장 또는 별점/랭킹 업데이트 중 에러:', err);
        next(err);
    } finally {
        if (client) client.release();
    }
};

module.exports = {
    getAddReviewPage,
    postAddReview
};