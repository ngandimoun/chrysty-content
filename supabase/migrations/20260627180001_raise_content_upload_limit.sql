-- Raise content-uploads limit to accommodate longer audiobook master WAV files.
update storage.buckets
set file_size_limit = 209715200
where id = 'content-uploads';
