const db = require('../config/db');

// 차트(루트페이지)페이지
const getChartsPage = async (req, res, next) => { //추가기능(2)
    // 카테고리 ID가져오기
    let selectedCategoryId = req.query.categoryId ? Number(req.query.categoryId) : null;

    try {
        // 3개월동안 인기있던 서적 가져옴
        const overallPopularSql = `
            SELECT
                b.bookname AS title,
                b.author,
                GROUP_CONCAT(DISTINCT c.categoryName ORDER BY c.categoryName SEPARATOR ', ') AS categories,
                COUNT(br.bookID) AS borrow_count
            FROM borrow AS br
            JOIN books AS b ON br.bookID = b.bookID
            LEFT JOIN book_categories AS bc ON b.bookID = bc.bookID
            LEFT JOIN categories AS c ON bc.categoryID = c.categoryID
            WHERE br.borrowDate >= DATE_SUB(NOW(), INTERVAL 3 MONTH) 
            GROUP BY b.bookID, b.bookname, b.author  -- bookNum만 다른 책들 하나로 출력하기 위해서
            ORDER BY borrow_count DESC
            LIMIT 10; -- 상위 10개만 표시 
        `;
        const [popularBooks] = await db.query(overallPopularSql);


        //선택된 카테고리 정보
        const [categories] = await db.query(
            "SELECT categoryID AS id, categoryName AS name FROM categories ORDER BY name ASC"
        );

        // 선택된 카테고리중에서 인기있는 리스트 뽑기
        let popularBooksByCategoryList = []; // 책이 없을수도잇음
        if (selectedCategoryId) {
            const categoryPopularSql = `
                SELECT
                    b.bookname AS title,
                    b.author,
                    GROUP_CONCAT(DISTINCT c.categoryName ORDER BY c.categoryName SEPARATOR ', ') AS categories,
                    COUNT(br.bookID) AS borrow_count
                FROM borrow AS br
                JOIN books AS b ON br.bookID = b.bookID
                JOIN book_categories AS bc ON b.bookID = bc.bookID 
                JOIN categories AS c ON bc.categoryID = c.categoryID
                WHERE br.borrowDate >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
                  AND bc.categoryID = ? 
                GROUP BY b.bookID, b.bookname, b.author
                ORDER BY borrow_count DESC
                LIMIT 10; -- 상위10개만 표시
            `;
            const [results] = await db.query(categoryPopularSql, [selectedCategoryId]);
            popularBooksByCategoryList = results;
        }

        // 선호작가작품 추천-추가기능(2)
        let authorRecommendations = []; //선호작가가 없을수도있음(빌린 책이 없는경우)
        
        //선호 작가 있을때만 검색해야함
        if (req.session.userId && req.session.favoriteAuthor) {
            
            const recommendationSql = `
                SELECT 
                    b.bookID, b.bookname, b.author, b.star
                FROM 
                    books b
                WHERE 
                    b.author = ? 
                    AND b.bookID NOT IN (
                        SELECT DISTINCT bookID 
                        FROM borrow 
                        WHERE username = ? 
                    )
                ORDER BY 
                    b.star DESC
                LIMIT 3;
            `;
            
            const [rows] = await db.query(recommendationSql, [
                req.session.favoriteAuthor, 
                req.session.userId
            ]);
            authorRecommendations = rows;
        }

        res.render('pages/charts', {
            title: 'Charts',

            user: req.session.userId,          
            authorRecs: authorRecommendations, 
            popularBooks: popularBooks,
            popularBooksByCategory: popularBooksByCategoryList,
            categories: categories,
            selectedCategoryId: selectedCategoryId
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getChartsPage
};

module.exports = {
    getChartsPage
};