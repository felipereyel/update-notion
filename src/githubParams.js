const core = require("@actions/core");
const github = require("@actions/github");

function extractGithubParams() {
  const pullRequest = github.context.payload.pull_request;
  const { draft, merged } = pullRequest;

  const statusKey = merged
    ? "merged"
    : draft
    ? "draft"
    : github.context.payload.action;

  const status = core.getInput(statusKey, { required: false });

  const databaseId = core.getInput("database-id", { required: true });

  const prProperty =
    core.getInput("pr-property", { required: false }) || "PR URL";

  const statusProperty =
    core.getInput("status-property", { required: false }) || "Status";

  if (!status) {
    core.info(
      `The status ${statusKey} is not mapped with a value in the action definition. Hence, the task update body does not contain a status update`
    );
  }

  return {
    metadata: {
      statusKey: statusKey,
    },
    pullRequest: {
      href: pullRequest.html_url,
      status: status,
    },
    notionProperties: {
      prProperty: prProperty,
      status: statusProperty,
    },
  };
}

module.exports = { extractParams: extractGithubParams };
