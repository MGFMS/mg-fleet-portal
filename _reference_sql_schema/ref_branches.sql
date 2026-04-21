--create table [#tempref_branches] (
--[Id] [int] identity,
--[branch_code] [nvarchar] (50) NULL,
--[status] [smallint] NULL,
--[booking_count_max] [int] NULL);



set identity_insert [#tempref_branches] on;


insert [#tempref_branches] ([Id],[branch_code],[status],[booking_count_max])
select 1,N'MGBACOOR',1,4 UNION ALL
select 2,N'MGFLEET-PF',1,0;

set identity_insert [#tempref_branches] off;