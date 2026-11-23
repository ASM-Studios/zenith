import { nextStatus } from './status.mjs';

const PROJECT_QUERY = `query($owner:String!,$number:Int!){organization(login:$owner){projectV2(number:$number){
  id field(name:"Status"){... on ProjectV2SingleSelectField{id options{id name}}}}}}`;

const ITEM_QUERY = `query($owner:String!,$repo:String!,$issue:Int!){repository(owner:$owner,name:$repo){issue(number:$issue){
  projectItems(first:20){nodes{id project{number} fieldValueByName(name:"Status"){... on ProjectV2ItemFieldSingleSelectValue{name}}}}}}}`;

const UPDATE = `mutation($project:ID!,$item:ID!,$field:ID!,$option:String!){updateProjectV2ItemFieldValue(input:{
  projectId:$project,itemId:$item,fieldId:$field,value:{singleSelectOptionId:$option}}){projectV2Item{id}}}`;

export async function setStatus(client, { owner, repo, projectNumber }, issue, target, force = false) {
  const data = await client.graphql(ITEM_QUERY, { owner, repo, issue });
  const item = data.repository.issue.projectItems.nodes.find((node) => node.project.number === projectNumber);
  if (!item) return { skipped: 'not in project' };
  const from = item.fieldValueByName?.name ?? null;
  const to = nextStatus(from, target, force);
  if (!to) return { skipped: `stays ${from}` };
  const { organization } = await client.graphql(PROJECT_QUERY, { owner, number: projectNumber });
  const { id: project, field } = organization.projectV2;
  const option = field.options.find((candidate) => candidate.name === to);
  if (!option) throw new Error(`Status option missing in project: ${to}`);
  await client.graphql(UPDATE, { project, item: item.id, field: field.id, option: option.id });
  return { from, to };
}
