import { google } from 'googleapis';
import dotenv from 'dotenv';
import { writeDataToExcel } from './excelUtils.js';  

dotenv.config();  

const youtube = google.youtube('v3');
const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID_1 = process.env.CHANNEL1_ID;  
const CHANNEL_ID_2 = process.env.CHANNEL2_ID;  

async function getChannelName(channelId) {
    const res = await youtube.channels.list({
        key: API_KEY,
        id: channelId,
        part: 'snippet'
    });

    if (res.data.items.length > 0) {
        return res.data.items[0].snippet.title;  // Channel name
    } else {
        throw new Error('Channel not found');
    }
}

async function getAllChannelVideos(channelId) {
    let videoIds = [];
    let nextPageToken = '';

    // Fetch videos from the channel using search.list
    while (videoIds.length < 200 && nextPageToken !== undefined) {
        const res = await youtube.search.list({
            key: API_KEY,
            channelId: channelId,
            part: 'snippet',
            type: 'video', 
            maxResults: 50, 
            pageToken: nextPageToken
        });

       
        if (res.data.items.length === 0) break;

        videoIds = videoIds.concat(
            res.data.items.map(item => item.id.videoId).filter(id => id)
        );

        nextPageToken = res.data.nextPageToken;
    }

    return videoIds;
}

async function getVideoStats(videoIds) {
    const videoStats = [];

    for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50);
        const res = await youtube.videos.list({
            key: API_KEY,
            id: chunk.join(','),
            part: 'statistics,snippet'
        });

        videoStats.push(
            ...res.data.items.map(video => ({
                videoId: video.id,
                title: video.snippet.title,
                views: parseInt(video.statistics.viewCount, 10)
            }))
        );
    }

    return videoStats;
}

export async function getTopVideos(channelId) {
    const videoIds = await getAllChannelVideos(channelId);
    const videoStats = await getVideoStats(videoIds);

    const topVideos = videoStats
        .sort((a, b) => b.views - a.views)
        .slice(0, 80);  

    return topVideos;
}

(async () => {
    try {
        const channelName1 = await getChannelName(CHANNEL_ID_1);
        const topVideos1 = await getTopVideos(CHANNEL_ID_1);
        console.log(`Writing Top 5 Videos for ${channelName1} to Excel...`);
        writeDataToExcel(channelName1, topVideos1, 'Channel1_TopVideos');

        const channelName2 = await getChannelName(CHANNEL_ID_2);
        const topVideos2 = await getTopVideos(CHANNEL_ID_2);
        console.log(`Writing Top 5 Videos for ${channelName2} to Excel...`);
        writeDataToExcel(channelName2, topVideos2, 'Channel2_TopVideos');

        console.log('Data successfully written to Excel files.');
    } catch (error) {
        console.error('Error:', error);
    }
})();
