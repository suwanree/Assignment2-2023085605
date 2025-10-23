const db = require('../config/db');



const updateUserRating = async (username, connection) => {
    const client = connection || db;

    try {
        // 대출 횟수 * 5
        const borrowSql = "SELECT COUNT(*) AS count FROM borrow WHERE username = ?";
        const [[borrowResult]] = await client.query(borrowSql, [username]);
        const borrowScore = borrowResult.count * 5;

        // 리뷰 횟수 * 10
        const reviewSql = "SELECT COUNT(*) AS count FROM review WHERE username = ?";
        const [[reviewResult]] = await client.query(reviewSql, [username]);
        const reviewScore = reviewResult.count * 10;

        // 총 연체 일수 * 2
        const overdueSql = `
            SELECT COALESCE(SUM(DATEDIFF(returnDate, borrowDate) - 7), 0) AS totalOverdueDays
            FROM borrow
            WHERE username = ? 
              AND returnDate IS NOT NULL 
              AND DATEDIFF(returnDate, borrowDate) > 7; -- 7일 초과시만
        `;
        const [[overdueResult]] = await client.query(overdueSql, [username]);
        const overduePenalty = overdueResult.totalOverdueDays * 2;

        // 최종 계산된점수
        const finalRating = borrowScore + reviewScore - overduePenalty;

        // users 테이블에 최종 점수 업데이트
        const updateSql = "UPDATE users SET rating = ? WHERE username = ?";
        await client.query(updateSql, [finalRating, username]);


    } catch (err) {
        console.error("레이팅 업데이트 실패:", err);
        if (connection) throw err;
    }
};

module.exports = {
    updateUserRating
};