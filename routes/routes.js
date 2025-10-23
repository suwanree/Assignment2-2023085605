const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const chartController = require('../controllers/chartController');
const bookController = require('../controllers/bookController');
const borrowingController = require('../controllers/borrowingController');
const categoryController = require('../controllers/categoryController');
const userController = require('../controllers/userController');

// 추가기능 1
const reviewController = require('../controllers/reviewController');

// 추가기능 3
const rankingController = require('../controllers/rankingController');

const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Login Page (no need login)
router.get('/login', authController.getLoginPage);
router.post('/login', authController.postLogin);

// Register Page (no need login)
router.get('/register', authController.getRegisterPage);
router.post('/register', authController.postRegister);

// Logout (need login only)
router.get('/logout', isAuthenticated, authController.logoutAndGetHomePage);

// Charts Page (no need login)
router.get('/charts', chartController.getChartsPage);


// Books Page (no need login)
router.get('/books', bookController.getBooksPage);

// Book Management (need login as admin)
router.get('/books/add', isAuthenticated, isAdmin, bookController.getAddBookPage);
router.post('/books/add', isAuthenticated, isAdmin, bookController.postAddBook);
router.post('/books/instance/delete', isAuthenticated, isAdmin, bookController.postDeleteBookInstance);
//여기수정함 ㅇㅇ

// Borrow & Return (need login only)
router.post('/books/instance/borrow', isAuthenticated, bookController.postBorrowBook);
router.post('/borrowings/return', isAuthenticated, bookController.postReturnBook);

// API route to get book instances
router.get('/api/books/:id/instances', isAuthenticated, bookController.getBookInstances);

// Borrowings Page (need login only)
router.get('/borrowings', isAuthenticated, borrowingController.getBorrowingsPage);


// Categories Page (need login as admin)
router.get('/categories', isAuthenticated, isAdmin, categoryController.getCategoriesPage);

// Category Management (need login as admin)
router.post('/categories/:id/delete', isAuthenticated, isAdmin, categoryController.postDeleteCategory);


// Users Page (need login as admin)
router.get('/users', isAuthenticated, isAdmin, userController.getUsersPage);

// 리뷰 페이지
router.get('/reviews/add/:bookId', isAuthenticated, reviewController.getAddReviewPage);
router.post('/reviews/add/:bookId', isAuthenticated, reviewController.postAddReview);


// 랭킹 페이지
router.get('/ranking', rankingController.getRankingPage);


module.exports = router;