// Vercel Serverless Function entry point
// Dynamically imports the built Angular SSR + Express server and delegates requests
export default async (req, res) => {
  const server = await import('../dist/food-ecommerce/server/server.mjs');
  const handler = server.reqHandler || server.default;
  return handler(req, res);
};
