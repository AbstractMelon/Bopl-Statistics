import fetch from 'node-fetch';
import cron from 'node-cron';
import { Webhook, MessageBuilder } from 'discord-webhook-node';

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1244414694475956288/1EVFhr9s4yx8jW3a7GRjxvzkHN5RoE-4m4w-xgh724dk7eVE94ITz2Lp9vQkqaukHLwg';
const hook = new Webhook(WEBHOOK_URL);

const STEAM_APP_ID = '1686940';
const TWITCH_GAME_NAME = 'Bopl Battle';  

async function fetchBoplStats() {
    try {
        const [steamData, twitchData, reviewsData] = await Promise.all([
            fetchSteamStats(),
            fetchTwitchStats(),
            fetchSteamReviews()
        ]);

        return {
            current_players: steamData.current_players,
            avg_monthly_players_down: steamData.avg_monthly_players_down,
            percentage_decrease: steamData.percentage_decrease,
            twitch_viewers: twitchData.twitch_viewers,
            steam_top_sellers_rank: steamData.steam_top_sellers_rank,
            steam_followers: steamData.steam_followers,
            positive_reviews: reviewsData.positive,
            negative_reviews: reviewsData.negative
        };
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
}

async function fetchSteamStats() {
    const playerCountResponse = await fetch(`http://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${STEAM_APP_ID}`);
    const playerCountData = await playerCountResponse.json();

    const steam_top_sellers_rank = "Not Fetched";
    const steam_followers = "Not Fetched";

    return {
        current_players: playerCountData.response.player_count,
        avg_monthly_players_down: "Not Fetched", 
        percentage_decrease: "Not Fetched", 
        steam_top_sellers_rank: steam_top_sellers_rank,
        steam_followers: steam_followers
    };
}

async function fetchTwitchStats() {
    return { twitch_viewers: "Not Fetched" };
}

async function fetchSteamReviews() {
    const response = await fetch(`https://store.steampowered.com/appreviews/${STEAM_APP_ID}?json=1&filter=all&language=all`);
    const data = await response.json();

    const positive = data.query_summary.total_positive;
    const negative = data.query_summary.total_negative;

    return { positive, negative };
}

async function sendWebhook() {
    const stats = await fetchBoplStats();
    
    if (!stats) return;

    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').split('.')[0] + ' UTC';
    
    const embed = new MessageBuilder()
        .setTitle(`BOPL STATS FOR ${timestamp}`)
        .addField('Current Players', stats.current_players.toString(), false)
        .addField('Avg. Monthly Players Down', `${stats.avg_monthly_players_down} (${stats.percentage_decrease}%)`, false)
        .addField('Twitch Viewers', stats.twitch_viewers.toString(), false)
        .addField('Steam Top Sellers Rank', `#${stats.steam_top_sellers_rank}`, false)
        .addField('Steam Followers', stats.steam_followers.toString(), false)
        .addField('Positive Reviews', stats.positive_reviews.toString(), false)
        .addField('Negative Reviews', stats.negative_reviews.toString(), false)
        // .setFooter('Bopl Player count stats for this week is attached below')
        .setFooter('Made with ❤️ by Abstractmelon & ReallyBadDev')
        .setColor('#00b0f4');
    
    await hook.send(embed);
}

cron.schedule('0 14 * * *', () => {
    console.log('Sending webhook...');
    sendWebhook().catch(console.error);
});

console.log('Webhook scheduler started');
sendWebhook().catch(console.error);
