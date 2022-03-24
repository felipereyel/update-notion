# Github Action - Update Notion

Updates a notion page property (specified by the `status-property` param)
with the choosen status (specified individually by each of the `<name-of-possible-action>` params).
To match a page with a pull request, the page must have a property with the pull request link (specified by the `pr-property` param).

## Inputs

### `status-property`

Name of the status property that will receive a new tag based on the triggered action

### `pr-property`

Name of the property that will filter the search of the PR URL

### `<name-of-possible-action>`

If you want a different status than the name of the triggered action, you can
input a mapping value with this input

## Example usage

```
uses: actions/update-notion@v1.1
env:
  NOTION_BOT_SECRET_KEY: ${{ secrets.NOTION_BOT_SECRET_KEY }}
  NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
with:
    - status-property: 'Status'
    - pr-property: 'PR URL'
    - opened: 'In progresss'
    - edited: 'In progress'
    - closed: 'Done'
    - reopened: 'In progress'
    - ready_for_review: 'In review'
    - review_requested: 'In review'
```

## Possible action

- **merged**
- **draft**
- assigned
- unassigned
- labeled
- unlabeled
- opened
- edited
- closed
- reopened
- synchronize
- ready_for_review
- locked
- unlocked
- review_requested
- review_request_removed

## Contributing

Feel free to mke Pull Requests to improve this action.

To compile the file :

```bash
npm install
npm run prepare
```
