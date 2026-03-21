# Listen to Luther

Spotify's AI DJ X is nice enough...if you want an entirely passive listening
experience. If you want an interactive experience, Listen to Luther instead!

Luther lives at [listentoluther.com](https://listentoluther.com).

Set the following environment variables in `.env`:

```
SPOTIFY_CLIENT_ID=your-spotify-app-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-app-client-secret

OPENAI_API_KEY=your-openai-api-key
NEON_DATABASE_URL=your-neon-postgres-connection-string

# copy this from Neon Console -> Auth -> Configuration
# if you leave it unset, luther will derive it from NEON_DATABASE_URL
NEON_AUTH_URL=https://ep-xxx.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth

# there are a bunch of other vars luther needs to run in 
# production, but you can set this to skip almost all of those:

PRODUCTION=false
```

Run the server:

```
deno task start
```

Manage the handful of private-app users from the terminal:

```
deno task users list
```

Neon Auth does not support migrating existing Supabase password hashes, so old
users need to be recreated manually in the Neon Console.

![](./luther-screenshot.png)
