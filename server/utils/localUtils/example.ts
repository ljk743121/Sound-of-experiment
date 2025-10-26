// an example function to validate user
// eslint-disable-next-line unused-imports/no-unused-vars
export default async function validateUser(id: string, name: string) {
  if (id.length !== 16)
    return false;
  return true;
}
