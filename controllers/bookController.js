const db = require('../config/db');

// borrow, return 할때마다 rating수정해주는 함수 호출해줘야함
const { updateUserRating } = require('./ratingController.js');

const getBooksPage = async (req, res, next) => {

    const { query: searchQuery, searchBy } = req.query;
    const sortedByWithDefault = req.query.sortBy || 'title';
    const sortOrderWithDefault = req.query.sortOrder || 'asc';

    try {
        let baseQuery = `
            SELECT 
                b.bookID, 
                b.bookname AS title, 
                b.author, 
                b.star,
                (SELECT COALESCE(GROUP_CONCAT(DISTINCT cat.categoryName SEPARATOR ', '), 'N/A')
                 FROM book_categories bc
                 JOIN categories cat ON bc.categoryID = cat.categoryID
                 WHERE bc.bookID = b.bookID) AS categories,
                COALESCE(lib.total_quantity, 0) AS total_quantity,
                COALESCE(lib.available_quantity, 0) AS available_quantity
            FROM 
                books AS b
            LEFT JOIN 
                (SELECT 
                    bookID, 
                    COUNT(*) AS total_quantity,
                    SUM(borrowable) AS available_quantity
                 FROM 
                    libraryBooks 
                 GROUP BY bookID) AS lib 
            ON b.bookID = lib.bookID
        `;
        
        // 검색할 때 집계함수사용하므로 해빙절따로 만듦
        let havingClause = ''; 

        // 검색어 처리
        if (searchQuery && searchBy) {
            if (searchBy === 'title') {
                havingClause = ` HAVING title LIKE '%${searchQuery}%'`;
            } else if (searchBy === 'author') {
                havingClause = ` HAVING author LIKE '%${searchQuery}%'`;
            } else if (searchBy === 'category') {
                havingClause = ` HAVING categories LIKE '%${searchQuery}%'`;
            } else if (searchBy === 'star') {

                //숫가자 완전히 같아야 검색이 가능함
                 baseQuery += ` WHERE b.star = '${parseFloat(searchQuery)}'`; // 숫자로 변환 시도
            }
        }

        baseQuery += ` GROUP BY b.bookID, b.bookname, b.author, b.star`;

        if (havingClause) {
            baseQuery += havingClause;
        }

        // 정렬
        const order = (sortOrderWithDefault.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
        let sortColumn = sortedByWithDefault;

        //정렬 기준
        switch (sortColumn) {
            case 'author': sortColumn = 'b.author'; break;
            case 'categories': sortColumn = 'categories'; break;
            case 'total_quantity': sortColumn = 'total_quantity'; break;
            case 'available_quantity': sortColumn = 'available_quantity'; break;
            case 'star': sortColumn = 'b.star'; break; // ⭐️ 추가
            case 'title':
            default: sortColumn = 'title'; break;
        }

        baseQuery += ` ORDER BY ${sortColumn} ${order}`;

        const [books] = await db.query(baseQuery);
        
        res.render('pages/books', {
            title: 'All Books',
            books: books,
            sortBy: sortedByWithDefault,
            sortOrder: sortOrderWithDefault,
            query: searchQuery || '',
            searchBy: searchBy || 'title'
        });
    } catch (err) {
        next(err);
    }
};


const getAddBookPage = async (req, res, next) => {
    try {
        /*
            CLEAR: 책을 추가하는 페이지를 렌더링 하는 코드를 작성하세요.
            책 추가 시 작가와 카테고리를 선택해야하므로 현재 카테고리 목록과 작가 목록을 불러와야 합니다.
        */

    
        const [categories] = await db.query(
            "SELECT categoryID AS id, categoryName AS name FROM categories ORDER BY name ASC"
        );

        // 저자 중복제거
        const [authors] = await db.query(
            "SELECT DISTINCT author AS name FROM books ORDER BY name ASC"
        );

        res.render('pages/add-book', {
            title: 'Add New Book',
            categories: categories, // 카테고리 리스트 (id, name 포함)
            authors: authors,       // 저자 리스트
        });
    } catch (err) {
        next(err);
    }
};

const postAddBook = async (req, res, next) => {
    // 관리자인지 확인
    if (req.session.role !== 'admin') {
        const err = new Error('접근 거부: 관리자만 책을 추가할 수 있습니다.');
        err.status = 403;
        return next(err);
    }

    // 카테고리 이름으로된 배열 받아옴
    const { title, authors, quantity, categories: categoryNames } = req.body;
    const bookLocation = '미지정'; // 도서관 내에서 기본 위치(임의로 추가했습니다.)
    let client;

    try {
        client = await db.pool.getConnection();
        await client.query('BEGIN'); 

        let bookID; 
        let isNewBook = false;

        // 1. 책있는지 확인
        const [existingBooks] = await client.query(
            "SELECT bookID FROM books WHERE bookname = ? AND author = ?",
            [title, authors]
        );

        if (existingBooks.length > 0) {
            // 책이 이미 존재하는 경우에
            bookID = existingBooks[0].bookID; // 기존 bookID 사용
            console.log(`책 "${title}" (저자: ${authors})은(는) ID ${bookID}(으)로 이미 존재합니다. 복사본을 추가합니다.`);
        } else {
            // 새책인 경우에
            isNewBook = true;
            // 새 bookID 생성
            const [maxIdRows] = await client.query(
                "SELECT MAX(CAST(SUBSTRING(bookID, 2) AS UNSIGNED)) AS maxId FROM books"
            );
            const newNumericId = (maxIdRows[0].maxId || 0) + 1;
            bookID = 'B' + String(newNumericId).padStart(3, '0'); // 새 bookID 할당

            console.log(`책 "${title}" (저자: ${authors})은(는) 새 책입니다. ID ${bookID} 생성.`);

            // 새로운책은 테이블에 삽입
            await client.query(
                "INSERT INTO books (bookID, bookname, author) VALUES (?, ?, ?)",
                [bookID, title, authors]
            );
        }

        // 카테고리 처리
        if (categoryNames) {
            const namesToProcess = Array.isArray(categoryNames) ? categoryNames : [categoryNames];

            for (const categoryName of namesToProcess) {
                let categoryId;
                // 이름을기준으로 카테고리 찾기
                const [existingCategory] = await client.query(
                    "SELECT categoryID FROM categories WHERE categoryName = ?",
                    [categoryName]
                );

                if (existingCategory.length > 0) {
                    categoryId = existingCategory[0].categoryID;
                } else {
                    const [insertResult] = await client.query(
                        "INSERT INTO categories (categoryName) VALUES (?)",
                        [categoryName]
                    );
                    categoryId = insertResult.insertId;
                }

                // book_categories테이블이랑 bookID 연결
                await client.query(
                    "INSERT IGNORE INTO book_categories (bookID, categoryID) VALUES (?, ?)",
                    [bookID, categoryId]
                );
            }
        }

        // 재고 구현(libraryBooks에 들어갈 책임)
        const numQuantity = parseInt(quantity, 10) || 1;
        let startBookNum = 1; // 새 책 기본 시작번호

        if (!isNewBook) {

            const [maxNumRow] = await client.query(
                "SELECT MAX(bookNum) as maxNum FROM libraryBooks WHERE bookID = ?",
                [bookID]
            );
            startBookNum = (maxNumRow[0].maxNum || 0) + 1; 
        }

        // bookNum만 다른 복사본 삽입
        for (let i = 0; i < numQuantity; i++) {
            const currentBookNum = startBookNum + i;
            await client.query(
                "INSERT INTO libraryBooks (bookID, bookLocation, bookNum, borrowable) VALUES (?, ?, ?, TRUE)",
                [bookID, bookLocation, currentBookNum]
            );
        }
        console.log(`책 ID ${bookID}에 대해 ${numQuantity}개의 복사본을 추가했습니다 (시작 번호: ${startBookNum}).`);

        // 끝
        await client.query('COMMIT');
        res.redirect('/books');

    } catch (err) {
        console.error('책/복사본 추가 중 에러:', err);
        if (client) await client.query('ROLLBACK');
        next(err);
    } finally {
        if (client) client.release();
    }
};

const postDeleteBookInstance = async (req, res, next) => { //CLEAR

    const { bookID, bookLocation, bookNum } = req.body;
    console.log(bookID)
    console.log(bookLocation)
    console.log(bookNum)
    let client; 

    try {
        client = await db.pool.getConnection();
        await client.query('BEGIN');

        // 삭제결과저장
        const deleteResult = await client.query(
            "DELETE FROM libraryBooks WHERE bookID = ? AND bookLocation = ? and bookNum = ?",
            [bookID, bookLocation, Number(bookNum)]
        );

        // 삭제확인
        if (deleteResult[0].affectedRows === 0) {

            await client.query('ROLLBACK');
            const err = new Error('이미 삭제되었습니다.');
            err.status = 404;
            return next(err);
        }

        // 책복사본 다 삭제되었는지 확인
        const [rows] = await client.query(
            "SELECT COUNT(*) AS count FROM libraryBooks WHERE bookID = ?",
            [bookID]
        );
        const remainingCount = rows[0].count;

        // 다삭제되었으면 books에서도 완전삭제 (delete casecade로 카테고리도삭제))
        if (remainingCount === 0) {
            await client.query(
                "DELETE FROM books WHERE bookID = ?",
                [bookID]
            );
        }

        await client.query('COMMIT');
        res.redirect('/books');

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('책 복사본 삭제 중 에러:', err); 
        next(err); 
    } finally {
        if (client) client.release();
    }
};


// 1. 대출가능확인
// 2. 대출목록보고 3권이상인지 확인 (이시점에 대출책 선정됨)
// 3. 선정된 책이 이미 대출한책이랑 똑같은건지 확인
// 4. 연체인지 확인
// 5. borrow 수행
const postBorrowBook = async (req, res, next) => { //CLEAR
    const username = req.session.userId; 

    const { bookID, bookLocation, bookNum } = req.body;
    console.log(bookID);
    console.log(bookLocation);
    console.log(bookNum);
    if (!username) {
        return res.redirect('/login');
    }

    let client; 

    try {
        client = await db.pool.getConnection();
        await client.query('BEGIN');

        // 1. 대출가능한지 확인
        const [userRows] = await client.query(
            "SELECT borrowable FROM users WHERE username = ?",
            [username]
        );
        if (userRows.length === 0 || !userRows[0].borrowable) {
            await client.query('ROLLBACK');
            const err = new Error('대출 권한이 없습니다.');
            err.status = 403;
            return next(err);
        }
        const [currentBorrows] = await client.query(
            "SELECT bookID, borrowDate FROM borrow WHERE username = ? AND returnDate IS NULL",
            [username]
        );

        // 최대 3권 제한 확인
        if (currentBorrows.length >= 3) {
            await client.query('ROLLBACK');
            const err = new Error('You have reached the maximum borrowing limit (3 books).');
            err.status = 400;
            return next(err);
        }

        // 동일도서를 중복대출하려고하는지 확인
        const alreadyBorrowed = currentBorrows.some(borrowedBook => borrowedBook.bookID === bookID);
        if (alreadyBorrowed) {
            await client.query('ROLLBACK');
            const err = new Error('이미 동일한 제목의 책을 대출 중입니다.');
            err.status = 400;
            return next(err);
        }

        // 연체확인 (7일 기준)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); 

        const isOverdue = currentBorrows.some(borrowedBook => {
            const borrowDate = new Date(borrowedBook.borrowDate);
            return borrowDate < sevenDaysAgo; 
        });

        if (isOverdue) {
            await client.query('ROLLBACK');
            const err = new Error('연체 중인 도서가 있어 대출할 수 없습니다. 먼저 반납해주세요.');
            err.status = 400;
            return next(err);
        }

        // 책 복사본이 대출가능한지 확인
        const numBookNum = parseInt(bookNum, 10);
        if (isNaN(numBookNum)) {
            await client.query('ROLLBACK');
            const err = new Error('Invalid book number provided.');
            err.status = 400;
            return next(err);
        }

        const [instanceRows] = await client.query(
            "SELECT borrowable FROM libraryBooks WHERE bookID = ? AND bookLocation = ? AND bookNum = ?",
            [bookID, bookLocation, numBookNum]
        );
        if (instanceRows.length === 0) {
            await client.query('ROLLBACK');
            const err = new Error('해당 책을 찾을 수 없습니다.');
            return next(err);
        }
        if (!instanceRows[0].borrowable) {
            await client.query('ROLLBACK');
            const err = new Error('이미 대출 중이거나 대출 불가능한 책입니다.');
            return next(err);
        }

        // 책 준비 끝, 대출 실행

        // 대출 실행
        await client.query(
            "INSERT INTO borrow (username, bookID, bookLocation, bookNum, borrowDate, returnDate) VALUES (?, ?, ?, ?, NOW(), NULL)",
            [username, bookID, bookLocation, numBookNum]
        );

        // 대출불가로 변경
        await client.query(
            "UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = ? AND bookLocation = ? AND bookNum = ?",
            [bookID, bookLocation, numBookNum]
        );

        // 대출성공시 사용자 레이팅 업뎃(추가기능3)
        await updateUserRating(username, client);

        await client.query('COMMIT');
        res.redirect('/books');

    } catch (err) {
        
        if (client) await client.query('ROLLBACK');
        console.error('책 대출 중 에러:', err); 
        next(err); 
    } finally {
        if (client) client.release();
    }
};


const postReturnBook = async (req, res, next) => {
    // 반납할 책정보
    const { bookID, bookLocation, bookNum } = req.body;
    //console.log(bookID);
    //c/onsole.log(bookLocation);
    //console.log(bookNum);


    // 현재 사용자 이름
    const username = req.session.userId;

    if (!username) {
        return res.redirect('/login');
    }

    let client; 

    try {
        client = await db.pool.getConnection();
        await client.query('BEGIN');

        // 대출기록을 찾기
        const numBookNum = parseInt(bookNum, 10);
        if (isNaN(numBookNum)) {
             await client.query('ROLLBACK');
             const err = new Error('Invalid book number provided.');
             err.status = 400;
             return next(err);
        }

        const [borrowRows] = await client.query(
            "SELECT * FROM borrow WHERE username = ? AND bookID = ? AND bookLocation = ? AND bookNum = ? AND returnDate IS NULL",
            [username, bookID, bookLocation, numBookNum]
        );

        if (borrowRows.length === 0) {
            await client.query('ROLLBACK');
            const err = new Error('반납할 대출 기록을 찾을 수 없습니다.');
            err.status = 404;
            return next(err);
        }

        const borrowInfo = borrowRows[0]; 

        // 반납할 기록을 찾았으므로 returndate를 현재시간으로 바꿈
        await client.query(
            "UPDATE borrow SET returnDate = NOW() WHERE username = ? AND bookID = ? AND bookLocation = ? AND bookNum = ? AND borrowDate = ?",
            [
                borrowInfo.username,
                borrowInfo.bookID,
                borrowInfo.bookLocation,
                borrowInfo.bookNum,
                borrowInfo.borrowDate 
            ]
        );

        // 대출완료 -- 대출가능으로 변경
        await client.query(
            "UPDATE libraryBooks SET borrowable = TRUE WHERE bookID = ? AND bookLocation = ? AND bookNum = ?",
            [borrowInfo.bookID, borrowInfo.bookLocation, borrowInfo.bookNum]
        );

        // 추가기능(3)
        await updateUserRating(username, client);


        await client.query('COMMIT');
        res.redirect('/borrowings');

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('책 반납 중 에러:', err); 
        next(err);
    } finally {
        if (client) client.release();
    }
};


const getBookInstances = async (req, res, next) => {

    // 책 이름
    const bookId = req.params.id;

    // 책 정보()
    try {
        const sql = `
            SELECT 
                lb.bookID,
                lb.bookLocation,
                lb.bookNum AS id, 
                br.username AS borrowed_by, 
                br.username AS borrowed_by_id,
                br.borrowDate AS borrow_date, 
                br.borrowDate AS borrowing_id, 
                
                CASE 
                    WHEN br.username IS NOT NULL THEN 'borrowed'
                    WHEN lb.borrowable = FALSE THEN 'unavailable'
                    ELSE 'available' 
                END AS status
            FROM 
                libraryBooks AS lb
            LEFT JOIN  -- 대여되지 않는책도 포함해야하므로 leftjoin
                borrow AS br ON lb.bookID = br.bookID 
                            AND lb.bookLocation = br.bookLocation 
                            AND lb.bookNum = br.bookNum
                            AND br.returnDate IS NULL
            WHERE 
                lb.bookID = ?
            ORDER BY 
                lb.bookNum ASC; 
        `;

        const [instances] = await db.query(sql, [bookId]);
        res.json(instances);

    } catch (err) {
        console.error('SQL Error in getBookInstances:', err);
        next(err);
    }
};

module.exports = {
    getBooksPage,
    getAddBookPage,
    postAddBook,
    postDeleteBookInstance,
    postBorrowBook,
    postReturnBook,
    getBookInstances
};