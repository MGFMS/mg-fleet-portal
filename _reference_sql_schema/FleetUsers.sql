--create table [#tempFleetUsers] (
--[Id] [int] identity,
--[username] [nvarchar] (50) NULL,
--[fleet_account_id] [int] NULL);



set identity_insert [#tempFleetUsers] on;


insert [#tempFleetUsers] ([Id],[username],[fleet_account_id])
select 1,N'purefoods_fleet',1;

set identity_insert [#tempFleetUsers] off;