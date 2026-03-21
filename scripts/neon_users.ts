import { sql } from "@/lib/db/sql.ts";

const listUsers = async () => {
  const users = await sql<
    Array<{ id: string; email: string; name: string | null; createdAt: string }>
  >`
    select id, email, name, "createdAt"
    from neon_auth.user
    order by "createdAt" desc
  `;

  console.log(JSON.stringify(users, null, 2));
};

await listUsers();
