-- Add illustration asset type for in-story images (covers remain asset_type: cover)

alter table content_creation_assets
  drop constraint if exists content_creation_assets_asset_type_check;

alter table content_creation_assets
  add constraint content_creation_assets_asset_type_check
  check (asset_type in ('audio', 'cover', 'script', 'source', 'illustration'));
