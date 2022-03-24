const core = require("@actions/core");
const github = require("@actions/github");
const { Client } = require("@notionhq/client");
const { extractParams } = require("./githubParams");

async function main() {
  const params = extractParams();
  if (!params.pullRequest.status) return;
  const notion = new Client({
    auth: process.env.NOTION_BOT_SECRET_KEY,
  });

  try {
    const pages = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      archived: false,
      filter: {
        property: params.notionProperties.prProperty,
        text: {
          contains: params.pullRequest.href,
        },
      },
    });

    const [page] = pages.results;

    if (page) {
      await notion.pages.update({
        page_id: page.id,
        properties: {
          [params.notionProperties.status]: {
            select: {
              name: params.pullRequest.status,
            },
          },
        },
      });
    } else {
      core.info(`No page found for ${params.pullRequest.href}`);
    }
  } catch (error) {
    core.setFailed(error);
  }

  core.info("Notion task updated!");
}

main().catch((err) => core.error(err.toString()));
