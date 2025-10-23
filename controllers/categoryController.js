const db = require('../config/db');


//카테고리 페이지 관련함수
const getCategoriesPage = async (req, res, next) => {
    try {
        /*
            CLEAR: 모든 카테고리를 출력하는 페이지를 렌더링하는 코드를 작성하세요.
        */

        // 카테고리 정보 가져오기
        const sql = `
            SELECT 
                categoryID AS id, 
                categoryName AS name 
            FROM 
                categories 
            ORDER BY 
                categoryID ASC
        `;

        const [categories] = await db.query(sql);
        res.render('pages/categories', {
            title: 'Category Management',
            categories: categories
        });
    } catch (err) {
        next(err);
    }
};

const postDeleteCategory = async (req, res, next) => {

    //삭제할 카테고리 키 가져오기
    const categoryId = Number(req.params.id);

    // categoryId가 유효한 숫자인지 확인(왠지모르겟는데 undefined값이들어옴)
    if (isNaN(categoryId)) {
        const err = new Error('Invalid Category ID.');
        err.status = 400;
        return next(err);
    }

    let client; 

    try {
        /*
            CLEAR: 카테고리를 제거하는 코드를 작성하세요.
            만약 해당 카테고리에 포함된 책이 있다면 책에서 해당 카테고리만 지우고 나머지 카테고리는 유지하면 됩니다.
        */

        client = await db.pool.getConnection();
        await client.query('BEGIN');

        //책 자체 삭제하지 않고 관련 카테고리만 삭제
        await client.query(
            "DELETE FROM book_categories WHERE categoryID = ?",
            [categoryId]
        );

        // 책에서 카테고리 삭제한 후 카테고리 자체도 삭제
        const deleteResult = await client.query(
            "DELETE FROM categories WHERE categoryID = ?",
            [categoryId]
        );

        
        //실제 삭제되었는지 검증
        if (deleteResult[0].affectedRows === 0) {

            await client.query('ROLLBACK');
            const err = new Error('삭제할 카테고리를 찾을 수 없습니다.');
            err.status = 404; 
            return next(err);
        }

        await client.query('COMMIT');
        res.redirect('/categories');

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('카테고리 삭제 중 에러:', err); 
        next(err); 
    } finally {
        if (client) client.release();
    }
};

module.exports = {
    getCategoriesPage,
    postDeleteCategory
};