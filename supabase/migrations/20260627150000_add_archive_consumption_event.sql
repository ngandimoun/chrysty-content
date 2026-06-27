-- Allow archive consumption events
alter table content_consumption_events
  drop constraint if exists content_consumption_events_event_type_check;

alter table content_consumption_events
  add constraint content_consumption_events_event_type_check check (
    event_type in (
      'open', 'close', 'play', 'pause', 'resume', 'seek',
      'page_change', 'bookmark', 'highlight', 'share', 'download', 'complete', 'archive'
    )
  );
