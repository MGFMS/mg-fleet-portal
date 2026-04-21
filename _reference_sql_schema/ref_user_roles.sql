--create table [#tempref_user_roles] (
--[Id] [smallint] identity,
--[role_name] [nvarchar] (50) NULL);



set identity_insert [#tempref_user_roles] on;


insert [#tempref_user_roles] ([Id],[role_name])
select 1,N'BRANCH MANAGER' UNION ALL
select 2,N'ADMIN SUPERVISOR' UNION ALL
select 3,N'CALL CENTER' UNION ALL
select 4,N'SERVICE ADVISOR' UNION ALL
select 5,N'FLOOR SUPERVISOR' UNION ALL
select 6,N'PARTS MAN' UNION ALL
select 7,N'FINANCE' UNION ALL
select 8,N'CUSTOMER';

set identity_insert [#tempref_user_roles] off;