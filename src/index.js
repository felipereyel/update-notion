const core = require("@actions/core");
const github = require("@actions/github");
const { Client } = require("@notionhq/client");
const { extractParams } = require("./githubParams");

async function main() {
  const params = extractParams();
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

    await notion.pages.update({
      page_id: page.id,
      properties: params.pullRequest.status
        ? {
            [params.notionProperties.status]: {
              name: params.pullRequest.status,
            },
          }
        : {},
    });
  } catch (error) {
    core.setFailed(error);
  }

  core.info("Notion task updated!");
}

main().catch((err) => core.error(err.toString()));
