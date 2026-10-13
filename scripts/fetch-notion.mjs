import fs from 'fs';
import path from 'path';

const NOTION_TOKEN = process.env.NOTION_TOKEN || '';
if (!NOTION_TOKEN) {
  console.error('Error: NOTION_TOKEN environment variable is required.');
  process.exit(1);
}
const ROOT_PAGE_ID = process.env.NOTION_ROOT_PAGE_ID || '3df968d8-4bdf-80c1-aae3-e239eb52e38d';
const OUTPUT_DIR = path.resolve('docs', 'notion');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const headers = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

async function notionRequest(endpoint, method = 'GET', body = null) {
  const url = `https://api.notion.com/v1${endpoint}`;
  let tries = 0;
  while (tries < 5) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
      if (res.status === 429) {
        console.warn('Rate limited, waiting 1s...');
        await new Promise(r => setTimeout(r, 1000));
        tries++;
        continue;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return await res.json();
    } catch (err) {
      tries++;
      if (tries >= 5) throw err;
      await new Promise(r => setTimeout(r, 500 * tries));
    }
  }
}

async function getAllBlocks(blockId) {
  let blocks = [];
  let cursor = undefined;
  while (true) {
    const query = cursor ? `?start_cursor=${cursor}&page_size=100` : '?page_size=100';
    const data = await notionRequest(`/blocks/${blockId}/children${query}`);
    blocks.push(...data.results);
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }
  return blocks;
}

function renderRichText(richTextArray) {
  if (!richTextArray || !richTextArray.length) return '';
  return richTextArray.map(rt => {
    let text = rt.plain_text || '';
    if (rt.annotations) {
      if (rt.annotations.code) text = `\`${text}\``;
      if (rt.annotations.bold) text = `**${text}**`;
      if (rt.annotations.italic) text = `*${text}*`;
      if (rt.annotations.strikethrough) text = `~~${text}~~`;
    }
    if (rt.href) {
      text = `[${text}](${rt.href})`;
    }
    return text;
  }).join('');
}

async function renderBlock(block, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  const type = block.type;
  let md = '';

  switch (type) {
    case 'paragraph': {
      const text = renderRichText(block.paragraph?.rich_text);
      md = `${indent}${text}\n\n`;
      break;
    }
    case 'heading_1': {
      const text = renderRichText(block.heading_1?.rich_text);
      md = `\n# ${text}\n\n`;
      break;
    }
    case 'heading_2': {
      const text = renderRichText(block.heading_2?.rich_text);
      md = `\n## ${text}\n\n`;
      break;
    }
    case 'heading_3': {
      const text = renderRichText(block.heading_3?.rich_text);
      md = `\n### ${text}\n\n`;
      break;
    }
    case 'bulleted_list_item': {
      const text = renderRichText(block.bulleted_list_item?.rich_text);
      md = `${indent}- ${text}\n`;
      break;
    }
    case 'numbered_list_item': {
      const text = renderRichText(block.numbered_list_item?.rich_text);
      md = `${indent}1. ${text}\n`;
      break;
    }
    case 'to_do': {
      const checked = block.to_do?.checked ? '[x]' : '[ ]';
      const text = renderRichText(block.to_do?.rich_text);
      md = `${indent}- ${checked} ${text}\n`;
      break;
    }
    case 'toggle': {
      const text = renderRichText(block.toggle?.rich_text);
      md = `${indent}<details><summary>${text}</summary>\n\n`;
      break;
    }
    case 'quote': {
      const text = renderRichText(block.quote?.rich_text);
      md = `${indent}> ${text}\n\n`;
      break;
    }
    case 'callout': {
      const icon = block.callout?.icon?.emoji || '💡';
      const text = renderRichText(block.callout?.rich_text);
      md = `${indent}> ${icon} **Note:** ${text}\n\n`;
      break;
    }
    case 'divider': {
      md = `\n---\n\n`;
      break;
    }
    case 'code': {
      const lang = block.code?.language || '';
      const text = block.code?.rich_text?.map(rt => rt.plain_text).join('') || '';
      md = `\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
      break;
    }
    case 'table': {
      // Table handling
      const rows = await getAllBlocks(block.id);
      let tableMd = '';
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (row.type === 'table_row') {
          const cells = row.table_row.cells.map(c => renderRichText(c).replace(/\|/g, '\\|'));
          tableMd += `| ${cells.join(' | ')} |\n`;
          if (r === 0) {
            tableMd += `| ${cells.map(() => '---').join(' | ')} |\n`;
          }
        }
      }
      md = tableMd + '\n';
      return md;
    }
    case 'child_page': {
      const title = block.child_page?.title || 'Untitled';
      md = `\n📄 **Subpage:** [${title}](./${slugify(title)}.md)\n\n`;
      break;
    }
    case 'child_database': {
      const title = block.child_database?.title || 'Untitled Database';
      md = `\n🗄️ **Database:** ${title}\n\n`;
      break;
    }
    case 'bookmark': {
      const url = block.bookmark?.url || '';
      const caption = renderRichText(block.bookmark?.caption);
      md = `[${caption || url}](${url})\n\n`;
      break;
    }
    case 'link_to_page': {
      md = `🔗 Linked page: ${JSON.stringify(block.link_to_page)}\n\n`;
      break;
    }
    default:
      if (block[type]?.rich_text) {
        md = `${indent}${renderRichText(block[type].rich_text)}\n\n`;
      } else {
        md = `${indent}<!-- block type: ${type} -->\n`;
      }
  }

  if (block.has_children && type !== 'child_page' && type !== 'child_database' && type !== 'table') {
    const children = await getAllBlocks(block.id);
    for (const child of children) {
      md += await renderBlock(child, indentLevel + 1);
    }
    if (type === 'toggle') {
      md += `${indent}</details>\n\n`;
    }
  }

  return md;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'page';
}

async function processPage(pageId, pageTitle, relativeDir = '') {
  console.log(`Processing page: ${pageTitle} (${pageId})`);
  const blocks = await getAllBlocks(pageId);
  let content = `# ${pageTitle}\n\n`;

  const subpages = [];
  const subdatabases = [];

  for (const block of blocks) {
    if (block.type === 'child_page') {
      subpages.push({ id: block.id, title: block.child_page?.title || 'Untitled' });
    } else if (block.type === 'child_database') {
      subdatabases.push({ id: block.id, title: block.child_database?.title || 'Database' });
    }
    content += await renderBlock(block, 0);
  }

  const filename = `${slugify(pageTitle)}.md`;
  const filePath = path.join(OUTPUT_DIR, relativeDir, filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Saved: ${filePath}`);

  // Recurse into subpages
  for (const sp of subpages) {
    await processPage(sp.id, sp.title, relativeDir);
  }

  // Handle databases
  for (const db of subdatabases) {
    console.log(`Processing database: ${db.title} (${db.id})`);
    try {
      let dbCursor = undefined;
      const dbPages = [];
      while (true) {
        const dbRes = await notionRequest(`/databases/${db.id}/query`, 'POST', dbCursor ? { start_cursor: dbCursor } : {});
        dbPages.push(...dbRes.results);
        if (!dbRes.has_more) break;
        dbCursor = dbRes.next_cursor;
      }
      for (const dbPage of dbPages) {
        let dbPageTitle = 'Untitled';
        for (const key of Object.keys(dbPage.properties)) {
          if (dbPage.properties[key].type === 'title') {
            dbPageTitle = dbPage.properties[key].title?.map(t => t.plain_text).join('') || 'Untitled';
          }
        }
        await processPage(dbPage.id, `${db.title} - ${dbPageTitle}`, relativeDir);
      }
    } catch (err) {
      console.error(`Error querying database ${db.title}:`, err.message);
    }
  }
}

async function main() {
  const rootPage = await notionRequest(`/pages/${ROOT_PAGE_ID}`);
  let rootTitle = 'MechanicMate - System Architecture Hub';
  if (rootPage.properties?.title?.title) {
    rootTitle = rootPage.properties.title.title.map(t => t.plain_text).join('') || rootTitle;
  }
  await processPage(ROOT_PAGE_ID, rootTitle);
  console.log('Finished downloading all Notion notes!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
