--create table [#tempUsers] (
--[Id] [smallint] identity,
--[user_fullname] [nvarchar] (200) NULL,
--[user_name] [nvarchar] (50) NULL,
--[password] [nvarchar] (200) NULL,
--[is_active] [smallint] NULL,
--[branch_id] [smallint] NULL,
--[is_password_changed] [smallint] NULL,
--[role] [smallint] NULL,
--[added_by] [nvarchar] (50) NULL,
--[date_added] [datetime] NULL,
--[updated_by] [nvarchar] (50) NULL,
--[date_updated] [datetime] NULL);



set identity_insert [#tempUsers] on;


insert [#tempUsers] ([Id],[user_fullname],[user_name],[password],[is_active],[branch_id],[is_password_changed],[role],[added_by],[date_added],[updated_by],[date_updated])
select 1,N'Liam Garcia',N'liam.g',N'P@ssword01',1,1,0,1,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 2,N'Olivia Cruz',N'olivia.c',N'P@ssword02',1,1,0,2,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 3,N'Noah Santos',N'noah.s',N'P@ssword03',1,1,1,3,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 4,N'Emma Reyes',N'emma.r',N'P@ssword04',1,1,0,4,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 5,N'Mateo Dela Rosa',N'mateo.dr',N'P@ssword05',1,1,0,5,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 6,N'Ava Lopez',N'ava.l',N'P@ssword06',1,1,0,6,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 7,N'Lucas Fernandez',N'lucas.f',N'P@ssword07',1,1,0,7,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 8,N'Sophia Ramos',N'sophia.r',N'P@ssword08',1,1,0,1,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 9,N'Ethan Bautista',N'ethan.b',N'P@ssword09',1,1,0,2,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 10,N'Isabella Navarro',N'isabella.n',N'P@ssword10',1,1,0,3,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 11,N'James Mendoza',N'james.m',N'P@ssword11',1,1,0,4,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 12,N'Mia Torres',N'mia.t',N'P@ssword12',1,1,0,5,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 13,N'Benjamin Rivera',N'ben.r',N'P@ssword13',1,1,0,6,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 14,N'Amelia Castillo',N'amelia.c',N'P@ssword14',1,1,0,7,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 15,N'Elijah Villanueva',N'elijah.v',N'P@ssword15',1,1,0,1,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 16,N'Harper Aquino',N'harper.a',N'P@ssword16',1,1,0,2,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 17,N'Daniel Ramos',N'daniel.r',N'P@ssword17',1,1,0,3,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 18,N'Aria Morales',N'aria.m',N'P@ssword18',1,1,0,4,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 19,N'Michael Delgado',N'mike.d',N'P@ssword19',1,1,0,5,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 20,N'Charlotte Cruz',N'charlotte.c',N'P@ssword20',1,2,0,6,N'system',NULL,NULL,'2025-10-01 05:23:22.393' UNION ALL
select 21,N'Pure Foods Fleet',N'purefoods_fleet',N'P@sswordPF',1,2,0,8,N'system',NULL,NULL,NULL;

set identity_insert [#tempUsers] off;