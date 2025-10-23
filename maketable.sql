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