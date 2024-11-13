export const redirect = (url: string) =>
  new Response("", {
    status: 307,
    headers: { Location: url },
  });

export const logFormData = (data: FormData) => {
  for (const pair of data) {
    console.log(pair[0] + ", " + pair[1]);
  }
};
