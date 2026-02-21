const homeService = require('../services/home.service');

async function getHome(req, res) {
    try {
        const userId = req.user && req.user.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const [recentlyRead, trending] = await Promise.all([
            homeService.getRecentlyRead(userId),
            homeService.getTrending()
        ]);

        return res.json({ recentlyRead, trending });
    } catch (err) {
        console.error('getHome error', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}

module.exports = { getHome };