export const redirect = (url: string) =>
  new Response("", {
    status: 307,
    headers: { Location: url },
  });
