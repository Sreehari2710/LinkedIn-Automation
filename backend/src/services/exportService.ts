import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';
import { query } from '../db';

export const exportDailyCSV = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sql = `
      SELECT p.*, k.term, k.location as kw_location
      FROM "ScrapedPost" p
      JOIN "Keyword" k ON p."keywordId" = k.id
      WHERE p."scrapedAt" >= $1
    `;

        const result = await query(sql, [today]);
        const posts = result.rows;

        if (posts.length === 0) {
            console.log('No posts scraped today to export.');
            return;
        }

        const exportsDir = path.join(__dirname, '../../exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }

        const dateString = new Date().toISOString().split('T')[0];
        const filePath = path.join(exportsDir, `linkedin_scraped_${dateString}.csv`);

        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: [
                { id: 'keyword', title: 'Keyword' },
                { id: 'location', title: 'Location' },
                { id: 'description', title: 'Description' },
                { id: 'postLink', title: 'Link' },
                { id: 'datePosted', title: 'Date Posted' },
                { id: 'authorName', title: 'Author Name' },
                { id: 'authorHeadline', title: 'Author Headline' },
                { id: 'authorUrl', title: 'Author URL' },
                { id: 'numLikes', title: 'Likes' },
                { id: 'numComments', title: 'Comments' },
                { id: 'numShares', title: 'Shares' },
                { id: 'scrapedAt', title: 'Scraped At' }
            ],
        });

        const records = posts.map((post: any) => ({
            keyword: post.term,
            location: post.kw_location || 'Any',
            description: post.description || '',
            postLink: post.postLink,
            datePosted: post.datePosted || '',
            authorName: post.authorName || '',
            authorHeadline: post.authorHeadline || '',
            authorUrl: post.authorUrl || '',
            numLikes: post.numLikes || 0,
            numComments: post.numComments || 0,
            numShares: post.numShares || 0,
            scrapedAt: post.scrapedAt instanceof Date ? post.scrapedAt.toISOString() : new Date(post.scrapedAt).toISOString(),
        }));

        await csvWriter.writeRecords(records);
        console.log(`Daily CSV exported to: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error('Failed to export daily CSV:', error);
    }
};
