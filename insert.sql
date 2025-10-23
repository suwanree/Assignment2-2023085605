INSERT INTO users (username, password, borrowable, role, preferAuthor, rating) 
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
VALUES
('IT'),
('과학'),
('소설'),
('역사'),
('인문'),
('경제'),
('예술'),
('자기계발');

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
('B012', '책12', 'E.H.카', 0.0);


INSERT INTO book_categories (bookID, categoryID) 
VALUES
('B001', 1), ('B001', 2),
('B002', 1),
('B003', 2),
('B004', 3),
('B005', 5),
('B006', 1),
('B007', 1),
('B008', 6),
('B009', 7),
('B010', 8),
('B011', 2),
('B012', 4);

INSERT INTO libraryBooks (bookID, bookLocation, bookNum, borrowable) 
VALUES
('B001', 'IT/컴퓨터', 1, TRUE),
('B001', 'IT/컴퓨터', 2, TRUE),
('B002', 'IT/컴퓨터', 1, TRUE),
('B002', 'IT/컴퓨터', 2, TRUE),
('B003', '과학', 1, TRUE),
('B004', '소설', 1, TRUE),
('B005', '인문', 1, TRUE),
('B005', '인문', 2, TRUE),
('B006', 'IT/컴퓨터', 1, TRUE),
('B007', 'IT/컴퓨터', 1, TRUE),
('B008', '경제', 1, TRUE),
('B009', '예술', 1, TRUE),
('B010', '자기계발', 1, TRUE),
('B011', '과학', 1, TRUE),
('B012', '역사', 1, TRUE);

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
('world', 'B011', 4.5, '재밌어요');

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
('world', 'B002', 'IT/컴퓨터', 2, '2025-10-11 10:00:00', '2025-10-15 11:00:00');

UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = 'B007' AND bookNum = 1;
UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = 'B011' AND bookNum = 1;
UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = 'B009' AND bookNum = 1;
UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = 'B010' AND bookNum = 1;
UPDATE libraryBooks SET borrowable = FALSE WHERE bookID = 'B012' AND bookNum = 1;

UPDATE users SET rating = 30 WHERE username = 'booklover';
UPDATE users SET rating = 40, preferAuthor = '윤성우' WHERE username = 'yoon_fan';
UPDATE users SET rating = 13 WHERE username = 'late_returner';
UPDATE users SET rating = 15 WHERE username = 'book_hoarder';
UPDATE users SET rating = 18 WHERE username = 'hello';
UPDATE users SET rating = 20 WHERE username = 'world';
UPDATE users SET rating = 10 WHERE username = 'bookcool';
UPDATE users SET rating = 0 WHERE username = 'admin';