--create table [#tempFleetAccounts] (
--[Id] [int] identity,
--[company_name] [nvarchar] (100) NULL);



set identity_insert [#tempFleetAccounts] on;


insert [#tempFleetAccounts] ([Id],[company_name])
select 1,N'PUREFOODS';

set identity_insert [#tempFleetAccounts] off;