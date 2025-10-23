const db = require('../config/db');

const createTablesSQL = `
CREATE TABLE users (
    username varchar(30) NOT NULL,
    password varchar(30) NOT NULL,
    borrowable boolean NOT NULL DEFAULT TRUE,
    role varchar(20) NOT NULL DEFAULT 'user',
    preferAuthor VARCHAR(30) NULL DEFAULT NULL,
    rating INT NOT NULL DEFAULT 0,

    PRIMARY KEY (username)
);


CREATE TABLE books (
    bookID varchar(10) NOT NULL,
    bookname varchar(50) NOT NULL,
    author varchar(30) NOT NULL,
    star float NOT NULL DEFAULT 0.0,

    PRIMARY KEY (bookID)
);


CREATE TABLE libraryBooks (
    bookID varchar(10) NOT NULL,
    bookLocation varchar(30) NOT NULL,
    bookNum int NOT NULL DEFAULT 1,
    borrowable boolean NOT NULL DEFAULT TRUE,

    PRIMARY KEY (bookID, bookLocation, bookNum),

    FOREIGN KEY (bookID) REFERENCES books(bookID)
        ON DELETE CASCADE 
        ON UPDATE CASCADE 
);

CREATE TABLE borrow (
    username varchar(30) NOT NULL,

    bookID varchar(10) NOT NULL,
    bookLocation varchar(30) NOT NULL,
    bookNum int NOT NULL,

    borrowDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    returnDate DATETIME NULL DEFAULT NULL,

    PRIMARY KEY (username, bookID, bookLocation, bookNum, borrowDate),



    FOREIGN KEY (username) REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE, 


    FOREIGN KEY (bookID, bookLocation, bookNum) 
        REFERENCES libraryBooks(bookID, bookLocation, bookNum)
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

CREATE TABLE review (
    username varchar(30) NOT NULL,
    bookID varchar(10) NOT NULL,
    star float NOT NULL,
    detail varchar(500) NOT NULL,

    PRIMARY KEY (username, bookID),


    FOREIGN KEY (username) REFERENCES users(username)
        ON DELETE CASCADE
        ON UPDATE CASCADE, 

    FOREIGN KEY (bookID) 
        REFERENCES books(bookID)
        ON DELETE CASCADE 
        ON UPDATE CASCADE,

    CONSTRAINT chk_star_rating CHECK (star >= 0.0 AND star <= 5.0)
);


CREATE TABLE categories (
    categoryID INT NOT NULL AUTO_INCREMENT,
    categoryName VARCHAR(50) NOT NULL UNIQUE, 

    PRIMARY KEY (categoryID)
);

CREATE TABLE book_categories (
    bookID VARCHAR(10) NOT NULL, 
    categoryID INT NOT NULL,     

    PRIMARY KEY (bookID, categoryID), 

    FOREIGN KEY (bookID) REFERENCES books(bookID)
        ON DELETE CASCADE,
    FOREIGN KEY (categoryID) REFERENCES categories(categoryID)
        ON DELETE CASCADE
);
`;

const insertDataSQL = `INSERT INTO users (username, password, borrowable, role, preferAuthor, rating) 
VALUES 
('admin', 'admin', TRUE, 'admin', NULL, 0),
('bookcool', '123', TRUE, 'user', NULL, 0),
('world', '123', TRUE, 'user', NULL, 0),
('hello', '123', TRUE, 'user', NULL, 0),
('booklover', '123', TRUE, 'user', NULL, 0),
('yoon_fan', '123', TRUE, 'user', NULL, 0),
('late_returner', '123', TRUE, 'user', NULL, 0),
('book_hoarder', '123', TRUE, 'user', NULL, 0);

INSERT INTO categories (categoryName) 
VALUES ('IT'), ('과학'), ('소설'), ('역사'), ('인문'), ('경제'), ('예술'), ('자기계발');

INSERT INTO books (bookID, bookname, author, star) 
VALUES
('B001', '책1', '홍길동', 4.0),
('B002', '책2', '홍길동', 3.5),
('B003', '책3', '아무개', 2.0),
('B004', '책4', '아무개', 0.0),
('B005', '책5 (윤성우)', '윤성우', 4.8),
('B006', '책6 (윤성우)', '윤성우', 5.0),
('B007', '책7 (윤성우)', '윤성우', 0.0),
('B008', '책8', '존리', 3.0),
('B009', '책9', '김작가', 0.0),
('B010', '책10', '박루틴', 0.0),
('B011', '책11', '정재승', 4.5),
('B012', '책12', 'E.H.카', 0.0),
('B013', '책13 (윤성우)', '윤성우', 3.5),
('B014', '책14 (윤성우)', '윤성우', 4.0),
('B015', '책15 (윤성우)', '윤성우', 5.0),
('B016', '책16 (윤성우)', '윤성우', 4.2),
('B017', '책17 (윤성우)', '윤성우', 4.8);

INSERT INTO book_categories (bookID, categoryID) 
VALUES
('B001', 1), ('B001', 2), ('B002', 1), ('B003', 2), ('B004', 3), ('B005', 5),
('B006', 1), ('B007', 1), ('B008', 6), ('B009', 7), ('B010', 8), ('B011', 2), ('B012', 4),
('B013', 1),
('B014', 1),
('B015', 2),
('B016', 1), ('B016', 5),
('B017', 5);

INSERT INTO libraryBooks (bookID, bookLocation, bookNum, borrowable) 
VALUES
('B001', 'IT/컴퓨터', 1, TRUE), ('B001', 'IT/컴퓨터', 2, TRUE),
('B002', 'IT/컴퓨터', 1, TRUE), ('B002', 'IT/컴퓨터', 2, TRUE),
('B003', '과학', 1, TRUE), ('B004', '소설', 1, TRUE),
('B005', '인문', 1, TRUE), ('B005', '인문', 2, TRUE),
('B006', 'IT/컴퓨터', 1, TRUE), ('B007', 'IT/컴퓨터', 1, TRUE),
('B008', '경제', 1, TRUE), ('B009', '예술', 1, TRUE),
('B010', '자기계발', 1, TRUE), ('B011', '과학', 1, TRUE), ('B012', '역사', 1, TRUE),
('B013', 'IT/컴퓨터', 1, TRUE),
('B014', 'IT/컴퓨터', 1, TRUE),
('B015', '과학', 1, TRUE),
('B016', 'IT/컴퓨터', 1, TRUE),
('B017', '인문', 1, TRUE);

INSERT INTO review (username, bookID, star, detail) 
VALUES
('booklover', 'B001', 5.0, '재밌습니다'),
('late_returner', 'B001', 3.0, '그럭저럭 볼만 했어요'),
('hello', 'B002', 3.5, '보통입니다'),
('late_returner', 'B003', 2.0, '너무 어려워요'),
('yoon_fan', 'B005', 5.0, '엄청재밌어요'),
('booklover', 'B005', 4.5, '내용이 알차네요'),
('yoon_fan', 'B006', 5.0, '최고의책'),
('bookcool', 'B008', 3.0, '뻔합니다'),
('world', 'B011', 4.5, '재밌어요'),
('booklover', 'B002', 4.0, '실버 테스트용 리뷰'),
('yoon_fan', 'B001', 5.0, '골드 테스트 리뷰1'),
('yoon_fan', 'B002', 5.0, '골드 테스트 리뷰2'),
('yoon_fan', 'B003', 5.0, '골드 테스트 리뷰3');

INSERT INTO borrow (username, bookID, bookLocation, bookNum, borrowDate, returnDate) 
VALUES 
('booklover', 'B001', 'IT/컴퓨터', 1, '2025-10-01 10:00:00', '2025-10-06 11:00:00'),
('booklover', 'B005', '인문', 1, '2025-10-10 10:00:00', '2025-10-16 11:00:00'),
('yoon_fan', 'B005', '인문', 2, '2025-09-01 10:00:00', '2025-09-05 11:00:00'),
('yoon_fan', 'B006', 'IT/컴퓨터', 1, '2025-09-10 10:00:00', '2025-09-15 11:00:00'),
('yoon_fan', 'B001', 'IT/컴퓨터', 2, '2025-10-01 10:00:00', '2025-10-03 11:00:00'),
('yoon_fan', 'B007', 'IT/컴퓨터', 1, '2025-10-20 14:00:00', NULL),
('late_returner', 'B003', '과학', 1, '2025-09-01 10:00:00', '2025-09-11 11:00:00'),
('late_returner', 'B008', '경제', 1, '2025-09-15 10:00:00', '2025-09-30 11:00:00'),
('late_returner', 'B011', '과학', 1, '2025-10-01 10:00:00', NULL),
('book_hoarder', 'B009', '예술', 1, '2025-10-21 11:00:00', NULL),
('book_hoarder', 'B010', '자기계발', 1, '2025-10-22 12:00:00', NULL),
('book_hoarder', 'B012', '역사', 1, '2025-10-23 13:00:00', NULL),
('hello', 'B001', 'IT/컴퓨터', 1, '2025-08-10 10:00:00', '2025-08-15 11:00:00'),
('hello', 'B002', 'IT/컴퓨터', 1, '2025-09-10 10:00:00', '2025-09-18 11:00:00'),
('world', 'B011', '과학', 1, '2025-09-20 10:00:00', '2025-09-25 11:00:00'),
('world', 'B002', 'IT/컴퓨터', 2, '2025-10-11 10:00:00', '2025-10-15 11:00:00'),
('booklover', 'B003', '과학', 1, '2025-01-01 10:00:00', '2025-01-05 11:00:00'),
('booklover', 'B004', '소설', 1, '2025-01-06 10:00:00', '2025-01-10 11:00:00'),
('yoon_fan', 'B002', 'IT/컴퓨터', 1, '2025-03-01 10:00:00', '2025-03-05 11:00:00'),
('yoon_fan', 'B003', '과학', 1, '2025-03-06 10:00:00', '2025-03-10 11:00:00'),
('yoon_fan', 'B004', '소설', 1, '2025-03-11 10:00:00', '2025-03-15 11:00:00'),
('yoon_fan', 'B008', '경제', 1, '2025-03-16 10:00:00', '2025-03-20 11:00:00'),
('yoon_fan', 'B011', '과학', 1, '2025-04-01 10:00:00', '2025-04-05 11:00:00'),
('yoon_fan', 'B012', '역사', 1, '2025-04-06 10:00:00', '2025-04-10 11:00:00');

UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = 'B007' AND bookNum = 1;
UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = 'B011' AND bookNum = 1;
UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = 'B009' AND bookNum = 1;
UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = 'B010' AND bookNum = 1;
UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = 'B012' AND bookNum = 1;

UPDATE users SET rating = 50 WHERE username = 'booklover'; 
UPDATE users SET rating = 100, preferAuthor = '윤성우' WHERE username = 'yoon_fan';
UPDATE users SET rating = 13 WHERE username = 'late_returner';
UPDATE users SET rating = 15 WHERE username = 'book_hoarder';
UPDATE users SET rating = 18 WHERE username = 'hello';
UPDATE users SET rating = 20 WHERE username = 'world';
UPDATE users SET rating = 10 WHERE username = 'bookcool';
UPDATE users SET rating = 0 WHERE username = 'admin';
`;


const initDB = async () => {

    const dropQueries = [
        'DROP TABLE IF EXISTS book_categories;',
        'DROP TABLE IF EXISTS review;',
        'DROP TABLE IF EXISTS borrow;',
        'DROP TABLE IF EXISTS libraryBooks;',
        'DROP TABLE IF EXISTS books;',
        'DROP TABLE IF EXISTS categories;',
        'DROP TABLE IF EXISTS users;'
    ].join(' '); 

    const createQueries = createTablesSQL.split(';').filter(q => q.trim() !== '');
    const insertQueries = insertDataSQL.split(';').filter(q => q.trim() !== '');

    let connection;
    try {

        const mysql = require('mysql2/promise');
        require('dotenv').config();

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            multipleStatements: true 
        });


        await connection.query(dropQueries);


        for (const query of createQueries) {
            await connection.query(query);
        }


        for (const query of insertQueries) {
            await connection.query(query);
        }

        console.log('Database initialization completed successfully.');

    } catch (err) {
        console.error('Database initialization failed:', err);
    } finally {
        if (connection) await connection.end(); 

    }
};

initDB();