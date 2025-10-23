const db = require('../config/db');
const adminCode = '2023085605'

const getLoginPage = (req, res) => {
    res.render('pages/login', { title: 'Login' });
};

const getRegisterPage = (req, res) => {
    res.render('pages/register', { title: 'Register' });
};

const logoutAndGetHomePage = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
};

const postLogin = async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const [ rows ] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        const user = rows[0];
        if(user){

            // 추가2 선호작가찾기
            let favoriteAuthor = null; // 기본값 null
            const favoriteAuthorSql = `
                SELECT b.author, COUNT(b.author) AS borrow_count
                FROM borrow br 
                JOIN books b ON br.bookID = b.bookID
                WHERE br.username = ? 
                GROUP BY b.author
                ORDER BY borrow_count DESC
                LIMIT 1; 
            `;
            const [authorRows] = await db.query(favoriteAuthorSql, [user.username]);
            if (authorRows.length > 0) {
                favoriteAuthor = authorRows[0].author; // 가장 많이 빌린 작가
                await db.query(
                    'UPDATE users SET preferAuthor = ? WHERE username = ?',
                    [favoriteAuthor, user.username]
                );
            }

            req.session.userId = user.username;
            req.session.username = user.username;
            req.session.role = user.role;
            req.session.favoriteAuthor = favoriteAuthor; 

            
            res.redirect('/');
        }
        else{
            const err = new Error('Invalid username or password.');
            return next(err);
        }
    } catch (err) {
        return next(err);
    }
};

const postRegister = async (req, res, next) => {
    const { username, password, role, admin_code: req_admin_code } = req.body;
    const client = await db.pool.getConnection();

    try {
        await client.query('BEGIN');
        const [existingUsers ] = await client.query('SELECT * FROM users WHERE username = ?', [username]);

        if(existingUsers.length > 0){
            const err = new Error('Username already exists.');
            await client.query('COMMIT');
            return next(err);
        }
        
        if(role === 'admin' && req_admin_code !== adminCode){
            const err = new Error('The admin code is incorrect.');
            await client.query('COMMIT');
            return next(err);
        }

        await client.query('INSERT INTO users (username, password, borrowable, role) VALUES (?, ?, ?, ?)', [username, password, true, role]);
        await client.query('COMMIT'); //트랜잭션 종료
        res.redirect('/login');
    } catch (err) {
        await client.query('ROLLBACK'); 
        return next(err);
    } finally {
        client.release();
    }
};


module.exports = {
    getLoginPage,
    getRegisterPage,
    logoutAndGetHomePage,
    postLogin,
    postRegister,
};