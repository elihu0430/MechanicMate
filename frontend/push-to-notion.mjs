/**
 * push-to-notion.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Pushes APP_FLOW.md content to a Notion page.
 *
 * SETUP:
 * 1. Go to https://www.notion.so/my-integrations → Create an integration
 * 2. Copy the "Internal Integration Token" (starts with "ntn_" or "secret_")
 * 3. Open the Notion page where you want to save this, click "..." → "Add connections"
 *    and add your integration.
 * 4. Copy the page ID from the URL:
 *    e.g. notion.so/My-Page-<PAGE_ID>  (the 32-char hex at the end)
 * 5. Run:
 *    NOTION_TOKEN=your_token NOTION_PAGE_ID=your_page_id node push-to-notion.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_PAGE_ID = process.env.NOTION_PAGE_ID;

if (!NOTION_TOKEN || !NOTION_PAGE_ID) {
  console.error(
    "❌  Missing env vars. Run with:\n" +
      "   NOTION_TOKEN=your_token NOTION_PAGE_ID=your_page_id node push-to-notion.mjs"
  );
  process.exit(1);
}

// ── Read APP_FLOW.md ─────────────────────────────────────────────────────────
const mdContent = readFileSync(join(__dirname, "APP_FLOW.md"), "utf-8");

// ── Helpers: convert Markdown lines to Notion blocks ─────────────────────────
function makeHeading(text, level) {
  const types = { 1: "heading_1", 2: "heading_2", 3: "heading_3" };
  return {
    object: "block",
    type: types[level] || "heading_3",
    [types[level] || "heading_3"]: {
      rich_text: [{ type: "text", text: { content: text.trim() } }],
    },
  };
}

function makeParagraph(text) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: text } }],
    },
  };
}

function makeDivider() {
  return { object: "block", type: "divider", divider: {} };
}

function makeCode(text) {
  return {
    object: "block",
    type: "code",
    code: {
      language: "plain text",
      rich_text: [{ type: "text", text: { content: text } }],
    },
  };
}

function makeBullet(text) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [{ type: "text", text: { content: text } }],
    },
  };
}

function makeCallout(text, emoji = "📋") {
  return {
    object: "block",
    type: "callout",
    callout: {
      icon: { type: "emoji", emoji },
      rich_text: [{ type: "text", text: { content: text } }],
    },
  };
}

// ── Parse markdown into Notion blocks ─────────────────────────────────────────
function parseMarkdownToBlocks(md) {
  const lines = md.split("\n");
  const blocks = [];
  let inCodeBlock = false;
  let codeBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code fence
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push(makeCode(codeBuffer.join("\n")));
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith("#### ")) { blocks.push(makeHeading(line.slice(5), 3)); continue; }
    if (line.startsWith("### "))  { blocks.push(makeHeading(line.slice(4), 3)); continue; }
    if (line.startsWith("## "))   { blocks.push(makeHeading(line.slice(3), 2)); continue; }
    if (line.startsWith("# "))    { blocks.push(makeHeading(line.slice(2), 1)); continue; }

    // Divider
    if (line.trim() === "---") { blocks.push(makeDivider()); continue; }

    // Blockquote / callout
    if (line.startsWith("> ")) { blocks.push(makeCallout(line.slice(2))); continue; }

    // Bullet
    if (line.match(/^[-*] /)) { blocks.push(makeBullet(line.slice(2))); continue; }

    // Table rows — just turn into paragraphs
    if (line.startsWith("|")) {
      if (line.match(/^[|\s:-]+$/)) continue; // skip separator row
      const cells = line.split("|").filter((c) => c.trim()).map((c) => c.trim()).join("  |  ");
      blocks.push(makeParagraph(cells));
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      // Don't push empty paragraphs back-to-back
      if (blocks.length && blocks[blocks.length - 1].type !== "paragraph") continue;
      continue;
    }

    // Regular paragraph
    blocks.push(makeParagraph(line));
  }

  return blocks;
}

// ── Chunk blocks (Notion API max 100 per request) ────────────────────────────
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

// ── Push to Notion ────────────────────────────────────────────────────────────
async function pushToNotion() {
  const blocks = parseMarkdownToBlocks(mdContent);
  const batches = chunk(blocks, 100);

  console.log(`📄  Parsed ${blocks.length} blocks → ${batches.length} batch(es)`);

  // First: update the page title
  await fetch(`https://api.notion.com/v1/pages/${NOTION_PAGE_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      properties: {
        title: {
          title: [
            {
              type: "text",
              text: { content: "MechanicMate — App Flow Documentation" },
            },
          ],
        },
      },
    }),
  });

  // Then: append all blocks in batches
  for (let i = 0; i < batches.length; i++) {
    console.log(`  ↳ Sending batch ${i + 1}/${batches.length} (${batches[i].length} blocks)...`);
    const res = await fetch(
      `https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({ children: batches[i] }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error(`❌  Batch ${i + 1} failed:`, JSON.stringify(err, null, 2));
      process.exit(1);
    }

    console.log(`  ✅  Batch ${i + 1} saved.`);
    // Small delay to avoid rate limits
    if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 350));
  }

  console.log("\n✅  APP_FLOW.md successfully pushed to Notion!");
  console.log(
    `   View it at: https://www.notion.so/${NOTION_PAGE_ID.replace(/-/g, "")}`
  );
}

pushToNotion().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
