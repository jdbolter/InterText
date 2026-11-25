Approved changes become a new version of the section, stored as a complete snapshot that is never altered afterwards,
with a pointer to the current one. The pointer moves only if the version it replaces is still current, so two
contributions arriving together cannot overwrite each other. A reader already in a section stays on the version they
began with; the next reader receives the new one. Snapshots can be exported, so the database is working state rather
than the archive.
