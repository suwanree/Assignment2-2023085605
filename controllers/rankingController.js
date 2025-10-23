const db = require('../config/db');

// 티어를 결정하는 함수
const getTier = (rating) => {
    if (rating >= 100) return { name: 'Gold', color: 'gold' };
    if (rating >= 50) return { name: 'Silver', color: 'silver' };
    if (rating >= 10) return { name: 'Bronze', color: 'black' };
    return { name: 'Unranked', color: 'grey' };
};

const getRankingPage = async (req, res, next) => {
    try {
        // rating기준으로 내림차순받아옴
        const sql = "SELECT username, rating FROM users ORDER BY rating DESC";
        const [users] = await db.query(sql);

        // 레이팅에 맞춰서 티어 부여
        const rankedUsers = users.map((user, index) => {
            return {
                rank: index + 1,
                username: user.username,
                rating: user.rating,
                tier: getTier(user.rating) 
            };
        });
        res.render('pages/ranking', {
            title: 'User Ranking',
            users: rankedUsers 
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getRankingPage
};