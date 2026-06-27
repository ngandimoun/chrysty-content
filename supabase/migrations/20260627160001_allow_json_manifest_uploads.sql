-- Allow book/audio manifest JSON uploads (asset_type: script, role: book_manifest | audio_manifest)
update storage.buckets
set allowed_mime_types = array(
  select distinct unnest(
    coalesce(allowed_mime_types, array[]::text[])
    || array['application/json']::text[]
  )
  from storage.buckets
  where id = 'content-uploads'
)
where id = 'content-uploads';
