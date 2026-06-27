# Consumption lifecycle ops

Apply migrations before validating consumption features:

```bash
supabase db push
# or apply SQL files under supabase/migrations/ in order
```

Required env (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — browser auth + Realtime
- `SUPABASE_SERVICE_ROLE_KEY`

Realtime: migration `20260627160000_enable_consumption_realtime.sql` adds `content_consumption_progress` to the `supabase_realtime` publication. Enable Realtime for that table in the Supabase dashboard if the publication migration cannot run.
