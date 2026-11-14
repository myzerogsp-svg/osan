create table if not exists center_panel (
  id integer primary key,
  body text not null,
  saved_at bigint not null default 0
);
