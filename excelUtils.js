import xlsx from 'xlsx';

export function writeDataToExcel(channelName, videos, fileName) {
    const data = [
        ['Video Name', 'Channel Name', 'Views', 'Performance Matrix (Views/1000)'], 
    ];

    // Map videos to rows with hyperlinks
    videos.forEach(video => {
        data.push([
            { t: 's', v: video.title, l: { Target: `https://www.youtube.com/watch?v=${video.videoId}` } }, // Hyperlinked video name
            channelName,  
            video.views,  
            (video.views / 1000).toFixed(2),
        ]);
    });

    const worksheet = xlsx.utils.aoa_to_sheet(data);  // Convert array of arrays to worksheet
    const workbook = xlsx.utils.book_new();  // Create a new workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, channelName);  // Append worksheet to workbook

    xlsx.writeFile(workbook, `${fileName}.xlsx`);
}
