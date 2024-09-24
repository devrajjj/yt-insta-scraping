import puppeteer from 'puppeteer';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const username1 = process.env.REEL1_USERNAME;  
const username2 = process.env.REEL2_USERNAME; 

// Function to log into Instagram
async function loginToInstagram(page) {
    const instagramUsername = process.env.INSTAGRAM_USERNAME;  
    const instagramPassword = process.env.INSTAGRAM_PASSWORD;  

    // Navigate to Instagram login page
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[name="username"]');

    // Input username and password
    await page.type('input[name="username"]', instagramUsername, { delay: 100 });
    await page.type('input[name="password"]', instagramPassword, { delay: 100 });

    await page.click('button[type="submit"]');

    try {
        await page.waitForSelector('button[type="button"]', { timeout: 5000 });
        await page.click('button[type="button"]'); 
    } catch (error) {
        console.log('No popup appeared');
    }

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Logged in successfully');
}

// Function to scrape Instagram Reels for a given username
async function scrapeInstagramReels(instagramUsername) {
    const browser = await puppeteer.launch({ headless: false });  // Change to true for headless mode
    const page = await browser.newPage();

    // Log in to Instagram
    await loginToInstagram(page);

    // Navigate to the Instagram user's reels page
    await page.goto(`https://www.instagram.com/${instagramUsername}/reels/`, { waitUntil: 'networkidle2' });

    
    await autoScroll(page);

    // Scrape reel data
    const reelsData = await page.evaluate(() => {
        const reelItems = document.querySelectorAll('article a[href*="/reel/"]');
        console.log('Reel items found:', reelItems.length);  // Log number of reels found
        const reels = [];
    
        reelItems.forEach(reel => {
            const link = reel.href;
            const title = reel.querySelector('img')?.alt || 'No title';
            const views = reel.querySelector('span')?.innerText || 'No views';
    
            reels.push({
                title: title,
                link: link,
                views: views.replace(/[^\d]/g, '')
            });
        });
    
        console.log('Scraped reels data:', reels);  // Log the scraped data
        return reels;
    });
    

    await browser.close();

    // Save scraped reels data to a JSON file
    fs.writeFileSync(`${instagramUsername}_reels.json`, JSON.stringify(reelsData, null, 2));
    console.log(`Scraped Instagram Reels for ${instagramUsername}:`, reelsData);
}

// Helper function to scroll the page
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

// Scrape Reels for both Instagram usernames
(async () => {
    try {
        await scrapeInstagramReels(username1);
        await scrapeInstagramReels(username2);
    } catch (error) {
        console.error('Error during Instagram Reels scraping:', error);
    }
})();
